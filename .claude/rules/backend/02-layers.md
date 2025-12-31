# レイヤー構造と責務

## 1. Presentation Layer（Controllers）

### 責務

- **HTTPリクエストの受付**
- **認可チェック**（Policy使用）
- **Use Caseの呼び出し**
- **HTTPレスポンスの返却**

### 種類

#### Web Controllers（Inertia.js用）

**目的**: 初期ページ描画のみを担当。静的なマスターデータのみを提供。

**命名規則**: `[Resource]PageController.php`

**提供データ**: 静的マスターデータ、Enumオプション、クエリパラメータ

```php
class WeeklyReportPageController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('WeeklyReport/Index', [
            'statusOptions' => ReportStatus::toSelectArray(), // 静的データ
            'filters' => $request->only(['q', 'status']),
        ]);
        // 週報一覧データは React 側から API 経由で取得
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

#### API Controllers（REST API用）

**目的**: CRUD操作、動的データ処理

**命名規則**: `[Resource]Controller.php`

**RESTful設計**: `index`, `store`, `show`, `update`, `destroy`

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

## 2. Request Layer（Form Requests）

### 責務

- **バリデーションルール定義**
- **カスタムエラーメッセージ**
- **DTOへの変換**

### 命名規則

- `Store[Resource]Request.php` - 作成用
- `Update[Resource]Request.php` - 更新用
- `Search[Resource]sRequest.php` - 検索用

### 実装例

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

## 3. Use Case Layer（Business Logic）

### 責務

- **ビジネスロジックの実装**
- **トランザクション制御**（必要に応じて）
- **ドメインバリデーション**
- **Repository、Serviceの呼び出し**

### 命名規則

- `Create[Resource]UseCase.php`
- `Update[Resource]UseCase.php`
- `Delete[Resource]UseCase.php`
- `Get[Resource]sUseCase.php`

### 実装例

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

## 4. Service Layer（Shared Logic）

### 責務

- **複数のUseCase間で共有されるロジック**
- **外部サービスとの連携**
- **複雑な計算処理**

### 命名規則

- `[Resource][Function]Service.php`
  - 例: `WeeklyReportExportService.php`
  - 例: `DashboardDataService.php`

### 実装例

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

## 5. Repository Layer（Data Access）

### 責務

- **データアクセスの抽象化**
- **Eloquentクエリのカプセル化**
- **トランザクション管理**

### 命名規則

- Interface: `[Resource]RepositoryInterface.php`
- Implementation: `[Resource]Repository.php`（必要に応じて）

### 実装パターン

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

**Implementation**（必要に応じて）:

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

## 6. Model Layer（Eloquent Models）

### 責務

- **ドメインモデルの定義**
- **リレーションシップの定義**
- **キャスト、アクセサ、ミューテータ**
- **スコープ定義**

### 実装例

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

## 7. Resource Layer（Response Transformation）

### 責務

- **JSONレスポンスの整形**
- **不要なデータの除外**
- **Lazy Loadingの最適化**

### 命名規則

- `[Resource]Resource.php`

### 実装例

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

## レイヤー間の依存ルール

### 許可される依存

```
Presentation → Request, UseCase, Resource
Request → DTO
UseCase → Repository, Service, Policy
Service → Repository, Model
Repository → Model
Resource → Model
```

### 禁止される依存

```
Model → Repository（逆方向）
UseCase → Resource
Controller → Model（Repository経由必須）
Domain → Infrastructure
```

### トランザクション管理

- **基本方針**: Repository 内で管理（`DB::transaction()`）
- **複数Repository操作**: UseCase 内で管理
- **ネストしたトランザクション**: Laravel の仕様に従う
