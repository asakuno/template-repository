# Module Isolation - Cross-Module Communication via Contract

## AI's Common Failure Pattern

**❌ AI writes: Module A directly uses Module B's internals**

```php
// In Project module
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberRepositoryInterface $memberRepository, // Wrong!
    ) {}

    public function execute(CreateProjectInput $input): CreateProjectOutput
    {
        // Directly accessing Member module's internal Repository
        $member = $this->memberRepository->findById(
            MemberId::from($input->managerId)
        );

        if ($member === null) {
            throw new DomainException('管理者が見つかりません');
        }

        // ...
    }
}
```

**Problems**:
- Module coupling (Project depends on Member internals)
- Can't change Member implementation without affecting Project
- Violates module isolation
- Creates dependency web

---

## ✅ Correct Pattern: Use Contract for Cross-Module Communication

### Step 1: Define Contract Interface

```php
// modules/Contract/Member/MemberServiceInterface.php

namespace Modules\Contract\Member;

interface MemberServiceInterface
{
    public function findById(string $id): ?MemberDto;
    public function exists(string $id): bool;
    public function findByEmail(string $email): ?MemberDto;
}
```

### Step 2: Define Contract DTO

```php
// modules/Contract/Member/MemberDto.php

namespace Modules\Contract\Member;

final readonly class MemberDto
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $status,
    ) {}
}
```

### Step 3: Implement Contract in Member Module

```php
// modules/Member/Application/Services/MemberService.php

namespace Modules\Member\Application\Services;

use Modules\Contract\Member\MemberServiceInterface;
use Modules\Contract\Member\MemberDto;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;
use Modules\Member\Domain\ValueObjects\MemberId;
use Modules\Member\Domain\ValueObjects\Email;

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
            email: $member->email()->value(),
            status: $member->status()->value(),
        );
    }

    public function exists(string $id): bool
    {
        return $this->repository->findById(MemberId::from($id)) !== null;
    }

    public function findByEmail(string $email): ?MemberDto
    {
        $member = $this->repository->findByEmail(Email::create($email));

        if ($member === null) {
            return null;
        }

        return new MemberDto(
            id: $member->id()->value(),
            name: $member->name()->value(),
            email: $member->email()->value(),
            status: $member->status()->value(),
        );
    }
}
```

### Step 4: Register Service Provider Binding

```php
// modules/Member/Infrastructure/MemberServiceProvider.php

namespace Modules\Member\Infrastructure;

use Illuminate\Support\ServiceProvider;
use Modules\Contract\Member\MemberServiceInterface;
use Modules\Member\Application\Services\MemberService;

final class MemberServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Repository binding
        $this->app->bind(
            MemberRepositoryInterface::class,
            EloquentMemberRepository::class,
        );

        // Contract Service binding
        $this->app->bind(
            MemberServiceInterface::class,
            MemberService::class,
        );
    }
}
```

### Step 5: Use Contract in Other Module

```php
// modules/Project/Application/UseCases/CreateProjectUseCase.php

namespace Modules\Project\Application\UseCases;

use Modules\Contract\Member\MemberServiceInterface; // Via Contract

final readonly class CreateProjectUseCase
{
    public function __construct(
        private ProjectRepositoryInterface $projectRepository,
        private MemberServiceInterface $memberService, // Via Contract
    ) {}

    public function execute(CreateProjectInput $input): CreateProjectOutput
    {
        // Validate manager exists (via Contract)
        if (!$this->memberService->exists($input->managerId)) {
            throw new DomainException('指定された管理者が存在しません');
        }

        $project = Project::create(
            name: ProjectName::create($input->name),
            description: ProjectDescription::create($input->description),
            managerId: MemberId::from($input->managerId),
        );

        $this->projectRepository->save($project);

        return new CreateProjectOutput(
            id: $project->id()->value(),
        );
    }
}
```

---

## Contract Design Patterns

### Pattern 1: Simple Existence Check

```php
// Contract
interface MemberServiceInterface
{
    public function exists(string $id): bool;
}

// Implementation
final readonly class MemberService implements MemberServiceInterface
{
    public function exists(string $id): bool
    {
        return $this->repository->findById(MemberId::from($id)) !== null;
    }
}

// Usage in other module
if (!$this->memberService->exists($managerId)) {
    throw new DomainException('メンバーが存在しません');
}
```

### Pattern 2: Retrieve Basic Data

```php
// Contract DTO
final readonly class MemberDto
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
    ) {}
}

// Contract
interface MemberServiceInterface
{
    public function findById(string $id): ?MemberDto;
}

// Implementation
final readonly class MemberService implements MemberServiceInterface
{
    public function findById(string $id): ?MemberDto
    {
        $member = $this->repository->findById(MemberId::from($id));

        if ($member === null) {
            return null;
        }

        return new MemberDto(
            id: $member->id()->value(),
            name: $member->name()->value(),
            email: $member->email()->value(),
        );
    }
}

// Usage
$memberDto = $this->memberService->findById($managerId);
if ($memberDto === null) {
    throw new DomainException('メンバーが見つかりません');
}
```

### Pattern 3: Batch Operations

```php
// Contract
interface MemberServiceInterface
{
    /**
     * @param array<string> $ids
     * @return array<MemberDto>
     */
    public function findByIds(array $ids): array;

    /**
     * @param array<string> $ids
     */
    public function allExist(array $ids): bool;
}

// Implementation
final readonly class MemberService implements MemberServiceInterface
{
    public function findByIds(array $ids): array
    {
        $memberIds = array_map(fn($id) => MemberId::from($id), $ids);
        $members = $this->repository->findByIds($memberIds);

        return array_map(
            fn($member) => new MemberDto(
                id: $member->id()->value(),
                name: $member->name()->value(),
                email: $member->email()->value(),
            ),
            $members,
        );
    }

    public function allExist(array $ids): bool
    {
        $memberIds = array_map(fn($id) => MemberId::from($id), $ids);
        $members = $this->repository->findByIds($memberIds);

        return count($members) === count($ids);
    }
}

// Usage
if (!$this->memberService->allExist($input->memberIds)) {
    throw new DomainException('一部のメンバーが存在しません');
}
```

### Pattern 4: Query with Criteria

```php
// Contract DTO
final readonly class MemberSearchCriteria
{
    public function __construct(
        public ?string $nameKeyword = null,
        public ?string $status = null,
    ) {}
}

// Contract
interface MemberServiceInterface
{
    /**
     * @return array<MemberDto>
     */
    public function search(MemberSearchCriteria $criteria): array;
}

// Implementation
final readonly class MemberService implements MemberServiceInterface
{
    public function search(MemberSearchCriteria $criteria): array
    {
        $domainCriteria = new \Modules\Member\Domain\Criteria\MemberSearchCriteria(
            nameKeyword: $criteria->nameKeyword,
            status: $criteria->status !== null
                ? MemberStatus::from($criteria->status)
                : null,
        );

        $members = $this->repository->search($domainCriteria);

        return array_map(
            fn($member) => new MemberDto(
                id: $member->id()->value(),
                name: $member->name()->value(),
                email: $member->email()->value(),
                status: $member->status()->value(),
            ),
            $members,
        );
    }
}
```

### Pattern 5: Command Operations

```php
// Contract
interface MemberServiceInterface
{
    public function activate(string $id): void;
    public function deactivate(string $id): void;
}

// Implementation
final readonly class MemberService implements MemberServiceInterface
{
    public function activate(string $id): void
    {
        $member = $this->repository->findById(MemberId::from($id));

        if ($member === null) {
            throw new DomainException('メンバーが見つかりません');
        }

        $activatedMember = $member->activate();
        $this->repository->save($activatedMember);
    }

    public function deactivate(string $id): void
    {
        $member = $this->repository->findById(MemberId::from($id));

        if ($member === null) {
            throw new DomainException('メンバーが見つかりません');
        }

        $deactivatedMember = $member->deactivate();
        $this->repository->save($deactivatedMember);
    }
}
```

---

## Directory Structure

```
modules/
├── Contract/                    # Cross-module public APIs
│   ├── Member/
│   │   ├── MemberServiceInterface.php
│   │   ├── MemberDto.php
│   │   └── MemberSearchCriteria.php
│   └── Project/
│       ├── ProjectServiceInterface.php
│       └── ProjectDto.php
├── Member/
│   ├── Application/
│   │   └── Services/
│   │       └── MemberService.php     # Implements Contract
│   ├── Domain/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   └── Repositories/
│   └── Infrastructure/
│       ├── MemberServiceProvider.php  # Binds Contract
│       └── Repositories/
└── Project/
    ├── Application/
    │   ├── UseCases/
    │   │   └── CreateProjectUseCase.php  # Uses Member via Contract
    │   └── Services/
    │       └── ProjectService.php         # Implements Contract
    ├── Domain/
    └── Infrastructure/
```

---

## Module Dependency Rules

### Allowed Dependencies

```php
// ✅ Module can depend on Contract
use Modules\Contract\Member\MemberServiceInterface;
use Modules\Contract\Member\MemberDto;

// ✅ Module can depend on itself
use Modules\Project\Domain\Entities\Project;
use Modules\Project\Domain\Repositories\ProjectRepositoryInterface;
```

### Forbidden Dependencies

```php
// ❌ Module cannot depend on other module's internals
use Modules\Member\Domain\Entities\Member;
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;
use Modules\Member\Application\UseCases\CreateMemberUseCase;
use Modules\Member\Infrastructure\Repositories\EloquentMemberRepository;
```

---

## Static Analysis with Deptrac

### Module Dependency Configuration

```yaml
# deptrac/module.yaml
deptrac:
  paths:
    - ./modules
  layers:
    Contract:
      collectors:
        - type: directory
          regex: modules/Contract/.*
    Member:
      collectors:
        - type: directory
          regex: modules/Member/.*
    Project:
      collectors:
        - type: directory
          regex: modules/Project/.*
  ruleset:
    Contract: []  # No dependencies
    Member:
      - Contract
      - Member
    Project:
      - Contract
      - Project
```

### Running Deptrac

```bash
./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml
```

---

## Contract Design Guidelines

### 1. Keep DTOs Simple
- Use primitives (string, int, bool, array)
- No domain logic in DTOs
- Immutable (readonly)

### 2. Define Minimal Interface
- Only expose what other modules need
- Don't expose internal implementation details
- Follow Interface Segregation Principle

### 3. Use Primitives for Parameters
- Accept primitives, not ValueObjects
- Contract is boundary between modules
- ValueObject conversion happens inside module

### 4. Return DTOs, Not Entities
- Never return Domain Entities
- Create Contract-specific DTOs
- Control data exposure

### 5. Version Contract Changes Carefully
- Adding methods: Safe (new functionality)
- Changing method signatures: Breaking change
- Removing methods: Breaking change

---

## Testing with Contracts

### Mock Contract in Tests

```php
final class CreateProjectUseCaseTest extends TestCase
{
    public function test_プロジェクトを作成できる(): void
    {
        $memberService = $this->createMock(MemberServiceInterface::class);
        $memberService->expects($this->once())
            ->method('exists')
            ->with('manager-id')
            ->willReturn(true);

        $projectRepository = $this->createMock(ProjectRepositoryInterface::class);
        $projectRepository->expects($this->once())
            ->method('save');

        $useCase = new CreateProjectUseCase(
            projectRepository: $projectRepository,
            memberService: $memberService,
        );

        $output = $useCase->execute(new CreateProjectInput(
            name: 'Test Project',
            description: 'Description',
            managerId: 'manager-id',
        ));

        $this->assertNotEmpty($output->id);
    }
}
```

---

## Checklist: Module Isolation

Before considering module communication correct, verify:

- [ ] Contract interface defined in `modules/Contract/`
- [ ] Contract DTOs use primitives only
- [ ] Service implements Contract in Application layer
- [ ] Service Provider binds Contract to implementation
- [ ] Other modules use Contract (not internal classes)
- [ ] No direct cross-module Entity/Repository references
- [ ] Deptrac validates module dependencies
- [ ] Tests mock Contract interfaces

---

## Why This Matters

**Without Contract pattern**:
- Tight module coupling
- Can't change one module without affecting others
- Dependency web
- Hard to understand module boundaries
- Difficult to test in isolation

**With Contract pattern**:
- Loose coupling between modules
- Clear module boundaries
- Independent module evolution
- Easy to test (mock Contract)
- Maintainable architecture
- Can extract modules to separate packages
