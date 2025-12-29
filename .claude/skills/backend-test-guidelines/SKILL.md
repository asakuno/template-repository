---
name: backend-test-guidelines
description: Comprehensive PHPUnit and Laravel testing guidelines for 4-layer architecture. Covers Unit tests for Domain layer, Feature tests for Application/Infrastructure/Presentation layers, and Inertia testing patterns. Reference this skill when creating or updating backend test code during Phase 2 (Testing & Review).
---

# Backend Test Guidelines - PHPUnit & Laravel Testing

This skill covers testing patterns for Laravel applications following a 4-layer architecture. It focuses on what AI commonly gets wrong in test design and implementation.

## Test Strategy Overview

| Layer | Test Type | Database | Purpose |
|-------|-----------|----------|---------|
| Domain | Unit | No | Entity/ValueObject behavior |
| Application | Unit | No | UseCase logic with mocked Repository |
| Application | Feature | Yes | UseCase integration with real Repository |
| Infrastructure | Feature | Yes | Repository implementation |
| Presentation | Feature | Yes | HTTP request/response, Inertia rendering |

## Directory Structure

```
tests/
├── Unit/
│   └── Modules/
│       └── {Module}/
│           ├── Domain/
│           │   ├── Entities/
│           │   └── ValueObjects/
│           └── Application/
│               └── UseCases/
└── Feature/
    └── Modules/
        └── {Module}/
            ├── Application/
            │   └── UseCases/
            ├── Infrastructure/
            │   └── Repositories/
            └── Presentation/
                └── Controllers/
```

---

## ⚠️ Critical: AI's Common Test Failures

### 1. Domain Layer Testing (Unit)

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

### 2. ValueObject Testing

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

### 3. UseCase Unit Testing

**Pattern AI gets wrong**: Not mocking repository, testing with database

```php
// ❌ AI writes: Uses real database
final class CreateMemberUseCaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_メンバーを作成できる(): void
    {
        $useCase = app(CreateMemberUseCase::class); // Gets real implementation

        $output = $useCase->execute(new CreateMemberInput(
            name: 'Test User',
            email: 'test@example.com',
        ));

        $this->assertDatabaseHas('members', ['email' => 'test@example.com']);
    }
}
```

**Correct pattern**: Mock repository for unit test

```php
// ✅ Correct: UseCase Unit Test with mocked repository
final class CreateMemberUseCaseTest extends TestCase
{
    public function test_メンバーを作成できる(): void
    {
        // Arrange
        $repository = $this->createMock(MemberRepositoryInterface::class);
        $repository
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(function (Member $member) {
                return $member->name()->value() === 'Test User'
                    && $member->email()->value() === 'test@example.com';
            }));

        $useCase = new CreateMemberUseCase($repository);

        // Act
        $output = $useCase->execute(new CreateMemberInput(
            name: 'Test User',
            email: 'test@example.com',
        ));

        // Assert
        $this->assertNotEmpty($output->id);
    }

    public function test_無効なメールアドレスで例外が発生する(): void
    {
        // Arrange
        $repository = $this->createMock(MemberRepositoryInterface::class);
        $repository->expects($this->never())->method('save');

        $useCase = new CreateMemberUseCase($repository);

        // Assert
        $this->expectException(InvalidArgumentException::class);

        // Act
        $useCase->execute(new CreateMemberInput(
            name: 'Test User',
            email: 'invalid-email',
        ));
    }

    public function test_名前が空の場合例外が発生する(): void
    {
        // Arrange
        $repository = $this->createMock(MemberRepositoryInterface::class);
        $repository->expects($this->never())->method('save');

        $useCase = new CreateMemberUseCase($repository);

        // Assert
        $this->expectException(InvalidArgumentException::class);

        // Act
        $useCase->execute(new CreateMemberInput(
            name: '',
            email: 'test@example.com',
        ));
    }
}
```

---

### 4. Repository Feature Testing

**Pattern AI gets wrong**: Testing Eloquent directly, not through interface

```php
// ❌ AI writes: Tests Eloquent Model, not Repository
final class MemberRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_メンバーを保存できる(): void
    {
        MemberModel::create([
            'id' => 'test-id',
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->assertDatabaseHas('members', ['id' => 'test-id']);
    }
}
```

**Correct pattern**: Test Repository implementation with Entity

```php
// ✅ Correct: Repository Feature Test
final class EloquentMemberRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentMemberRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentMemberRepository();
    }

    public function test_メンバーを保存して取得できる(): void
    {
        // Arrange
        $member = Member::create(
            name: Name::create('山田太郎'),
            email: Email::create('taro@example.com'),
        );

        // Act
        $this->repository->save($member);
        $found = $this->repository->findById($member->id());

        // Assert
        $this->assertNotNull($found);
        $this->assertTrue($found->id()->equals($member->id()));
        $this->assertTrue($found->name()->equals($member->name()));
        $this->assertTrue($found->email()->equals($member->email()));
    }

    public function test_存在しないIDでnullが返る(): void
    {
        // Arrange
        $nonExistentId = MemberId::from('non-existent-id');

        // Act
        $result = $this->repository->findById($nonExistentId);

        // Assert
        $this->assertNull($result);
    }

    public function test_メールアドレスで検索できる(): void
    {
        // Arrange
        $member = Member::create(
            name: Name::create('山田太郎'),
            email: Email::create('taro@example.com'),
        );
        $this->repository->save($member);

        // Act
        $found = $this->repository->findByEmail(Email::create('taro@example.com'));

        // Assert
        $this->assertNotNull($found);
        $this->assertTrue($found->id()->equals($member->id()));
    }

    public function test_メンバーを削除できる(): void
    {
        // Arrange
        $member = Member::create(
            name: Name::create('山田太郎'),
            email: Email::create('taro@example.com'),
        );
        $this->repository->save($member);

        // Act
        $this->repository->delete($member->id());
        $found = $this->repository->findById($member->id());

        // Assert
        $this->assertNull($found);
    }
}
```

---

### 5. Controller/Inertia Testing

**Pattern AI gets wrong**: Only testing response status

```php
// ❌ AI writes: Only checks status code
final class MemberControllerTest extends TestCase
{
    public function test_一覧ページを表示できる(): void
    {
        $response = $this->get(route('members.index'));
        $response->assertStatus(200);
    }
}
```

**Correct pattern**: Test Inertia component and props

```php
// ✅ Correct: Inertia Controller Test
final class MemberControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_一覧ページにメンバーが表示される(): void
    {
        // Arrange
        MemberModel::factory()->count(3)->create();

        // Act
        $response = $this->get(route('members.index'));

        // Assert
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Members/Index')
            ->has('members', 3)
        );
    }

    public function test_メンバーを作成できる(): void
    {
        // Arrange
        $data = [
            'name' => '山田太郎',
            'email' => 'taro@example.com',
        ];

        // Act
        $response = $this->post(route('members.store'), $data);

        // Assert
        $response->assertRedirect(route('members.index'));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('members', [
            'name' => '山田太郎',
            'email' => 'taro@example.com',
        ]);
    }

    public function test_詳細ページにメンバー情報が表示される(): void
    {
        // Arrange
        $member = MemberModel::factory()->create([
            'name' => '山田太郎',
            'email' => 'taro@example.com',
        ]);

        // Act
        $response = $this->get(route('members.show', $member));

        // Assert
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Members/Show')
            ->has('member', fn (AssertableInertia $page) => $page
                ->where('id', $member->id)
                ->where('name', '山田太郎')
                ->where('email', 'taro@example.com')
            )
        );
    }

    public function test_バリデーションエラーでリダイレクトされる(): void
    {
        // Arrange
        $data = [
            'name' => '',
            'email' => 'invalid-email',
        ];

        // Act
        $response = $this->post(route('members.store'), $data);

        // Assert
        $response->assertSessionHasErrors(['name', 'email']);
    }

    public function test_未認証ユーザーはログインにリダイレクトされる(): void
    {
        // Act (without authentication)
        $response = $this->get(route('members.index'));

        // Assert
        $response->assertRedirect(route('login'));
    }
}
```

---

### 6. Authentication in Tests

**Pattern AI gets wrong**: Not using authenticated user properly

```php
// ❌ AI writes: No authentication
final class MemberControllerTest extends TestCase
{
    public function test_メンバーを作成できる(): void
    {
        $response = $this->post(route('members.store'), [...]);
        // Fails if route requires auth
    }
}
```

**Correct pattern**: Use actingAs for authenticated tests

```php
// ✅ Correct: Authenticated test
final class MemberControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_認証済みユーザーはメンバーを作成できる(): void
    {
        // Act
        $response = $this->actingAs($this->user)
            ->post(route('members.store'), [
                'name' => '山田太郎',
                'email' => 'taro@example.com',
            ]);

        // Assert
        $response->assertRedirect(route('members.index'));
        $this->assertDatabaseHas('members', ['email' => 'taro@example.com']);
    }

    public function test_権限のないユーザーは403エラーになる(): void
    {
        // Arrange
        $normalUser = User::factory()->create(['role' => 'viewer']);
        $member = MemberModel::factory()->create();

        // Act
        $response = $this->actingAs($normalUser)
            ->delete(route('members.destroy', $member));

        // Assert
        $response->assertForbidden();
    }
}
```

---

## Test Method Naming Convention

Use Japanese for test method names with `test_` prefix:

```php
// ✅ Good naming
public function test_有効なメールアドレスで生成できる(): void {}
public function test_無効なメールアドレスは例外が発生する(): void {}
public function test_メンバー一覧を取得できる(): void {}
public function test_存在しないメンバーでnullが返る(): void {}
public function test_認証済みユーザーはアクセスできる(): void {}
public function test_未認証ユーザーはリダイレクトされる(): void {}
```

---

## AAA Pattern (Arrange-Act-Assert)

Always structure tests with clear sections:

```php
public function test_メンバーを作成できる(): void
{
    // Arrange - テストデータと依存の準備
    $repository = $this->createMock(MemberRepositoryInterface::class);
    $repository->expects($this->once())->method('save');
    $useCase = new CreateMemberUseCase($repository);

    // Act - テスト対象の実行
    $output = $useCase->execute(new CreateMemberInput(
        name: 'Test User',
        email: 'test@example.com',
    ));

    // Assert - 結果の検証
    $this->assertNotEmpty($output->id);
}
```

---

## Data Providers

Use data providers for testing multiple cases:

```php
/**
 * @dataProvider 有効な入力データ
 */
public function test_有効なデータでメンバーを作成できる(
    string $name,
    string $email,
): void {
    // Test implementation
}

public static function 有効な入力データ(): array
{
    return [
        'standard' => ['山田太郎', 'taro@example.com'],
        'long_name' => [str_repeat('あ', 255), 'long@example.com'],
        'subdomain_email' => ['佐藤花子', 'hanako@sub.example.com'],
    ];
}

/**
 * @dataProvider 無効な入力データ
 */
public function test_無効なデータで例外が発生する(
    string $name,
    string $email,
    string $expectedError,
): void {
    $this->expectException(InvalidArgumentException::class);
    $this->expectExceptionMessage($expectedError);

    // Test implementation
}

public static function 無効な入力データ(): array
{
    return [
        'empty_name' => ['', 'test@example.com', '名前は必須です'],
        'invalid_email' => ['Test', 'invalid', '無効なメールアドレス'],
        'too_long_name' => [str_repeat('a', 256), 'test@example.com', '名前は255文字以内'],
    ];
}
```

---

## Factory Usage

```php
// Create a custom factory for domain testing
final class MemberTestFactory
{
    public static function create(
        ?Name $name = null,
        ?Email $email = null,
    ): Member {
        return Member::create(
            name: $name ?? Name::create('テストユーザー'),
            email: $email ?? Email::create('test@example.com'),
        );
    }

    public static function createWithId(
        string $id,
        ?Name $name = null,
        ?Email $email = null,
    ): Member {
        return Member::reconstruct(
            id: MemberId::from($id),
            name: $name ?? Name::create('テストユーザー'),
            email: $email ?? Email::create('test@example.com'),
        );
    }
}
```

---

## AI Weakness Checklist

Before considering test implementation complete:

### Unit Tests ⚠️
- [ ] No database usage (`RefreshDatabase` not needed)
- [ ] Repository is mocked for UseCase tests
- [ ] Both valid and invalid cases tested for ValueObjects
- [ ] Factory methods tested for Entities

### Feature Tests ⚠️
- [ ] Uses `RefreshDatabase` trait
- [ ] Tests actual database operations
- [ ] Authentication tested (actingAs)
- [ ] Inertia assertions used for controller tests

### Test Structure ⚠️
- [ ] AAA pattern followed
- [ ] Japanese method names
- [ ] Data providers for multiple cases
- [ ] Edge cases covered

### Coverage ⚠️
- [ ] All public methods tested
- [ ] All validation rules tested
- [ ] Error paths tested
- [ ] Authorization tested

---

## Summary

| What to Test | How to Test |
|--------------|-------------|
| ValueObject | Unit test with valid/invalid inputs |
| Entity | Unit test factory methods |
| UseCase | Unit test with mocked repository |
| Repository | Feature test with real database |
| Controller | Feature test with Inertia assertions |
