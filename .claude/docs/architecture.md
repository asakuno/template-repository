# Backend Architecture Documentation

このドキュメントは、Laravel 12をベースとしたバックエンドアーキテクチャの設計パターンと実装規約をまとめたものです。他のプロジェクトでも流用可能な汎用的なアーキテクチャパターンとして記述しています。

## 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [レイヤード・アーキテクチャ](#レイヤードアーキテクチャ)
- [ディレクトリ構造](#ディレクトリ構造)
- [データフロー](#データフロー)
- [各レイヤーの詳細](#各レイヤーの詳細)
- [TypeScript型生成](#typescript型生成)
- [Inertia.js + React 統合](#inertiajs--react-統合)
- [設計パターン](#設計パターン)
- [テスト戦略](#テスト戦略)
- [ベストプラクティス](#ベストプラクティス)

---

## アーキテクチャ概要

### 基本方針

- **クリーンアーキテクチャ**を基盤とした**レイヤード・アーキテクチャ**
- **Inertia.js + React**による**フロントエンド/バックエンド分離**
- **型安全性**を重視（PHPDoc、Type Hints、DTOs、TypeScript自動生成）
- **テスト駆動開発（TDD）**の推奨
- **SOLID原則**の遵守

### 技術スタック

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React + TypeScript, Inertia.js
- **Database**: MySQL 8.0
- **Queue**: Redis
- **Storage**: MinIO (S3互換)
- **Testing**: PHPUnit 11
- **Code Style**: Laravel Pint
- **型生成**: spatie/laravel-data, spatie/laravel-typescript-transformer, fumeapp/modeltyper
- **ルート共有**: Laravel Wayfinder

---

## レイヤード・アーキテクチャ

このプロジェクトは、以下の7層のレイヤード・アーキテクチャを採用しています：

```
┌─────────────────────────────────────────┐
│  Presentation Layer (Controllers)       │  ← HTTP Request/Response
├─────────────────────────────────────────┤
│  Request Layer (Form Requests)          │  ← Validation & DTO Conversion
├─────────────────────────────────────────┤
│  Use Case Layer (Business Logic)        │  ← Application Logic
├─────────────────────────────────────────┤
│  Service Layer (Shared Logic)           │  ← Reusable Business Logic
├─────────────────────────────────────────┤
│  Repository Layer (Data Access)         │  ← Data Abstraction
├─────────────────────────────────────────┤
│  Model Layer (Eloquent Models)          │  ← Domain Models
├─────────────────────────────────────────┤
│  Resource Layer (Response Transformation) │  ← JSON Serialization
└─────────────────────────────────────────┘
```

### 各層の責務の概要

| レイヤー | 責務 | 依存方向 |
|---------|------|---------|
| **Presentation (Controllers)** | HTTPリクエストの受付・レスポンス返却 | → Request, UseCase, Resource |
| **Request (Form Requests)** | バリデーション、DTO変換 | → DTO |
| **Use Case** | ビジネスロジック、トランザクション制御 | → Repository, Service, Policy |
| **Service** | 汎用的なビジネスロジック | → Repository, Model |
| **Repository** | データアクセス抽象化 | → Model |
| **Model** | ドメインモデル、データ永続化 | なし（最下層） |
| **Resource** | JSONレスポンス変換 | → Model |

---

## ディレクトリ構造

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php              # ベースコントローラー
│   │   ├── Api/                        # API Controllers（REST API）
│   │   │   ├── Auth/                   # 認証関連API
│   │   │   ├── Dashboard/              # ダッシュボードAPI
│   │   │   └── [Resource]/             # リソース別API
│   │   │       └── [Resource]Controller.php
│   │   └── Web/                        # Web Controllers（Inertia.js用）
│   │       ├── Auth/                   # 認証画面
│   │       └── [Resource]PageController.php  # ページ描画用
│   │
│   ├── Requests/                       # Form Requests
│   │   ├── Auth/                       # 認証リクエスト
│   │   └── [Resource]/                 # リソース別リクエスト
│   │       ├── Store[Resource]Request.php
│   │       ├── Update[Resource]Request.php
│   │       └── Search[Resource]sRequest.php
│   │
│   ├── Resources/                      # API Resources
│   │   ├── [Resource]Resource.php
│   │   └── Web/                        # Web固有のResource
│   │
│   └── Middleware/
│       └── HandleInertiaRequests.php   # Inertia共通データ
│
├── UseCases/                           # Use Cases（ビジネスロジック）
│   └── [Resource]/
│       ├── Create[Resource]UseCase.php
│       ├── Update[Resource]UseCase.php
│       ├── Delete[Resource]UseCase.php
│       └── Get[Resource]sUseCase.php
│
├── Services/                           # Services（共通ロジック）
│   └── [Resource]/
│       └── [Resource]ExportService.php # エクスポート等の汎用機能
│
├── Repositories/                       # Repositories（データアクセス）
│   └── [Resource]/
│       ├── [Resource]RepositoryInterface.php
│       └── [Resource]Repository.php    # 実装（存在する場合）
│
├── Data/                               # DTOs（Laravel Data）
│   └── [Resource]/
│       ├── Create[Resource]Data.php
│       └── Update[Resource]Data.php
│
├── Models/                             # Eloquent Models
│   ├── User.php
│   └── [Resource].php
│
├── Policies/                           # Policies（認可）
│   └── [Resource]Policy.php
│
├── Enums/                              # Enums（列挙型）
│   └── [Resource]/
│       └── [Status].php
│
├── Exceptions/                         # Exceptions（例外）
│   └── Domain/                         # ドメイン固有例外
│       └── [Resource]NotFoundException.php
│
├── Utils/                              # ユーティリティ
│   └── ModelTransformer.php            # TypeScript型生成用トランスフォーマー
│
└── Providers/                          # Service Providers
    └── AppServiceProvider.php

resources/
├── js/
│   ├── app.tsx                         # Reactエントリーポイント
│   ├── pages/                          # Inertia Pages（Reactコンポーネント）
│   │   └── [Resource]/
│   │       ├── Index.tsx
│   │       ├── Create.tsx
│   │       └── Edit.tsx
│   ├── components/                     # 共通コンポーネント
│   ├── layouts/                        # レイアウトコンポーネント
│   │   └── BaseLayout.tsx
│   ├── hooks/                          # カスタムフック
│   ├── types/                          # TypeScript型定義
│   │   ├── index.d.ts                  # 共通型定義
│   │   ├── generated.d.ts              # 自動生成（Laravel Data）
│   │   └── model.d.ts                  # 自動生成（modeltyper）
│   ├── actions/                        # Wayfinder Actions（自動生成）
│   └── routes/                         # Wayfinder Routes（自動生成）
└── views/
    └── app.blade.php                   # Inertiaルートテンプレート
```

---

## データフロー

### 1. Web Controllers（Inertia.js）のデータフロー

**目的**: 初期ページ描画のみを担当。静的なマスターデータのみを提供。

```
┌─────────────┐
│ Web Request │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Web Controller   │ ← 静的データのみ準備（Enum、マスターデータ等）
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Inertia::render()│ ← React コンポーネントに Props を渡す
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ React Component  │ ← 初期描画
└──────────────────┘
       │
       │ (動的データが必要な場合)
       ▼
┌──────────────────┐
│ API Request      │ ← axios/fetch で API コントローラーへリクエスト
└──────────────────┘
```

**例**: ページコントローラー

```php
// Web/WeeklyReportPageController.php
public function index(Request $request): Response
{
    return Inertia::render('WeeklyReport/Index', [
        'statusOptions' => ReportStatus::toSelectArray(), // 静的マスターデータ
        'filters' => $request->only(['q', 'status']),    // クエリパラメータ
    ]);
    // 週報一覧データは React 側から API 経由で取得
}
```

### 2. API Controllers（REST API）のデータフロー

**目的**: CRUD操作、動的データの取得・更新を担当。

```
┌─────────────┐
│ API Request │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ API Controller   │ ← HTTPリクエスト受付
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Form Request     │ ← バリデーション & DTO変換
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Use Case         │ ← ビジネスロジック実行
└──────┬───────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Repository   │  │ Service      │ ← データアクセス & 汎用ロジック
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────────────────┐
│ Model (Eloquent)         │ ← データ永続化
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│ Resource         │ ← JSONレスポンス変換
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ JSON Response    │
└──────────────────┘
```

**例**: APIコントローラー

```php
// Api/WeeklyReportController.php
public function store(StoreWeeklyReportRequest $request): JsonResponse
{
    // 1. Form Requestで自動バリデーション
    $data = $request->getCreateWeeklyReportData(); // DTO取得

    // 2. Use Caseでビジネスロジック実行
    $weeklyReport = $this->createWeeklyReportUseCase->execute($data);

    // 3. Resourceでレスポンス変換
    return response()->json([
        'data' => new WeeklyReportResource($weeklyReport),
    ], 201);
}
```

---

## 各レイヤーの詳細

### 1. Presentation Layer（Controllers）

#### 責務

- HTTPリクエストの受付
- 認可チェック（Policy）
- Use Caseの呼び出し
- HTTPレスポンスの返却

#### 種類

##### Web Controllers（Inertia.js用）

- **目的**: 初期ページ描画のみ
- **命名規則**: `[Resource]PageController.php`
- **提供データ**: 静的マスターデータ、Enumオプション、クエリパラメータ

```php
class WeeklyReportPageController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('WeeklyReport/Index', [
            'statusOptions' => ReportStatus::toSelectArray(),
            'filters' => $request->only(['q', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('WeeklyReport/Create', [
            'reportStatuses' => ReportStatus::toSelectArray(),
        ]);
    }

    public function edit(int $id): Response
    {
        return Inertia::render('WeeklyReport/Edit', [
            'weeklyReportId' => $id,
            'reportStatuses' => ReportStatus::toSelectArray(),
        ]);
    }
}
```

##### API Controllers（REST API用）

- **目的**: CRUD操作、動的データ処理
- **命名規則**: `[Resource]Controller.php`
- **RESTful設計**: `index`, `store`, `show`, `update`, `destroy`

```php
class WeeklyReportController extends Controller
{
    public function __construct(
        private GetWeeklyReportsUseCase $getWeeklyReportsUseCase,
        private CreateWeeklyReportUseCase $createWeeklyReportUseCase,
        private UpdateWeeklyReportUseCase $updateWeeklyReportUseCase,
        private DeleteWeeklyReportUseCase $deleteWeeklyReportUseCase,
    ) {}

    public function index(SearchWeeklyReportsRequest $request): JsonResponse
    {
        $weeklyReports = $this->getWeeklyReportsUseCase->execute(
            $request->getSearchWeeklyReportsData()
        );

        return response()->json([
            'data' => WeeklyReportResource::collection($weeklyReports),
            'meta' => [
                'current_page' => $weeklyReports->currentPage(),
                'last_page' => $weeklyReports->lastPage(),
                'per_page' => $weeklyReports->perPage(),
                'total' => $weeklyReports->total(),
            ],
        ]);
    }

    public function store(StoreWeeklyReportRequest $request): JsonResponse
    {
        $data = $request->getCreateWeeklyReportData();
        $weeklyReport = $this->createWeeklyReportUseCase->execute($data);

        return response()->json([
            'data' => new WeeklyReportResource($weeklyReport),
        ], 201);
    }

    public function show(WeeklyReport $weeklyReport): JsonResponse
    {
        $this->authorize('view', $weeklyReport);

        $weeklyReport->load(['user', 'kpiValues.kpiItem']);

        return response()->json([
            'data' => new WeeklyReportResource($weeklyReport),
        ]);
    }

    public function update(
        UpdateWeeklyReportRequest $request,
        WeeklyReport $weeklyReport
    ): JsonResponse {
        $this->authorize('update', $weeklyReport);

        $data = $request->getUpdateWeeklyReportData();
        $updatedReport = $this->updateWeeklyReportUseCase->execute($data, auth()->id());

        return response()->json([
            'data' => new WeeklyReportResource($updatedReport),
        ]);
    }

    public function destroy(WeeklyReport $weeklyReport): JsonResponse
    {
        $this->authorize('delete', $weeklyReport);

        $this->deleteWeeklyReportUseCase->execute($weeklyReport->id, auth()->id());

        return response()->json([
            'message' => 'Resource deleted successfully.',
        ], 204);
    }
}
```

---

### 2. Request Layer（Form Requests / Laravel Data）

#### 責務

- **バリデーションルール定義**
- **カスタムエラーメッセージ**
- **DTOへの変換**

#### 命名規則

- `Store[Resource]Request.php` - 作成用
- `Update[Resource]Request.php` - 更新用
- `Search[Resource]sRequest.php` - 検索用

#### 実装例（従来のFormRequest）

```php
class StoreWeeklyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // 認可はPolicyで実施
    }

    public function rules(): array
    {
        return [
            'week_start_date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'memo' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ReportStatus::class)],
            'kpi_values' => ['required', 'array', 'min:1'],
            'kpi_values.*.kpi_item_id' => ['required', 'integer', 'exists:kpi_items,id'],
            'kpi_values.*.value' => ['required'],
        ];
    }

    public function messages(): array
    {
        return [
            'week_start_date.required' => 'Week start date is required.',
            'title.required' => 'Title is required.',
            'kpi_values.min' => 'At least one KPI value is required.',
        ];
    }

    /**
     * DTOへの変換メソッド
     */
    public function getCreateWeeklyReportData(): CreateWeeklyReportData
    {
        return CreateWeeklyReportData::from([
            'user_id' => auth()->id(),
            'week_start_date' => $this->input('week_start_date'),
            'title' => $this->input('title'),
            'memo' => $this->input('memo'),
            'status' => $this->input('status'),
            'kpi_values' => array_map(
                fn (array $kpiValue) => KpiValueData::from($kpiValue),
                $this->input('kpi_values', [])
            ),
        ]);
    }
}
```

---

### 3. Use Case Layer（Business Logic）

#### 責務

- **ビジネスロジックの実装**
- **トランザクション制御**（必要に応じて）
- **ドメインバリデーション**
- **Repository、Serviceの呼び出し**

#### 命名規則

- `Create[Resource]UseCase.php`
- `Update[Resource]UseCase.php`
- `Delete[Resource]UseCase.php`
- `Get[Resource]sUseCase.php`

#### 実装例

```php
class CreateWeeklyReportUseCase
{
    public function __construct(
        private WeeklyReportRepositoryInterface $weeklyReportRepository,
        private KpiItemRepositoryInterface $kpiItemRepository,
    ) {}

    /**
     * @throws ValidationException
     */
    public function execute(CreateWeeklyReportData $data): WeeklyReport
    {
        // 1. ドメインバリデーション（重複チェック）
        $existingReport = $this->weeklyReportRepository->findByUserAndWeek(
            $data->userId,
            $data->weekStartDate
        );

        if ($existingReport !== null) {
            throw ValidationException::withMessages([
                'week_start_date' => ['A report for this week already exists.'],
            ]);
        }

        // 2. ビジネスルールのバリデーション（提出時の必須チェック）
        if ($data->status === ReportStatus::Submitted) {
            $this->validateSubmission($data);
        }

        // 3. 所有権チェック
        $this->validateKpiItemOwnership($data);

        // 4. データ作成（トランザクションはRepository内で管理）
        $kpiValuesArray = array_map(function ($kpiValue) {
            return [
                'kpi_item_id' => $kpiValue->kpiItemId,
                'value' => $kpiValue->value,
            ];
        }, $data->kpiValues);

        return $this->weeklyReportRepository->create(
            $data->userId,
            $data->weekStartDate,
            $data->title,
            $data->memo,
            $data->status,
            $kpiValuesArray
        );
    }

    private function validateSubmission(CreateWeeklyReportData $data): void
    {
        // ビジネスルールのバリデーション実装
    }

    private function validateKpiItemOwnership(CreateWeeklyReportData $data): void
    {
        // 所有権チェックの実装
    }
}
```

---

### 4. Service Layer（Shared Logic）

#### 責務

- **複数のUseCase間で共有されるロジック**
- **外部サービスとの連携**
- **複雑な計算処理**

#### 命名規則

- `[Resource][Function]Service.php`
  - 例: `WeeklyReportExportService.php`
  - 例: `DashboardDataService.php`

#### 実装例

```php
class WeeklyReportExportService
{
    /**
     * Export report to CSV (UTF-8 BOM)
     */
    public function exportToCsv(WeeklyReport $report): string
    {
        $report->load(['kpiValues.kpiItem', 'user']);

        $filename = 'exports/weekly_report_'.$report->id.'_'.time().'.csv';

        // UTF-8 BOM for Excel compatibility
        $csv = "\xEF\xBB\xBF";

        // Headers
        $headers = ['Week', 'Title', 'Status'];
        foreach ($report->kpiValues as $kpiValue) {
            $headers[] = $kpiValue->kpiItem->name;
        }
        $headers[] = 'Memo';

        $csv .= $this->arrayToCsvLine($headers);

        // Data row
        $row = [
            $report->week_start_date->format('Y-m-d'),
            $report->title,
            $report->status->label(),
        ];

        foreach ($report->kpiValues as $kpiValue) {
            $row[] = $kpiValue->value;
        }

        $row[] = $report->memo ?? '';
        $csv .= $this->arrayToCsvLine($row);

        Storage::disk('local')->put($filename, $csv);

        return $filename;
    }

    /**
     * Export report to PDF
     */
    public function exportToPdf(WeeklyReport $report): string
    {
        $report->load(['kpiValues.kpiItem', 'user']);

        $filename = 'exports/weekly_report_'.$report->id.'_'.time().'.pdf';

        $pdf = Pdf::loadView('exports.weekly-report-pdf', [
            'report' => $report,
        ]);

        Storage::disk('local')->put($filename, $pdf->output());

        return $filename;
    }

    private function arrayToCsvLine(array $array): string
    {
        $fp = fopen('php://temp', 'r+');
        fputcsv($fp, $array);
        rewind($fp);
        $line = stream_get_contents($fp);
        fclose($fp);

        return $line;
    }
}
```

---

### 5. Repository Layer（Data Access）

#### 責務

- **データアクセスの抽象化**
- **Eloquentクエリのカプセル化**
- **トランザクション管理**

#### 命名規則

- Interface: `[Resource]RepositoryInterface.php`
- Implementation: `[Resource]Repository.php`（Laravel Service Containerで自動バインディング）

#### 実装パターン

**Interface定義**:

```php
interface WeeklyReportRepositoryInterface
{
    public function findById(int $id): ?WeeklyReport;

    public function findByUserAndWeek(int $userId, string $weekStartDate): ?WeeklyReport;

    public function create(
        int $userId,
        string $weekStartDate,
        string $title,
        ?string $memo,
        ReportStatus $status,
        array $kpiValues
    ): WeeklyReport;

    public function update(
        int $id,
        string $weekStartDate,
        string $title,
        ?string $memo,
        ReportStatus $status,
        array $kpiValues
    ): WeeklyReport;

    public function delete(int $id): bool;
}
```

**Implementation** (必要に応じて):

```php
class WeeklyReportRepository implements WeeklyReportRepositoryInterface
{
    public function findById(int $id): ?WeeklyReport
    {
        return WeeklyReport::find($id);
    }

    public function create(
        int $userId,
        string $weekStartDate,
        string $title,
        ?string $memo,
        ReportStatus $status,
        array $kpiValues
    ): WeeklyReport {
        return DB::transaction(function () use (
            $userId,
            $weekStartDate,
            $title,
            $memo,
            $status,
            $kpiValues
        ) {
            $weeklyReport = WeeklyReport::create([
                'user_id' => $userId,
                'week_start_date' => $weekStartDate,
                'title' => $title,
                'memo' => $memo,
                'status' => $status,
            ]);

            foreach ($kpiValues as $kpiValue) {
                $weeklyReport->kpiValues()->create($kpiValue);
            }

            return $weeklyReport->fresh(['kpiValues.kpiItem']);
        });
    }
}
```

**Service Provider でのバインディング**:

```php
// AppServiceProvider.php
public function register(): void
{
    $this->app->bind(
        WeeklyReportRepositoryInterface::class,
        WeeklyReportRepository::class
    );
}
```

---

### 6. Model Layer（Eloquent Models）

#### 責務

- **ドメインモデルの定義**
- **リレーションシップの定義**
- **キャスト、アクセサ、ミューテータ**
- **スコープ定義**

#### 実装例

```php
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript()]
class WeeklyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'week_start_date',
        'title',
        'memo',
        'status',
    ];

    /**
     * Type casts
     */
    protected function casts(): array
    {
        return [
            'week_start_date' => 'date',
            'status' => ReportStatus::class,
        ];
    }

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kpiValues(): HasMany
    {
        return $this->hasMany(KpiValue::class);
    }

    public function sharedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'weekly_report_shares')
            ->withTimestamps();
    }

    /**
     * Query Scopes
     */
    public function scopeByStatus(Builder $query, ReportStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
```

---

### 7. Resource Layer（Response Transformation）

#### 責務

- **JSONレスポンスの整形**
- **不要なデータの除外**
- **Lazy Loadingの最適化**

#### 命名規則

- `[Resource]Resource.php`

#### 実装例

```php
class WeeklyReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'week_start_date' => $this->week_start_date->format('Y-m-d'),
            'title' => $this->title,
            'memo' => $this->memo,
            'status' => $this->status->value,

            // Conditional loading (lazy loading)
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),

            // Computed properties
            'is_owner' => $request->user()?->id === $this->user_id,

            // Nested relationships
            'kpi_values' => $this->whenLoaded('kpiValues', fn () =>
                $this->kpiValues->map(fn ($kpiValue) => [
                    'kpi_item' => [
                        'id' => $kpiValue->kpiItem->id,
                        'name' => $kpiValue->kpiItem->name,
                        'data_type' => $kpiValue->kpiItem->data_type->value,
                        'unit' => $kpiValue->kpiItem->unit,
                    ],
                    'value' => $kpiValue->value,
                ])
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

---

### 8. Data Transfer Objects (DTOs) - Laravel Data

#### 責務

- **型安全なデータ転送**
- **不変性の保証（readonly）**
- **スネークケース/キャメルケースの自動変換**
- **TypeScript型の自動生成**

#### 使用ライブラリ

- `spatie/laravel-data`
- `spatie/laravel-typescript-transformer`

#### インストール

```bash
composer require spatie/laravel-data
composer require spatie/laravel-typescript-transformer

php artisan vendor:publish --provider="Spatie\LaravelTypeScriptTransformer\TypeScriptTransformerServiceProvider"
```

#### 設定（config/typescript-transformer.php）

```php
return [
    'transformers' => [
        App\Utils\ModelTransformer::class,
        Spatie\LaravelTypeScriptTransformer\Transformers\SpatieStateTransformer::class,
        Spatie\TypeScriptTransformer\Transformers\EnumTransformer::class,
        Spatie\LaravelTypeScriptTransformer\Transformers\DtoTransformer::class,
    ],

    'output_file' => resource_path('js/types/generated.d.ts'),

    'writer' => Spatie\TypeScriptTransformer\Writers\TypeDefinitionWriter::class,

    'transform_to_native_enums' => false,

    'transform_null_to_optional' => true,
];
```

#### 実装例

```php
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript()]
#[MapName(SnakeCaseMapper::class)]
class CreateWeeklyReportData extends Data
{
    public function __construct(
        #[Exists(User::class, 'id')]
        public readonly int $userId,
        public readonly string $weekStartDate,
        #[Max(255)]
        public readonly string $title,
        #[Max(1000)]
        public readonly ?string $memo,
        public readonly ReportStatus $status,
        /** @var array<KpiValueData> */
        #[DataCollectionOf(KpiValueData::class)]
        public readonly array $kpiValues,
    ) {}
}
```

#### ネストされたDTO

```php
#[TypeScript()]
class KpiValueData extends Data
{
    public function __construct(
        #[Exists(KpiItem::class, 'id')]
        public int $kpiItemId,
        #[Max(255)]
        public string $value,
    ) {}
}
```

#### DTOをControllerで直接使用

Laravel Dataを使用すると、FormRequestの代わりにDTOを直接Controllerで受け取ることができます：

```php
// routes/api.php
Route::post('/weekly-reports', function (CreateWeeklyReportData $data) {
    // バリデーションは自動的に実行される
    // $dataは型安全なDTOインスタンス
    return response()->json($data->toArray());
});
```

---

## TypeScript型生成

### 概要

PHP側で定義したDTO、Model、Enumの型をTypeScriptに自動生成することで、フロントエンド/バックエンド間の型安全性を確保します。

### 必要なパッケージ

```bash
# Laravel Data（DTO + バリデーション + TypeScript型生成）
composer require spatie/laravel-data
composer require spatie/laravel-typescript-transformer

# Model型生成
composer require --dev fumeapp/modeltyper
```

### 1. Laravel Data による DTO 型生成

DTOに `#[TypeScript()]` アトリビュートを付与すると、TypeScriptの型として生成されます。

```php
// app/Data/PostData.php
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript()]
class PostData extends Data
{
    public function __construct(
        public int $userId,
        #[Max(255)]
        public string $title,
        #[Max(1000)]
        public ?string $body,
        /** @var array<PostTagData> */
        #[DataCollectionOf(PostTagData::class)]
        public array $tags,
    ) {}
}
```

### 2. modeltyper による Model 型生成

modeltyperは、Eloquent Modelから自動的にTypeScript型を生成します。

```bash
# 型生成コマンド
php artisan model:typer ./resources/js/types/model.d.ts
```

生成結果：

```typescript
// resources/js/types/model.d.ts
export interface Post {
  // columns
  id: number
  user_id: number
  title: string
  body: string
  created_at: string | null
  updated_at: string | null
  // relations
  user: User
  tags: PostTag[]
  // counts
  tags_count: number
  // exists
  user_exists: boolean
  tags_exists: boolean
}
```

#### 型の上書き

Model側で `$interfaces` プロパティを定義することで、TypeScript型を上書きできます：

```php
class PostTag extends Model
{
    protected $fillable = ['name', 'color'];

    // TypeScript型の上書き
    public array $interfaces = [
        'color' => [
            'type' => "'red' | 'blue' | 'green'",
        ],
    ];
}
```

### 3. 統合された型生成（ModelTransformer）

TypeScript Transformerとmodeltyperを統合するカスタムトランスフォーマーを作成し、単一のコマンドで全ての型を生成します。

**app/Utils/ModelTransformer.php**

```php
<?php

namespace App\Utils;

use FumeApp\ModelTyper\Actions\Generator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use ReflectionClass;
use Spatie\TypeScriptTransformer\Structures\TransformedType;
use Spatie\TypeScriptTransformer\Transformers\Transformer;
use Spatie\TypeScriptTransformer\TypeScriptTransformerConfig;
use FumeApp\ModelTyper\Overrides\ModelInspector;

class ModelTransformer implements Transformer
{
    public function __construct(protected TypeScriptTransformerConfig $config)
    {
    }

    public function transform(ReflectionClass $class, string $name): ?TransformedType
    {
        if (! $class->isSubclassOf(Model::class)) {
            return null;
        }

        // (1) 利用 Class を集める
        $inspector = app(ModelInspector::class);
        $inspect = $inspector->inspect($class->getName());

        $modelMaps = collect()
            ->merge(collect(data_get($inspect, 'attributes'))->pluck('cast'))
            ->merge(collect(data_get($inspect, 'relations'))->pluck('related'))
            ->filter(fn ($attr) => Str::of($attr)->test('/^[A-Z]/'))
            ->unique()
            ->mapWithKeys(fn ($attr) => [
                Str::of($attr)->afterLast('\\')->toString() =>
                Str::of($attr)->replace('\\', '.')->toString()
            ]);

        // (2) Model to Type
        $modelTyper = app(Generator::class)(
            specificModel: $class->getName(),
        );

        // type を成型する
        $format = Str::of($modelTyper)
            ->replaceMatches('/export interface \w+ /s', '')
            ->replaceMatches('/.const.*/s', '')
            ->replaceMatches('/(\n|\r\n|\r)$/s', '')
            ->replaceMatches('/ ([A-Z]\w*)/', fn ($match) =>
                ' '.$modelMaps->get(data_get($match, 1), data_get($match, 1),)
            );

        return TransformedType::create(
            $class,
            $name,
            $format,
        );
    }
}
```

**Modelへの #[TypeScript()] 付与**

```php
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript()]
class Post extends Model
{
    // ...
}
```

### 型生成コマンド

```bash
# 統合型生成（DTO + Model + Enum）
php artisan typescript:transform
```

**生成結果（resources/js/types/generated.d.ts）**

```typescript
declare namespace App.Data {
  export type PostData = {
    user_id: number;
    title: string;
    body?: string;
    tags: Array<App.Data.PostTagData>;
  };
}

declare namespace App.Models {
  export type Post = {
    id: number
    user_id: number
    title: string
    body: string
    created_at: string | null
    updated_at: string | null
    user: App.Models.User
    tags: App.Models.PostTag[]
    tags_count: number
    user_exists: boolean
    tags_exists: boolean
  };
}

declare namespace App.Enums {
  export type ReportStatus = 'draft' | 'submitted';
}
```

---

## Inertia.js + React 統合

### 概要

Inertia.jsは、SPAのようなユーザー体験を提供しながら、サーバーサイドルーティングとコントローラーを維持できるモダンなアプローチです。APIを別途構築する必要がなく、Laravel側のコントローラーから直接Reactコンポーネントにデータを渡すことができます。

### データの受け渡し

#### LaravelからReactへのデータ渡し（GET）

**Controller側**

```php
// app/Http/Controllers/Web/TestPageController.php
namespace App\Http\Controllers\Web;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class TestPageController extends Controller
{
    public function index(): Response
    {
        $users = User::limit(5)->get();

        return Inertia::render('Test/Index', [
            'users' => $users,
        ]);
    }
}
```

**React側**

```tsx
// resources/js/pages/Test/Index.tsx
import { FC } from 'react';

interface Props {
  users: App.Models.User[];
}

const TestIndex: FC<Props> = ({ users }) => {
  return (
    <table className="m-4 border-collapse border-2">
      <thead>
        <tr>
          <th className="p-2 border-2">ID</th>
          <th className="p-2 border-2">Name</th>
          <th className="p-2 border-2">Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td className="p-2 border-2">{user.id}</td>
            <td className="p-2 border-2">{user.name}</td>
            <td className="p-2 border-2">{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TestIndex;
```

#### 遅延取得（Lazy Loading）

コントローラー側で `fn ()` でくるむと、必要な時にのみ関数が実行されます：

```php
return Inertia::render('Test/Index', [
    'posts' => fn () => Post::with('tags')->get(),  // 遅延実行
    'users' => fn () => User::all(),                // 遅延実行
]);
```

### レイアウトの使用

**レイアウトコンポーネント**

```tsx
// resources/js/layouts/BaseLayout.tsx
import { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const BaseLayout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        {/* ナビゲーション */}
      </nav>
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
};

export default BaseLayout;
```

**ページでのレイアウト指定**

```tsx
// resources/js/pages/Test/Index.tsx
import BaseLayout from '@/layouts/BaseLayout';

const TestIndex = ({ users }: Props) => {
  // ...
};

TestIndex.layout = (page: ReactNode) => <BaseLayout>{page}</BaseLayout>;

export default TestIndex;
```

### 共有データ（HandleInertiaRequests）

全てのページで共有するデータは、HandleInertiaRequestsミドルウェアで定義します：

**app/Http/Middleware/HandleInertiaRequests.php**

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'app' => [
            'name' => config('app.name'),
        ],
        'auth' => [
            'user' => $request->user(),
        ],
        'toast' => fn () => $request->session()->get('toast'),
    ];
}
```

**TypeScript型定義**

```typescript
// resources/js/types/index.d.ts
export interface Auth {
  user: App.Models.User | null;
}

export interface AppPageProps<T extends Record<string, unknown> = Record<string, unknown>> {
  app: {
    name: string;
  };
  auth: Auth;
  toast?: string;
}
```

**React側での使用**

```tsx
import { usePage } from '@inertiajs/react';

const Component = () => {
  const { auth, toast } = usePage<AppPageProps>().props;

  return (
    <div>
      {auth.user && <span>Welcome, {auth.user.name}</span>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};
```

### Wayfinder（型安全なルーティング）

Wayfinderは、LaravelのルートをTypeScriptの関数として生成し、型安全なページ遷移を実現します。

#### インストールと生成

```bash
# ルートの生成
php artisan wayfinder:generate
```

生成されるファイル：
- `resources/js/actions/` - コントローラーベースのルート関数
- `resources/js/routes/` - 名前付きルートベースのルート関数

#### 使用例

```tsx
// resources/js/pages/Test/Index.tsx
import { Link } from '@inertiajs/react';
import { show, store } from '@/routes/tests';

const TestIndex = () => {
  return (
    <div>
      {/* リンク */}
      <Link href={show(1).url}>View Detail</Link>

      {/* クエリパラメータ付き */}
      <Link href={show(1, { query: { tab: 'details' } }).url}>
        View Details Tab
      </Link>
    </div>
  );
};
```

#### QueryParameter の使い方

```tsx
import { index } from '@/routes/tests';

// 基本的なクエリパラメータ
console.log(index({ query: { foo: 1, bar: 'test' } }));
// => { url: '/test?foo=1&bar=test', method: 'get' }

// 現在のURLのパラメータとマージ
console.log(index({ mergeQuery: { foo: 1 } }));
// 現在のURL: /test?baz=add の場合
// => { url: '/test?baz=add&foo=1', method: 'get' }

// 配列形式
console.log(index({ query: { baz: ['aaa', 'bbb', 'ccc'] } }));
// => { url: '/test?baz[]=aaa&baz[]=bbb&baz[]=ccc', method: 'get' }
```

### フォーム送信（POST/PUT/DELETE）

#### useFormフックの使用

```tsx
// resources/js/pages/Post/Create.tsx
import { FC } from 'react';
import { useForm } from '@inertiajs/react';
import { store } from '@/routes/posts';

interface Props {
  users: App.Models.User[];
}

const PostCreate: FC<Props> = ({ users }) => {
  const { data, setData, submit, processing, errors, reset } = useForm<App.Data.PostData>({
    user_id: 0,
    title: '',
    body: undefined,
    tags: [{ name: '', color: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(store().method, store().url, {
      only: ['posts', 'toast'],  // 部分リロード
      onSuccess: () => reset(),
    });
  };

  const addTag = () => {
    setData('tags', [...data.tags, { name: '', color: '' }]);
  };

  const removeTag = (index: number) => {
    setData('tags', data.tags.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>User</label>
        <select
          value={data.user_id}
          onChange={(e) => setData('user_id', Number(e.target.value))}
        >
          <option value={0}>Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        {errors.user_id && <p className="text-red-500">{errors.user_id}</p>}
      </div>

      <div>
        <label>Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
        />
        {errors.title && <p className="text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label>Body</label>
        <textarea
          value={data.body ?? ''}
          onChange={(e) => setData('body', e.target.value)}
          rows={3}
        />
        {errors.body && <p className="text-red-500">{errors.body}</p>}
      </div>

      <div>
        <label>Tags</label>
        {data.tags.map((tag, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              value={tag.name}
              onChange={(e) => {
                const newTags = [...data.tags];
                newTags[idx].name = e.target.value;
                setData('tags', newTags);
              }}
              placeholder="Tag name"
            />
            <input
              type="color"
              value={tag.color ?? '#000000'}
              onChange={(e) => {
                const newTags = [...data.tags];
                newTags[idx].color = e.target.value;
                setData('tags', newTags);
              }}
            />
            <button type="button" onClick={() => removeTag(idx)}>Remove</button>
            {errors[`tags.${idx}.name`] && (
              <p className="text-red-500">{errors[`tags.${idx}.name`]}</p>
            )}
          </div>
        ))}
        <button type="button" onClick={addTag}>Add Tag</button>
      </div>

      <button type="submit" disabled={processing}>
        {processing ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

export default PostCreate;
```

#### Controller側（POST受け取り）

```php
// app/Http/Controllers/Web/PostController.php
use App\Data\PostData;

class PostController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Post/Index', [
            'posts' => fn () => Post::with('tags')->get(),
            'users' => fn () => User::all(),
        ]);
    }

    public function store(PostData $data)
    {
        $post = Post::create($data->except('tags')->all());

        foreach ($data->tags as $tag) {
            $post->tags()->create($tag->all());
        }

        return redirect()->back()
            ->with('toast', '保存しました。');
    }
}
```

### 部分リロード（only オプション）

`only` オプションを使用すると、特定のpropsのみを再取得できます：

```tsx
const handleSubmit = () => {
  submit(store().method, store().url, {
    only: ['posts', 'toast'],  // posts と toast のみ再取得
    onSuccess: () => reset(),
  });
};
```

これにより、不要なデータの再取得を避け、パフォーマンスを向上させることができます。

### トースト通知

**Controller側**

```php
return redirect()->back()
    ->with('toast', '保存しました。');
```

**React側（レイアウトでの実装）**

```tsx
// resources/js/layouts/BaseLayout.tsx
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const BaseLayout: FC<Props> = ({ children }) => {
  const { toast: message } = usePage<AppPageProps>().props;

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

---

## 設計パターン

### 1. Repository パターン

**目的**: データアクセスロジックをビジネスロジックから分離

```php
interface WeeklyReportRepositoryInterface
{
    public function findById(int $id): ?WeeklyReport;
    public function create(...): WeeklyReport;
}

// Use Case
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    return $this->weeklyReportRepository->create(...);
}
```

### 2. Use Case パターン

**目的**: ビジネスロジックの単一責任化

- 1つのUseCase = 1つのビジネスユースケース
- 例: `CreateWeeklyReportUseCase`, `UpdateWeeklyReportUseCase`

### 3. Policy パターン（Laravel標準）

**目的**: 認可ロジックの集約

```php
class WeeklyReportPolicy
{
    public function view(User $user, WeeklyReport $weeklyReport): bool
    {
        return $weeklyReport->user_id === $user->id
            || $weeklyReport->sharedUsers()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, WeeklyReport $weeklyReport): bool
    {
        return $weeklyReport->user_id === $user->id;
    }
}
```

### 4. Enum パターン（PHP 8.1+）

**目的**: 型安全な列挙型定義

```php
enum ReportStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';

    public function label(): string
    {
        return match($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Submitted',
        };
    }

    public static function toSelectArray(): array
    {
        return array_map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ], self::cases());
    }
}
```

### 5. Domain Exception パターン

**目的**: ドメイン固有の例外定義

```php
// app/Exceptions/Domain/WeeklyReportNotFoundException.php
class WeeklyReportNotFoundException extends \Exception
{
    public function __construct(int $id)
    {
        parent::__construct("Weekly report with ID {$id} not found.", 404);
    }
}

// bootstrap/app.php
$exceptions->renderable(function (WeeklyReportNotFoundException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json(['message' => $e->getMessage()], $e->getCode());
    }
    abort($e->getCode(), $e->getMessage());
});
```

---

## テスト戦略

### テスト構造

```
tests/
├── Unit/                          # ユニットテスト（独立した小さなロジック）
│   ├── Models/
│   ├── Services/
│   └── UseCases/
│
└── Feature/                       # フィーチャーテスト（統合テスト）
    ├── Http/
    │   ├── Controllers/
    │   │   ├── Api/               # API エンドポイントテスト
    │   │   └── Web/               # Web ページテスト
    │   ├── Requests/              # Form Request テスト
    │   └── Routes/                # ルーティングテスト
    │
    ├── Auth/                      # 認証・認可テスト
    ├── Policies/                  # Policy テスト
    ├── Services/                  # Service テスト
    └── Database/                  # DB・Migration テスト
```

### テスト実装例

#### Feature Test（API Controller）

```php
class WeeklyReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_weekly_reports(): void
    {
        $user = User::factory()->create();
        WeeklyReport::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/weekly-reports');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_weekly_report(): void
    {
        $user = User::factory()->create();
        $kpiItem = KpiItem::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/weekly-reports', [
            'week_start_date' => '2025-10-13',
            'title' => 'Week 42 Report',
            'memo' => 'Test memo',
            'status' => 'submitted',
            'kpi_values' => [
                [
                    'kpi_item_id' => $kpiItem->id,
                    'value' => '1000000',
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Week 42 Report');

        $this->assertDatabaseHas('weekly_reports', [
            'title' => 'Week 42 Report',
        ]);
    }
}
```

#### Policy Test

```php
class WeeklyReportPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_own_report(): void
    {
        $user = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->can('view', $report));
    }

    public function test_shared_user_can_view_report(): void
    {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $owner->id]);
        $report->sharedUsers()->attach($sharedUser->id);

        $this->assertTrue($sharedUser->can('view', $report));
    }

    public function test_non_shared_user_cannot_view_report(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $owner->id]);

        $this->assertFalse($otherUser->can('view', $report));
    }
}
```

### テストベストプラクティス

1. **Factory を活用**: テストデータはFactory経由で作成
2. **RefreshDatabase Trait**: 各テストでDBをリセット
3. **テスト命名**: `test_<動作>_<条件>` 形式（例: `test_can_create_weekly_report`）
4. **Given-When-Then パターン**: テストコードを3段階で構造化
5. **最小限のテスト実行**: `--filter` オプションで効率化

```bash
# 特定のテストメソッドのみ実行
docker compose exec app php artisan test --filter=test_can_create_weekly_report

# 特定のファイルのみ実行
docker compose exec app php artisan test tests/Feature/Http/Controllers/Api/WeeklyReportControllerTest.php
```

---

## ベストプラクティス

### 1. コード規約

#### PHP（Laravel Pint）

```bash
# コード整形の実行
docker compose exec app ./vendor/bin/pint --dirty
```

#### Type Hints & PHPDoc

```php
// ✅ Good: 明示的な型宣言
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    // ...
}

// ❌ Bad: 型宣言なし
public function execute($data)
{
    // ...
}

// ✅ Good: 配列の型定義
/**
 * @param array<int> $ids
 * @return array<WeeklyReport>
 */
public function findByIds(array $ids): array
{
    // ...
}
```

### 2. 型生成のワークフロー

```bash
# 1. マイグレーション実行後、Model型を生成
php artisan migrate

# 2. 統合型生成（DTO + Model + Enum）
php artisan typescript:transform

# 3. Wayfinderルート生成
php artisan wayfinder:generate

# 4. フロントエンドビルド
npm run build
```

### 3. データベース

#### N+1問題の防止

```php
// ❌ Bad: N+1問題
$reports = WeeklyReport::all();
foreach ($reports as $report) {
    echo $report->user->name; // ループごとにクエリ実行
}

// ✅ Good: Eager Loading
$reports = WeeklyReport::with('user')->get();
foreach ($reports as $report) {
    echo $report->user->name; // 1回のクエリで取得済み
}
```

#### Migration での型定義

```php
Schema::create('weekly_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->date('week_start_date');
    $table->string('title');
    $table->text('memo')->nullable();
    $table->string('status'); // Enum
    $table->timestamps();

    $table->unique(['user_id', 'week_start_date']); // 複合ユニーク制約
});
```

### 4. セキュリティ

#### 認可チェック

```php
// Controller
public function show(WeeklyReport $weeklyReport): JsonResponse
{
    $this->authorize('view', $weeklyReport); // Policy チェック

    return response()->json([
        'data' => new WeeklyReportResource($weeklyReport),
    ]);
}
```

#### Mass Assignment 対策

```php
// Model
protected $fillable = [
    'user_id',
    'title',
    'memo',
]; // ホワイトリスト方式

protected $guarded = ['id']; // ブラックリスト方式（非推奨）
```

### 5. パフォーマンス

#### キャッシュ戦略

```php
// 頻繁にアクセスされるマスターデータはキャッシュ
public function getAllKpiItems(): Collection
{
    return Cache::remember('kpi_items', 3600, function () {
        return KpiItem::all();
    });
}
```

#### ページネーション

```php
// ✅ Good: ページネーション
public function index(): JsonResponse
{
    $reports = WeeklyReport::paginate(20);

    return response()->json([
        'data' => WeeklyReportResource::collection($reports),
        'meta' => [
            'current_page' => $reports->currentPage(),
            'total' => $reports->total(),
        ],
    ]);
}

// ❌ Bad: 全件取得
$reports = WeeklyReport::all(); // メモリ枯渇の危険性
```

### 6. エラーハンドリング

#### 集中例外管理（`bootstrap/app.php`）

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions): void {
        // Domain exception handlers
        $exceptions->renderable(function (WeeklyReportNotFoundException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], $e->getCode());
            }
            abort($e->getCode(), $e->getMessage());
        });

        // Inertia custom error pages
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($request->header('X-Inertia') && in_array($response->getStatusCode(), [401, 403, 404, 500])) {
                return Inertia::render('Errors/ErrorPage', [
                    'status' => $response->getStatusCode(),
                    'message' => $exception->getMessage(),
                ])->toResponse($request)->setStatusCode($response->getStatusCode());
            }
            return $response;
        });
    })->create();
```

### 7. Git コミット規約

#### コミットメッセージ形式

```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント更新
- `chore`: ビルドプロセス、ツール変更

---

## まとめ

このアーキテクチャは、以下の特徴を持っています：

1. **保守性の高い設計**: レイヤー分離により変更の影響範囲を局所化
2. **テスタビリティ**: 各層が独立しており、ユニットテスト・統合テストが容易
3. **拡張性**: Repository、Service、UseCaseの追加が容易
4. **型安全性**: PHP 8.2+ の型宣言、Enum、DTOを活用し、TypeScript型を自動生成
5. **パフォーマンス**: N+1問題の防止、Eager Loading、キャッシュ戦略
6. **セキュリティ**: Policy による認可、Mass Assignment 対策
7. **開発効率**: Inertia.js + React + Wayfinderによるシームレスな開発体験

このドキュメントをベースに、プロジェクト固有の要件に応じてカスタマイズしてください。
