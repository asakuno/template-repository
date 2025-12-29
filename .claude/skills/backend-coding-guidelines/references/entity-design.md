# Entity Design - Factory Methods and Immutability

## AI's Most Critical Failure Pattern

**Pattern AI ALWAYS gets wrong**: Using public constructors and mutable properties

### ❌ Typical AI Pattern (Mutable, No Factory Methods)

```php
class Member
{
    public function __construct(
        public ?string $id,
        public string $name,
        public string $email,
    ) {}
}

// AI creates Entities without distinguishing creation vs reconstruction
$member = new Member(null, 'Taro', 'taro@example.com'); // 新規作成?
$member = new Member('123', 'Taro', 'taro@example.com'); // DB復元?
```

**Problems with this approach**:
1. No distinction between creating new entities and reconstructing from DB
2. Mutable properties allow invalid state changes after creation
3. ID generation is inconsistent (sometimes null, sometimes provided)
4. No validation at creation time
5. Violates encapsulation (public properties)

---

## ✅ Correct Pattern: Private Constructor with Factory Methods

### Complete Entity Implementation

```php
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

### Usage Examples

```php
// Creating new entity
$member = Member::create(
    name: Name::create('山田太郎'),
    email: Email::create('taro@example.com'),
);
// ID is automatically generated

// Reconstructing from database
$member = Member::reconstruct(
    id: MemberId::from('existing-uuid'),
    name: Name::create('山田太郎'),
    email: Email::create('taro@example.com'),
);
// Uses existing ID from database
```

---

## Key Design Principles

### 1. Private Constructor
- Prevents direct instantiation
- Forces use of factory methods
- Ensures all instances go through validation

### 2. Two Factory Methods
- `create()`: For new entities (generates ID)
- `reconstruct()`: For database restoration (uses existing ID)
- Clear semantic distinction

### 3. Readonly Properties
- Entity is immutable after creation
- Prevents accidental state changes
- Guarantees consistency

### 4. Final Class
- Prevents inheritance
- Ensures entity behavior can't be modified
- Simplifies reasoning about code

### 5. ValueObject Properties
- Use `MemberId`, `Name`, `Email` instead of primitives
- Validation happens in ValueObject creation
- Type safety and domain modeling

---

## Common Variations

### Entity with Business Logic

```php
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
            status: MemberStatus::active(), // Default status
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

    // Business logic methods
    public function deactivate(): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            email: $this->email,
            status: MemberStatus::inactive(),
        );
    }

    public function isActive(): bool
    {
        return $this->status->equals(MemberStatus::active());
    }

    public function id(): MemberId { return $this->id; }
    public function name(): Name { return $this->name; }
    public function email(): Email { return $this->email; }
    public function status(): MemberStatus { return $this->status; }
}
```

### Entity with Validation Logic

```php
final class Project
{
    private function __construct(
        private readonly ProjectId $id,
        private readonly ProjectName $name,
        private readonly MemberId $managerId,
        private readonly ProjectStatus $status,
    ) {}

    public static function create(
        ProjectName $name,
        MemberId $managerId,
    ): self {
        return new self(
            id: ProjectId::generate(),
            name: $name,
            managerId: $managerId,
            status: ProjectStatus::draft(),
        );
    }

    public static function reconstruct(
        ProjectId $id,
        ProjectName $name,
        MemberId $managerId,
        ProjectStatus $status,
    ): self {
        return new self($id, $name, $managerId, $status);
    }

    public function start(): self
    {
        if ($this->status->equals(ProjectStatus::completed())) {
            throw new DomainException('完了したプロジェクトは開始できません');
        }

        return new self(
            id: $this->id,
            name: $this->name,
            managerId: $this->managerId,
            status: ProjectStatus::inProgress(),
        );
    }

    public function id(): ProjectId { return $this->id; }
    public function name(): ProjectName { return $this->name; }
    public function managerId(): MemberId { return $this->managerId; }
    public function status(): ProjectStatus { return $this->status; }
}
```

---

## Checklist: Entity Design

Before considering an Entity implementation complete, verify:

- [ ] Class is marked as `final`
- [ ] Constructor is `private`
- [ ] Has `create()` factory method for new entities
- [ ] Has `reconstruct()` factory method for DB restoration
- [ ] All properties are `readonly`
- [ ] All properties use ValueObjects (not primitives)
- [ ] Has getter methods for all properties
- [ ] Business logic returns new instance (immutability)
- [ ] No setter methods
- [ ] No public property access

---

## Why This Matters

**Without factory methods**, AI will:
- Mix creation and reconstruction logic
- Generate inconsistent IDs
- Skip validation
- Create mutable entities
- Use primitives instead of ValueObjects

**With factory methods**, you get:
- Clear distinction between new and existing entities
- Consistent ID generation
- Guaranteed validation
- Immutable, consistent state
- Type-safe domain modeling
