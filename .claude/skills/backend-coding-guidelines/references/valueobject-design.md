# ValueObject Design - Validation and Type Safety

## AI's Common Failure Patterns

### Pattern 1: Skipping Validation

**❌ AI writes: No validation, accepts any string**

```php
final readonly class Email
{
    public function __construct(public string $value) {}
}

// This allows invalid emails
$email = new Email('not-an-email'); // No error!
$email = new Email(''); // Empty string allowed!
```

### Pattern 2: Using Primitives Instead of ValueObjects

**❌ AI writes: Using primitives instead of ValueObjects**

```php
final class Member
{
    public function __construct(
        private readonly string $id,    // Should be MemberId
        private readonly string $name,  // Should be Name
        private readonly string $email, // Should be Email
    ) {}
}

// Problems:
// - No validation on email format
// - No type safety (can pass email as name)
// - No domain modeling
```

---

## ✅ Correct Pattern: Validation at Creation Time

### Basic ValueObject with Validation

```php
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
```

### ID ValueObject with Generation

```php
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

## Common ValueObject Patterns

### Simple String ValueObject with Constraints

```php
final readonly class Name
{
    private function __construct(private string $value) {}

    public static function create(string $value): self
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            throw new InvalidArgumentException('名前は空にできません');
        }

        if (mb_strlen($trimmed) > 100) {
            throw new InvalidArgumentException('名前は100文字以内にしてください');
        }

        return new self($trimmed);
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

### Numeric ValueObject with Range Validation

```php
final readonly class Age
{
    private function __construct(private int $value) {}

    public static function create(int $value): self
    {
        if ($value < 0) {
            throw new InvalidArgumentException('年齢は0以上である必要があります');
        }

        if ($value > 150) {
            throw new InvalidArgumentException('年齢は150以下である必要があります');
        }

        return new self($value);
    }

    public function value(): int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function isAdult(): bool
    {
        return $this->value >= 20;
    }
}
```

### Enum-like ValueObject (Status)

```php
final readonly class MemberStatus
{
    private const ACTIVE = 'active';
    private const INACTIVE = 'inactive';
    private const SUSPENDED = 'suspended';

    private function __construct(private string $value) {}

    public static function active(): self
    {
        return new self(self::ACTIVE);
    }

    public static function inactive(): self
    {
        return new self(self::INACTIVE);
    }

    public static function suspended(): self
    {
        return new self(self::SUSPENDED);
    }

    public static function from(string $value): self
    {
        return match ($value) {
            self::ACTIVE => self::active(),
            self::INACTIVE => self::inactive(),
            self::SUSPENDED => self::suspended(),
            default => throw new InvalidArgumentException("無効なステータス: {$value}"),
        };
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function isActive(): bool
    {
        return $this->value === self::ACTIVE;
    }
}
```

### Date/Time ValueObject

```php
final readonly class CreatedAt
{
    private function __construct(private DateTimeImmutable $value) {}

    public static function now(): self
    {
        return new self(new DateTimeImmutable());
    }

    public static function fromString(string $value): self
    {
        try {
            return new self(new DateTimeImmutable($value));
        } catch (Exception $e) {
            throw new InvalidArgumentException("無効な日時形式: {$value}", 0, $e);
        }
    }

    public static function fromDateTime(DateTimeImmutable $value): self
    {
        return new self($value);
    }

    public function value(): DateTimeImmutable
    {
        return $this->value;
    }

    public function format(string $format = 'Y-m-d H:i:s'): string
    {
        return $this->value->format($format);
    }

    public function equals(self $other): bool
    {
        return $this->value == $other->value;
    }

    public function isBefore(self $other): bool
    {
        return $this->value < $other->value;
    }

    public function isAfter(self $other): bool
    {
        return $this->value > $other->value;
    }
}
```

### Multi-Property ValueObject

```php
final readonly class Address
{
    private function __construct(
        private string $postalCode,
        private string $prefecture,
        private string $city,
        private string $street,
    ) {}

    public static function create(
        string $postalCode,
        string $prefecture,
        string $city,
        string $street,
    ): self {
        // Validate postal code format
        if (!preg_match('/^\d{3}-\d{4}$/', $postalCode)) {
            throw new InvalidArgumentException('郵便番号は000-0000の形式で入力してください');
        }

        // Validate non-empty
        if (trim($prefecture) === '' || trim($city) === '' || trim($street) === '') {
            throw new InvalidArgumentException('住所のすべての項目を入力してください');
        }

        return new self(
            postalCode: $postalCode,
            prefecture: trim($prefecture),
            city: trim($city),
            street: trim($street),
        );
    }

    public function postalCode(): string
    {
        return $this->postalCode;
    }

    public function prefecture(): string
    {
        return $this->prefecture;
    }

    public function city(): string
    {
        return $this->city;
    }

    public function street(): string
    {
        return $this->street;
    }

    public function fullAddress(): string
    {
        return "{$this->postalCode} {$this->prefecture}{$this->city}{$this->street}";
    }

    public function equals(self $other): bool
    {
        return $this->postalCode === $other->postalCode
            && $this->prefecture === $other->prefecture
            && $this->city === $other->city
            && $this->street === $other->street;
    }
}
```

---

## Key Design Principles

### 1. Private Constructor
- Prevents direct instantiation
- Forces validation through factory methods
- Ensures all instances are valid

### 2. Factory Methods
- `create()`: For creating from validated input
- `from()`: For reconstruction from trusted source (DB)
- Named constructors: `now()`, `active()`, etc.

### 3. Readonly Class/Properties
- Immutable after creation
- Thread-safe
- Easier to reason about

### 4. Final Class
- Prevents inheritance
- Ensures behavior consistency
- Simplifies testing

### 5. Value() Method
- Returns underlying primitive value
- Enables conversion back to primitives
- Used when persisting to database

### 6. Equals() Method
- Compares by value (not identity)
- Essential for ValueObject equality
- Used in business logic

---

## Usage in Entities

### Before (with primitives)

```php
final class Member
{
    public function __construct(
        private readonly string $id,
        private readonly string $name,
        private readonly string $email,
    ) {}

    // No validation
    // Can pass email as name (type unsafe)
}
```

### After (with ValueObjects)

```php
final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private readonly Email $email,
    ) {}

    public static function create(Name $name, Email $email): self
    {
        return new self(
            id: MemberId::generate(),
            name: $name,  // Already validated
            email: $email, // Already validated
        );
    }

    // Type-safe, validated, domain-modeled
}
```

---

## Checklist: ValueObject Design

Before considering a ValueObject implementation complete, verify:

- [ ] Class is marked as `final readonly`
- [ ] Constructor is `private`
- [ ] Has factory method (`create()`, `from()`, etc.)
- [ ] Validation happens in factory method
- [ ] Has `value()` method to get underlying value
- [ ] Has `equals()` method for comparison
- [ ] Immutable after creation
- [ ] Throws exception for invalid values
- [ ] No setter methods
- [ ] No public properties

---

## Why This Matters

**Without ValueObjects**, code suffers from:
- Primitive Obsession anti-pattern
- No validation guarantee
- Type unsafety (string can be anything)
- Scattered validation logic
- Poor domain modeling

**With ValueObjects**, you get:
- Guaranteed validation
- Type safety
- Self-documenting code
- Centralized validation logic
- Rich domain model
- Immutability and consistency
