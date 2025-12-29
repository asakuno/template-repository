---
name: backend-coding-guidelines
description: Comprehensive Laravel backend coding guidelines for 4-layer architecture (DDD-lite). **CRITICAL**: Focuses on patterns AI commonly fails to implement correctly, especially Entity/ValueObject design, UseCase structure, and layer separation. Reference this skill when implementing or refactoring backend code during Phase 2.
---

# Backend Coding Guidelines - What AI Gets Wrong (4-Layer Architecture Edition)

This skill focuses on patterns AI commonly fails to implement correctly in Laravel applications following a 4-layer architecture (Presentation, Application, Domain, Infrastructure).

## Architecture Overview

**4-Layer Structure:**
- **Presentation Layer**: HTTP request/response handling (Controller, Request, Resource, Middleware)
- **Application Layer**: UseCase orchestration (UseCase, DTO)
- **Domain Layer**: Business logic/rules (Entity, ValueObject, DomainService, Repository Interface)
- **Infrastructure Layer**: Technical details (Repository Implementation, Eloquent Model, QueryBuilder)

**Dependency Direction:**
```
Presentation → Application → Domain ← Infrastructure
```
- Domain layer MUST NOT depend on any other layer
- Infrastructure implements Domain interfaces (Dependency Inversion)

## ⚠️ Critical: AI's Common Failures

### 1. Entity Design (Most Critical)

**Pattern AI ALWAYS gets wrong**: Using public constructors and mutable properties

```php
// ❌ Typical AI pattern (mutable, no factory methods)
class Member
{
    public function __construct(
        public ?string $id,
        public string $name,
        public string $email,
    ) {}
}

// ❌ AI creates Entities without distinguishing creation vs reconstruction
$member = new Member(null, 'Taro', 'taro@example.com'); // 新規作成?
$member = new Member('123', 'Taro', 'taro@example.com'); // DB復元?
```

**Correct pattern**: Private constructor with factory methods

```php
// ✅ Correct: final class with factory methods
final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private readonly Email $email,
    ) {}

    // 新規作成用 - IDは自動生成
    public static function create(Name $name, Email $email): self
    {
        return new self(
            id: MemberId::generate(),
            name: $name,
            email: $email,
        );
    }

    // DB復元用 - 既存データの再構築
    public static function reconstruct(
        MemberId $id,
        Name $name,
        Email $email,
    ): self {
        return new self($id, $name, $email);
    }

    // Getter methods
    public function id(): MemberId { return $this->id; }
    public function name(): Name { return $this->name; }
    public function email(): Email { return $this->email; }
}
```

---

### 2. ValueObject Design

**Pattern AI gets wrong**: Skipping validation or using primitives

```php
// ❌ AI writes: No validation, accepts any string
final readonly class Email
{
    public function __construct(public string $value) {}
}

// ❌ AI writes: Using primitives instead of ValueObjects
final class Member
{
    public function __construct(
        private readonly string $id,    // Should be MemberId
        private readonly string $name,  // Should be Name
        private readonly string $email, // Should be Email
    ) {}
}
```

**Correct pattern**: Validation at creation time with factory methods

```php
// ✅ Correct: ValueObject with validation
final readonly class Email
{
    private function __construct(private string $value) {}

    public static function create(string $value): self
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("無効なメールアドレス形式: {$value}");
        }
        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}

// ✅ Correct: ID ValueObject with generation
final readonly class MemberId
{
    private function __construct(private string $value) {}

    public static function generate(): self
    {
        return new self((string) Str::uuid());
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

---

### 3. UseCase Structure

**Pattern AI gets wrong**: Business logic in controller, no DTOs

```php
// ❌ AI writes: Logic in controller
final class MemberController extends Controller
{
    public function store(Request $request)
    {
        // Business logic in controller
        $member = new Member();
        $member->name = $request->input('name');
        $member->email = $request->input('email');
        $member->save();

        return redirect()->route('members.index');
    }
}

// ❌ AI writes: UseCase returns Entity directly
final readonly class CreateMemberUseCase
{
    public function execute(string $name, string $email): Member
    {
        // Returns Entity to Presentation layer
    }
}
```

**Correct pattern**: UseCase with Input/Output DTOs

```php
// ✅ Correct: Input DTO
final readonly class CreateMemberInput
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}

// ✅ Correct: Output DTO
final readonly class CreateMemberOutput
{
    public function __construct(
        public string $id,
    ) {}
}

// ✅ Correct: UseCase with DTOs
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );

        $this->repository->save($member);

        return new CreateMemberOutput(
            id: $member->id()->value(),
        );
    }
}

// ✅ Correct: Controller uses UseCase
final class MemberController extends Controller
{
    public function store(
        CreateMemberRequest $request,
        CreateMemberUseCase $useCase,
    ): RedirectResponse {
        $useCase->execute(new CreateMemberInput(
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return redirect()->route('members.index')
            ->with('success', 'メンバーを作成しました');
    }
}
```

---

### 4. Repository Pattern

**Pattern AI gets wrong**: Returning Eloquent Model, missing interface

```php
// ❌ AI writes: Repository returns Eloquent Model
final class MemberRepository
{
    public function findById(string $id): ?MemberModel
    {
        return MemberModel::find($id);
    }
}

// ❌ AI writes: No interface separation
final class MemberRepository
{
    public function findById(string $id): ?Member
    {
        $model = MemberModel::find($id);
        return $model ? new Member($model->id, $model->name, $model->email) : null;
    }
}
```

**Correct pattern**: Interface in Domain, implementation in Infrastructure

```php
// ✅ Correct: Interface in Domain layer
// modules/{Module}/Domain/Repositories/MemberRepositoryInterface.php
interface MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member;
    public function findByEmail(Email $email): ?Member;
    public function save(Member $member): void;
    public function delete(MemberId $id): void;
}

// ✅ Correct: Implementation in Infrastructure layer
// modules/{Module}/Infrastructure/Repositories/EloquentMemberRepository.php
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member
    {
        $model = MemberModel::find($id->value());

        if ($model === null) {
            return null;
        }

        return Member::reconstruct(
            id: MemberId::from($model->id),
            name: Name::create($model->name),
            email: Email::create($model->email),
        );
    }

    public function save(Member $member): void
    {
        MemberModel::updateOrCreate(
            ['id' => $member->id()->value()],
            [
                'name' => $member->name()->value(),
                'email' => $member->email()->value(),
            ],
        );
    }
}
```

---

### 5. Layer Separation Violations

**Pattern AI gets wrong**: Cross-layer dependencies

```php
// ❌ AI writes: Domain depends on Eloquent
// In Domain layer
use Illuminate\Database\Eloquent\Model;

final class Member
{
    public function save(): void
    {
        MemberModel::create([...]); // Domain depends on Infrastructure
    }
}

// ❌ AI writes: UseCase uses Eloquent directly
final readonly class CreateMemberUseCase
{
    public function execute(CreateMemberInput $input): void
    {
        MemberModel::create([
            'name' => $input->name,
            'email' => $input->email,
        ]);
    }
}

// ❌ AI writes: Controller accesses database
final class MemberController extends Controller
{
    public function index(): Response
    {
        $members = MemberModel::all(); // Direct DB access
        return Inertia::render('Members/Index', ['members' => $members]);
    }
}
```

**Correct pattern**: Proper layer isolation

```php
// ✅ Correct: Domain layer has no external dependencies
// Domain layer: Pure PHP, no Laravel/Eloquent
final class Member
{
    // No use statements for Laravel classes
    // No database operations
    // Pure business logic only
}

// ✅ Correct: UseCase uses Repository interface
final readonly class ListMembersUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(): ListMembersOutput
    {
        $members = $this->repository->findAll();

        return new ListMembersOutput(
            members: array_map(
                fn(Member $m) => new MemberData(
                    id: $m->id()->value(),
                    name: $m->name()->value(),
                    email: $m->email()->value(),
                ),
                $members,
            ),
        );
    }
}

// ✅ Correct: Controller uses UseCase
final class MemberController extends Controller
{
    public function index(ListMembersUseCase $useCase): Response
    {
        $output = $useCase->execute();

        return Inertia::render('Members/Index', [
            'members' => $output->members,
        ]);
    }
}
```

---

### 6. Module Isolation

**Pattern AI gets wrong**: Direct cross-module references

```php
// ❌ AI writes: Module A directly uses Module B's internals
// In Project module
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberRepositoryInterface $memberRepository, // Wrong!
    ) {}
}
```

**Correct pattern**: Use Contract for cross-module communication

```php
// ✅ Correct: Contract defines public API
// modules/Contract/Member/MemberServiceInterface.php
interface MemberServiceInterface
{
    public function findById(string $id): ?MemberDto;
    public function exists(string $id): bool;
}

// ✅ Correct: Module implements Contract
// modules/Member/Application/Services/MemberService.php
final readonly class MemberService implements MemberServiceInterface
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function findById(string $id): ?MemberDto
    {
        $member = $this->repository->findById(MemberId::from($id));
        if ($member === null) {
            return null;
        }

        return new MemberDto(
            id: $member->id()->value(),
            name: $member->name()->value(),
        );
    }
}

// ✅ Correct: Other module uses Contract
// modules/Project/Application/UseCases/CreateProjectUseCase.php
use Modules\Contract\Member\MemberServiceInterface;

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberServiceInterface $memberService, // Via Contract
    ) {}
}
```

---

## Directory Structure

```
modules/
├── Contract/
│   └── {Module}/
│       ├── {Module}ServiceInterface.php
│       └── DTOs/
├── {Module}/
│   ├── Presentation/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Application/
│   │   ├── UseCases/
│   │   ├── DTOs/
│   │   └── Services/
│   ├── Domain/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Repositories/      # Interfaces only
│   │   ├── Services/          # Domain Services
│   │   └── Exceptions/
│   └── Infrastructure/
│       ├── Repositories/      # Implementations
│       └── Models/
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{Name}` | `Member`, `Project` |
| ValueObject | `{Name}` | `Email`, `MemberId`, `Name` |
| Repository Interface | `{Entity}RepositoryInterface` | `MemberRepositoryInterface` |
| Repository Impl | `Eloquent{Entity}Repository` | `EloquentMemberRepository` |
| UseCase | `{Action}{Entity}UseCase` | `CreateMemberUseCase` |
| Input DTO | `{Action}{Entity}Input` | `CreateMemberInput` |
| Output DTO | `{Action}{Entity}Output` | `CreateMemberOutput` |
| Controller | `{Entity}Controller` | `MemberController` |
| Request | `{Action}{Entity}Request` | `CreateMemberRequest` |
| Eloquent Model | `{Entity}Model` | `MemberModel` |

---

## Method Naming

| Purpose | Method Name |
|---------|-------------|
| Create new | `create` |
| Reconstruct from DB | `reconstruct` |
| Find single | `findById`, `findBy{Property}` |
| Find multiple | `findAll`, `findBy{Criteria}` |
| Save | `save` |
| Delete | `delete` |
| Get value | `value` |
| Compare equality | `equals` |

---

## Class Modifiers

```php
// Entity: final with private constructor
final class Member
{
    private function __construct(...) {}
}

// ValueObject: final readonly
final readonly class Email
{
    private function __construct(...) {}
}

// DTO: final readonly with public constructor
final readonly class CreateMemberInput
{
    public function __construct(...) {}
}

// UseCase: final readonly
final readonly class CreateMemberUseCase {}

// Repository Implementation: final
final class EloquentMemberRepository implements MemberRepositoryInterface {}

// Controller: final
final class MemberController extends Controller {}
```

---

## Prohibited Patterns

### In Domain Layer
- ❌ Eloquent Model usage
- ❌ Laravel Facades (`DB::`, `Cache::`, etc.)
- ❌ HTTP Request/Response
- ❌ External service calls
- ❌ File system operations

### In Application Layer
- ❌ Direct database queries
- ❌ Returning Entities to Presentation layer
- ❌ HTTP-specific logic

### In Controller
- ❌ Business logic
- ❌ Direct database access
- ❌ Data transformation (use UseCase for this)

---

## AI Weakness Checklist

Before considering implementation complete, verify AI didn't fall into these traps:

### Entity/ValueObject ⚠️ (Most Critical)
- [ ] Entity has `private` constructor with `create()` and `reconstruct()` factory methods
- [ ] ValueObject has validation in factory method
- [ ] All properties are `readonly`
- [ ] Class is marked as `final`
- [ ] Uses ValueObjects instead of primitives for Entity properties

### UseCase ⚠️
- [ ] Uses Input DTO for parameters
- [ ] Returns Output DTO (not Entity)
- [ ] Depends on Repository Interface (not implementation)
- [ ] No direct database access
- [ ] Marked as `final readonly`

### Repository ⚠️
- [ ] Interface defined in Domain layer
- [ ] Implementation in Infrastructure layer
- [ ] Uses `reconstruct()` to build Entity from model
- [ ] Returns Entity (not Eloquent Model)

### Layer Separation ⚠️
- [ ] Domain layer has no Laravel dependencies
- [ ] Application layer uses interfaces
- [ ] Controller only handles HTTP
- [ ] No cross-module internal references

### Controller ⚠️
- [ ] Uses method injection for UseCase
- [ ] No business logic
- [ ] Returns Inertia response with DTOs/arrays (not Entities)
- [ ] Uses FormRequest for validation

---

## Summary: What to Watch For

AI will confidently write code that:
1. **Uses public constructors** in Entities (should use factory methods)
2. **Skips ValueObjects** and uses primitives
3. **Returns Entities** from UseCases (should return Output DTOs)
4. **Returns Eloquent Models** from Repositories
5. **Puts business logic** in Controllers
6. **References other modules** directly (should use Contract)

**Trust AI for**:
- Basic PHP syntax
- Simple CRUD operations
- Controller routing

**Scrutinize AI for**:
- Entity/ValueObject design (factory methods required)
- UseCase structure (DTOs required)
- Layer boundaries (no cross-layer dependencies)
- Repository pattern (interface + implementation separation)

When in doubt, ask: **"Is each layer isolated with no illegal dependencies?"**
