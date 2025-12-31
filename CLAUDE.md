# Development Guide

あなたはプロジェクトのプロフェッショナルなフルスタックエンジニアです。

## プロジェクト概要

| 領域 | 技術 |
|------|------|
| バックエンド | Laravel 12.x (PHP 8.2+), Inertia.js |
| フロントエンド | React/TypeScript, Tailwind CSS, shadcn/ui |
| フォーム | Laravel Precognition（リアルタイムバリデーション） |
| テスト | PHPUnit (Backend), Vitest + RTL (Frontend), Storybook |
| ビルド | Composer (Backend), Bun (Frontend) |
| Lint/Format | Laravel Pint (Backend), Biome (Frontend) |
| 静的解析 | PHPStan, deptrac（依存関係） |

## アーキテクチャ

### バックエンド: 7層レイヤードアーキテクチャ
```
Presentation (Controllers) → Request (FormRequest) → UseCase → Service/Repository → Model → Resource
```
詳細: `.claude/rules/backend/` または `.claude/docs/architecture.md`

### フロントエンド: ハイブリッドアーキテクチャ
- **静的データ**: Inertia Props（認証情報、メニュー、権限、SEO コンテンツ）
- **動的データ**: API + カスタムフック（通知、統計、検索結果）
- **フォーム**: Laravel Precognition（`@inertiajs/react` の `useForm` は**使用禁止**）

詳細: `Skill('coding-guidelines')`

## 開発ワークフロー

すべてのタスクは以下の 6 フェーズに従う。**フェーズのスキップは禁止**。

| Phase | 内容 | Agent |
|-------|------|-------|
| 1. Planning & Review | 調査、計画作成、レビュー | `plan-reviewer` / `backend-plan-reviewer` |
| 2. Implementation & Review | 実装、コードレビュー | `implement-review` / `backend-implement-review` |
| 3. Quality Checks | 型チェック、lint、テスト、ビルド | - |
| 4. Browser Verification | UI/パフォーマンス確認（任意） | Chrome DevTools MCP |
| 5. Git Commit | `<type>: <description>` 形式 | - |
| 6. Push | `git push`, 必要に応じて PR 作成 | - |

### Quality Checks コマンド

**フロントエンド**:
```bash
bun run typecheck && bun run check && bun run test && bun run build
```

**バックエンド**:
```bash
./vendor/bin/phpstan analyse && ./vendor/bin/pint --test && ./vendor/bin/phpunit && ./vendor/bin/deptrac
```

### テストカバレッジ基準

コードカバレッジの最低基準を設定し、品質を担保する。

**バックエンド**:
- **UseCase 層**: 80%以上（ビジネスロジックの核心）
- **Repository 層**: 70%以上（データアクセス）
- **Controller 層**: 70%以上（API/Web）
- **Service 層**: 70%以上（共通ロジック）

```bash
./vendor/bin/phpunit --coverage-text
```

**フロントエンド**:
- **UI コンポーネント**: 70%以上
- **カスタムフック**: 80%以上
- **ユーティリティ関数**: 80%以上

```bash
bun run test --coverage
```

**重要**: カバレッジ基準を満たさない場合は、追加テストを作成してから次のフェーズに進む。

## ディレクトリ構成

```
project/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/              # API Controllers（REST API）
│   │   │   └── Web/              # Web Controllers（Inertia.js用）
│   │   ├── Requests/             # FormRequests（バリデーション）
│   │   └── Resources/            # API Resources（JSONレスポンス）
│   ├── UseCases/                 # UseCases（ビジネスロジック）
│   ├── Services/                 # Services（共通ロジック）
│   ├── Repositories/             # Repositories（データアクセス）
│   ├── Data/                     # DTOs（Laravel Data）
│   ├── Models/                   # Eloquent Models
│   ├── Policies/                 # Policies（認可）
│   └── Enums/                    # Enums（列挙型）
├── resources/js/
│   ├── pages/                    # Inertia Pages（Reactコンポーネント）
│   ├── components/               # 共通コンポーネント
│   ├── layouts/                  # レイアウト
│   ├── hooks/                    # カスタムフック（API データ取得）
│   ├── types/                    # TypeScript型定義
│   │   ├── generated.d.ts        # 自動生成（Laravel Data）
│   │   └── model.d.ts            # 自動生成（modeltyper）
│   ├── actions/                  # Wayfinder Actions（自動生成）
│   └── routes/                   # Wayfinder Routes（自動生成）
├── routes/
│   ├── web.php                   # Inertia routes
│   └── api.php                   # API routes
└── tests/
    ├── Unit/                     # ユニットテスト
    └── Feature/                  # フィーチャーテスト
```

## 利用可能なツール

### Agents（タスク実行）

| Agent | 用途 |
|-------|------|
| `plan-reviewer` | Frontend Phase 1: 調査、UI/UX レビュー、計画作成 |
| `implement-review` | Frontend Phase 2: 実装、コードレビュー |
| `test-review` | Frontend テスト・Storybook 作成（任意） |
| `backend-plan-reviewer` | Backend Phase 1: 調査、アーキテクチャレビュー、計画作成 |
| `backend-implement-review` | Backend Phase 2: UseCase/Repository 実装、レビュー |
| `backend-test-review` | Backend PHPUnit テスト作成（任意） |

### Skills（知識参照）

| Skill | 内容 |
|-------|------|
| `coding-guidelines` | React/TS 規約、Precognition パターン、ハイブリッドアーキテクチャ |
| `test-guidelines` | Vitest/RTL テスト規約、AAA パターン |
| `storybook-guidelines` | Storybook ストーリー作成規約 |
| `ui-design-guidelines` | UI/UX 原則、アクセシビリティ |
| `backend-coding-guidelines` | UseCase、Repository、DTO パターン |
| `backend-test-guidelines` | PHPUnit テスト規約 |
| `backend-architecture-guidelines` | 7層設計、レイヤー分離、TypeScript型生成 |

### MCPs

| MCP | 用途 |
|-----|------|
| Kiri | セマンティックコード検索、依存関係分析 |
| Context7 | ライブラリドキュメント取得 |
| Serena | シンボルベースコード編集 |
| Codex | AI コードレビュー |
| Chrome DevTools | ブラウザ自動化 |

## コーディング原則（クイックリファレンス）

### 共通
- TypeScript/PHP の型定義は厳格に（`any` 禁止）
- コード内コメントは日本語

### フロントエンド
- バレルインポート禁止（直接パス指定）
- データ取得はカスタムフックに分離
- コンポーネントはプレゼンテーショナルに保つ
- Page コンポーネントのみ `export default` 許可、その他は名前付きエクスポート

### バックエンド
- UseCase は Laravel Data の DTO を使用
- Repository は Interface 経由でアクセス
- Controller は UseCase のみを呼び出し、ビジネスロジックを含まない
- TypeScript型は自動生成（`php artisan typescript:transform`）

## 重要な原則

1. **フェーズをスキップしない** - 「簡単なタスク」という判断は禁物
2. **Quality Checks は必須** - すべてのチェックをパスするまで次に進まない
3. **エラーは完全修正** - 放置して次に進まない
4. **Agent を活用** - 計画と実装は Agent に任せる
5. **フォームは Precognition** - `@inertiajs/react` の `useForm` 使用禁止
6. **ハイブリッドアーキテクチャ遵守** - 静的は Inertia、動的は API
