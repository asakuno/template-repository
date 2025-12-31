---
paths:
  - modules/**/Domain/**/*.php
---

# Domain 層実装規約

## Entity 実装

Entity は `final` クラスとして定義する。コンストラクタは `private` とし、Factory メソッドで生成を制御する。新規作成用の `create()` と復元用の `reconstruct()` を分離する。すべてのプロパティは `readonly` で定義する。

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
            name: $name,
            email: $email,
        );
    }

    public static function reconstruct(MemberId $id, Name $name, Email $email): self
    {
        return new self($id, $name, $email);
    }
}
```

## ValueObject 実装

ValueObject は `final readonly` クラスとして定義する。コンストラクタは `private` とし、Factory メソッドで生成する。バリデーションは生成時に行い、不正な値は `InvalidArgumentException` を投げる。

```php
final readonly class Email
{
    private function __construct(private string $value) {}

    public static function create(string $value): self
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }
        return new self($value);
    }

    public function value(): string { return $this->value; }
    public function equals(self $other): bool { return $this->value === $other->value; }
}
```

## Repository Interface

Repository Interface は Domain 層に配置し、実装は Infrastructure 層に配置する。命名は `{Entity}RepositoryInterface` とする。

## 禁止事項

Domain 層では Eloquent Model の直接使用、Laravel ファサードの使用、HTTP リクエスト/レスポンスへの依存を禁止する。
