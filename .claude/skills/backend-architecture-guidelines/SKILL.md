---
name: backend-architecture-guidelines
description: 4-layer architecture design guidelines for Laravel applications. Covers layer responsibilities, dependency rules, module isolation, and DDD-lite patterns. Reference this skill when planning backend architecture decisions during Phase 1 (Planning & Review).
---

# Backend Architecture Guidelines - 4-Layer DDD-Lite

This skill covers architectural decisions and patterns for Laravel applications following a 4-layer architecture with Domain-Driven Design principles.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (Controller, Request, Resource, Middleware, Inertia)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│            (UseCase, DTO, ApplicationService)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  (Entity, ValueObject, DomainService, Repository Interface) │
└─────────────────────────────▲───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   Infrastructure Layer                       │
│      (Repository Implementation, Eloquent Model, Query)     │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Rules

### Fundamental Rule
**Dependencies point inward - outer layers depend on inner layers.**

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain Layer**: ZERO external dependencies (pure PHP only)
- **Infrastructure Layer**: Implements Domain interfaces (Dependency Inversion)
- **Application Layer**: Orchestrates Domain objects through interfaces
- **Presentation Layer**: Handles HTTP concerns, uses Application layer

### What Each Layer Can Depend On

| Layer | Can Depend On |
|-------|---------------|
| Presentation | Application, (Domain DTOs for display) |
| Application | Domain |
| Domain | Nothing (Pure PHP) |
| Infrastructure | Domain (for implementing interfaces) |

---

## Layer Responsibilities

### Presentation Layer

**Purpose**: HTTP request/response handling

**Contains**:
- `Controllers/` - HTTP request handlers
- `Requests/` - Form validation (FormRequest)
- `Resources/` - API response transformation
- `Middleware/` - Request pipeline

**Responsibilities**:
- Receive HTTP request
- Validate input format (not business rules)
- Call appropriate UseCase
- Return HTTP response (Inertia, JSON, Redirect)

**NOT Responsible For**:
- Business logic
- Direct database access
- Data transformation logic

```php
// ✅ Controller - thin, delegates to UseCase
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

        return redirect()->route('members.index');
    }
}
```

---

### Application Layer

**Purpose**: Use case orchestration

**Contains**:
- `UseCases/` - Application-specific business operations
- `DTOs/` - Input/Output data transfer objects
- `Services/` - Application services (cross-cutting concerns)

**Responsibilities**:
- Coordinate Domain objects
- Transaction management
- Authorization checks
- Input/Output transformation

**NOT Responsible For**:
- Business rules (belongs in Domain)
- HTTP concerns
- Database queries

```php
// ✅ UseCase - orchestrates Domain objects
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
        private EventDispatcherInterface $events,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        // Create Domain object
        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );

        // Persist through interface
        $this->repository->save($member);

        // Dispatch domain event
        $this->events->dispatch(new MemberCreated($member));

        // Return Output DTO
        return new CreateMemberOutput(id: $member->id()->value());
    }
}
```

---

### Domain Layer

**Purpose**: Business logic and rules

**Contains**:
- `Entities/` - Business objects with identity
- `ValueObjects/` - Immutable value types
- `Repositories/` - Interface definitions only
- `Services/` - Domain services (cross-entity logic)
- `Exceptions/` - Domain-specific exceptions
- `Events/` - Domain events

**Responsibilities**:
- Encapsulate business rules
- Validate business invariants
- Define repository contracts

**NOT Responsible For**:
- Persistence details
- External service calls
- Framework dependencies

```php
// ✅ Entity - pure business logic
final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private Email $email,
        private MemberStatus $status,
    ) {}

    public static function create(Name $name, Email $email): self
    {
        return new self(
            id: MemberId::generate(),
            name: $name,
            email: $email,
            status: MemberStatus::Active,
        );
    }

    public function suspend(): void
    {
        if ($this->status === MemberStatus::Suspended) {
            throw new MemberAlreadySuspendedException($this->id);
        }
        $this->status = MemberStatus::Suspended;
    }

    public function canAccessPremiumContent(): bool
    {
        return $this->status === MemberStatus::Active
            && $this->membershipType === MembershipType::Premium;
    }
}
```

---

### Infrastructure Layer

**Purpose**: Technical implementation details

**Contains**:
- `Repositories/` - Repository implementations
- `Models/` - Eloquent models
- `QueryBuilders/` - Complex query builders
- `Services/` - External service integrations

**Responsibilities**:
- Implement Domain interfaces
- Database operations
- External API calls
- File system operations

**NOT Responsible For**:
- Business logic
- HTTP handling

```php
// ✅ Repository Implementation - technical details
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member
    {
        $model = MemberModel::find($id->value());

        if ($model === null) {
            return null;
        }

        return $this->toEntity($model);
    }

    public function save(Member $member): void
    {
        MemberModel::updateOrCreate(
            ['id' => $member->id()->value()],
            [
                'name' => $member->name()->value(),
                'email' => $member->email()->value(),
                'status' => $member->status()->value,
            ],
        );
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
}
```

---

## Module Structure

### Directory Layout

```
modules/
├── Contract/                    # Cross-module public APIs
│   ├── Member/
│   │   ├── MemberServiceInterface.php
│   │   └── DTOs/
│   │       └── MemberDto.php
│   └── Project/
│       └── ProjectServiceInterface.php
│
├── Member/                      # Member module
│   ├── Presentation/
│   │   ├── Controllers/
│   │   │   └── MemberController.php
│   │   ├── Requests/
│   │   │   ├── CreateMemberRequest.php
│   │   │   └── UpdateMemberRequest.php
│   │   └── Resources/
│   │       └── MemberResource.php
│   ├── Application/
│   │   ├── UseCases/
│   │   │   ├── CreateMemberUseCase.php
│   │   │   ├── UpdateMemberUseCase.php
│   │   │   └── ListMembersUseCase.php
│   │   ├── DTOs/
│   │   │   ├── CreateMemberInput.php
│   │   │   ├── CreateMemberOutput.php
│   │   │   └── MemberListItem.php
│   │   └── Services/
│   │       └── MemberService.php  # Implements Contract
│   ├── Domain/
│   │   ├── Entities/
│   │   │   └── Member.php
│   │   ├── ValueObjects/
│   │   │   ├── MemberId.php
│   │   │   ├── Name.php
│   │   │   └── Email.php
│   │   ├── Repositories/
│   │   │   └── MemberRepositoryInterface.php
│   │   ├── Services/
│   │   │   └── MemberDomainService.php
│   │   └── Exceptions/
│   │       ├── MemberNotFoundException.php
│   │       └── DuplicateEmailException.php
│   └── Infrastructure/
│       ├── Repositories/
│       │   └── EloquentMemberRepository.php
│       └── Models/
│           └── MemberModel.php
│
└── Project/                     # Project module
    └── ...
```

---

## Module Isolation

### Rule: Modules communicate ONLY through Contract

```php
// ❌ WRONG: Direct cross-module reference
namespace Modules\Project\Application\UseCases;

use Modules\Member\Domain\Entities\Member;  // Illegal!
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;  // Illegal!

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberRepositoryInterface $memberRepository,  // Wrong!
    ) {}
}
```

```php
// ✅ CORRECT: Use Contract interface
namespace Modules\Project\Application\UseCases;

use Modules\Contract\Member\MemberServiceInterface;

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberServiceInterface $memberService,  // Via Contract
        private ProjectRepositoryInterface $projectRepository,
    ) {}

    public function execute(CreateProjectInput $input): CreateProjectOutput
    {
        // Check member exists via Contract
        $member = $this->memberService->findById($input->ownerId);
        if ($member === null) {
            throw new MemberNotFoundException($input->ownerId);
        }

        // Create project
        $project = Project::create(
            name: ProjectName::create($input->name),
            ownerId: OwnerId::from($input->ownerId),
        );

        $this->projectRepository->save($project);

        return new CreateProjectOutput(id: $project->id()->value());
    }
}
```

### Contract Definition

```php
// modules/Contract/Member/MemberServiceInterface.php
namespace Modules\Contract\Member;

interface MemberServiceInterface
{
    public function findById(string $id): ?MemberDto;
    public function exists(string $id): bool;
    public function findByEmail(string $email): ?MemberDto;
}

// modules/Contract/Member/DTOs/MemberDto.php
namespace Modules\Contract\Member\DTOs;

final readonly class MemberDto
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
    ) {}
}
```

### Contract Implementation

```php
// modules/Member/Application/Services/MemberService.php
namespace Modules\Member\Application\Services;

use Modules\Contract\Member\MemberServiceInterface;
use Modules\Contract\Member\DTOs\MemberDto;

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
        );
    }
}
```

---

## Static Analysis with Deptrac

### Module Dependencies

```yaml
# deptrac/module.yaml
deptrac:
  paths:
    - ./modules
  layers:
    - name: Contract
      collectors:
        - type: directory
          value: modules/Contract/.*
    - name: Member
      collectors:
        - type: directory
          value: modules/Member/.*
    - name: Project
      collectors:
        - type: directory
          value: modules/Project/.*
  ruleset:
    Contract:
      - Contract
    Member:
      - Contract
      - Member
    Project:
      - Contract
      - Project
```

### Layer Dependencies

```yaml
# deptrac/layer.yaml
deptrac:
  paths:
    - ./modules
  layers:
    - name: Presentation
      collectors:
        - type: directory
          value: modules/.*/Presentation/.*
    - name: Application
      collectors:
        - type: directory
          value: modules/.*/Application/.*
    - name: Domain
      collectors:
        - type: directory
          value: modules/.*/Domain/.*
    - name: Infrastructure
      collectors:
        - type: directory
          value: modules/.*/Infrastructure/.*
  ruleset:
    Presentation:
      - Presentation
      - Application
    Application:
      - Application
      - Domain
    Domain:
      - Domain
    Infrastructure:
      - Infrastructure
      - Domain
```

---

## Decision Framework

### When to Create a New Module

Create a new module when:
- Feature has its own business domain
- Feature can be developed independently
- Feature has clear boundaries
- Feature might be extracted as microservice later

### When to Create a Domain Service

Use Domain Service when:
- Logic involves multiple entities
- Logic doesn't naturally belong to one entity
- Operation requires coordination between aggregates

```php
// ✅ Domain Service for cross-entity logic
final readonly class MemberTransferService
{
    public function transfer(
        Member $member,
        Project $fromProject,
        Project $toProject,
    ): void {
        $fromProject->removeMember($member->id());
        $toProject->addMember($member->id());
    }
}
```

### When to Create a ValueObject

Create ValueObject when:
- Value has validation rules
- Value has behavior (formatting, comparison)
- Value is used in multiple places
- Primitive obsession is emerging

---

## Anti-Patterns to Avoid

### 1. Anemic Domain Model

```php
// ❌ Anemic Entity - just getters/setters
final class Member
{
    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = $name; }
    // No business logic!
}

// Business logic in Service
class MemberService
{
    public function suspend(Member $member): void
    {
        if ($member->getStatus() === 'suspended') {
            throw new Exception('Already suspended');
        }
        $member->setStatus('suspended');
    }
}
```

```php
// ✅ Rich Domain Model - logic in Entity
final class Member
{
    public function suspend(): void
    {
        if ($this->status === MemberStatus::Suspended) {
            throw new MemberAlreadySuspendedException($this->id);
        }
        $this->status = MemberStatus::Suspended;
    }
}
```

### 2. God UseCase

```php
// ❌ UseCase doing too much
final readonly class ProcessOrderUseCase
{
    public function execute(OrderInput $input): void
    {
        // Validate inventory
        // Calculate prices
        // Process payment
        // Send notifications
        // Update analytics
        // Generate reports
        // ... 500 lines
    }
}
```

```php
// ✅ Focused UseCase
final readonly class PlaceOrderUseCase
{
    public function execute(PlaceOrderInput $input): PlaceOrderOutput
    {
        $order = Order::create(...);
        $this->orderRepository->save($order);
        $this->events->dispatch(new OrderPlaced($order));

        return new PlaceOrderOutput($order->id()->value());
    }
}

// Separate UseCases for other concerns
// ProcessPaymentUseCase
// SendOrderConfirmationUseCase
// UpdateInventoryUseCase
```

### 3. Leaky Abstractions

```php
// ❌ Repository returns Eloquent-specific types
interface MemberRepositoryInterface
{
    public function findAll(): Collection;  // Laravel Collection!
    public function paginate(): LengthAwarePaginator;  // Laravel specific!
}
```

```php
// ✅ Repository uses Domain types
interface MemberRepositoryInterface
{
    /** @return array<Member> */
    public function findAll(): array;

    public function findPaginated(int $page, int $perPage): PaginatedResult;
}

// PaginatedResult is a Domain value object
final readonly class PaginatedResult
{
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $perPage,
    ) {}
}
```

---

## Architecture Decision Checklist

When making architecture decisions, verify:

### Layer Placement
- [ ] Is this code in the correct layer?
- [ ] Does it depend only on allowed layers?
- [ ] Is business logic in Domain layer?

### Module Boundaries
- [ ] Does this belong to an existing module?
- [ ] If cross-module, using Contract?
- [ ] Are module boundaries respected?

### Dependencies
- [ ] Domain layer has no framework imports?
- [ ] Repository interface in Domain, implementation in Infrastructure?
- [ ] Controller depends on UseCase, not Repository?

### Entity Design
- [ ] Using factory methods (create/reconstruct)?
- [ ] Properties are readonly?
- [ ] Business logic in Entity, not Service?

### UseCase Design
- [ ] Using Input/Output DTOs?
- [ ] Single responsibility?
- [ ] Depending on interfaces?
