# バックエンド テスト戦略

## テスト構造

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

---

## テスト種類の使い分け

### Unit テスト

**対象**: 独立した小さなロジック

- Model のスコープ、アクセサ、ミューテータ
- Service の単一メソッド
- UseCase（Repository をモック）
- ValueObject、DTO

**特徴**:
- DB は不要（モックを使用）
- 高速実行
- 単一の振る舞いを検証

### Feature テスト

**対象**: 統合テスト、エンドツーエンドテスト

- API Controller（HTTPリクエスト→レスポンス）
- Web Controller（Inertia レスポンス）
- Repository 実装
- Policy（認可ロジック）
- 認証フロー

**特徴**:
- DB を使用（RefreshDatabase）
- 実際のHTTPリクエストをシミュレート
- 複数のレイヤーを統合して検証

---

## Unit テスト実装例

### Model テスト

```php
namespace Tests\Unit\Models;

use App\Models\WeeklyReport;
use App\Enums\ReportStatus;
use PHPUnit\Framework\TestCase;

class WeeklyReportTest extends TestCase
{
    public function test_scopeByStatus_filters_reports_by_status(): void
    {
        // このテストは実際にはFeatureテストとして実装すべき（DB必要）
        // ここでは概念的な例として記載
        $this->assertTrue(true);
    }

    public function test_status_enum_is_correctly_cast(): void
    {
        $report = new WeeklyReport([
            'status' => 'draft',
        ]);

        $this->assertInstanceOf(ReportStatus::class, $report->status);
        $this->assertEquals(ReportStatus::Draft, $report->status);
    }
}
```

### UseCase テスト（Repository モック）

```php
namespace Tests\Unit\UseCases\WeeklyReport;

use App\UseCases\WeeklyReport\CreateWeeklyReportUseCase;
use App\Repositories\WeeklyReport\WeeklyReportRepositoryInterface;
use App\Data\WeeklyReport\CreateWeeklyReportData;
use App\Enums\ReportStatus;
use PHPUnit\Framework\TestCase;

class CreateWeeklyReportUseCaseTest extends TestCase
{
    public function test_can_create_weekly_report(): void
    {
        // Repository のモック作成
        $repository = $this->createMock(WeeklyReportRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('create')
            ->willReturn(new \App\Models\WeeklyReport());

        // UseCase インスタンス化
        $useCase = new CreateWeeklyReportUseCase($repository);

        // DTO作成
        $data = new CreateWeeklyReportData(
            userId: 1,
            weekStartDate: '2025-10-13',
            title: 'Test Report',
            memo: null,
            status: ReportStatus::Draft,
            kpiValues: []
        );

        // 実行
        $result = $useCase->execute($data);

        // 検証
        $this->assertInstanceOf(\App\Models\WeeklyReport::class, $result);
    }
}
```

---

## Feature テスト実装例

### API Controller テスト

```php
namespace Tests\Feature\Http\Controllers\Api;

use App\Models\User;
use App\Models\WeeklyReport;
use App\Models\KpiItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeeklyReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_weekly_reports(): void
    {
        $user = User::factory()->create();
        WeeklyReport::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/weekly-reports');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'week_start_date',
                        'title',
                        'status',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
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
            ->assertJsonPath('data.title', 'Week 42 Report')
            ->assertJsonPath('data.status', 'submitted');

        $this->assertDatabaseHas('weekly_reports', [
            'title' => 'Week 42 Report',
            'user_id' => $user->id,
        ]);
    }

    public function test_cannot_create_duplicate_weekly_report(): void
    {
        $user = User::factory()->create();
        $weekStartDate = '2025-10-13';

        // 既存のレポート作成
        WeeklyReport::factory()->create([
            'user_id' => $user->id,
            'week_start_date' => $weekStartDate,
        ]);

        // 重複作成を試みる
        $response = $this->actingAs($user)->postJson('/api/weekly-reports', [
            'week_start_date' => $weekStartDate,
            'title' => 'Duplicate Report',
            'status' => 'draft',
            'kpi_values' => [],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['week_start_date']);
    }

    public function test_can_update_weekly_report(): void
    {
        $user = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->putJson("/api/weekly-reports/{$report->id}", [
            'week_start_date' => $report->week_start_date->format('Y-m-d'),
            'title' => 'Updated Title',
            'status' => 'submitted',
            'kpi_values' => [],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('weekly_reports', [
            'id' => $report->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_can_delete_weekly_report(): void
    {
        $user = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/weekly-reports/{$report->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('weekly_reports', [
            'id' => $report->id,
        ]);
    }

    public function test_cannot_update_other_users_report(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser)->putJson("/api/weekly-reports/{$report->id}", [
            'title' => 'Unauthorized Update',
        ]);

        $response->assertForbidden();
    }
}
```

### Web Controller（Inertia）テスト

```php
namespace Tests\Feature\Http\Controllers\Web;

use App\Models\User;
use App\Enums\ReportStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class WeeklyReportPageControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_page_returns_status_options(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/weekly-reports');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('WeeklyReport/Index')
            ->has('statusOptions')
            ->has('filters')
        );
    }

    public function test_create_page_returns_necessary_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/weekly-reports/create');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('WeeklyReport/Create')
            ->has('reportStatuses')
        );
    }

    public function test_edit_page_returns_report_id(): void
    {
        $user = User::factory()->create();
        $report = \App\Models\WeeklyReport::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/weekly-reports/{$report->id}/edit");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('WeeklyReport/Edit')
            ->where('weeklyReportId', $report->id)
            ->has('reportStatuses')
        );
    }
}
```

### Policy テスト

```php
namespace Tests\Feature\Policies;

use App\Models\User;
use App\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

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

    public function test_owner_can_update_own_report(): void
    {
        $user = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->can('update', $report));
    }

    public function test_shared_user_cannot_update_report(): void
    {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $owner->id]);
        $report->sharedUsers()->attach($sharedUser->id);

        $this->assertFalse($sharedUser->can('update', $report));
    }

    public function test_owner_can_delete_own_report(): void
    {
        $user = User::factory()->create();
        $report = WeeklyReport::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->can('delete', $report));
    }
}
```

---

## テストベストプラクティス

### 1. Factory を活用

テストデータは Factory 経由で作成する。

```php
// ✅ Good: Factory使用
$user = User::factory()->create();
$report = WeeklyReport::factory()->create(['user_id' => $user->id]);

// ❌ Bad: 手動作成
$user = new User();
$user->name = 'Test User';
$user->email = 'test@example.com';
$user->save();
```

### 2. RefreshDatabase Trait

各テストでDBをリセットする。

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class WeeklyReportControllerTest extends TestCase
{
    use RefreshDatabase;  // 必須

    // ...
}
```

### 3. テスト命名規則

`test_<動作>_<条件>` 形式を使用する。

```php
// ✅ Good
public function test_can_create_weekly_report(): void
public function test_cannot_update_other_users_report(): void

// ❌ Bad
public function testCreate(): void
public function test1(): void
```

### 4. Given-When-Then パターン

テストコードを3段階で構造化する。

```php
public function test_can_create_weekly_report(): void
{
    // Given（前提条件）
    $user = User::factory()->create();
    $kpiItem = KpiItem::factory()->create(['user_id' => $user->id]);

    // When（実行）
    $response = $this->actingAs($user)->postJson('/api/weekly-reports', [
        'title' => 'Test Report',
        // ...
    ]);

    // Then（検証）
    $response->assertCreated();
    $this->assertDatabaseHas('weekly_reports', ['title' => 'Test Report']);
}
```

### 5. 最小限のテスト実行

`--filter` オプションで効率化する。

```bash
# 特定のテストメソッドのみ実行
php artisan test --filter=test_can_create_weekly_report

# 特定のファイルのみ実行
php artisan test tests/Feature/Http/Controllers/Api/WeeklyReportControllerTest.php

# 特定のグループのみ実行
php artisan test --group=api
```

---

## テストカバレッジ目標

### カバレッジ基準

- **Domain / UseCase**: 80%以上（ビジネスロジックの核心）
- **Repository**: 70%以上（データアクセス）
- **Controller**: 70%以上（API/Web）
- **Service**: 70%以上（共通ロジック）

### カバレッジ確認

```bash
# HTMLレポート生成
./vendor/bin/phpunit --coverage-html coverage

# テキスト形式
./vendor/bin/phpunit --coverage-text
```

---

## テストコマンド

### 全テスト実行

```bash
php artisan test
```

### 並列実行（高速化）

```bash
php artisan test --parallel
```

### カバレッジ付き実行

```bash
php artisan test --coverage
```

### 特定のテストスイート実行

```bash
# Unit テストのみ
php artisan test --testsuite=Unit

# Feature テストのみ
php artisan test --testsuite=Feature
```

---

## 禁止事項

### 1. テストなしのコミット禁止

新機能、バグ修正には必ずテストを追加する。

### 2. テストのスキップ禁止

`$this->markTestSkipped()` の使用は原則禁止。

### 3. sleep() の使用禁止

テスト内で `sleep()` を使用しない。非同期処理はモックする。

```php
// ❌ Bad
sleep(5);

// ✅ Good
Queue::fake();
```

### 4. 実際の外部APIへのアクセス禁止

外部APIはモックする。

```php
// ❌ Bad
Http::get('https://api.example.com/data');

// ✅ Good
Http::fake([
    'api.example.com/*' => Http::response(['data' => 'mocked'], 200),
]);
```
