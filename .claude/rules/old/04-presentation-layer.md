---
paths:
  - modules/**/Presentation/**/*.php
  - app/Http/**/*.php
---

# Presentation 層実装規約（Inertia 対応）

## Controller 実装

Controller は `final` クラスとして定義する。命名は `{Entity}Controller` とする。Controller はメソッドインジェクションで UseCase を受け取り、入出力の変換のみを行う。

Inertia レスポンスを返す場合は `Inertia::render()` を使用する。props としてフロントエンドに渡すデータは Output DTO または配列で構成する。

```php
final class MemberController extends Controller
{
    public function index(ListMembersUseCase $useCase): Response
    {
        $output = $useCase->execute();

        return Inertia::render('Members/Index', [
            'members' => $output->members,
        ]);
    }

    public function store(
        CreateMemberRequest $request,
        CreateMemberUseCase $useCase,
    ): RedirectResponse {
        $useCase->execute(
            new CreateMemberInput(
                name: $request->validated('name'),
                email: $request->validated('email'),
            ),
        );

        return redirect()->route('members.index')
            ->with('success', 'メンバーを作成しました');
    }
}
```

## FormRequest 実装

FormRequest は命名を `{Action}{Entity}Request` とする。入力形式のバリデーションのみを行い、ビジネスルールのバリデーションは UseCase または Domain 層で行う。

```php
final class CreateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}
```

## Inertia 用データ変換

フロントエンドに渡すデータは、必要な情報のみを含む配列または DTO に変換する。Entity をそのまま渡すことは禁止する。

```php
// ✅ OK: 必要なデータのみを配列で渡す
return Inertia::render('Members/Show', [
    'member' => [
        'id' => $output->id,
        'name' => $output->name,
        'email' => $output->email,
    ],
]);

// ❌ NG: Entity をそのまま渡す
return Inertia::render('Members/Show', [
    'member' => $member,
]);
```

## 禁止事項

Controller での直接的な DB アクセスは禁止する。Controller でのビジネスロジック実装は禁止する。
