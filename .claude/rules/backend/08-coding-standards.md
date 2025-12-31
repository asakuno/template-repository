# バックエンド コーディング規約

## 基本設定

### Strict Types 宣言

すべての PHP ファイルで `declare(strict_types=1)` を宣言する。

```php
<?php

declare(strict_types=1);

namespace App\UseCases\WeeklyReport;

use App\Data\WeeklyReport\CreateWeeklyReportData;
use App\Models\WeeklyReport;
// ...
```

---

## 命名規則

### Controllers

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| **Web Controller** | `[Resource]PageController` | `WeeklyReportPageController` |
| **API Controller** | `[Resource]Controller` | `WeeklyReportController` |

```php
// ✅ Good
class WeeklyReportPageController extends Controller { }
class WeeklyReportController extends Controller { }

// ❌ Bad
class WeeklyReportWebController extends Controller { }
class WeeklyReportApiController extends Controller { }
```

### Form Requests

| 用途 | 命名規則 | 例 |
|------|---------|-----|
| **作成** | `Store[Resource]Request` | `StoreWeeklyReportRequest` |
| **更新** | `Update[Resource]Request` | `UpdateWeeklyReportRequest` |
| **検索** | `Search[Resource]sRequest` | `SearchWeeklyReportsRequest` |

```php
// ✅ Good
class StoreWeeklyReportRequest extends FormRequest { }
class UpdateWeeklyReportRequest extends FormRequest { }

// ❌ Bad
class CreateWeeklyReportRequest extends FormRequest { }
class WeeklyReportStoreRequest extends FormRequest { }
```

### Use Cases

| 用途 | 命名規則 | 例 |
|------|---------|-----|
| **作成** | `Create[Resource]UseCase` | `CreateWeeklyReportUseCase` |
| **更新** | `Update[Resource]UseCase` | `UpdateWeeklyReportUseCase` |
| **削除** | `Delete[Resource]UseCase` | `DeleteWeeklyReportUseCase` |
| **取得** | `Get[Resource]sUseCase` | `GetWeeklyReportsUseCase` |

```php
// ✅ Good
class CreateWeeklyReportUseCase { }
class GetWeeklyReportsUseCase { }

// ❌ Bad
class WeeklyReportCreateUseCase { }
class WeeklyReportGetter { }
```

### Services

| 命名規則 | 例 |
|---------|-----|
| `[Resource][Function]Service` | `WeeklyReportExportService` |
| | `DashboardDataService` |

```php
// ✅ Good
class WeeklyReportExportService { }
class DashboardDataService { }

// ❌ Bad
class ExportService { }
class DataService { }
```

### Repositories

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| **Interface** | `[Resource]RepositoryInterface` | `WeeklyReportRepositoryInterface` |
| **Implementation** | `[Resource]Repository` | `WeeklyReportRepository` |

```php
// ✅ Good: Interface
interface WeeklyReportRepositoryInterface { }

// ✅ Good: Implementation
class WeeklyReportRepository implements WeeklyReportRepositoryInterface { }

// ❌ Bad
interface IWeeklyReportRepository { }
class EloquentWeeklyReportRepository { }
```

### DTOs（Laravel Data）

| 用途 | 命名規則 | 例 |
|------|---------|-----|
| **作成** | `Create[Resource]Data` | `CreateWeeklyReportData` |
| **更新** | `Update[Resource]Data` | `UpdateWeeklyReportData` |
| **検索** | `Search[Resource]sData` | `SearchWeeklyReportsData` |
| **ネスト** | `[Property]Data` | `KpiValueData` |

```php
// ✅ Good
class CreateWeeklyReportData extends Data { }
class KpiValueData extends Data { }

// ❌ Bad
class WeeklyReportCreateDTO { }
class WeeklyReportData { }  // 用途が不明確
```

### Models

| 命名規則 | 例 |
|---------|-----|
| `[Resource]` | `WeeklyReport` |
| | `KpiItem` |

```php
// ✅ Good
class WeeklyReport extends Model { }
class KpiItem extends Model { }

// ❌ Bad
class WeeklyReportModel extends Model { }
class KpiItemEntity extends Model { }
```

### Resources

| 命名規則 | 例 |
|---------|-----|
| `[Resource]Resource` | `WeeklyReportResource` |

```php
// ✅ Good
class WeeklyReportResource extends JsonResource { }

// ❌ Bad
class WeeklyReportApiResource extends JsonResource { }
```

### Policies

| 命名規則 | 例 |
|---------|-----|
| `[Resource]Policy` | `WeeklyReportPolicy` |

```php
// ✅ Good
class WeeklyReportPolicy { }

// ❌ Bad
class WeeklyReportAccessPolicy { }
```

### Enums

| 命名規則 | 例 |
|---------|-----|
| `[Status/Type]` | `ReportStatus` |
| | `KpiDataType` |

```php
// ✅ Good
enum ReportStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
}

// ❌ Bad
enum WeeklyReportStatus: string { }
enum Status: string { }  // 不明確
```

---

## メソッド命名

### Repository メソッド

| 用途 | 命名規則 | 例 |
|------|---------|-----|
| **単一取得** | `findById`, `findBy[Property]` | `findById($id)` |
| | | `findByUserAndWeek($userId, $weekStartDate)` |
| **複数取得** | `findAll`, `findBy[Criteria]` | `findAll()` |
| | | `findByStatus($status)` |
| **作成** | `create` | `create(...)` |
| **更新** | `update` | `update($id, ...)` |
| **削除** | `delete` | `delete($id)` |

```php
// ✅ Good
public function findById(int $id): ?WeeklyReport;
public function findByUserAndWeek(int $userId, string $weekStartDate): ?WeeklyReport;
public function create(...): WeeklyReport;

// ❌ Bad
public function getById(int $id): ?WeeklyReport;
public function fetchByUserAndWeek(int $userId, string $weekStartDate): ?WeeklyReport;
public function save(...): WeeklyReport;  // 作成か更新か不明確
```

### UseCase メソッド

| 命名規則 | 例 |
|---------|-----|
| `execute` | `execute(CreateWeeklyReportData $data): WeeklyReport` |

```php
// ✅ Good
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    // ...
}

// ❌ Bad
public function handle(CreateWeeklyReportData $data): WeeklyReport { }
public function run(CreateWeeklyReportData $data): WeeklyReport { }
```

### Service メソッド

業務内容を明確に示す動詞を使用する。

```php
// ✅ Good
public function exportToCsv(WeeklyReport $report): string;
public function exportToPdf(WeeklyReport $report): string;
public function calculateTotalKpi(WeeklyReport $report): float;

// ❌ Bad
public function process(WeeklyReport $report): string;
public function handle(WeeklyReport $report): string;
```

---

## 修飾子の使用

### クラス修飾子

#### final の使用

継承を想定しないクラスには `final` を付与する。

```php
// ✅ Good: final使用
final class CreateWeeklyReportUseCase { }
final class WeeklyReportRepository implements WeeklyReportRepositoryInterface { }
final class WeeklyReportExportService { }

// ❌ Bad: final なし
class CreateWeeklyReportUseCase { }  // 継承されるべきでない
```

**例外**: 以下のクラスには `final` を付与しない:
- `Model` クラス（Laravel の仕様）
- `Controller` クラス（テスト時のモック作成のため）
- `Policy` クラス（テスト時のモック作成のため）

#### readonly の使用

DTOには `readonly` を付与する。

```php
// ✅ Good: readonly使用
#[TypeScript()]
final readonly class CreateWeeklyReportData extends Data
{
    public function __construct(
        public readonly int $userId,
        public readonly string $title,
    ) {}
}

// ❌ Bad: readonly なし
class CreateWeeklyReportData extends Data
{
    public function __construct(
        public int $userId,        // 可変
        public string $title,      // 可変
    ) {}
}
```

### コンストラクタ修飾子

#### private コンストラクタ

DTO以外で Factory パターンを使用する場合、コンストラクタを `private` とする。

```php
// ✅ Good: Factory パターン
final class WeeklyReportExportService
{
    private function __construct(
        private readonly StorageManager $storage,
    ) {}

    public static function create(): self
    {
        return new self(
            storage: app(StorageManager::class),
        );
    }
}

// DTO は public コンストラクタ
final readonly class CreateWeeklyReportData extends Data
{
    public function __construct(  // public のまま
        public readonly int $userId,
    ) {}
}
```

---

## 型宣言

### 必須の型宣言

すべての public メソッドに型宣言を必須とする。

```php
// ✅ Good: 完全な型宣言
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    // ...
}

public function findById(int $id): ?WeeklyReport
{
    // ...
}

// ❌ Bad: 型宣言なし
public function execute($data)
{
    // ...
}

public function findById($id)
{
    // ...
}
```

### Nullable 型

Nullable な引数・戻り値は `?` を使用する。

```php
// ✅ Good: ?型使用
public function findById(int $id): ?WeeklyReport
{
    return WeeklyReport::find($id);
}

public function getMemo(): ?string
{
    return $this->memo;
}

// ❌ Bad: Union型（非推奨）
public function findById(int $id): WeeklyReport|null
{
    return WeeklyReport::find($id);
}
```

### 配列型の PHPDoc

配列の型は PHPDoc で明示する。

```php
/**
 * @param array<int> $ids
 * @return array<WeeklyReport>
 */
public function findByIds(array $ids): array
{
    return WeeklyReport::whereIn('id', $ids)->get()->all();
}

/**
 * @param array<string, mixed> $data
 */
public function create(array $data): WeeklyReport
{
    // ...
}
```

---

## 依存関係の静的解析（deptrac）

### レイヤー間の依存ルール

```yaml
# deptrac/layer.yaml
deptrac:
  paths:
    - ./app
  layers:
    - name: Presentation
      collectors:
        - type: directory
          value: app/Http/Controllers
    - name: Request
      collectors:
        - type: directory
          value: app/Http/Requests
    - name: UseCase
      collectors:
        - type: directory
          value: app/UseCases
    - name: Service
      collectors:
        - type: directory
          value: app/Services
    - name: Repository
      collectors:
        - type: directory
          value: app/Repositories
    - name: Model
      collectors:
        - type: directory
          value: app/Models
    - name: Resource
      collectors:
        - type: directory
          value: app/Http/Resources

  ruleset:
    Presentation:
      - Request
      - UseCase
      - Resource
    Request:
      - Data
    UseCase:
      - Repository
      - Service
      - Policy
    Service:
      - Repository
      - Model
    Repository:
      - Model
    Resource:
      - Model
    Model: []
```

### 検証コマンド

```bash
# deptrac 実行
./vendor/bin/deptrac

# CI での検証
./vendor/bin/deptrac --fail-on-uncovered
```

---

## 禁止事項

### 型宣言

- **型宣言の省略**（すべての public メソッドに型宣言必須）
- **mixed 型の使用**（具体的な型を明示する）
- **any 型の使用**（TypeScript）

### マジックナンバー

定数化または Enum を使用する。

```php
// ✅ Good: 定数化
private const MAX_RETRY_COUNT = 3;
private const DEFAULT_TIMEOUT = 30;

public function retry(): void
{
    for ($i = 0; $i < self::MAX_RETRY_COUNT; $i++) {
        // ...
    }
}

// ❌ Bad: マジックナンバー
public function retry(): void
{
    for ($i = 0; $i < 3; $i++) {  // 3 の意味が不明
        // ...
    }
}
```

### else の濫用

Early Return を使用する。

```php
// ✅ Good: Early Return
public function process(?User $user): void
{
    if ($user === null) {
        throw new InvalidArgumentException('User is required');
    }

    if (!$user->isActive()) {
        throw new InvalidArgumentException('User is not active');
    }

    // メインの処理
}

// ❌ Bad: else の濫用
public function process(?User $user): void
{
    if ($user !== null) {
        if ($user->isActive()) {
            // メインの処理
        } else {
            throw new InvalidArgumentException('User is not active');
        }
    } else {
        throw new InvalidArgumentException('User is required');
    }
}
```

### 例外処理

空の catch ブロックは禁止する。

```php
// ✅ Good: ログ出力またはre-throw
try {
    $this->repository->save($report);
} catch (\Exception $e) {
    Log::error('Failed to save report', ['exception' => $e->getMessage()]);
    throw $e;
}

// ❌ Bad: 空のcatch
try {
    $this->repository->save($report);
} catch (\Exception $e) {
    // 何もしない
}
```

---

## コメント規約

### PHPDoc

すべての public メソッドに PHPDoc を記述する（型宣言で自明な場合は省略可）。

```php
/**
 * 週報を作成する
 *
 * @param CreateWeeklyReportData $data 作成データ
 * @return WeeklyReport 作成された週報
 * @throws ValidationException バリデーションエラー時
 */
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    // ...
}
```

### インラインコメント

複雑なロジックには日本語でコメントを記述する。

```php
public function execute(CreateWeeklyReportData $data): WeeklyReport
{
    // 1. 重複チェック
    $existingReport = $this->repository->findByUserAndWeek(
        $data->userId,
        $data->weekStartDate
    );

    if ($existingReport !== null) {
        throw ValidationException::withMessages([
            'week_start_date' => ['A report for this week already exists.'],
        ]);
    }

    // 2. ビジネスルールのバリデーション
    if ($data->status === ReportStatus::Submitted) {
        $this->validateSubmission($data);
    }

    // 3. データ作成
    return $this->repository->create(...);
}
```

---

## Laravel Pint 設定

### 設定ファイル（pint.json）

```json
{
    "preset": "laravel",
    "rules": {
        "blank_line_before_statement": {
            "statements": ["return"]
        },
        "method_argument_space": {
            "on_multiline": "ensure_fully_multiline"
        },
        "no_unused_imports": true,
        "ordered_imports": {
            "sort_algorithm": "alpha"
        }
    }
}
```

### 実行コマンド

```bash
# 整形実行
./vendor/bin/pint

# 変更されたファイルのみ
./vendor/bin/pint --dirty

# テストのみ（整形しない）
./vendor/bin/pint --test

# 特定のディレクトリのみ
./vendor/bin/pint app/UseCases
```

---

## コーディング規約チェックリスト

### クラス定義

- [ ] `declare(strict_types=1)` を宣言している
- [ ] 適切な命名規則を使用している
- [ ] `final` を適切に使用している
- [ ] DTO に `readonly` を使用している

### メソッド定義

- [ ] すべての public メソッドに型宣言がある
- [ ] Nullable 型は `?` を使用している
- [ ] 配列型は PHPDoc で明示している
- [ ] 適切なメソッド命名規則を使用している

### コード品質

- [ ] マジックナンバーを使用していない
- [ ] Early Return を使用している
- [ ] 空の catch ブロックがない
- [ ] 複雑なロジックにコメントがある

### 依存関係

- [ ] レイヤー間の依存ルールを守っている
- [ ] deptrac でチェックしている
- [ ] 循環参照がない
