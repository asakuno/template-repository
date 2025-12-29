# Layer Separation - Preventing Cross-Layer Dependencies

## AI's Common Failure Patterns

### Pattern 1: Domain Depends on Eloquent

**❌ AI writes: Domain depends on Eloquent**

```php
// In Domain layer
use Illuminate\Database\Eloquent\Model;

final class Member
{
    public function save(): void
    {
        MemberModel::create([...]); // Domain depends on Infrastructure
    }
}
```

**Problems**:
- Domain layer depends on Laravel
- Can't test Domain logic without database
- Violates Dependency Inversion Principle
- Domain is no longer portable

### Pattern 2: UseCase Uses Eloquent Directly

**❌ AI writes: UseCase uses Eloquent directly**

```php
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
```

**Problems**:
- Application layer depends on Infrastructure
- Bypasses Repository abstraction
- Hard to test (requires database)
- Can't swap storage implementation

### Pattern 3: Controller Accesses Database

**❌ AI writes: Controller accesses database**

```php
final class MemberController extends Controller
{
    public function index(): Response
    {
        $members = MemberModel::all(); // Direct DB access
        return Inertia::render('Members/Index', ['members' => $members]);
    }
}
```

**Problems**:
- Presentation layer depends on Infrastructure
- No business logic separation
- Hard to test
- Can't reuse logic

---

## ✅ Correct Pattern: Proper Layer Isolation

### Layer Dependency Rules

```
Presentation → Application → Domain ← Infrastructure
```

**Rules**:
1. Domain layer has NO dependencies
2. Infrastructure implements Domain interfaces
3. Application uses Domain interfaces
4. Presentation uses Application layer only

### Domain Layer: Pure PHP, No Laravel

```php
// ✅ Correct: Domain layer has no external dependencies
// modules/Member/Domain/Entities/Member.php

namespace Modules\Member\Domain\Entities;

use Modules\Member\Domain\ValueObjects\MemberId;
use Modules\Member\Domain\ValueObjects\Name;
use Modules\Member\Domain\ValueObjects\Email;
use Modules\Member\Domain\ValueObjects\MemberStatus;

final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private readonly Email $email,
        private readonly MemberStatus $status,
    ) {}

    public static function create(Name $name, Email $email): self
    {
        return new self(
            id: MemberId::generate(),
            name: $name,
            email: $email,
            status: MemberStatus::active(),
        );
    }

    public static function reconstruct(
        MemberId $id,
        Name $name,
        Email $email,
        MemberStatus $status,
    ): self {
        return new self($id, $name, $email, $status);
    }

    public function deactivate(): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            email: $this->email,
            status: MemberStatus::inactive(),
        );
    }

    // No use statements for Laravel classes
    // No database operations
    // Pure business logic only

    public function id(): MemberId { return $this->id; }
    public function name(): Name { return $this->name; }
    public function email(): Email { return $this->email; }
    public function status(): MemberStatus { return $this->status; }
}
```

### Application Layer: Uses Repository Interface

```php
// ✅ Correct: UseCase uses Repository interface
// modules/Member/Application/UseCases/ListMembersUseCase.php

namespace Modules\Member\Application\UseCases;

use Modules\Member\Domain\Repositories\MemberRepositoryInterface;
use Modules\Member\Application\DTOs\ListMembersOutput;
use Modules\Member\Application\DTOs\MemberData;

final readonly class ListMembersUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository, // Interface from Domain
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
                    status: $m->status()->value(),
                ),
                $members,
            ),
        );
    }
}
```

### Infrastructure Layer: Implements Domain Interface

```php
// ✅ Correct: Infrastructure implements Domain interface
// modules/Member/Infrastructure/Repositories/EloquentMemberRepository.php

namespace Modules\Member\Infrastructure\Repositories;

use Modules\Member\Domain\Repositories\MemberRepositoryInterface;
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Infrastructure\Models\MemberModel;

final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findAll(): array
    {
        return MemberModel::all()
            ->map(fn(MemberModel $m) => $this->toEntity($m))
            ->toArray();
    }

    private function toEntity(MemberModel $model): Member
    {
        return Member::reconstruct(
            id: MemberId::from($model->id),
            name: Name::create($model->name),
            email: Email::create($model->email),
            status: MemberStatus::from($model->status),
        );
    }

    // Other methods...
}
```

### Presentation Layer: Uses UseCase

```php
// ✅ Correct: Controller uses UseCase
// app/Http/Controllers/MemberController.php

namespace App\Http\Controllers;

use Modules\Member\Application\UseCases\ListMembersUseCase;
use Inertia\Inertia;
use Inertia\Response;

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

## Detecting Layer Violations

### Domain Layer Violations

**❌ Forbidden in Domain layer:**

```php
// Laravel dependencies
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

// Infrastructure layer
use Modules\Member\Infrastructure\Models\MemberModel;

// Application layer
use Modules\Member\Application\UseCases\CreateMemberUseCase;

// Presentation layer
use App\Http\Controllers\MemberController;
```

**✅ Allowed in Domain layer:**

```php
// Pure PHP
use InvalidArgumentException;
use DateTimeImmutable;

// Domain layer only
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Domain\ValueObjects\Email;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;
use Modules\Member\Domain\Exceptions\MemberNotFoundException;

// Laravel utilities (if absolutely necessary)
use Illuminate\Support\Str; // Only for UUID generation
```

### Application Layer Violations

**❌ Forbidden in Application layer:**

```php
// Direct database access
use Illuminate\Support\Facades\DB;
MemberModel::create([...]);

// HTTP-specific logic
use Illuminate\Http\Request;
use Illuminate\Http\Response;
return response()->json([...]);

// Infrastructure implementations
use Modules\Member\Infrastructure\Repositories\EloquentMemberRepository;
```

**✅ Allowed in Application layer:**

```php
// Domain layer
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;

// Application layer
use Modules\Member\Application\DTOs\CreateMemberInput;
use Modules\Member\Application\DTOs\CreateMemberOutput;

// Laravel (for transaction management, if needed)
use Illuminate\Support\Facades\DB;
DB::transaction(fn() => ...); // Only in UseCase
```

### Presentation Layer Violations

**❌ Forbidden in Presentation layer:**

```php
// Business logic
$member = Member::create(...);
if ($member->isActive()) { ... }

// Direct database access
MemberModel::where('status', 'active')->get();

// Domain layer direct manipulation
$this->memberRepository->save($member);
```

**✅ Allowed in Presentation layer:**

```php
// HTTP handling
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\RedirectResponse;

// Inertia
use Inertia\Inertia;
use Inertia\Response;

// Application layer
use Modules\Member\Application\UseCases\CreateMemberUseCase;
use Modules\Member\Application\DTOs\CreateMemberInput;

// Form Requests
use App\Http\Requests\CreateMemberRequest;
```

---

## Common Violations and Fixes

### Violation 1: Controller with Business Logic

**❌ Before:**

```php
final class MemberController extends Controller
{
    public function store(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:members',
        ]);

        // Business logic in controller
        if (MemberModel::where('email', $validated['email'])->exists()) {
            return back()->withErrors(['email' => 'このメールアドレスは既に使用されています']);
        }

        // Direct database access
        $member = MemberModel::create($validated);

        return redirect()->route('members.index');
    }
}
```

**✅ After:**

```php
// Controller
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

// UseCase
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        // Check if email exists
        if ($this->repository->findByEmail(Email::create($input->email)) !== null) {
            throw new DomainException('このメールアドレスは既に使用されています');
        }

        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );

        $this->repository->save($member);

        return new CreateMemberOutput(id: $member->id()->value());
    }
}
```

### Violation 2: Domain Entity with Database Access

**❌ Before:**

```php
final class Member
{
    public function save(): void
    {
        MemberModel::updateOrCreate(
            ['id' => $this->id],
            ['name' => $this->name, 'email' => $this->email],
        );
    }

    public function delete(): void
    {
        MemberModel::where('id', $this->id)->delete();
    }
}
```

**✅ After:**

```php
// Domain Entity (no database access)
final class Member
{
    // Pure business logic only
    public function deactivate(): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            email: $this->email,
            status: MemberStatus::inactive(),
        );
    }

    // No save(), delete(), or database methods
}

// Repository handles persistence
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function save(Member $member): void
    {
        MemberModel::updateOrCreate(
            ['id' => $member->id()->value()],
            [
                'name' => $member->name()->value(),
                'email' => $member->email()->value(),
                'status' => $member->status()->value(),
            ],
        );
    }

    public function delete(MemberId $id): void
    {
        MemberModel::where('id', $id->value())->delete();
    }
}
```

### Violation 3: UseCase with Eloquent

**❌ Before:**

```php
final readonly class ListMembersUseCase
{
    public function execute(): array
    {
        return MemberModel::where('status', 'active')
            ->orderBy('name')
            ->get()
            ->toArray();
    }
}
```

**✅ After:**

```php
// UseCase uses Repository interface
final readonly class ListMembersUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(): ListMembersOutput
    {
        $members = $this->repository->findActive();

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

// Repository interface
interface MemberRepositoryInterface
{
    public function findActive(): array;
}

// Repository implementation
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findActive(): array
    {
        return MemberModel::where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn($m) => $this->toEntity($m))
            ->toArray();
    }
}
```

---

## Static Analysis with Deptrac

### Layer Dependency Configuration

```yaml
# deptrac/layer.yaml
deptrac:
  paths:
    - ./modules
  layers:
    Domain:
      collectors:
        - type: directory
          regex: modules/.*/Domain/.*
    Application:
      collectors:
        - type: directory
          regex: modules/.*/Application/.*
    Infrastructure:
      collectors:
        - type: directory
          regex: modules/.*/Infrastructure/.*
    Presentation:
      collectors:
        - type: directory
          regex: app/Http/.*
  ruleset:
    Domain: []  # No dependencies allowed
    Application:
      - Domain
    Infrastructure:
      - Domain
    Presentation:
      - Application
```

### Running Deptrac

```bash
./vendor/bin/deptrac analyse --config-file=deptrac/layer.yaml
```

---

## Checklist: Layer Separation

Before considering layer separation correct, verify:

### Domain Layer
- [ ] No `use` statements for Laravel classes
- [ ] No database operations
- [ ] No HTTP Request/Response handling
- [ ] Only pure PHP and Domain layer classes
- [ ] Can be tested without Laravel

### Application Layer
- [ ] Uses Repository interfaces (not implementations)
- [ ] No direct database access
- [ ] No HTTP-specific logic
- [ ] Returns DTOs (not Entities)

### Infrastructure Layer
- [ ] Implements Domain interfaces
- [ ] No business logic
- [ ] Handles technical details only

### Presentation Layer
- [ ] No business logic
- [ ] Uses UseCases only
- [ ] Handles HTTP concerns only

---

## Why This Matters

**Without layer separation**:
- Domain logic mixed with technical details
- Can't test business logic independently
- Can't swap implementations
- Violates SOLID principles
- Monolithic, hard to maintain

**With proper layer separation**:
- Domain is pure and portable
- Easy to test
- Clear responsibilities
- Flexible (can swap storage, UI)
- Maintainable and scalable
