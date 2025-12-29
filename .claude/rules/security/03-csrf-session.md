# CSRF・セッション管理

## 1. CSRF（クロスサイト・リクエスト・フォージェリ）対策

### 脅威

ログイン利用者からのリクエストの正当性を識別できない場合、**不正な送金、意図しない商品購入、パスワード変更、掲示板への不適切な書き込み**が発生する。

---

### Laravel での CSRF 対策

#### Blade テンプレート

すべてのPOST/PUT/PATCH/DELETEフォームに `@csrf` ディレクティブを必須とする。

```blade
{{-- ✅ 安全: @csrfディレクティブ使用 --}}
<form method="POST" action="/transfer">
    @csrf
    <input type="text" name="amount" />
    <button type="submit">送金</button>
</form>
```

#### VerifyCsrfToken ミドルウェア

外部Webhook等でCSRF検証を除外する場合のみ設定する。

```php
// bootstrap/app.php（Laravel 11）
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'stripe/*',      // Stripe webhook
            'webhook/*',     // 外部システムからのWebhook
        ]);
    })
    ->create();
```

**重要**: 除外設定は必要最小限に限定し、安易な除外は避ける。

---

### React SPA での CSRF 対策

#### Axios 設定

Axios の `withCredentials` と `withXSRFToken` を有効化する。

```javascript
// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // クレデンシャル（Cookie）を含める
    withCredentials: true,
    // XSRFトークンを自動送信
    withXSRFToken: true,
});

export default apiClient;
```

#### 認証フロー実装

ログイン前に必ず `/sanctum/csrf-cookie` にアクセスする。

```typescript
// src/services/auth.ts
import apiClient from './api';

// CSRFトークンの取得
export const getCsrfToken = async (): Promise<void> => {
    await apiClient.get('/sanctum/csrf-cookie');
};

// ログイン処理
export const login = async (email: string, password: string): Promise<User> => {
    // 最初にCSRFトークンを取得
    await getCsrfToken();

    await apiClient.post('/login', { email, password });
    return await getUser();
};
```

---

## 2. セッション管理

### 脅威

セッションIDの発行・管理に不備がある場合、**セッションIDの推測・盗用・固定化攻撃**により、なりすましアクセスが発生する。

---

### セッション設定（config/session.php）

本番環境では以下の設定を必須とする。

```php
return [
    // セッションドライバ（本番環境ではdatabase/redis推奨）
    'driver' => env('SESSION_DRIVER', 'database'),

    // セッション有効期限（分）
    'lifetime' => env('SESSION_LIFETIME', 120),

    // ブラウザ終了時にセッション破棄
    'expire_on_close' => true,

    // セッションデータの暗号化
    'encrypt' => true,

    // ✅ HTTPS通信のみでCookieを送信
    'secure' => env('SESSION_SECURE_COOKIE', true),

    // ✅ JavaScriptからのアクセスを禁止
    'http_only' => true,

    // ✅ SameSite属性（Strict/Lax/None）
    'same_site' => 'lax',
];
```

### セッションドライバ選定基準

| ドライバ | パフォーマンス | 永続性 | スケーラビリティ | 推奨環境 |
|---------|--------------|--------|----------------|----------|
| **file** | ⭐⭐ | ⭐⭐ | ⭐ | 開発環境 |
| **database** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 単一サーバ本番 |
| **redis** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 複数サーバ本番 |
| **memcached** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | 高速だが再起動でデータ消失 |

**負荷分散環境の注意点**:
- `file` ドライバは使用不可（セッションが共有されない）
- `database` は書き込み負荷に注意
- `redis` が最も推奨（Redis Sentinel/Clusterで冗長化）

---

### セッション固定攻撃対策

ログイン成功時とログアウト時にセッションIDを再生成する。

```php
// ✅ 安全: ログイン成功後にセッションID再生成
public function login(Request $request)
{
    $credentials = $request->only('email', 'password');

    if (Auth::attempt($credentials)) {
        // セッション固定化攻撃対策
        $request->session()->regenerate();

        return redirect()->intended('dashboard');
    }

    return back()->withErrors(['email' => 'Invalid credentials']);
}

// ✅ ログアウト時のセッション無効化
public function logout(Request $request)
{
    Auth::logout();

    // セッションを無効化し、新しいトークンを生成
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
}
```

---

### Laravel Sanctum 設定（SPA認証）

#### config/sanctum.php

```php
return [
    // ステートフルドメインの設定（SPA認証に必須）
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000',
        env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),
];
```

#### .env ファイル（本番環境）

```env
SANCTUM_STATEFUL_DOMAINS=example.com,www.example.com,app.example.com
SESSION_DOMAIN=.example.com
SESSION_SECURE_COOKIE=true
```

#### config/cors.php

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    // フロントエンドのオリジンを明示的に指定
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],

    // ✅ 重要: Cookie送信に必須
    'supports_credentials' => true,
];
```

---

## セッション管理ベストプラクティス

### Cookie属性の必須設定

| 属性 | 設定値 | 目的 |
|------|--------|------|
| `Secure` | `true` | HTTPS通信のみでCookie送信（本番環境必須） |
| `HttpOnly` | `true` | JavaScriptからのアクセス禁止（XSS対策） |
| `SameSite` | `Lax` / `Strict` | CSRF対策（クロスサイトリクエスト制限） |

### セッションドライバ選定

| 環境 | 推奨ドライバ | 理由 |
|------|------------|------|
| 開発環境 | `file` | シンプル・設定不要 |
| 本番環境（単一サーバ） | `database` | 永続化・監査ログ対応 |
| 本番環境（複数サーバ） | `redis` | 高速・負荷分散対応 |

### セッションライフタイム設定

- 一般的なWebアプリ: 120分（2時間）
- 金融・医療システム: 15-30分
- 管理画面: 30-60分
- 「ログイン状態を保持」機能: `remember_token` 使用（セッションライフタイムは短く保つ）

---

## CSRF・セッション管理チェックリスト

- [ ] POST/PUT/PATCH/DELETEフォームに`@csrf`を使用している
- [ ] React SPAで`withCredentials: true`と`withXSRFToken: true`を設定している
- [ ] ログイン前に`/sanctum/csrf-cookie`にアクセスしている
- [ ] ログイン成功後にセッションIDを再生成している（`session()->regenerate()`）
- [ ] ログアウト時にセッションを無効化している（`session()->invalidate()`）
- [ ] CookieにSecure属性が設定されている（本番環境）
- [ ] CookieにHttpOnly属性が設定されている
- [ ] SameSite属性が適切に設定されている（`Lax` または `Strict`）
- [ ] セッションドライバは本番環境で`database`または`redis`を使用している
- [ ] `SANCTUM_STATEFUL_DOMAINS`が正しく設定されている（SPA認証使用時）
