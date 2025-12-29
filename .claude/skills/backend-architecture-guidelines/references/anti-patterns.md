# Anti-Patterns to Avoid

This document describes common architectural anti-patterns and their correct implementations.

## Table of Contents
- [1. Anemic Domain Model](#1-anemic-domain-model)
- [2. God UseCase](#2-god-usecase)
- [3. Leaky Abstractions](#3-leaky-abstractions)

---

## 1. Anemic Domain Model

### Problem

An anemic domain model is a model where entities are just data containers with getters/setters, and all business logic is in services. This violates the principle of encapsulation and makes the code procedural rather than object-oriented.

### ❌ Anti-Pattern: Anemic Entity

```php
// Entity with no behavior - just getters/setters
final class Member
{
    private string $name;
    private string $email;
    private string $status;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    // No business logic!
}

// Business logic scattered in Services
class MemberService
{
    public function suspend(Member $member): void
    {
        if ($member->getStatus() === 'suspended') {
            throw new Exception('Already suspended');
        }
        $member->setStatus('suspended');
    }

    public function canAccessPremiumContent(Member $member): bool
    {
        return $member->getStatus() === 'active'
            && $member->getMembershipType() === 'premium';
    }
}
```

**Problems**:
- Business rules are not in the Domain layer
- Entity doesn't protect its invariants
- Easy to put entity in invalid state
- Business logic is scattered across services

### ✅ Correct: Rich Domain Model

```php
// Entity with business logic
final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private Email $email,
        private MemberStatus $status,
        private MembershipType $membershipType,
    ) {}

    public static function create(Name $name, Email $email): self
    {
        return new self(
            id: MemberId::generate(),
            name: $name,
            email: $email,
            status: MemberStatus::Active,
            membershipType: MembershipType::Free,
        );
    }

    // Business logic in Entity
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

    public function upgradeToPremium(): void
    {
        if ($this->membershipType === MembershipType::Premium) {
            throw new AlreadyPremiumMemberException($this->id);
        }
        $this->membershipType = MembershipType::Premium;
    }

    // Getters only - no setters
    public function id(): MemberId { return $this->id; }
    public function name(): Name { return $this->name; }
    public function email(): Email { return $this->email; }
    public function status(): MemberStatus { return $this->status; }
}
```

**Benefits**:
- Business rules are encapsulated in Entity
- Entity protects its invariants
- Impossible to put entity in invalid state
- Clear, intention-revealing methods

---

## 2. God UseCase

### Problem

A God UseCase tries to do too many things in a single method, violating the Single Responsibility Principle. It becomes difficult to test, maintain, and understand.

### ❌ Anti-Pattern: God UseCase

```php
// UseCase doing too much
final readonly class ProcessOrderUseCase
{
    public function execute(OrderInput $input): void
    {
        // Validate inventory (50 lines)
        foreach ($input->items as $item) {
            $product = $this->productRepository->find($item->productId);
            if ($product->stock < $item->quantity) {
                throw new InsufficientStockException();
            }
            // ... more inventory logic
        }

        // Calculate prices (100 lines)
        $subtotal = 0;
        foreach ($input->items as $item) {
            $price = $this->priceCalculator->calculate($item);
            // ... discount logic
            // ... tax logic
            // ... shipping logic
            $subtotal += $price;
        }

        // Process payment (80 lines)
        $paymentResult = $this->paymentGateway->charge($subtotal);
        // ... retry logic
        // ... error handling
        // ... refund logic

        // Send notifications (60 lines)
        $this->mailer->send($customer);
        $this->smsService->send($customer);
        // ... notification templates
        // ... notification preferences

        // Update analytics (50 lines)
        $this->analytics->track($order);
        // ... event tracking
        // ... conversion tracking

        // Generate reports (60 lines)
        $this->reportGenerator->generate($order);
        // ... PDF generation
        // ... invoice generation

        // ... 500+ lines total
    }
}
```

**Problems**:
- Too many responsibilities
- Difficult to test (requires many mocks)
- Hard to understand and maintain
- Changes in one area affect everything

### ✅ Correct: Focused UseCases

Break down into smaller, focused UseCases:

```php
// Focused UseCase - single responsibility
final readonly class PlaceOrderUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private InventoryServiceInterface $inventoryService,
        private DomainEventDispatcherInterface $events,
    ) {}

    public function execute(PlaceOrderInput $input): PlaceOrderOutput
    {
        // Validate inventory
        $this->inventoryService->reserve($input->items);

        // Create order (Domain logic)
        $order = Order::create(
            customerId: CustomerId::from($input->customerId),
            items: $this->mapItems($input->items),
            shippingAddress: Address::create($input->shippingAddress),
        );

        // Persist
        $this->orderRepository->save($order);

        // Dispatch event for other concerns
        $this->events->dispatch(new OrderPlaced($order));

        return new PlaceOrderOutput(
            orderId: $order->id()->value(),
            total: $order->total()->value(),
        );
    }

    private function mapItems(array $items): array
    {
        return array_map(
            fn($item) => OrderItem::create(
                productId: ProductId::from($item->productId),
                quantity: Quantity::create($item->quantity),
            ),
            $items,
        );
    }
}

// Separate UseCases for other concerns
final readonly class ProcessPaymentUseCase { /* ... */ }
final readonly class SendOrderConfirmationUseCase { /* ... */ }
final readonly class UpdateInventoryUseCase { /* ... */ }
final readonly class GenerateInvoiceUseCase { /* ... */ }
```

**Use Event Listeners for side effects**:

```php
// Event listener handles notifications
final readonly class SendOrderNotificationListener
{
    public function handle(OrderPlaced $event): void
    {
        $this->mailer->sendOrderConfirmation($event->order);
        $this->smsService->sendOrderNotification($event->order);
    }
}

// Event listener handles analytics
final readonly class TrackOrderAnalyticsListener
{
    public function handle(OrderPlaced $event): void
    {
        $this->analytics->trackPurchase($event->order);
    }
}
```

**Benefits**:
- Each UseCase has single responsibility
- Easy to test (fewer dependencies)
- Easy to understand and maintain
- Changes are isolated

---

## 3. Leaky Abstractions

### Problem

Leaky abstractions occur when implementation details (like Laravel-specific types) leak through interfaces into the Domain layer. This couples Domain to infrastructure and makes testing difficult.

### ❌ Anti-Pattern: Repository Returns Framework Types

```php
// Repository interface leaking Laravel types
interface MemberRepositoryInterface
{
    // Returns Laravel Collection instead of array
    public function findAll(): Collection;  // ❌ Laravel-specific!

    // Returns Laravel Paginator
    public function paginate(): LengthAwarePaginator;  // ❌ Laravel-specific!

    // Returns Eloquent Builder
    public function query(): Builder;  // ❌ Exposes implementation!
}

// Usage in UseCase
final readonly class ListMembersUseCase
{
    public function execute(): Collection  // ❌ Coupled to Laravel
    {
        return $this->memberRepository->findAll();
    }
}
```

**Problems**:
- Domain layer depends on Laravel
- Cannot test without Laravel
- Cannot swap implementation easily
- Violates Dependency Inversion Principle

### ✅ Correct: Repository Uses Domain Types

```php
// Repository interface with pure types
interface MemberRepositoryInterface
{
    /** @return array<Member> */
    public function findAll(): array;

    public function findPaginated(int $page, int $perPage): PaginatedResult;

    public function findById(MemberId $id): ?Member;
}

// PaginatedResult is a Domain value object
final readonly class PaginatedResult
{
    /**
     * @param array<Member> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $perPage,
    ) {}

    public function hasNextPage(): bool
    {
        return $this->page * $this->perPage < $this->total;
    }

    public function totalPages(): int
    {
        return (int) ceil($this->total / $this->perPage);
    }
}

// Infrastructure implementation converts framework types
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findAll(): array
    {
        return MemberModel::all()
            ->map(fn($model) => $this->toEntity($model))
            ->toArray();  // Convert to array before returning
    }

    public function findPaginated(int $page, int $perPage): PaginatedResult
    {
        $paginator = MemberModel::paginate($perPage, ['*'], 'page', $page);

        return new PaginatedResult(
            items: $paginator->items()->map(fn($m) => $this->toEntity($m))->toArray(),
            total: $paginator->total(),
            page: $paginator->currentPage(),
            perPage: $paginator->perPage(),
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

**Benefits**:
- Domain layer is framework-agnostic
- Easy to test (use array/simple objects)
- Can swap implementation (e.g., to in-memory for tests)
- Follows Dependency Inversion Principle
