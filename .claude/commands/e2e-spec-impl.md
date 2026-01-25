---
description: "E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装"
argument-hint: "<テスト仕様書パス> (例: tests/e2e/specs/auth/login.spec.md)"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion", "Task", "Skill"]
---

# /e2e-spec-impl - Playwrightテスト実装コマンド

E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装する。
「計画書作成 → 実装方法選択 → 実装」の2段階ワークフローで、コンテキスト蓄積による実装ブレを防ぐ。

---

## [1/4] 仕様書読み込み・環境確認

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

**「セットアップ実行」選択時**: `Skill({ skill: "playwright-guidelines" })` を参照してセットアップ。

---

## [2/4] 実装計画書の生成

### スキル参照

```javascript
Skill({ skill: "playwright-guidelines" })
```

実装計画書テンプレートは **references/impl-plan-templates.md** を参照。

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

### 計画書のセルフレビュー（任意）

1. **Page Object設計の妥当性**: ロケーターとメソッドが仕様書の要件を満たしているか
2. **テストケースの網羅性**: 正常系・異常系・境界値が適切に設計されているか
3. **AAAパターンの明確さ**: 各テストケースのArrange-Act-Assertが明確か

---

## [3/4] 実装方法の選択

```javascript
AskUserQuestion({
  questions: [{
    question: "実装計画書が生成されました。実装方法を選択してください。\n\n計画書: .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md",
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

## 参照スキル
必要に応じて Skill('playwright-guidelines') を参照してください。`,
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

### なぜ2段階ワークフローなのか

1. **コンテキスト蓄積問題の解決**: 仕様書読み込み → Page Object設計 → テストコード生成を1セッションで行うと、コンテキストが蓄積し後半で実装がブレる
2. **計画書が真実の情報源**: 計画書を生成してからサブエージェントに渡すことで、一貫した実装が可能
3. **柔軟な実行オプション**: 大規模テストは自動実装、小規模テストは現セッション継続など、状況に応じた選択が可能

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
