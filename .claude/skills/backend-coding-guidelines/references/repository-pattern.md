# Repository Pattern - Interface + Implementation Separation

## AI's Common Failure Patterns

### Pattern 1: Repository Returns Eloquent Model

**❌ AI writes: Repository returns Eloquent Model**

```php
final class MemberRepository
{
    public function findById(string $id): ?MemberModel
    {
        return MemberModel::find($id);
    }
}

// Problems:
// - Exposes Eloquent Model to Application/Domain layer
// - Breaks layer separation
// - Domain logic can access Eloquent methods
```

### Pattern 2: No Interface Separation

**❌ AI writes: No interface separation**

```php
final class MemberRepository
{
    public function findById(string $id): ?Member
    {
        $model = MemberModel::find($id);
        return $model ? new Member($model->id, $model->name, $model->email) : null;
    }
}

// Problems:
// - No interface defined
// - Can't swap implementations
// - Hard to test (tightly coupled to Eloquent)
// - UseCase depends on concrete implementation
```

---

## ✅ Correct Pattern: Interface in Domain, Implementation in Infrastructure

### Repository Interface (Domain Layer)

```php
// modules/Member/Domain/Repositories/MemberRepositoryInterface.php

interface MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member;
    public function findByEmail(Email $email): ?Member;
    public function findAll(): array;
    public function save(Member $member): void;
    public function delete(MemberId $id): void;
}
```

### Repository Implementation (Infrastructure Layer)

```php
// modules/Member/Infrastructure/Repositories/EloquentMemberRepository.php

final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member
    {
        $model = MemberModel::find($id->value());

        if ($model === null) {
            return null;
        }

        return Member::reconstruct(
            id: MemberId::from($model->id),
            name: Name::create($model->name),
            email: Email::create($model->email),
            status: MemberStatus::from($model->status),
        );
    }

    public function findByEmail(Email $email): ?Member
    {
        $model = MemberModel::where('email', $email->value())->first();

        if ($model === null) {
            return null;
        }

        return Member::reconstruct(
            id: MemberId::from($model->id),
            name: Name::create($model->name),
            email: Email::create($model->email),
            status: MemberStatus::from($model->status),
        );
    }

    public function findAll(): array
    {
        return MemberModel::all()
            ->map(fn(MemberModel $model) => Member::reconstruct(
                id: MemberId::from($model->id),
                name: Name::create($model->name),
                email: Email::create($model->email),
                status: MemberStatus::from($model->status),
            ))
            ->toArray();
    }

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

### Service Provider Binding

```php
// modules/Member/Infrastructure/MemberServiceProvider.php

final class MemberServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            MemberRepositoryInterface::class,
            EloquentMemberRepository::class,
        );
    }
}
```

---

## Repository Method Patterns

### Find Single Entity

```php
// By ID
public function findById(MemberId $id): ?Member
{
    $model = MemberModel::find($id->value());

    if ($model === null) {
        return null;
    }

    return $this->toEntity($model);
}

// By unique property
public function findByEmail(Email $email): ?Member
{
    $model = MemberModel::where('email', $email->value())->first();

    if ($model === null) {
        return null;
    }

    return $this->toEntity($model);
}
```

### Find Multiple Entities

```php
// Find all
public function findAll(): array
{
    return MemberModel::all()
        ->map(fn(MemberModel $m) => $this->toEntity($m))
        ->toArray();
}

// Find with criteria
public function findActiveMembers(): array
{
    return MemberModel::where('status', 'active')
        ->get()
        ->map(fn(MemberModel $m) => $this->toEntity($m))
        ->toArray();
}

// Find by IDs
public function findByIds(array $ids): array
{
    $idValues = array_map(fn(MemberId $id) => $id->value(), $ids);

    return MemberModel::whereIn('id', $idValues)
        ->get()
        ->map(fn(MemberModel $m) => $this->toEntity($m))
        ->toArray();
}
```

### Save (Create or Update)

```php
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

// Alternative: Separate create and update
public function create(Member $member): void
{
    MemberModel::create([
        'id' => $member->id()->value(),
        'name' => $member->name()->value(),
        'email' => $member->email()->value(),
        'status' => $member->status()->value(),
    ]);
}

public function update(Member $member): void
{
    MemberModel::where('id', $member->id()->value())
        ->update([
            'name' => $member->name()->value(),
            'email' => $member->email()->value(),
            'status' => $member->status()->value(),
        ]);
}
```

### Delete

```php
public function delete(MemberId $id): void
{
    MemberModel::where('id', $id->value())->delete();
}

// Soft delete
public function softDelete(MemberId $id): void
{
    MemberModel::where('id', $id->value())->update([
        'deleted_at' => now(),
    ]);
}
```

### Exists Check

```php
public function exists(MemberId $id): bool
{
    return MemberModel::where('id', $id->value())->exists();
}

public function emailExists(Email $email): bool
{
    return MemberModel::where('email', $email->value())->exists();
}
```

---

## Model to Entity Conversion

### Extract to Private Method

```php
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
}
```

### Complex Entity with Relations

```php
final class EloquentProjectRepository implements ProjectRepositoryInterface
{
    public function findById(ProjectId $id): ?Project
    {
        $model = ProjectModel::with('members')->find($id->value());

        if ($model === null) {
            return null;
        }

        return $this->toEntity($model);
    }

    private function toEntity(ProjectModel $model): Project
    {
        return Project::reconstruct(
            id: ProjectId::from($model->id),
            name: ProjectName::create($model->name),
            description: ProjectDescription::create($model->description),
            managerId: MemberId::from($model->manager_id),
            status: ProjectStatus::from($model->status),
            memberIds: $model->members->map(
                fn($m) => MemberId::from($m->id)
            )->toArray(),
        );
    }
}
```

---

## Query Optimization

### Eager Loading

```php
public function findWithMembers(ProjectId $id): ?Project
{
    $model = ProjectModel::with('members')->find($id->value());

    if ($model === null) {
        return null;
    }

    return $this->toEntity($model);
}

public function findAllWithMembers(): array
{
    return ProjectModel::with('members')
        ->get()
        ->map(fn(ProjectModel $m) => $this->toEntity($m))
        ->toArray();
}
```

### Pagination Support

```php
public function findPaginated(int $perPage): LengthAwarePaginator
{
    $paginator = MemberModel::paginate($perPage);

    return new LengthAwarePaginator(
        items: $paginator->items()->map(fn($m) => $this->toEntity($m))->toArray(),
        total: $paginator->total(),
        perPage: $paginator->perPage(),
        currentPage: $paginator->currentPage(),
    );
}
```

### Filtering and Sorting

```php
public interface MemberRepositoryInterface
{
    public function search(MemberSearchCriteria $criteria): array;
}

final readonly class MemberSearchCriteria
{
    public function __construct(
        public ?string $nameKeyword = null,
        public ?MemberStatus $status = null,
        public ?string $sortBy = 'name',
        public ?string $sortOrder = 'asc',
    ) {}
}

final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function search(MemberSearchCriteria $criteria): array
    {
        $query = MemberModel::query();

        if ($criteria->nameKeyword !== null) {
            $query->where('name', 'like', "%{$criteria->nameKeyword}%");
        }

        if ($criteria->status !== null) {
            $query->where('status', $criteria->status->value());
        }

        $query->orderBy($criteria->sortBy, $criteria->sortOrder);

        return $query->get()
            ->map(fn(MemberModel $m) => $this->toEntity($m))
            ->toArray();
    }
}
```

---

## Transaction Handling

### Repository Should Not Manage Transactions

```php
// ❌ Wrong: Repository manages transaction
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function save(Member $member): void
    {
        DB::transaction(function () use ($member) {
            MemberModel::updateOrCreate(...);
        });
    }
}

// ✅ Correct: UseCase manages transaction
final readonly class CreateMemberUseCase
{
    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        return DB::transaction(function () use ($input) {
            $member = Member::create(...);
            $this->repository->save($member);
            return new CreateMemberOutput(...);
        });
    }
}
```

---

## Testing Repositories

### Interface Mocking in UseCase Tests

```php
final class CreateMemberUseCaseTest extends TestCase
{
    public function test_メンバーを作成できる(): void
    {
        $repository = $this->createMock(MemberRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('save')
            ->with($this->callback(function (Member $member) {
                return $member->name()->value() === 'Test User'
                    && $member->email()->value() === 'test@example.com';
            }));

        $useCase = new CreateMemberUseCase($repository);
        $output = $useCase->execute(new CreateMemberInput(
            name: 'Test User',
            email: 'test@example.com',
        ));

        $this->assertNotEmpty($output->id);
    }
}
```

### Repository Implementation Tests

```php
final class EloquentMemberRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_IDでメンバーを取得できる(): void
    {
        $model = MemberModel::factory()->create();

        $repository = new EloquentMemberRepository();
        $member = $repository->findById(MemberId::from($model->id));

        $this->assertNotNull($member);
        $this->assertSame($model->id, $member->id()->value());
        $this->assertSame($model->name, $member->name()->value());
    }

    public function test_存在しないIDの場合nullを返す(): void
    {
        $repository = new EloquentMemberRepository();
        $member = $repository->findById(MemberId::from('non-existent-id'));

        $this->assertNull($member);
    }
}
```

---

## Checklist: Repository Pattern

Before considering a Repository implementation complete, verify:

- [ ] Interface defined in Domain layer
- [ ] Implementation in Infrastructure layer
- [ ] Named `{Entity}RepositoryInterface` and `Eloquent{Entity}Repository`
- [ ] Returns Entity (not Eloquent Model)
- [ ] Uses `reconstruct()` to build Entity from Model
- [ ] Uses ValueObjects for method parameters
- [ ] Service Provider binds interface to implementation
- [ ] No business logic in Repository
- [ ] No transaction management in Repository
- [ ] Private `toEntity()` method for Model conversion

---

## Why This Matters

**Without Interface/Implementation separation**:
- Tight coupling to Eloquent
- Can't swap implementations
- Hard to test
- Violates Dependency Inversion Principle

**With proper Repository pattern**:
- Dependency Inversion (Domain defines interface)
- Testability (easy to mock)
- Flexibility (can swap to different storage)
- Clear boundaries between layers
- Type safety with ValueObjects
