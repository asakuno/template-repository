# Domain Layer Testing - Entity & ValueObject

This reference covers testing patterns for Domain layer components (Entity and ValueObject) in the 4-layer architecture.

## Core Principles

- **No Database**: Domain tests are pure unit tests
- **No Laravel Dependencies**: Test business logic in isolation
- **ValueObject Validation**: Test both valid and invalid cases
- **Factory Methods**: Test Entity creation and reconstruction

---

## 1. Domain Layer Testing (Unit)

**Pattern AI gets wrong**: Testing with database, skipping ValueObject validation

```php
// ❌ AI writes: Uses database in Domain tests
final class MemberTest extends TestCase
{
    use RefreshDatabase; // Wrong! Domain tests shouldn't need DB

    public function test_メンバーを作成できる(): void
    {
        $member = Member::create(
            name: 'Taro',  // Using primitives
            email: 'taro@example.com',
        );

        $this->assertDatabaseHas('members', ['name' => 'Taro']); // Wrong!
    }
}
```

**Correct pattern**: Pure unit tests with ValueObjects

```php
// ✅ Correct: Domain Unit Test - no database
final class MemberTest extends TestCase
{
    public function test_メンバーを作成できる(): void
    {
        // Arrange
        $name = Name::create('山田太郎');
        $email = Email::create('taro@example.com');

        // Act
        $member = Member::create($name, $email);

        // Assert
        $this->assertNotNull($member->id());
        $this->assertTrue($member->name()->equals($name));
        $this->assertTrue($member->email()->equals($email));
    }

    public function test_IDが自動生成される(): void
    {
        // Arrange
        $name = Name::create('山田太郎');
        $email = Email::create('taro@example.com');

        // Act
        $member1 = Member::create($name, $email);
        $member2 = Member::create($name, $email);

        // Assert - 異なるIDが生成される
        $this->assertFalse($member1->id()->equals($member2->id()));
    }
}
```

---

## 2. ValueObject Testing

**Pattern AI gets wrong**: Only testing happy path

```php
// ❌ AI writes: Only tests valid case
final class EmailTest extends TestCase
{
    public function test_メールアドレスを作成できる(): void
    {
        $email = Email::create('test@example.com');
        $this->assertSame('test@example.com', $email->value());
    }
    // Missing: Invalid email tests!
}
```

**Correct pattern**: Test both valid and invalid cases

```php
// ✅ Correct: Complete ValueObject test
final class EmailTest extends TestCase
{
    public function test_有効なメールアドレスで生成できる(): void
    {
        // Arrange & Act
        $email = Email::create('test@example.com');

        // Assert
        $this->assertSame('test@example.com', $email->value());
    }

    public function test_無効なメールアドレスは例外が発生する(): void
    {
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('無効なメールアドレス形式');

        // Act
        Email::create('invalid-email');
    }

    public function test_空文字列は例外が発生する(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Email::create('');
    }

    public function test_等価判定ができる(): void
    {
        // Arrange
        $email1 = Email::create('test@example.com');
        $email2 = Email::create('test@example.com');
        $email3 = Email::create('other@example.com');

        // Assert
        $this->assertTrue($email1->equals($email2));
        $this->assertFalse($email1->equals($email3));
    }

    /**
     * @dataProvider 有効なメールアドレス一覧
     */
    public function test_様々な有効なメールアドレスで生成できる(string $validEmail): void
    {
        $email = Email::create($validEmail);
        $this->assertSame($validEmail, $email->value());
    }

    public static function 有効なメールアドレス一覧(): array
    {
        return [
            'basic' => ['test@example.com'],
            'subdomain' => ['test@sub.example.com'],
            'plus' => ['test+tag@example.com'],
            'numbers' => ['test123@example.com'],
        ];
    }

    /**
     * @dataProvider 無効なメールアドレス一覧
     */
    public function test_様々な無効なメールアドレスで例外が発生する(string $invalidEmail): void
    {
        $this->expectException(InvalidArgumentException::class);
        Email::create($invalidEmail);
    }

    public static function 無効なメールアドレス一覧(): array
    {
        return [
            'no_at' => ['testexample.com'],
            'no_domain' => ['test@'],
            'spaces' => ['test @example.com'],
            'special_chars' => ['test<>@example.com'],
        ];
    }
}
```

---

## ValueObject Testing Checklist

When testing ValueObjects, ensure:

- [ ] Valid input creates ValueObject successfully
- [ ] Invalid input throws InvalidArgumentException
- [ ] Empty/null input is handled appropriately
- [ ] Edge cases are tested (boundaries, special characters)
- [ ] `equals()` method works correctly
- [ ] `value()` method returns expected value
- [ ] Data providers used for multiple test cases
- [ ] Exception messages are verified

## Entity Testing Checklist

When testing Entities, ensure:

- [ ] `create()` factory method generates new Entity with ID
- [ ] `reconstruct()` factory method recreates Entity from data
- [ ] All ValueObject properties are properly set
- [ ] ID generation works (multiple creates produce different IDs)
- [ ] Getter methods return correct ValueObjects
- [ ] No database access in tests
- [ ] No RefreshDatabase trait used
