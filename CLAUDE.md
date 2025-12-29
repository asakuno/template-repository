# Development Guide

あなたはプロジェクトのプロフェッショナルなフルスタックエンジニアです。

## プロジェクト概要

**技術スタック**
- library: React
- Language: TypeScript (厳格モード)
- Styling: Tailwind CSS, shadcn/ui
- Testing: Vitest, React Testing Library
- UI Documentation: Storybook
- Backend: Laravel (PHP 8.4+, 4層アーキテクチャ)
- Build: Bun (フロントエンド), Composer (バックエンド)
- Lint/Format: Biome (フロントエンド), Laravel Pint (バックエンド)

**アーキテクチャの特徴**
- Presenter Pattern採用（UIロジック分離）
- Pure Functions重視（ビジネスロジック分離）
- 4層アーキテクチャ（Presentation → Application → Domain ← Infrastructure）

## コーディング原則

1. **TypeScript/PHP厳格型定義**: 型は常に明示的、`any`は使用禁止
2. **バレルインポート禁止**: `import { X } from './index'` ではなく直接パス指定
3. **Presenter Pattern**: UIロジックをコンポーネントから分離
4. **Pure Functions**: 副作用のない純粋関数でビジネスロジックを記述
5. **日本語コメント**: コード内コメントは日本語で記述
6. **Entity/ValueObject**: ファクトリメソッドで生成、immutable設計

## 開発ワークフロー

すべての開発タスクは以下の6フェーズに従います。**フェーズのスキップ禁止。**

### Phase 1: Planning & Review 【必須】
- **Agent**: `plan-reviewer`（フロントエンド）/ `backend-plan-reviewer`（バックエンド）
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
- **Agent**: `implement-review`（フロントエンド）/ `backend-implement-review`（バックエンド）
- **目的**: Serena MCPで実装 → Codexでレビュー
- **備考**: テストは一旦スキップ（必要に応じて`test-review`/`backend-test-review`エージェントを使用）

**Cursor Agent Mode使用時の注意**:
Cursor AgentでCodexモデルを選択している場合、Codex MCPを経由せず直接Codexモデルにレビューを依頼してください。

### Phase 3: Quality Checks 【必須】

**フロントエンド:**
```bash
bun run typecheck  # 型チェック
bun run check      # Biome lint/format
bun run test       # テスト実行
bun run build      # ビルド確認
```

**バックエンド:**
```bash
./vendor/bin/phpstan analyse  # 静的解析
./vendor/bin/pint --test      # コードスタイル
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

#### フロントエンド Agents
- **`plan-reviewer`**: Phase 1を実行。調査、UI/UXデザインレビュー、実装計画作成、Codex MCPでのレビューを統合実行。
- **`implement-review`**: Phase 2を実行。Serena MCPで実装、Codexでレビュー。
- **`test-review`**: テスト・ストーリー作成、Codexでテストレビュー（任意）。

#### バックエンド Agents
- **`backend-plan-reviewer`**: Phase 1を実行。4層アーキテクチャの調査、アーキテクチャレビュー、実装計画作成、Codex MCPでのレビューを統合実行。
- **`backend-implement-review`**: Phase 2を実行。Entity/ValueObject/UseCaseの実装、Codexでレビュー。
- **`backend-test-review`**: PHPUnitテスト作成、Codexでテストレビュー（任意）。

### Skills（知識参照）

#### フロントエンド Skills
- **`coding-guidelines`**: React/TypeScriptコーディング規約、アーキテクチャパターン
- **`test-guidelines`**: Vitest/RTLテスト規約、AAAパターン、カバレッジ基準
- **`storybook-guidelines`**: Storybookストーリー作成規約
- **`ui-design-guidelines`**: UI/UX原則、アクセシビリティ、レスポンシブデザイン

#### バックエンド Skills
- **`backend-coding-guidelines`**: Entity/ValueObjectパターン、UseCase構造、Repositoryパターン、レイヤー分離
- **`backend-test-guidelines`**: PHPUnitテスト規約、レイヤー別テスト戦略（Unit/Feature）、AAAパターン
- **`backend-architecture-guidelines`**: 4層アーキテクチャ設計、依存関係ルール、モジュール分離、Contractパターン

### MCPs
- **Kiri**: セマンティックコード検索、依存関係分析
- **Context7**: ライブラリドキュメント取得
- **Serena**: シンボルベースコード編集
- **Codex**: AIコードレビュー
- **Chrome DevTools**: ブラウザ自動化

## 重要な原則

1. **フェーズをスキップしない**: 「簡単なタスク」という判断は禁物。すべてのフェーズを実行。
2. **品質チェック必須**: Phase 3のすべてのチェックをパスするまで次に進まない。
3. **エラー完全修正**: エラーが出たら完全に修正してから次のフェーズへ。
4. **Agent活用**: plan-reviewer/backend-plan-reviewer, implement-review/backend-implement-reviewを積極的に使用。
5. **ワークフロー遵守 = 効率化**: 手順を守ることが最も確実な効率化。
