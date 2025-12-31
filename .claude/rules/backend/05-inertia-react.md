# Inertia.js + React 統合

## 概要

Inertia.jsは、SPAのようなユーザー体験を提供しながら、サーバーサイドルーティングとコントローラーを維持できるモダンなアプローチである。APIを別途構築する必要がなく、Laravel側のコントローラーから直接Reactコンポーネントにデータを渡すことができる。

---

## 基本概念

### データの受け渡しパターン

#### パターン1: Web Controllers（Inertia.js）

**目的**: 初期ページ描画のみを担当。静的なマスターデータのみを提供。

```
Web Request → Web Controller → Inertia::render() → React Component
                                                         ↓
                                             （動的データが必要な場合）
                                                         ↓
                                                  API Request
```

#### パターン2: API Controllers（REST API）

**目的**: CRUD操作、動的データの取得・更新を担当。

```
API Request → API Controller → Form Request → Use Case → Repository
                                                                ↓
                                                          JSON Response
```

---

## Web Controllers（ページ描画用）

### 基本実装

**Controller側**

```php
// app/Http/Controllers/Web/WeeklyReportPageController.php
namespace App\Http\Controllers\Web;

use App\Enums\ReportStatus;
use Inertia\Inertia;
use Inertia\Response;

class WeeklyReportPageController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('WeeklyReport/Index', [
            'statusOptions' => ReportStatus::toSelectArray(), // 静的マスターデータ
            'filters' => $request->only(['q', 'status']),    // クエリパラメータ
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

**React側**

```tsx
// resources/js/pages/WeeklyReport/Index.tsx
import { FC } from 'react';

interface Props {
  statusOptions: Array<{ value: string; label: string }>;
  filters: { q?: string; status?: string };
}

const WeeklyReportIndex: FC<Props> = ({ statusOptions, filters }) => {
  // API経由で動的データを取得
  const { data: reports } = useFetchWeeklyReports(filters);

  return (
    <div>
      <h1>Weekly Reports</h1>
      <select defaultValue={filters.status}>
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* ... */}
    </div>
  );
};

export default WeeklyReportIndex;
```

---

## 遅延取得（Lazy Loading）

コントローラー側で `fn ()` でくるむと、必要な時にのみ関数が実行される。

```php
return Inertia::render('WeeklyReport/Index', [
    'posts' => fn () => Post::with('tags')->get(),  // 遅延実行
    'users' => fn () => User::all(),                // 遅延実行
]);
```

**React側での取得**

```tsx
import { router } from '@inertiajs/react';

// 特定のpropsのみリロード
router.reload({
  only: ['posts'],  // posts のみ再取得
});
```

---

## 共有データ（HandleInertiaRequests）

全てのページで共有するデータは、HandleInertiaRequestsミドルウェアで定義する。

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

---

## レイアウトの使用

### レイアウトコンポーネント

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

### ページでのレイアウト指定

```tsx
// resources/js/pages/WeeklyReport/Index.tsx
import BaseLayout from '@/layouts/BaseLayout';

const WeeklyReportIndex = ({ statusOptions }: Props) => {
  // ...
};

WeeklyReportIndex.layout = (page: ReactNode) => <BaseLayout>{page}</BaseLayout>;

export default WeeklyReportIndex;
```

---

## Wayfinder（型安全なルーティング）

Wayfinderは、LaravelのルートをTypeScriptの関数として生成し、型安全なページ遷移を実現する。

### インストールと生成

```bash
# ルートの生成
php artisan wayfinder:generate
```

生成されるファイル：
- `resources/js/actions/` - コントローラーベースのルート関数
- `resources/js/routes/` - 名前付きルートベースのルート関数

### 使用例

```tsx
// resources/js/pages/WeeklyReport/Index.tsx
import { Link } from '@inertiajs/react';
import { show, store } from '@/routes/weekly-reports';

const WeeklyReportIndex = () => {
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

### QueryParameter の使い方

```tsx
import { index } from '@/routes/weekly-reports';

// 基本的なクエリパラメータ
console.log(index({ query: { foo: 1, bar: 'test' } }));
// => { url: '/weekly-reports?foo=1&bar=test', method: 'get' }

// 現在のURLのパラメータとマージ
console.log(index({ mergeQuery: { foo: 1 } }));
// 現在のURL: /weekly-reports?baz=add の場合
// => { url: '/weekly-reports?baz=add&foo=1', method: 'get' }

// 配列形式
console.log(index({ query: { baz: ['aaa', 'bbb', 'ccc'] } }));
// => { url: '/weekly-reports?baz[]=aaa&baz[]=bbb&baz[]=ccc', method: 'get' }
```

---

## フォーム送信（POST/PUT/DELETE）

### Laravel Precognition の使用（推奨）

**重要**: `@inertiajs/react` の `useForm` は**使用禁止**。Laravel Precognition を使用する。

```tsx
// resources/js/pages/WeeklyReport/Create.tsx
import { FC } from 'react';
import { useForm } from 'laravel-precognition-react';
import { store } from '@/routes/weekly-reports';

interface Props {
  reportStatuses: Array<{ value: string; label: string }>;
}

const WeeklyReportCreate: FC<Props> = ({ reportStatuses }) => {
  const form = useForm<App.Data.CreateWeeklyReportData>(
    'post',
    store().url,
    {
      userId: 0,
      weekStartDate: '',
      title: '',
      memo: undefined,
      status: 'draft',
      kpiValues: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.submit({
      onSuccess: () => {
        // 成功時の処理
        router.visit(index().url);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title</label>
        <input
          type="text"
          value={form.data.title}
          onChange={(e) => form.setData('title', e.target.value)}
          onBlur={() => form.validate('title')}  // リアルタイムバリデーション
        />
        {form.errors.title && <p className="text-red-500">{form.errors.title}</p>}
      </div>

      <div>
        <label>Status</label>
        <select
          value={form.data.status}
          onChange={(e) => form.setData('status', e.target.value as App.Enums.ReportStatus)}
        >
          {reportStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? '処理中...' : '作成'}
      </button>
    </form>
  );
};

export default WeeklyReportCreate;
```

---

## 部分リロード（only オプション）

`only` オプションを使用すると、特定のpropsのみを再取得できる。

```tsx
import { router } from '@inertiajs/react';

const handleSubmit = () => {
  form.submit('post', store().url, {
    only: ['posts', 'toast'],  // posts と toast のみ再取得
    onSuccess: () => reset(),
  });
};
```

---

## トースト通知

### Controller側

```php
return redirect()->back()
    ->with('toast', '保存しました。');
```

### React側（レイアウトでの実装）

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

## ページ遷移

### Link コンポーネント

```tsx
import { Link } from '@inertiajs/react';
import { index, show } from '@/routes/weekly-reports';

<Link href={index().url}>Back to List</Link>
<Link href={show(report.id).url}>View Detail</Link>
```

### router.visit()

```tsx
import { router } from '@inertiajs/react';

// 通常の遷移
router.visit(index().url);

// クエリパラメータ付き
router.visit(index({ query: { status: 'submitted' } }).url);

// 部分リロード付き
router.visit(index().url, {
  only: ['reports'],
});
```

---

## ベストプラクティス

### 1. Web Controllers は静的データのみ

動的データは API 経由で取得する。

```php
// ✅ Good: 静的データのみ
public function index(): Response
{
    return Inertia::render('WeeklyReport/Index', [
        'statusOptions' => ReportStatus::toSelectArray(),
    ]);
}

// ❌ Bad: 動的データを含む
public function index(): Response
{
    return Inertia::render('WeeklyReport/Index', [
        'reports' => WeeklyReport::paginate(20),  // API経由で取得すべき
    ]);
}
```

### 2. Precognition でリアルタイムバリデーション

`@inertiajs/react` の `useForm` は使用禁止。

```tsx
// ✅ Good: Laravel Precognition
import { useForm } from 'laravel-precognition-react';

const form = useForm<App.Data.CreateWeeklyReportData>('post', store().url, { ... });

// ❌ Bad: @inertiajs/react の useForm
import { useForm } from '@inertiajs/react';  // 使用禁止
```

### 3. 型安全なルーティング

Wayfinder を使用して型安全なルーティングを実現する。

```tsx
// ✅ Good: Wayfinder
import { show } from '@/routes/weekly-reports';
<Link href={show(1).url}>View</Link>

// ❌ Bad: ハードコードされたURL
<Link href="/weekly-reports/1">View</Link>
```

### 4. 部分リロードの活用

不要なデータの再取得を避ける。

```tsx
// ✅ Good: 必要なpropsのみリロード
router.visit(index().url, {
  only: ['reports', 'toast'],
});

// ❌ Bad: 全propsをリロード
router.visit(index().url);
```

### 5. レイアウトの共通化

ページごとにレイアウトを設定する。

```tsx
// ✅ Good: レイアウト指定
WeeklyReportIndex.layout = (page) => <BaseLayout>{page}</BaseLayout>;

// ❌ Bad: ページ内でレイアウト実装
const WeeklyReportIndex = () => {
  return (
    <BaseLayout>
      {/* ... */}
    </BaseLayout>
  );
};
```

---

## 禁止事項

### 1. @inertiajs/react の useForm 使用禁止

Laravel Precognition を使用する。

```tsx
// ❌ 禁止
import { useForm } from '@inertiajs/react';

// ✅ 推奨
import { useForm } from 'laravel-precognition-react';
```

### 2. Web Controllers での動的データ提供禁止

動的データは API 経由で取得する。

```php
// ❌ 禁止
public function index(): Response
{
    return Inertia::render('WeeklyReport/Index', [
        'reports' => WeeklyReport::all(),  // 動的データ
    ]);
}

// ✅ 推奨
public function index(): Response
{
    return Inertia::render('WeeklyReport/Index', [
        'statusOptions' => ReportStatus::toSelectArray(),  // 静的データ
    ]);
}
```

### 3. ハードコードされたURL禁止

Wayfinder を使用する。

```tsx
// ❌ 禁止
<Link href="/weekly-reports/1">View</Link>

// ✅ 推奨
import { show } from '@/routes/weekly-reports';
<Link href={show(1).url}>View</Link>
```
