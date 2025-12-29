# Layer Responsibilities - Detailed Guide

This document provides detailed explanations and code examples for each layer in the 4-layer architecture.

## Table of Contents
- [Presentation Layer](#presentation-layer)
- [Application Layer](#application-layer)
- [Domain Layer](#domain-layer)
- [Infrastructure Layer](#infrastructure-layer)

---

## Presentation Layer

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

### Example: Controller Implementation

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

## Application Layer

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

### Example: UseCase Implementation

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

## Domain Layer

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

### Example: Entity Implementation

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

## Infrastructure Layer

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

### Example: Repository Implementation

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
