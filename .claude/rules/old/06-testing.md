---
paths:
  - tests/**/*.php
---

# バックエンド テスト規約

## テストの配置

Unit テストは `tests/Unit/Modules/{Module}/` に配置する。Feature テストは `tests/Feature/Modules/{Module}/` に配置する。

## テスト種類の使い分け

Domain 層は Unit テストで検証する。DB は不要であり、Entity と ValueObject の振る舞いを検証する。Application 層は Unit テストと Feature テストを併用する。UseCase 単体は Repository をモックして Unit テストで検証する。Infrastructure 層と Presentation 層は Feature テストで検証する。

## Unit テストの書き方

```php
final class EmailTest extends TestCase
{
    public function test_有効なメールアドレスで生成できる(): void
    {
        $email = Email::create('test@example.com');
        $this->assertSame('test@example.com', $email->value());
    }

    public function test_無効なメールアドレスは例外が発生する(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Email::create('invalid-email');
    }
}
```

## UseCase テストの書き方

```php
final class CreateMemberUseCaseTest extends TestCase
{
    public function test_メンバーを作成できる(): void
    {
        $repository = $this->createMock(MemberRepositoryInterface::class);
        $repository->expects($this->once())->method('save');

        $useCase = new CreateMemberUseCase($repository);
        $output = $useCase->execute(new CreateMemberInput(
            name: 'Test User',
            email: 'test@example.com',
        ));

        $this->assertNotEmpty($output->id);
    }
}
```

## Inertia テストの書き方

```php
final class MemberControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_メンバー一覧を表示できる(): void
    {
        $response = $this->get(route('members.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Members/Index')
            ->has('members')
        );
    }
}
```

## テストメソッド命名

日本語でテスト内容を記述する。`test_` プレフィックスを使用する。

## コードカバレッジ基準

テストカバレッジの最低基準を設定し、品質を担保する。

### カバレッジ目標

- **Domain 層**: 80%以上（ビジネスロジックの核心）
- **Application 層**: 70%以上（ユースケース）
- **Infrastructure 層**: 60%以上（Repository 実装）
- **Presentation 層**: 60%以上（Controller）

### カバレッジの確認

```bash
./vendor/bin/phpunit --coverage-text
```

詳細なHTMLレポートを生成する場合：

```bash
./vendor/bin/phpunit --coverage-html coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成される。

### カバレッジ不足時の対応

1. 未テストのブランチを特定
2. エッジケースのテストを追加
3. 例外ハンドリングのテストを追加
4. バリデーションロジックのテストを追加
5. カバレッジ基準を満たすまで追加テストを作成

**重要**: カバレッジ基準を満たさない場合は、次のフェーズに進まない。特に Domain 層は 80%以上を必須とする。
