# Repository Testing - Feature Tests with Database

This reference covers testing patterns for Infrastructure layer Repositories in the 4-layer architecture.

## Core Principles

- **Use Database**: Repository tests are feature tests with real database
- **Test Interface Implementation**: Test through Repository interface, not Eloquent Model
- **Entity Conversion**: Verify proper conversion between Eloquent Model and Entity
- **Test CRUD Operations**: Verify all repository methods work correctly

---

## Repository Feature Testing

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

## Advanced Repository Testing Patterns

### Testing Update Operations

```php
public function test_メンバー情報を更新できる(): void
{
    // Arrange - 最初のメンバーを作成
    $member = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@example.com'),
    );
    $this->repository->save($member);

    // Act - 更新後のメンバーを保存
    $updatedMember = Member::reconstruct(
        id: $member->id(),
        name: Name::create('山田花子'),
        email: Email::create('hanako@example.com'),
    );
    $this->repository->save($updatedMember);

    // Assert - 更新されたデータを取得して検証
    $found = $this->repository->findById($member->id());
    $this->assertNotNull($found);
    $this->assertTrue($found->name()->equals(Name::create('山田花子')));
    $this->assertTrue($found->email()->equals(Email::create('hanako@example.com')));
}
```

### Testing Collection Queries

```php
public function test_すべてのメンバーを取得できる(): void
{
    // Arrange
    $member1 = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@example.com'),
    );
    $member2 = Member::create(
        name: Name::create('佐藤花子'),
        email: Email::create('hanako@example.com'),
    );
    $member3 = Member::create(
        name: Name::create('鈴木一郎'),
        email: Email::create('ichiro@example.com'),
    );

    $this->repository->save($member1);
    $this->repository->save($member2);
    $this->repository->save($member3);

    // Act
    $members = $this->repository->findAll();

    // Assert
    $this->assertCount(3, $members);
    $this->assertContainsOnlyInstancesOf(Member::class, $members);
}

public function test_条件に一致するメンバーを検索できる(): void
{
    // Arrange
    $member1 = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@yamada.com'),
    );
    $member2 = Member::create(
        name: Name::create('山田花子'),
        email: Email::create('hanako@yamada.com'),
    );
    $member3 = Member::create(
        name: Name::create('佐藤一郎'),
        email: Email::create('ichiro@sato.com'),
    );

    $this->repository->save($member1);
    $this->repository->save($member2);
    $this->repository->save($member3);

    // Act - ドメイン "yamada.com" のメンバーを検索
    $members = $this->repository->findByEmailDomain('yamada.com');

    // Assert
    $this->assertCount(2, $members);
    foreach ($members as $member) {
        $this->assertStringContainsString('yamada.com', $member->email()->value());
    }
}
```

### Testing Pagination

```php
public function test_ページネーションで取得できる(): void
{
    // Arrange - 15件のメンバーを作成
    for ($i = 1; $i <= 15; $i++) {
        $member = Member::create(
            name: Name::create("テストユーザー{$i}"),
            email: Email::create("user{$i}@example.com"),
        );
        $this->repository->save($member);
    }

    // Act - 1ページ目 (10件)
    $page1 = $this->repository->findAllPaginated(page: 1, perPage: 10);

    // Assert
    $this->assertCount(10, $page1->items);
    $this->assertSame(15, $page1->total);
    $this->assertSame(1, $page1->currentPage);
    $this->assertSame(2, $page1->lastPage);

    // Act - 2ページ目 (5件)
    $page2 = $this->repository->findAllPaginated(page: 2, perPage: 10);

    // Assert
    $this->assertCount(5, $page2->items);
    $this->assertSame(2, $page2->currentPage);
}
```

### Testing Transactions

```php
public function test_トランザクションでロールバックされる(): void
{
    // Arrange
    $member = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@example.com'),
    );

    // Act & Assert
    try {
        DB::transaction(function () use ($member) {
            $this->repository->save($member);

            // トランザクション内で例外を発生させる
            throw new \Exception('Rollback test');
        });
    } catch (\Exception $e) {
        // トランザクションがロールバックされているか確認
        $found = $this->repository->findById($member->id());
        $this->assertNull($found);
    }
}

public function test_トランザクションでコミットされる(): void
{
    // Arrange
    $member = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@example.com'),
    );

    // Act
    DB::transaction(function () use ($member) {
        $this->repository->save($member);
    });

    // Assert - トランザクション外でも取得できる
    $found = $this->repository->findById($member->id());
    $this->assertNotNull($found);
    $this->assertTrue($found->id()->equals($member->id()));
}
```

### Testing Complex Queries

```php
public function test_複数条件で検索できる(): void
{
    // Arrange
    $member1 = Member::create(
        name: Name::create('山田太郎'),
        email: Email::create('taro@example.com'),
        status: MemberStatus::Active,
        joinedAt: new DateTime('2024-01-01'),
    );
    $member2 = Member::create(
        name: Name::create('佐藤花子'),
        email: Email::create('hanako@example.com'),
        status: MemberStatus::Active,
        joinedAt: new DateTime('2024-06-01'),
    );
    $member3 = Member::create(
        name: Name::create('鈴木一郎'),
        email: Email::create('ichiro@example.com'),
        status: MemberStatus::Inactive,
        joinedAt: new DateTime('2024-01-01'),
    );

    $this->repository->save($member1);
    $this->repository->save($member2);
    $this->repository->save($member3);

    // Act - アクティブかつ2024年上半期に参加したメンバーを検索
    $criteria = new MemberSearchCriteria(
        status: MemberStatus::Active,
        joinedFrom: new DateTime('2024-01-01'),
        joinedTo: new DateTime('2024-06-30'),
    );
    $members = $this->repository->search($criteria);

    // Assert
    $this->assertCount(2, $members);
    foreach ($members as $member) {
        $this->assertTrue($member->status()->equals(MemberStatus::Active));
    }
}
```

---

## Repository Testing Checklist

When testing Repositories, ensure:

### Setup
- [ ] Uses `RefreshDatabase` trait
- [ ] Repository instance created in `setUp()`
- [ ] Tests actual database operations

### CRUD Operations
- [ ] Save operation creates records
- [ ] FindById retrieves correct Entity
- [ ] FindById returns null for non-existent ID
- [ ] Update operation modifies existing records
- [ ] Delete operation removes records

### Entity Conversion
- [ ] Eloquent Model correctly converts to Entity
- [ ] Entity correctly converts to Eloquent Model
- [ ] ValueObjects properly reconstructed
- [ ] All Entity properties preserved in conversion

### Query Methods
- [ ] Collection queries return arrays of Entities
- [ ] Custom finder methods work correctly
- [ ] Pagination works as expected
- [ ] Empty results handled properly

### Edge Cases
- [ ] Null/empty searches return empty collections
- [ ] Duplicate checks work correctly
- [ ] Transaction rollback works
- [ ] Complex queries with multiple criteria work
