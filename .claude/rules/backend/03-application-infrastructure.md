---
paths:
  - modules/**/Application/**/*.php
  - modules/**/Infrastructure/**/*.php
---

# Application・Infrastructure 層実装規約

## UseCase 実装

UseCase は `final readonly` クラスとして定義する。1 ユースケース 1 クラスの原則に従う。命名は `{Action}{Entity}UseCase` とする。入力は Input DTO で受け取り、出力は Output DTO で返す。

```php
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );
        $this->repository->save($member);
        return new CreateMemberOutput(id: $member->id()->value());
    }
}
```

## DTO 実装

DTO は `final readonly` クラスとして定義する。Input DTO の命名は `{Action}{Entity}Input`、Output DTO の命名は `{Action}{Entity}Output` とする。

```php
final readonly class CreateMemberInput
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
```

## Repository 実装

Repository 実装は `final` クラスとして定義する。命名は `Eloquent{Entity}Repository` とする。Eloquent Model から Entity への変換は Repository 内で行い、Entity の `reconstruct()` メソッドを使用して復元する。

```php
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
        );
    }
}
```

## Eloquent Model

Eloquent Model は `final` クラスとして定義する。命名は `{Entity}Model` とする。PHPDoc で `@property` を使用してプロパティの型を明示する。

## 禁止事項

UseCase での直接的な DB アクセスは禁止する。Eloquent Model を Domain 層や Application 層に直接返すことは禁止する。
