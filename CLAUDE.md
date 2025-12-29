# Development Guide

あなたはプロジェクトのプロフェッショナルなフルスタックエンジニアです。

## プロジェクト概要

**技術スタック**

バックエンドは Laravel 12.x（PHP 8.4+）を使用し、Inertia.js でフロントエンドと連携する。フォームバリデーションには Laravel Precognition を採用し、リアルタイムバリデーションを実現する。

フロントエンドは React/TypeScript を使用し、スタイリングには Tailwind CSS と shadcn/ui を採用する。テストは Vitest と React Testing Library、UI ドキュメントは Storybook を使用する。

ビルドツールはフロントエンドに Bun、バックエンドに Composer を使用する。Lint/Format はフロントエンドに Biome、バックエンドに Laravel Pint を使用する。依存関係の静的解析には deptrac を使用する。

**アーキテクチャの特徴**

本プロジェクトはハイブリッドアーキテクチャを採用している。静的コンテンツは Inertia.js によるサーバーレンダリングで配信し、動的データは API エンドポイント経由でリアルタイムに取得する。フォームバリデーションには Laravel Precognition を使用し、送信前のリアルタイムバリデーションを実現する。

バックエンドは4層アーキテクチャ（Presentation → Application → Domain ← Infrastructure）を採用し、関心の分離を徹底する。フロントエンドは Presenter Pattern を採用し、UI ロジックをコンポーネントから分離する。データ取得ロジックはカスタムフックに分離し、プレゼンテーショナルコンポーネントのテスタビリティを確保する。

## ハイブリッドアーキテクチャ

### データソースの使い分け

**Inertia Props（静的データ）** は以下の用途に使用する。ユーザー認証情報、ナビゲーションメニュー、権限情報、ページ固有の設定、SEO に重要なコンテンツなど、更新頻度が低いデータが該当する。

**API（動的データ）** は以下の用途に使用する。リアルタイム通知、ライブ統計情報、検索結果、フィルタリング・ソート・ページネーション、頻繁に更新されるデータが該当する。

### フォームバリデーション

フォームには Laravel Precognition を使用し、`@inertiajs/react` の `useForm` は使用しない。Precognition により、フォーム送信前にサーバーサイドのバリデーションルールを使用したリアルタイムバリデーションが可能になる。

## コーディング原則

### 共通原則

TypeScript と PHP の型定義は厳格に行い、`any` 型の使用は禁止する。コード内コメントは日本語で記述する。

### フロントエンド原則

バレルインポートは禁止し、`import { X } from './index'` ではなく直接パス指定を使用する。Presenter Pattern を採用し、UI ロジックをコンポーネントから分離する。データ取得ロジックはカスタムフックに分離し、コンポーネントはプレゼンテーショナルに保つ。フォームには必ず `laravel-precognition-react` の `useForm` を使用し、`@inertiajs/react` の `useForm` は使用しない。

### バックエンド原則

4層アーキテクチャの依存方向を守る。Entity と ValueObject はファクトリメソッドで生成し、immutable 設計とする。モジュール間通信は Contract 経由のみとする。

## 開発ワークフロー

すべての開発タスクは以下の6フェーズに従う。フェーズのスキップは禁止である。

### Phase 1: Planning & Review（必須）

Agent `plan-reviewer` を使用する。Agent は以下を実行する。既存コード調査（Kiri MCP）とライブラリドキュメント確認（Context7 MCP）を行う Investigation、UI 変更時の ui-design-guidelines を使用した UI Design Review、実装計画作成（TodoWrite）を行う Plan Creation、Codex MCP で統合レビューを行う Plan Review、そして Plan Revision を実施する。成果物は承認された実装計画である。

Cursor Agent Mode で Codex モデルを選択している場合、Codex MCP を経由せず直接 Codex モデルにレビューを依頼する。これにより二重ラッピングの回避、レイテンシーの改善、コンテキストの一貫性保持が実現される。

### Phase 2: Implementation & Review（必須）

Agent `implement-review` を使用する。Serena MCP で実装を行い、Codex でレビューを実施する。テストは一旦スキップし、必要に応じて `test-review` エージェントを使用する。

### Phase 3: Quality Checks（必須）

フロントエンドでは `bun run typecheck` で型チェック、`bun run check` で Biome lint/format、`bun run test` で Vitest テスト実行、`bun run build` でビルド確認を行う。

バックエンドでは `./vendor/bin/phpstan analyse` で静的解析、`./vendor/bin/pint --test` でコードスタイル確認、`./vendor/bin/phpunit` でテスト実行、`./vendor/bin/deptrac` で依存関係チェックを行う。

### Phase 4: Browser Verification（任意：詳細確認時）

Chrome DevTools で複雑な UI、パフォーマンス、ネットワークを確認する。

### Phase 5: Git Commit（必須）

コミットメッセージ形式は `<type>: <description>` とする。type には feat、fix、refactor、docs、test、style、chore を使用する。

### Phase 6: Push（必須）

`git push origin <branch>` を実行し、必要に応じて `gh pr create` で PR を作成する。

## 利用可能なツール

### Agents（タスク実行）

`plan-reviewer` は Phase 1 を実行し、調査、UI/UX デザインレビュー、実装計画作成、Codex MCP でのレビューを統合実行する。`implement-review` は Phase 2 を実行し、Serena MCP で実装、Codex でレビューを行う。`test-review` はテスト・ストーリー作成、Codex でテストレビューを行う（任意）。

### Skills（知識参照）

`coding-guidelines` は React/TypeScript コーディング規約、Laravel Precognition パターン、ハイブリッドアーキテクチャパターンを提供する。`test-guidelines` は Vitest/RTL テスト規約、AAA パターン、カバレッジ基準を提供する。`storybook-guidelines` は Storybook ストーリー作成規約を提供する。`ui-design-guidelines` は UI/UX 原則、アクセシビリティ、レスポンシブデザインを提供する。

### MCPs

Kiri はセマンティックコード検索と依存関係分析を行う。Context7 はライブラリドキュメント取得を行う。Serena はシンボルベースコード編集を行う。Codex は AI コードレビューを行う。Chrome DevTools はブラウザ自動化を行う。

## Laravel Precognition パターン早見表

### フォームコンポーネント

```tsx
import { useForm } from 'laravel-precognition-react'
import { router } from '@inertiajs/react'

interface FormData {
  name: string
  email: string
}

export default function Create() {
  const form = useForm<FormData>('post', route('members.store'), {
    name: '',
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.submit({
      onSuccess: () => router.visit(route('members.index')),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={form.data.name}
        onChange={(e) => form.setData('name', e.target.value)}
        onBlur={() => form.validate('name')}
        error={form.errors.name}
      />
      <Button type="submit" disabled={form.processing}>
        {form.processing ? '処理中...' : '作成'}
      </Button>
    </form>
  )
}
```

### Laravel FormRequest

```php
final class CreateMemberRequest extends FormRequest
{
    protected $precognitiveRules = ['name', 'email', 'role'];

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:members'],
            'role' => ['required', 'in:admin,member,guest'],
        ];
    }
}
```

## ハイブリッドデータ取得パターン

### ページコンポーネント

```tsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'

interface Props {
  user: User           // 静的データ（Inertia）
  permissions: string[] // 静的データ（Inertia）
}

export default function Dashboard({ user, permissions }: Props) {
  // 動的データ（API）
  const { stats, isLoading } = useStats()
  const { notifications } = useNotifications()

  return (
    <AuthenticatedLayout user={user}>
      <Head title="ダッシュボード" />
      <StatsCard stats={stats} isLoading={isLoading} />
      <NotificationList notifications={notifications} />
    </AuthenticatedLayout>
  )
}
```

### カスタムフック（動的データ取得）

```tsx
function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading, error }
}
```

### プレゼンテーショナルコンポーネント（テスタブル）

```tsx
interface StatsCardProps {
  stats: Stats | null
  isLoading?: boolean
  error?: Error | null
}

function StatsCard({ stats, isLoading, error }: StatsCardProps) {
  if (isLoading) return <StatsSkeleton />
  if (error) return <StatsError error={error} />
  if (!stats) return <NoData />

  return <Card>{/* stats display */}</Card>
}
```

## ナビゲーション

```tsx
import { Link, router } from '@inertiajs/react'

// 宣言的ナビゲーション
<Link href={route('members.show', { id })}>詳細</Link>

// プログラム的ナビゲーション
router.visit(route('members.index'))
```

## ディレクトリ構成

```
project/
├── app/
│   └── Http/
│       ├── Controllers/          # Inertia Controllers
│       └── Controllers/Api/      # API Controllers
├── modules/                      # ビジネスロジック (4層アーキテクチャ)
│   ├── Contract/                 # モジュール間公開API
│   └── {Module}/
│       ├── Presentation/
│       ├── Application/
│       ├── Domain/
│       └── Infrastructure/
├── resources/js/
│   ├── Pages/                    # ページコンポーネント
│   ├── Components/
│   │   ├── ui/                   # 汎用UIコンポーネント
│   │   └── features/             # 機能固有コンポーネント
│   ├── Layouts/                  # レイアウト
│   ├── hooks/                    # カスタムフック（API データ取得）
│   ├── types/                    # 型定義
│   └── lib/                      # ユーティリティ
├── routes/
│   ├── web.php                   # Inertia routes
│   └── api.php                   # API routes
└── tests/
    ├── Unit/                     # PHPUnit Unit
    └── Feature/                  # PHPUnit Feature
```

## 重要な原則

フェーズをスキップしないこと。「簡単なタスク」という判断は禁物であり、すべてのフェーズを実行する。

品質チェックは必須である。Phase 3 のすべてのチェックをパスするまで次に進まない。

エラーは完全修正する。エラーが出たら完全に修正してから次のフェーズへ進む。

Agent を活用する。plan-reviewer と implement-review を積極的に使用する。

ワークフロー遵守は効率化である。手順を守ることが最も確実な効率化となる。

フォームは Laravel Precognition を使用する。`@inertiajs/react` の `useForm` は使用禁止である。

ハイブリッドアーキテクチャを遵守する。静的データは Inertia、動的データは API を使用する。
