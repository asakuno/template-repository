---
description: 最小限の仕様からインタビューで詳細を収集し、厳格なTDD（機能単位）で実装セッションを開始
allowed-tools: Read, Write, Bash, Task
argument-hint: [機能の概要や目的]
---

# 仕様インタビュー & 厳格TDD実装セッション作成

**このコマンドは機能単位の厳格なTDDサイクル（RED → GREEN → REFACTOR）を採用します。**

各機能ごとに以下を繰り返します：
1. RED: テスト作成 → コミット
2. GREEN: 最小限の実装 → コミット
3. REFACTOR: リファクタリング → コミット

## 入力された初期仕様
```
$ARGUMENTS
```

## フェーズ1: 要件インタビュー

上記の初期仕様を理解した上で、**AskUserQuestionTool** を使用して以下の観点から詳細をヒアリングしてください。

### インタビュー項目

以下の質問をAskUserQuestionToolで実施してください（1回の呼び出しで最大4問）：

**質問1: プロジェクト種別**
- question: "このプロジェクトの種別を教えてください"
- header: "種別"
- multiSelect: false
- options:
  - label: "新規プロジェクト"
    description: "全く新しいプロジェクトを作成"
  - label: "既存への機能追加"
    description: "既存プロジェクトに新機能を追加"
  - label: "リファクタリング"
    description: "既存コードの改善・再構築"

**質問2: 技術要件**
- question: "使用する技術スタックを選択してください（複数選択可）"
- header: "技術"
- multiSelect: true
- options:
  - label: "Laravel/PHP"
    description: "バックエンドフレームワーク"
  - label: "React/TypeScript"
    description: "フロントエンドフレームワーク"
  - label: "Inertia.js"
    description: "フルスタック連携"

**質問3: コア機能**
- question: "最も重要な機能は何ですか？"
- header: "主要機能"
- multiSelect: false
- options:
  - label: "データCRUD"
    description: "データの作成・参照・更新・削除"
  - label: "認証/認可"
    description: "ユーザー認証とアクセス制御"
  - label: "API連携"
    description: "外部サービスとの連携"
  - label: "レポート/分析"
    description: "データ分析・可視化機能"

**質問4: 優先事項**
- question: "最も重視する要件は何ですか？"
- header: "優先度"
- multiSelect: false
- options:
  - label: "開発スピード (推奨)"
    description: "MVP早期リリース優先"
  - label: "コード品質"
    description: "テストカバレッジ・保守性重視"
  - label: "パフォーマンス"
    description: "高速化・最適化優先"

ユーザーの回答が不十分な場合は、追加で質問を行ってください。

## フェーズ2: 仕様書の作成

インタビュー結果を元に、以下の形式で仕様書を作成し `.claude/specs/` ディレクトリに保存してください。

1. `.claude/specs/` ディレクトリを作成（存在しない場合）:
   ```bash
   mkdir -p .claude/specs
   ```

2. 仕様書を以下の形式で作成：

### 仕様書フォーマット

```markdown
# 機能仕様書: [機能名]

## 概要
[初期仕様とインタビュー結果のサマリー]

## 要件
### 機能要件
- [ ] ...

### 非機能要件
- [ ] ...

## 技術設計
- 言語/フレームワーク:
- アーキテクチャ:

## 実装ステップ（機能単位で記載）
1. [機能1: 具体的な機能名]
2. [機能2: 具体的な機能名]
3. [機能3: 具体的な機能名]

**重要**: 実装手順は機能単位で細かく分割してください。
各機能ごとにRED → GREEN → REFACTORサイクルを実行します。

例（Backend - 架空の商品管理機能の場合）:
- ProductId ValueObject
- CategoryId ValueObject
- ProductName ValueObject
- Product Entity
- CreateProductUseCase

例（Frontend - 架空のユーザー管理画面の場合）:
- Button コンポーネント
- Input コンポーネント
- UserForm コンポーネント
- UserList ページ

## 備考
[追加情報]
```

3. ファイル名を生成：
   - タイムスタンプ: !`date +%Y%m%d-%H%M%S`
   - スラグ: $ARGUMENTSから生成（小文字、ハイフン区切り）
   - パス: `.claude/specs/{タイムスタンプ}-{slug}.md`

## フェーズ3: 実装セッションの準備

仕様書の保存が完了したら、ユーザーに以下を提示してください：

---

### 📋 仕様書が完成しました

**保存先:** `.claude/specs/[ファイル名]`

### 🚀 厳格なTDD実装を開始するには

#### オプション1: 新しいセッションで実行（推奨）

以下のコマンドをコピーして新しいセッションで実行してください：

```
/clear
```

その後、実装タイプに応じて以下のプロンプトで実装を開始：

**Frontend実装の場合（厳格TDD）**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて厳格なTDD（機能単位）で実装を開始してください。

Phase 1: plan-reviewer で実装計画を作成
  → 完了後、計画ドキュメントをコミット

Phase 2: 各機能ごとにTDDサイクルを実行
  機能1:
    RED: test-review でテスト作成 → コミット
    GREEN: implement-review で最小限の実装 → コミット
    REFACTOR: implement-review でリファクタリング → コミット

  機能2:
    RED: test-review でテスト作成 → コミット
    GREEN: implement-review で最小限の実装 → コミット
    REFACTOR: implement-review でリファクタリング → コミット

  ... (すべての機能について繰り返す)

Phase 3: Quality Checks を実行
  以下のコマンドをすべて実行し、すべてのチェックがパスすることを確認：
  ```bash
  bun run typecheck && bun run check && bun run test && bun run build
  ```

  **重要**: すべてのチェックがパスするまで次に進まない。

  **エラーが発生した場合**:
  1. エラーメッセージを確認
  2. 該当箇所を修正
  3. 再度 Quality Checks を実行
  4. すべてパスしたら修正をコミット

  **よくあるエラーと対処法**:
  - `typecheck` 失敗: 型定義の不足 → 適切な型を追加
  - `check` 失敗: Biome lint エラー → `bun run check --apply` で自動修正
  - `test` 失敗: テストケースの不足または実装のバグ → 修正して再実行
  - `build` 失敗: import エラーやビルド設定の問題 → エラーログを確認

コミットメッセージ例:
- RED: test(frontend): Button コンポーネント - テスト作成（RED）
- GREEN: feat(frontend): Button コンポーネント - 実装（GREEN）
- REFACTOR: refactor(frontend): Button コンポーネント - リファクタリング（REFACTOR）
```

**Backend実装の場合（厳格TDD）**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて厳格なTDD（機能単位）で実装を開始してください。

Phase 1: backend-plan-reviewer で実装計画を作成
  → 完了後、計画ドキュメントをコミット

Phase 2: 各機能ごとにTDDサイクルを実行
  機能1（例: ProductId ValueObject）:
    RED: backend-test-review でテスト作成 → コミット
    GREEN: backend-implement-review で最小限の実装 → コミット
    REFACTOR: backend-implement-review でリファクタリング → コミット

  機能2（例: CategoryId ValueObject）:
    RED: backend-test-review でテスト作成 → コミット
    GREEN: backend-implement-review で最小限の実装 → コミット
    REFACTOR: backend-implement-review でリファクタリング → コミット

  ... (すべての機能について繰り返す)

Phase 3: Quality Checks を実行
  以下のコマンドをすべて実行し、すべてのチェックがパスすることを確認：
  ```bash
  ./vendor/bin/phpstan analyse && ./vendor/bin/pint --test && ./vendor/bin/phpunit && ./vendor/bin/deptrac
  ```

  **重要**: すべてのチェックがパスするまで次に進まない。

  **エラーが発生した場合**:
  1. エラーメッセージを確認
  2. 該当箇所を修正
  3. 再度 Quality Checks を実行
  4. すべてパスしたら修正をコミット

  **よくあるエラーと対処法**:
  - `phpstan` 失敗: 型定義の不足、潜在的バグ → 適切な型を追加、コードを修正
  - `pint` 失敗: コーディング規約違反 → `./vendor/bin/pint` で自動修正
  - `phpunit` 失敗: テストケースの不足または実装のバグ → 修正して再実行
  - `deptrac` 失敗: 依存関係の違反 → 4層アーキテクチャに従って修正

コミットメッセージ例:
- RED: test(backend): ProductId ValueObject - テスト作成（RED）
- GREEN: feat(backend): ProductId ValueObject - 実装（GREEN）
- REFACTOR: refactor(backend): ProductId ValueObject - リファクタリング（REFACTOR）
```

**Fullstack実装の場合（厳格TDD）**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて厳格なTDD（機能単位）で実装を開始してください。

実行順序:

【Backend（厳格TDD）】
1. Backend Phase 1: backend-plan-reviewer
   → 完了後コミット

2. Backend Phase 2: 各機能ごとにTDDサイクル
   機能1: RED → コミット → GREEN → コミット → REFACTOR → コミット
   機能2: RED → コミット → GREEN → コミット → REFACTOR → コミット
   ...

3. Backend Phase 3: Quality Checks
   → すべてパス後コミット

【Frontend（厳格TDD）】
4. Frontend Phase 1: plan-reviewer
   → 完了後コミット

5. Frontend Phase 2: 各機能ごとにTDDサイクル
   機能1: RED → コミット → GREEN → コミット → REFACTOR → コミット
   機能2: RED → コミット → GREEN → コミット → REFACTOR → コミット
   ...

6. Frontend Phase 3: Quality Checks
   → すべてパス後コミット

重要: Backend完了後にFrontend開始。各機能はRED → GREEN → REFACTORを厳守。
```

---

#### オプション2: 現在のセッションで続行

現在のセッションでそのまま実装を続けることもできます。
実装タイプに応じて適切なガイドラインを参照してください：

- **Frontend**: ui-design-guidelines、coding-guidelines
- **Backend**: backend-architecture-guidelines、backend-coding-guidelines

**重要**: 各機能ごとにRED → GREEN → REFACTORサイクルを実行し、それぞれコミットしてください。

---

**どちらを希望しますか？**
