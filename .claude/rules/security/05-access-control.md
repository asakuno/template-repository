# アクセス制御・認証

## 1. アクセス制御・認可制御（IDOR対策）

### 脅威

利用者IDをURLやPOSTパラメータに埋め込んでいる実装では、**IDOR（Insecure Direct Object Reference）**により、他のユーザーのデータに不正アクセスされる危険がある。

---

### 根本的対策

**セッションから認証済みユーザーを取得**し、**Laravel Policy で認可チェック**を必須とする。

#### 禁止パターン

```php
// ❌ 脆弱: 認可制御なし - IDORの脆弱性
public function show($id)
{
    // URLパラメータのIDをそのまま使用
    $post = Post::find($id);
    return view('posts.show', compact('post'));
}

// ❌ 脆弱: ユーザーIDをリクエストから取得
public function showProfile(Request $request)
{
    $userId = $request->input('user_id'); // 外部入力をそのまま使用
    $user = User::find($userId);
    return view('profile', compact('user'));
}
```

#### 安全なコード例

```php
// ✅ 安全: Policyによる認可チェック
public function show(Post $post)
{
    $this->authorize('view', $post);
    return view('posts.show', compact('post'));
}

// ✅ 安全: セッションから認証済みユーザーを取得
public function showProfile()
{
    $user = auth()->user();
    return view('profile', compact('user'));
}

// ✅ 安全: スコープを使用して所有リソースのみアクセス
public function showOrder($orderId)
{
    $order = auth()->user()->orders()->findOrFail($orderId);
    return view('orders.show', compact('order'));
}
```

---

### Laravel Policy 実装

すべての保護リソースに対して Policy を実装する。

```php
// app/Policies/PostPolicy.php
namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PostPolicy
{
    /**
     * 管理者は全てのアクションを許可
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->is_admin) {
            return true;
        }
        return null;
    }

    /**
     * 投稿の閲覧権限
     */
    public function view(User $user, Post $post): bool
    {
        // 公開済みまたは自分の投稿のみ閲覧可能
        return $post->is_published || $user->id === $post->user_id;
    }

    /**
     * 投稿の更新権限
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    /**
     * 投稿の削除権限
     */
    public function delete(User $user, Post $post): Response
    {
        if ($user->id === $post->user_id) {
            return Response::allow();
        }

        return Response::deny('この投稿を削除する権限がありません。');
    }
}
```

#### Controller での使用

```php
// ✅ authorize() メソッドで認可チェック
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);

    // 認可が通った場合のみ実行される
    $post->update($request->validated());

    return redirect()->route('posts.show', $post);
}

// ✅ can() メソッドで条件分岐
public function show(Post $post)
{
    if (auth()->user()->can('view', $post)) {
        return view('posts.show', compact('post'));
    }

    abort(403, 'この投稿を閲覧する権限がありません。');
}
```

---

### React SPA での認可実装

#### ProtectedRoute コンポーネント

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

#### 使用例

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 認証が必要なルート */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* 管理者のみアクセス可能 */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**重要**: フロントエンドの認可チェックは**UI表示制御のみ**であり、**バックエンドでの認可チェックが必須**である。

---

## 2. パスワード管理・認証

### パスワードハッシュ

Laravel の `Hash` ファサードを使用し、bcrypt または Argon2id でハッシュ化する。

```php
use Illuminate\Support\Facades\Hash;

// ✅ パスワードのハッシュ化
$user = User::create([
    'name' => $request->name,
    'email' => $request->email,
    'password' => Hash::make($request->password),
]);

// ✅ パスワード検証
if (Hash::check($plainPassword, $user->password)) {
    // パスワードが一致
}
```

### Argon2id の使用（推奨）

```php
// config/hashing.php
return [
    'driver' => 'argon2id',  // bcrypt より安全

    'argon' => [
        'memory' => 65536,
        'threads' => 4,
        'time' => 4,
    ],
];
```

---

### パスワードバリデーション

強力なパスワードポリシーを適用する。

```php
use Illuminate\Validation\Rules\Password;

$request->validate([
    'password' => [
        'required',
        'confirmed',
        Password::min(8)
            ->mixedCase()        // 大文字小文字を含む
            ->numbers()          // 数字を含む
            ->symbols()          // 記号を含む
            ->uncompromised(),   // 漏洩パスワードチェック（Have I Been Pwned API）
    ],
]);
```

### カスタムパスワードルール

```php
// プロジェクト固有のルール
Password::min(12)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised(3);  // 3回以上漏洩していないこと
```

---

### レート制限（ブルートフォース対策）

ログインエンドポイントに必ずレート制限を適用する。

```php
// routes/web.php
Route::post('/login', [LoginController::class, 'login'])
    ->middleware('throttle:5,1'); // 1分間に5回まで
```

#### カスタムレートリミッター

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by(
            $request->input('email') . '|' . $request->ip()
        )->response(function () {
            return response()->json([
                'message' => 'ログイン試行回数が多すぎます。しばらくお待ちください。'
            ], 429);
        });
    });
}
```

---

### 多要素認証（MFA）の実装

本番環境では多要素認証の導入を推奨する。

```bash
composer require laravel/fortify
```

```php
// config/fortify.php
'features' => [
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

---

## アクセス制御・認証チェックリスト

### アクセス制御

- [ ] 全ての保護リソースに対してサーバーサイドで認可チェックを実装している
- [ ] Laravel Policy を使用してリソースアクセスを制御している
- [ ] URLパラメータからユーザーIDを取得していない
- [ ] セッションから認証済みユーザー情報を取得している
- [ ] `auth()->user()` または `$request->user()` を使用している
- [ ] 所有リソースへのアクセスはスコープ（`user()->posts()`）を使用している

### 認証

- [ ] パスワードは`Hash::make()`でハッシュ化している
- [ ] ハッシュアルゴリズムは bcrypt または Argon2id を使用している
- [ ] パスワードポリシーを適用している（最小8文字、大小英数記号）
- [ ] `Password::uncompromised()` で漏洩パスワードをチェックしている
- [ ] ログインエンドポイントにレート制限を適用している（5回/分）
- [ ] 本番環境では多要素認証（MFA）を導入している（推奨）

### 禁止事項

- [ ] URLパラメータやPOSTデータからユーザーIDを取得していない
- [ ] 認可チェックなしでリソースにアクセスしていない
- [ ] パスワードを平文で保存していない
- [ ] MD5やSHA1でパスワードをハッシュ化していない
- [ ] フロントエンドの認可チェックのみに依存していない
