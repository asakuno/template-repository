# ログイン機能バックエンド実装計画

## 概要

Laravel 7層アーキテクチャに基づくセッションベースのログイン・ログアウト認証API。
Laravel Sanctum SPA認証を使用し、既存フロントエンドUI（LoginForm, Login page）と接続する。

## 現状分析

### 既存
- User Model（`app/Models/User.php`）: 標準Authenticatable、password hashed cast済み
- LoginPageController（Web）: `Inertia::render('Auth/Login')`
- SecurityHeadersMiddleware, HandleInertiaRequests: 設定済み
- セッションドライバ: database
- spatie/laravel-data: インストール済み

### 未作成
- Laravel Sanctum: **未インストール**
- `routes/api.php`: **未作成**
- `app/UseCases/`, `app/Repositories/`, `app/Data/`: **未作成**
- `app/Http/Controllers/Api/`: **未作成**
- `app/Http/Requests/`: カスタムリクエスト未作成

---

## アーキテクチャ設計

### ファイル構成

```
app/
├── Data/
│   └── Auth/
│       └── LoginData.php                    # ログインDTO
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── AuthController.php           # 認証APIコントローラ
│   └── Requests/
│       └── Auth/
│           └── LoginRequest.php             # ログインバリデーション
├── Repositories/
│   ├── Contracts/
│   │   └── UserRepositoryInterface.php      # Repository Interface
│   └── UserRepository.php                   # Repository実装
├── UseCases/
│   └── Auth/
│       ├── LoginUseCase.php                 # ログインUseCase
│       ├── LogoutUseCase.php                # ログアウトUseCase
│       └── GetAuthenticatedUserUseCase.php  # 認証ユーザー取得UseCase
├── Http/
│   └── Resources/
│       └── UserResource.php                 # ユーザーJSON Resource
└── Providers/
    └── AppServiceProvider.php               # DI登録（既存ファイル修正）

routes/
└── api.php                                  # APIルート（新規）

config/
├── sanctum.php                              # Sanctum設定（publish）
└── cors.php                                 # CORS設定（publish）

tests/
├── Unit/
│   └── UseCases/
│       └── Auth/
│           ├── LoginUseCaseTest.php
│           ├── LogoutUseCaseTest.php
│           └── GetAuthenticatedUserUseCaseTest.php
└── Feature/
    └── Api/
        └── AuthControllerTest.php
```

### APIエンドポイント

| Method | URI | 用途 | 認証 |
|--------|-----|------|------|
| POST | `/api/login` | ログイン | 不要 |
| POST | `/api/logout` | ログアウト | 必要 |
| GET | `/api/user` | 認証ユーザー取得 | 必要 |

### 依存関係図

```
AuthController
  → LoginRequest → LoginData (DTO)
  → LoginUseCase → UserRepositoryInterface → UserRepository → User Model
  → LogoutUseCase (セッション操作のみ)
  → GetAuthenticatedUserUseCase → UserRepositoryInterface
  → UserResource (レスポンス変換)
```

---

## Phase別実装計画

### Phase 0: 環境準備

**タスク:**
1. Laravel Sanctum インストール (`docker compose exec app composer require laravel/sanctum`)
2. Sanctum設定publish (`docker compose exec app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`)
3. セッションテーブル確認 (`sessions` マイグレーション存在確認)
4. `bootstrap/app.php` に `api` ルート追加、Sanctum `statefulApi` middleware設定
5. `.env` に `SANCTUM_STATEFUL_DOMAINS` 設定確認
6. `routes/api.php` 新規作成

**テスト:** Sanctumミドルウェアが正しく動作することを手動確認

---

### Phase 1: Model層（User Model確認・拡張）

**タスク:**
1. User Model確認 - Authenticatable, HasFactory, Notifiable が揃っていることを確認
2. 必要に応じてUser Modelのリレーション追加（現時点では変更不要の見込み）

**テスト:** 既存Userファクトリーが正常動作することを確認

---

### Phase 2: Repository層

**タスク:**
1. `app/Repositories/Contracts/UserRepositoryInterface.php` 作成
   - `findByEmail(string $email): ?User`
2. `app/Repositories/UserRepository.php` 作成
   - Interface実装、Eloquent使用

**テスト（RED → GREEN → REFACTOR）:**
- `tests/Unit/Repositories/UserRepositoryTest.php`
  - `findByEmail` で既存ユーザーを取得できる
  - `findByEmail` で存在しないメールはnullを返す

```php
// UserRepositoryInterface.php
interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
}

// UserRepository.php
final class UserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }
}
```

---

### Phase 3: UseCase層

#### 3-1: LoginData DTO

```php
// app/Data/Auth/LoginData.php
final class LoginData extends Data
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
    ) {}
}
```

#### 3-2: LoginUseCase

**責務:**
- メール/パスワード認証（`Auth::attempt`）
- セッション再生成（`session()->regenerate()`）
- 認証失敗時は例外送出

```php
// app/UseCases/Auth/LoginUseCase.php
final class LoginUseCase
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
    ) {}

    public function execute(LoginData $data, Request $request): User
    {
        if (! Auth::attempt(['email' => $data->email, 'password' => $data->password])) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        return Auth::user();
    }
}
```

**テスト（RED → GREEN → REFACTOR）:**
- `tests/Unit/UseCases/Auth/LoginUseCaseTest.php`
  - 正しい認証情報でログイン成功、User返却
  - 不正な認証情報でValidationException送出
  - ログイン成功時にセッション再生成される

#### 3-3: LogoutUseCase

```php
final class LogoutUseCase
{
    public function execute(Request $request): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
```

**テスト:**
- `tests/Unit/UseCases/Auth/LogoutUseCaseTest.php`
  - ログアウト後にセッション無効化される
  - CSRFトークンが再生成される

#### 3-4: GetAuthenticatedUserUseCase

```php
final class GetAuthenticatedUserUseCase
{
    public function execute(Request $request): User
    {
        return $request->user();
    }
}
```

**テスト:**
- `tests/Unit/UseCases/Auth/GetAuthenticatedUserUseCaseTest.php`
  - 認証済みユーザーを返却する

---

### Phase 4: Request層 + Presentation層 + Resource層

#### 4-1: LoginRequest (FormRequest)

```php
// app/Http/Requests/Auth/LoginRequest.php
final class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string|\Illuminate\Contracts\Validation\ValidationRule>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function toData(): LoginData
    {
        return LoginData::from($this->validated());
    }
}
```

#### 4-2: UserResource (API Resource)

```php
// app/Http/Resources/UserResource.php
final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

#### 4-3: AuthController (API)

```php
// app/Http/Controllers/Api/AuthController.php
final class AuthController extends Controller
{
    public function __construct(
        private LoginUseCase $loginUseCase,
        private LogoutUseCase $logoutUseCase,
        private GetAuthenticatedUserUseCase $getAuthenticatedUserUseCase,
    ) {}

    public function login(LoginRequest $request): UserResource
    {
        $user = $this->loginUseCase->execute($request->toData(), $request);
        return new UserResource($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->logoutUseCase->execute($request);
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function user(Request $request): UserResource
    {
        $user = $this->getAuthenticatedUserUseCase->execute($request);
        return new UserResource($user);
    }
}
```

#### 4-4: APIルート + レートリミッター

```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

```php
// AppServiceProvider::boot() にレートリミッター登録
RateLimiter::for('login', function (Request $request) {
    $email = (string) $request->input('email');
    return Limit::perMinute(5)->by($email . '|' . $request->ip());
});
```

**テスト（RED → GREEN → REFACTOR）:**
- `tests/Feature/Api/AuthControllerTest.php`
  - POST /api/login: 正しい認証情報で200 + ユーザー情報返却
  - POST /api/login: 不正認証情報で422
  - POST /api/login: バリデーションエラー（email未入力、password短すぎ）で422
  - POST /api/login: レート制限超過で429
  - POST /api/logout: 認証済みで200
  - POST /api/logout: 未認証で401
  - GET /api/user: 認証済みでユーザー情報返却
  - GET /api/user: 未認証で401

---

### Phase 5: セキュリティ強化

**タスク:**
1. `.env` のセッション設定確認・調整
   - `SESSION_SECURE_COOKIE=true`（本番）
   - `SESSION_SAME_SITE=lax`
   - `SESSION_HTTP_ONLY=true`
2. Sanctum `stateful` ドメイン設定
3. CORS設定（`config/cors.php` publish & 設定）
   - `supports_credentials: true`
   - `allowed_origins` を明示的に指定

**テスト:** Feature テストでセッション関連の動作を確認（Phase 4のテストでカバー）

---

### Phase 6: DI設定

**タスク:**
1. `AppServiceProvider` に Repository バインディング追加

```php
// AppServiceProvider::register()
$this->app->bind(
    UserRepositoryInterface::class,
    UserRepository::class,
);
```

**テスト:** DIコンテナからの解決が正常に動作することをFeatureテストで確認

---

### Phase 7: ドキュメント

**タスク:**
1. API仕様書作成（エンドポイント、リクエスト/レスポンス形式、エラーコード）
2. セットアップガイド更新（Sanctumインストール手順）

---

## レビューチェックリスト

### アーキテクチャ準拠

- [x] **Presentation層**: AuthController はUseCaseのみ呼び出し、ビジネスロジックなし
- [x] **Request層**: LoginRequest でバリデーション + DTO変換
- [x] **UseCase層**: LoginUseCase にビジネスロジック集約、LoginData DTO使用
- [x] **Repository層**: UserRepositoryInterface + UserRepository 分離
- [x] **Model層**: User Model 変更なし（既存で十分）
- [x] **Resource層**: UserResource でJSON変換
- [x] **Service層**: 今回は不要（共通ロジックなし）

### セキュリティ

- [x] セッション再生成（ログイン成功時）
- [x] セッション無効化 + トークン再生成（ログアウト時）
- [x] レート制限（5回/分、email + IP）
- [x] CSRF保護（Sanctum SPA認証で自動）
- [x] パスワードはHash cast済み（User Model）

### 依存方向

```
Controller → UseCase → RepositoryInterface ← Repository → Model
                ↑
            LoginData (DTO)
```

下位層から上位層への依存なし。
