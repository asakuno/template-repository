---
name: implementing-e2e-specs
description: E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装する。「セレクタ調査→計画書作成→品質ゲート→実装」の5ステップワークフローで、コンテキスト蓄積による実装ブレを防ぎ品質基準を確保する。/e2e-spec-impl で起動。Playwrightテスト実装、Page Object生成、セレクタ調査、E2Eテスト自動実装に使用。
disable-model-invocation: true
---

# Playwrightテスト実装

## Required References

このスキルを読み込んだ後、以下のファイルをReadツールで読み込むこと。

**必須**（常に読み込む）:
- `references/selector-validation.md` - セレクタ違反パターン検出と修正提案
- `references/context-management-guide.md` - テスト規模別の実装方法選択ガイド

---

## External Skill Dependencies

このスキルは `playwright-guidelines` スキルに依存しています。以下のセクションが変更された場合、本スキルの動作に影響する可能性があります:

- **セレクタ優先順位** - Step 2 のセレクタ調査で参照
- **実装計画書テンプレート** - Step 3 の計画書生成で参照
- **Page Object パターン** - Step 3, 5 の設計・実装で参照
- **禁止パターン / 正例** - Step 5 の実装で参照

---

## Overview

E2Eテスト仕様書からPlaywrightテストコードを5ステップで実装するワークフロー。

**計画書出力先**: `.claude/specs/e2e/{category}/{screen}-impl-plan.md`

---

## ワークフロー

### [1/5] 仕様書読み込み・環境確認

1. 引数 `$1` から仕様書パスを取得（空の場合は `tests/e2e/specs/**/*.spec.md` をGlobで検索しユーザーに選択を促す）
2. Readツールで仕様書を読み込み、以下を抽出:
   - **画面情報**: 画面ID、画面名、URL、認証要否
   - **テストケース**: テストID、テスト名、前提条件、操作手順、期待結果、優先度
   - **データ要件**: テストデータ、Laravelファクトリー定義
   - **Page Object要件**: 必要なPage Object、主要要素
3. `playwright.config.ts` の存在を確認。存在しない場合はセットアップをユーザーに確認

### [2/5] セレクタ調査

実際のDOM構造を確認し、具体的なセレクタ値を特定する。

1. アプリケーション起動中の場合、`npx playwright codegen {baseURL}` でDOM構造を確認することを推奨
2. 仕様書の各画面要素に対してセレクタを決定:
   - ロールベースセレクタの検討（`getByRole`）
   - ラベルセレクタの検討（`getByLabel`）
   - 代替セレクタの検討
   - TestIDは上記で特定できない場合のみ
3. セレクタ調査結果を以下の形式で記録:

| 要素名 | 推奨セレクタ | 代替セレクタ | 備考 |
|--------|-------------|-------------|------|
| {要素名} | `getByLabel('...')` | `getByRole('textbox')` | 確認済み |

セレクタ優先順位の詳細は `Skill('playwright-guidelines')` を参照。

### [3/5] 実装計画書の生成

1. `Skill('playwright-guidelines')` を参照（実装計画書テンプレート、Page Objectパターン、セレクタ分離、フィクスチャ設計、Laravel統合）
2. `.claude/specs/e2e/{category}/` ディレクトリを作成
3. 計画書を生成（`Skill('playwright-guidelines')` のフォーマットに従う）:
   - 参照仕様書情報
   - Playwright環境情報
   - Page Object設計（ロケーター一覧、アクション/アサーションメソッド一覧）
   - テストコード設計（テストケース一覧、AAA詳細）
   - フィクスチャ設計
   - 実装手順チェックリスト・実装ルール

### [4/5] 品質ゲート

実装計画書の品質を検証する。**承認なしでは実装に進めない。**

#### チェック項目

- **セレクタ検証**: 具体的なセレクタ値、優先順位遵守、代替セレクタ検討。違反パターンの詳細は `references/selector-validation.md` を参照
- **セレクタ分離**: 中規模以上（Page Object 4件以上）で推奨。詳細は `Skill('playwright-guidelines')` を参照
- **テストデータ検証**: ファクトリー名だけでなくカスタム属性が明記、用途が明確、必要なステートが指定
- **AAAパターン検証**: Arrange（データ準備・ページ遷移）が具体的、Act（1つの主要操作）が明確、Assert（具体的なアサーション）が検証可能

品質ゲート結果をユーザーに報告し、承認して実装/計画書を修正/計画書のみ保存を選択。

### [5/5] 実装と検証

実装方法をユーザーに確認。テスト規模に応じた推奨は `references/context-management-guide.md` を参照。

#### 自動実装またはセッション継続の場合

Taskツールでサブエージェントを起動し、計画書に基づいて実装:

Taskツール（subagent_type: `general-purpose`）でサブエージェントを起動し、計画書の全内容をpromptに含めて実装を指示する。

**実装手順**:
1. BasePage確認・作成（`tests/e2e/pages/base/BasePage.ts`）
2. ディレクトリ作成
3. セレクタファイル生成（中規模以上で推奨）
4. Page Object生成
5. `testSetup.ts` 更新
6. テストコード生成（正常系、異常系、境界値）
7. テスト実行（`npx playwright test tests/e2e/tests/{category}/{screen}.spec.ts`）
8. 完了レポート

**必須参照**: `Skill('playwright-guidelines')`（禁止パターン、BasePage テンプレート、正例/禁止例）

#### 手動実装の場合

計画書のパスと実装開始手順を表示して終了。

