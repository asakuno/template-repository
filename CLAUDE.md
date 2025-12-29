# Development Guide

あなたはプロジェクトのプロフェッショナルなフルスタックエンジニアです。

## プロジェクト概要

**技術スタック**
- Backend: Laravel 12.x (PHP 8.4+)
- Frontend: React/TypeScript + Inertia.js
- Styling: Tailwind CSS, shadcn/ui
- Testing (Frontend): Vitest, React Testing Library
- Testing (Backend): PHPUnit
- UI Documentation: Storybook
- Build: Bun (frontend), Composer (backend)
- Lint/Format: Biome (frontend), Laravel Pint (backend)
- Static Analysis: deptrac (依存関係分析)

**アーキテクチャの特徴**
- バックエンド: 4層アーキテクチャ (Presentation → Application → Domain ← Infrastructure)
- フロントエンド: Inertia.js による SPA ライクな体験
- データフロー: Laravel Controller → Inertia::render → React Props
- Presenter Pattern採用（UIロジック分離）
- Pure Functions重視（ビジネスロジック分離）

## コーディング原則

### 共通
1. **TypeScript/PHP厳格型定義**: 型は常に明示的、`any`は使用禁止
2. **日本語コメント**: コード内コメントは日本語で記述

### フロントエンド (React/Inertia.js)
1. **バレルインポート禁止**: `import { X } from './index'` ではなく直接パス指定
2. **Presenter Pattern**: UIロジックをコンポーネントから分離
3. **Pure Functions**: 副作用のない純粋関数でビジネスロジックを記述
4. **Inertia Patterns**: useForm, router, Controller props を正しく使用
5. **useEffect禁止 (データ取得)**: データはLaravel Controllerから受け取る

### バックエンド (Laravel)
1. **4層アーキテクチャ遵守**: 依存方向を守る
2. **Entity/ValueObject**: ファクトリメソッドで生成、immutable設計
3. **モジュール間通信**: Contract経由のみ

## 開発ワークフロー

すべての開発タスクは以下の6フェーズに従います。**フェーズのスキップ禁止。**

### Phase 1: Planning & Review 【必須】
- **Agent**: `plan-reviewer`
- **Agent が実行**:
  1. Investigation: 既存コード調査（Kiri MCP）、ライブラリドキュメント確認（Context7 MCP）
  2. UI Design Review: UI変更時はui-design-guidelinesでデザインレビュー
  3. Plan Creation: 実装計画作成（TodoWrite）
  4. Plan Review: Codex MCPで統合レビュー（UI/UX + アーキテクチャ）
  5. Plan Revision: 計画修正
- **成果物**: 承認された実装計画

**Cursor Agent Mode使用時の注意**:
Cursor AgentでCodexモデルを選択している場合、Codex MCPを経由せず直接Codexモデルにレビューを依頼してください。理由：
- 二重ラッピング（Codex→MCP→Codex）の回避
- レイテンシーの改善
- コンテキストの一貫性保持

### Phase 2: Implementation & Review 【必須】
- **Agent**: `implement-review`
- **目的**: Serena MCPで実装 → Codexでレビュー
- **備考**: テストは一旦スキップ（必要に応じて`test-review`エージェントを使用）

**Cursor Agent Mode使用時の注意**:
Cursor AgentでCodexモデルを選択している場合、Codex MCPを経由せず直接Codexモデルにレビューを依頼してください。

### Phase 3: Quality Checks 【必須】

**フロントエンド**
```bash
bun run typecheck  # 型チェック
bun run check      # Biome lint/format
bun run test       # Vitest テスト実行
bun run build      # ビルド確認
```

**バックエンド**
```bash
./vendor/bin/phpstan analyse  # 静的解析
./vendor/bin/pint --test      # コードスタイル確認
./vendor/bin/phpunit          # テスト実行
./vendor/bin/deptrac          # 依存関係チェック
```

### Phase 4: Browser Verification

**4: Browser Verification 【任意：詳細確認時】**
- Chrome DevToolsで複雑なUI、パフォーマンス、ネットワーク確認

### Phase 5: Git Commit 【必須】
- コミットメッセージ形式: `<type>: <description>`
- type: feat, fix, refactor, docs, test, style, chore

### Phase 6: Push 【必須】
- `git push origin <branch>` 実行
- 必要に応じて `gh pr create` でPR作成

## 利用可能なツール

### Agents（タスク実行）
- **`plan-reviewer`**: Phase 1を実行。調査、UI/UXデザインレビュー、実装計画作成、Codex MCPでのレビューを統合実行。
- **`implement-review`**: Phase 2を実行。Serena MCPで実装、Codexでレビュー。
- **`test-review`**: テスト・ストーリー作成、Codexでテストレビュー（任意）。

### Skills（知識参照）
- **`coding-guidelines`**: React/TypeScriptコーディング規約、アーキテクチャパターン
- **`test-guidelines`**: Vitest/RTLテスト規約、AAAパターン、カバレッジ基準
- **`storybook-guidelines`**: Storybookストーリー作成規約
- **`ui-design-guidelines`**: UI/UX原則、アクセシビリティ、レスポンシブデザイン

### MCPs
- **Kiri**: セマンティックコード検索、依存関係分析
- **Context7**: ライブラリドキュメント取得
- **Serena**: シンボルベースコード編集
- **Codex**: AIコードレビュー
- **Chrome DevTools**: ブラウザ自動化

## Inertia.js パターン早見表

### ページコンポーネント
```tsx
// resources/js/Pages/Members/Index.tsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'

interface Props {
  members: Member[]
}

export default function Index({ members }: Props) {
  return (
    <AuthenticatedLayout>
      <Head title="メンバー一覧" />
      {/* content */}
    </AuthenticatedLayout>
  )
}
```

### フォーム (useForm)
```tsx
import { useForm } from '@inertiajs/react'

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('members.store'))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button disabled={processing}>
        {processing ? '処理中...' : '作成'}
      </Button>
    </form>
  )
}
```

### ナビゲーション
```tsx
import { Link, router } from '@inertiajs/react'

// 宣言的
<Link href={route('members.show', { id })}>詳細</Link>

// プログラム的
router.visit(route('members.index'))
```

## ディレクトリ構成

```
project/
├── app/                          # Laravel Application
│   └── Http/
│       └── Controllers/
├── modules/                      # ビジネスロジック (4層アーキテクチャ)
│   ├── Contract/                 # モジュール間公開API
│   └── {Module}/
│       ├── Presentation/
│       ├── Application/
│       ├── Domain/
│       └── Infrastructure/
├── resources/js/                 # React/Inertia フロントエンド
│   ├── Pages/                    # ページコンポーネント
│   ├── Components/
│   │   ├── ui/                   # 汎用UIコンポーネント
│   │   └── features/             # 機能固有コンポーネント
│   ├── Layouts/                  # レイアウト
│   ├── hooks/                    # カスタムフック
│   ├── types/                    # 型定義
│   └── lib/                      # ユーティリティ
└── tests/
    ├── Unit/                     # PHPUnit Unit
    └── Feature/                  # PHPUnit Feature
```

## 重要な原則

1. **フェーズをスキップしない**: 「簡単なタスク」という判断は禁物。すべてのフェーズを実行。
2. **品質チェック必須**: Phase 3のすべてのチェックをパスするまで次に進まない。
3. **エラー完全修正**: エラーが出たら完全に修正してから次のフェーズへ。
4. **Agent活用**: plan-reviewer, implement-reviewを積極的に使用。
5. **ワークフロー遵守 = 効率化**: 手順を守ることが最も確実な効率化。
6. **Inertiaパターン遵守**: データは必ずController経由、useEffectでfetchしない。
