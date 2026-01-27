---
description: "E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装"
argument-hint: "<テスト仕様書パス> (例: tests/e2e/specs/auth/login.spec.md)"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion", "Task", "Skill"]
---

# /e2e-spec-impl - Playwrightテスト実装コマンド

E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装する。
「セレクタ調査 → 計画書作成 → 品質ゲート → 実装」の5ステップワークフローで、コンテキスト蓄積による実装ブレを防ぎ、品質基準を確保する。

---

## [1/5] 仕様書読み込み・環境確認

### 仕様書パスの取得

```
仕様書パス: $1
```

$1が空の場合、Globツールで既存のテスト仕様書を検索：

```javascript
Glob({ pattern: "tests/e2e/specs/**/*.spec.md" })
```

検索結果を元にAskUserQuestionで選択を促す：

```javascript
AskUserQuestion({
  questions: [{
    question: "テストコードを生成するテスト仕様書を選択してください。",
    header: "仕様書選択",
    options: [
      { label: "[検出した仕様書1]", description: "[概要]" },
      { label: "[検出した仕様書2]", description: "[概要]" }
    ],
    multiSelect: false
  }]
})
```

### 仕様書の解析

Readツールで仕様書を読み込み、以下を抽出：

1. **画面情報**: 画面ID、画面名、URL、認証要否
2. **テストケース**: テストID、テスト名、前提条件、操作手順、期待結果、優先度
3. **データ要件**: テストデータ、Laravelファクトリー定義
4. **Page Object要件**: 必要なPage Object、主要要素

### 環境確認

playwright.config.ts の存在を確認。存在しない場合はセットアップを確認：

```javascript
AskUserQuestion({
  questions: [{
    question: "Playwright設定ファイルが見つかりません。セットアップしますか？",
    header: "環境セットアップ",
    options: [
      { label: "セットアップ実行 (Recommended)", description: "Playwright + hyvor/laravel-playwright をセットアップ" },
      { label: "スキップ", description: "手動でセットアップ済みとして続行" },
      { label: "キャンセル", description: "コマンドを終了" }
    ],
    multiSelect: false
  }]
})
```

**「セットアップ実行」選択時**: `Skill('playwright-guidelines')` を参照してセットアップ。

---

## [2/5] セレクタ調査

### 目的

実際のDOM構造を確認し、具体的なセレクタ値を特定する。抽象的なセレクタ指定による実装ブレを防止する。

### Playwright Codegen の活用

アプリケーションが起動している場合、以下のコマンドでDOM構造を確認することを推奨：

```bash
npx playwright codegen {baseURL}
```

※ アプリケーションが起動していない場合は、仕様書の要素定義と既存コードから推測する。

### セレクタ優先順位の確認

| 優先順位 | セレクタ種別 | 使用場面 | 例 |
|---------|-------------|---------|-----|
| 1 | `getByRole()` | ボタン、チェックボックス、見出し、リンク | `getByRole('button', { name: 'ログイン' })` |
| 2 | `getByLabel()` | ラベル付きフォーム要素 | `getByLabel('メールアドレス')` |
| 3 | `getByPlaceholder()` | プレースホルダー付き入力欄 | `getByPlaceholder('example@mail.com')` |
| 4 | `getByText()` | 非インタラクティブ要素 | `getByText('ログイン成功')` |
| 5 | `getByTestId()` | 上記で特定できない場合のみ（最後の手段） | `getByTestId('login-form')` |

### 要素ごとのセレクタ決定

仕様書の各画面要素に対して：

1. **ロールベースセレクタの検討**: 要素の役割（button, textbox, link等）から特定できるか
2. **ラベルセレクタの検討**: ラベルやaria-label属性から特定できるか
3. **代替セレクタの検討**: 主セレクタが不安定な場合の代替手段
4. **TestIDの検討**: 上記で特定できない場合のみ、TestID追加を提案

### セレクタ調査結果の記録

次ステップの実装計画書に含めるため、以下の形式で記録：

| 要素名 | 推奨セレクタ | 代替セレクタ | 備考 |
|--------|-------------|-------------|------|
| {要素名} | `getByLabel('...')` | `getByRole('textbox')` | ✓ 確認済み |

---

## [3/5] 実装計画書の生成

### スキル参照

**playwright-guidelines** の詳細ガイドラインを参照：

```javascript
Skill('playwright-guidelines')
```

参照セクション:
- references/impl-plan-templates.md: 実装計画書テンプレート
- references/pom-patterns.md: Page Objectパターン
- references/fixtures-guide.md: フィクスチャ設計
- references/laravel-integration.md: Laravel統合

### 計画書ディレクトリの確認・作成

仕様書パス `tests/e2e/specs/{category}/{screen}.spec.md` から `{category}` を抽出：

```bash
mkdir -p .claude/e2e-impl-plans/{category}
```

### 実装計画書の生成

**出力先**: `.claude/e2e-impl-plans/{category}/{screen}-impl-plan.md`

**references/impl-plan-templates.md** のフォーマットに従い、以下を含む計画書を生成：

- 参照仕様書情報
- Playwright環境情報
- Page Object設計（ロケーター一覧、アクションメソッド一覧、アサーションメソッド一覧）
- テストコード設計（テストケース一覧、AAA詳細）
- フィクスチャ設計
- 実装手順チェックリスト
- 実装ルール

---

## [4/5] 品質ゲート

### 目的

実装計画書の品質を検証し、実装フェーズでの手戻りを防止する。**このステップは必須であり、承認なしでは実装に進めない。**

### 品質チェックリスト

#### セレクタ検証

- [ ] すべてのロケーターに**具体的なセレクタ値**が記載されている
- [ ] セレクタ優先順位を遵守している（getByRole > getByLabel > getByTestId）
- [ ] 代替セレクタが検討されている（主セレクタが不安定な場合の備え）

#### セレクタ検証（自動チェック対応）

以下の違反パターンを自動検出し、修正提案を行う：

| # | 違反パターン | 検出条件 | 修正提案 |
|---|-------------|---------|---------|
| 1 | **TestID優先使用** | `getByTestId` がロケーター一覧の50%以上を占める | 「{要素名}は `getByRole('button', { name: '...' })` または `getByLabel('...')` で特定可能です。ロールベースセレクタを優先してください。」 |
| 2 | **CSSセレクタ使用** | `locator('.class')` または `locator('#id')` の使用 | 「{要素名}は CSS セレクタではなく `getByLabel('{ラベル}')` または `getByRole('{role}')` で特定してください。」 |
| 3 | **XPathセレクタ使用** | `locator('//xpath')` の使用 | 「XPath セレクタは DOM 構造に依存するため使用禁止です。ロールベースセレクタに変更してください。」 |
| 4 | **具体性不足** | セレクタ値が空、`TODO`、`{placeholder}` | 「{要素名}のセレクタ値を具体的に記載してください。セレクタ調査 [2/5] を再実行することを推奨します。」 |
| 5 | **代替セレクタ未検討** | 入力要素で代替セレクタが「-」または空 | 「{要素名}の代替セレクタを検討してください。例: 主セレクタ `getByLabel` → 代替 `getByRole('textbox')`」 |

#### 自動検出の実行

品質ゲートチェック時に、計画書のロケーター一覧テーブルを解析し、上記違反パターンを検出する。

**検出結果の報告形式**:

```markdown
### セレクタ検証結果

**検出された違反: 2件**

#### 違反1: TestID優先使用
- **該当要素**: submitButton, cancelButton, searchInput
- **現状**: 5要素中3要素（60%）が getByTestId を使用
- **修正提案**: 以下の要素はロールベースセレクタで特定可能です
  - `submitButton`: `getByRole('button', { name: '送信' })` を使用
  - `cancelButton`: `getByRole('button', { name: 'キャンセル' })` を使用
  - `searchInput`: `getByLabel('検索')` または `getByPlaceholder('検索...')` を使用

#### 違反2: 具体性不足
- **該当要素**: userAvatar
- **現状**: セレクタ値が `TODO` になっている
- **修正提案**: セレクタ調査 [2/5] を再実行し、DOM構造を確認してください
```

#### テストデータ検証

- [ ] ファクトリー名だけでなく、**カスタム属性**が明記されている
- [ ] テストデータの**用途**が明確に記述されている
- [ ] 必要なステートが指定されている（例: unverified, admin 等）

#### AAAパターン検証

- [ ] 各テストケースの**Arrange**が具体的（データ準備、ページ遷移）
- [ ] 各テストケースの**Act**が明確（1つの主要操作）
- [ ] 各テストケースの**Assert**が検証可能（具体的なアサーション）

### 品質ゲートダイアログ

```javascript
AskUserQuestion({
  questions: [{
    question: "実装計画書の品質ゲートチェックを実施しました：\n\n【セレクタ検証】\n- 具体的なセレクタ値: ✓/✗\n- 優先順位遵守: ✓/✗\n- 代替セレクタ: ✓/✗\n\n【テストデータ検証】\n- カスタム属性: ✓/✗\n- 用途記述: ✓/✗\n- ステート指定: ✓/✗\n\n【AAAパターン検証】\n- Arrange明確: ✓/✗\n- Act明確: ✓/✗\n- Assert検証可能: ✓/✗\n\n品質基準を満たしています。実装に進んでよろしいですか？",
    header: "品質ゲート",
    options: [
      { label: "承認して実装へ (Recommended)", description: "品質基準を満たしたため実装に進む" },
      { label: "計画書を修正", description: "指摘箇所を修正してから再チェック" },
      { label: "計画書のみ保存", description: "実装せずに計画書を保存して終了" }
    ],
    multiSelect: false
  }]
})
```

**「計画書を修正」選択時**:
修正箇所を特定し、計画書を更新後、再度品質ゲートチェックを実施する。

### コンテキスト管理ガイド

テストケース数に応じて最適な実装方法を選択し、長いセッションでの品質低下を防止する。

| テスト規模 | ケース数 | 推奨方法 | 理由 |
|---------|--------|--------|------|
| 小規模 | 3-5件 | 現セッション継続 | コンテキスト蓄積が限定的、実装ブレのリスク低 |
| 中規模 | 6-10件 | サブエージェント自動実装 | 計画書を基点とした独立セッションで実装 |
| 大規模 | 10+件 | `/clear` + 計画書参照 | コンテキストをリセットし、計画書のみを参照して実装 |

**大規模テストの実装手順**:
1. 品質ゲート承認後、「完了（手動実装）」を選択
2. `/clear` でセッションをクリア
3. 新しいセッションで計画書を参照して実装を開始

---

## [5/5] 実装と検証

### 実装方法の選択

```javascript
AskUserQuestion({
  questions: [{
    question: "品質ゲートを通過しました。実装方法を選択してください。\n\n計画書: .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md",
    header: "実装方法",
    options: [
      { label: "Yes（自動実装）(Recommended)", description: "サブエージェントで自動実装（大規模テスト向け）" },
      { label: "このセッションで続行", description: "現在の会話内で実装を続行（小規模テスト向け）" },
      { label: "完了（手動実装）", description: "計画書のみ保存、後で手動実装" }
    ],
    multiSelect: false
  }]
})
```

### 「Yes（自動実装）」または「このセッションで続行」を選択された場合

Taskツールでサブエージェントを起動し、計画書に基づいて実装を開始：

```javascript
Task({
  description: "E2Eテスト自動実装",
  prompt: `以下の実装計画書に基づいてE2Eテストを実装してください。

## 実装計画書
${Readツールで計画書の内容を読み込み、ここに展開}

## ディレクトリ構造
- 計画書: .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md
- Page Object: tests/e2e/pages/{category}/{Category}{Screen}Page.ts
- テストコード: tests/e2e/tests/{category}/{screen}.spec.ts

## 実装手順
1. BasePage確認・作成（tests/e2e/pages/BasePage.ts）
2. ディレクトリ作成（mkdir -p tests/e2e/pages/{category}）
3. {Category}{Screen}Page生成
   - インポート: import { BasePage } from '../BasePage'
4. testSetup.ts更新（tests/e2e/fixtures/testSetup.ts）
5. テストコード生成（正常系、異常系、境界値）
6. テスト実行（npx playwright test tests/e2e/tests/{category}/{screen}.spec.ts）
7. 完了レポート

## 重要事項
- AAAパターン（Arrange-Act-Assert）を遵守
- ロールベースセレクタを優先（getByRole, getByLabel）
- 手動waitは禁止（Auto-waitingを信頼）
- 各ステップ完了後に進捗を報告

## コード生成チェックリスト

**必須参照**: Skill('playwright-guidelines') の以下を確認
- references/code-generation-checklist.md（禁止パターン、BasePage テンプレート、正例/禁止例）
- references/pom-patterns.md（Page Object パターン）
- references/selector-strategy.md（セレクタ戦略）

コード生成後、チェックリストの全項目を検証し、違反があれば即座に修正すること。

**重要チェック項目（抜粋）**:
- [ ] BasePage は `abstract class`（`export class` 禁止）
- [ ] `waitForSelector()` メソッドは提供しない
- [ ] CSSセレクタ未使用（`getByRole`, `getByLabel` を優先）
- [ ] Web-first Assertion 使用（`page.waitForFunction()` 禁止）
- [ ] プロパティとメソッドの名前重複なし`,
  subagent_type: "implement-review",
  allowed_tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Skill"],
  model: "sonnet"
})
```

サブエージェント完了後、結果を表示してコマンドを終了。

### 「完了（手動実装）」を選択された場合

以下を表示してコマンドを終了：

```
---
実装計画書を保存しました: .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md

手動で実装を開始するには：

オプション1: 新しいセッションで実装
1. `/clear` を入力してセッションをクリア
2. 以下を入力：
   @.claude/e2e-impl-plans/{category}/{screen}-impl-plan.md
   この計画書に基づいてE2Eテストを実装してください。

オプション2: CLIで自動実装
claude --yes -p "この計画書に基づいてE2Eテストを実装" .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md
---
```

---

## 重要な注意事項

### なぜ5ステップワークフローなのか

1. **コンテキスト蓄積問題の解決**: 仕様書読み込み → Page Object設計 → テストコード生成を1セッションで行うと、コンテキストが蓄積し後半で実装がブレる
2. **セレクタ調査による具体性確保**: 抽象的なセレクタ指定ではなく、実際のDOM構造に基づく具体的なセレクタ値を特定することで実装ブレを防止
3. **品質ゲートによる品質保証**: 必須の品質チェックにより、セレクタ、テストデータ、AAAパターンの品質を担保してから実装に進む
4. **計画書が真実の情報源**: 計画書を生成してからサブエージェントに渡すことで、一貫した実装が可能
5. **柔軟な実行オプション**: 大規模テストは自動実装、小規模テストは現セッション継続など、状況に応じた選択が可能

### playwright-guidelinesとの連携

テストコードは以下のガイドラインに準拠：

- **Page Object Model**: references/pom-patterns.md
- **セレクタ戦略**: references/selector-strategy.md
- **Laravel統合**: references/laravel-integration.md
- **テスト安定性**: references/test-stability.md
- **実装計画書テンプレート**: references/impl-plan-templates.md

### エラーハンドリング

- テスト実行エラー時は明確なエラーメッセージを表示
- サブエージェントが自動修正を試み、最大3回まで再試行
- 3回失敗した場合は手動対応を促す
