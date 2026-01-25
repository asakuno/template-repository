---
description: "E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装。コンテキスト蓄積による実装ブレを防ぐ2段階ワークフロー。Page Object Modelパターンを適用し、hyvor/laravel-playwright統合でLaravelファクトリーを活用"
argument-hint: "<テスト仕様書パス> (例: tests/e2e/specs/auth/login.spec.md)"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion", "Task", "Skill"]
---

# /e2e-spec-impl - Playwrightテスト実装コマンド

このコマンドは、E2Eテスト仕様書から実装計画書を生成し、Playwrightテストコードを実装します。
「計画書作成 → 実装方法選択 → 実装」の2段階ワークフローで、コンテキスト蓄積による実装ブレを防ぎます。
Page Object Modelパターンを適用し、hyvor/laravel-playwright統合でLaravelファクトリーを活用します。

## 使い方

### 引数付き起動
```
/e2e-spec-impl tests/e2e/specs/auth/login.spec.md
```

### 引数なし起動（対話的）
```
/e2e-spec-impl
```

---

## [1/4] 仕様書読み込み・環境確認

### 仕様書パスの取得

引数から仕様書パスを取得します：
- `$1`が存在する場合: そのまま使用
- `$1`が空の場合: ユーザーに質問

```
仕様書パス: $1
```

$1が空の場合、Globツールで既存のテスト仕様書を検索してください：

```javascript
Glob({
  pattern: "tests/e2e/specs/**/*.spec.md"
})
```

検索結果を元にAskUserQuestionツールで選択を促してください：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "テストコードを生成するテスト仕様書を選択してください。",
      header: "仕様書選択",
      options: [
        {
          label: "[検出した仕様書1]",
          description: "[仕様書の概要]"
        },
        {
          label: "[検出した仕様書2]",
          description: "[仕様書の概要]"
        }
      ],
      multiSelect: false
    }
  ]
})
```

### 仕様書の解析

Readツールで仕様書を読み込み、以下を抽出してください：

1. **画面情報**:
   - 画面ID、画面名、URL、認証要否

2. **テストケース**:
   - テストID、テスト名、前提条件、操作手順、期待結果、優先度

3. **データ要件**:
   - テストデータ、Laravelファクトリー定義

4. **Page Object要件**:
   - 必要なPage Object、主要要素

### 環境確認

Playwrightの設定ファイルを確認してください：

```javascript
// playwright.config.ts が存在するか確認
Glob({
  pattern: "playwright.config.ts"
})
```

**playwright.config.ts が存在しない場合**：

AskUserQuestionツールで環境セットアップを確認：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "Playwright設定ファイルが見つかりません。環境をセットアップしますか？",
      header: "環境セットアップ",
      options: [
        {
          label: "セットアップ実行 (Recommended)",
          description: "Playwright + hyvor/laravel-playwright をセットアップ"
        },
        {
          label: "スキップ",
          description: "手動でセットアップ済みとして続行"
        },
        {
          label: "キャンセル",
          description: "コマンドを終了"
        }
      ],
      multiSelect: false
    }
  ]
})
```

**「セットアップ実行」を選択された場合**：

Skillツールでplaywright-guidelinesを参照し、セットアップ手順を実行：

```javascript
Skill({
  skill: "playwright-guidelines"
})
```

---

## [2/4] 実装計画書の生成

### スキル参照

Skillツールでplaywright-guidelinesを参照し、POMパターンを確認してください：

```javascript
Skill({
  skill: "playwright-guidelines"
})
```

### 計画書ディレクトリの確認・作成

仕様書パス `tests/e2e/specs/{category}/{screen}.spec.md` から `{category}` を抽出し、計画書を格納するディレクトリを確認・作成：

```bash
# {category} は仕様書パスから抽出（例: tests/e2e/specs/auth/login.spec.md → auth）
mkdir -p .claude/e2e-impl-plans/{category}
```

### 実装計画書の生成

仕様書の内容に基づいて、以下のフォーマットで実装計画書を生成してください。

**出力先**: `.claude/e2e-impl-plans/{category}/{screen}-impl-plan.md`

```markdown
# {画面名} E2E実装計画書

## 参照仕様書
- パス: {テスト仕様書パス}
- 画面ID: {画面ID}
- テストケース数: {正常系X件, 異常系Y件, 境界値Z件}

## Playwright環境
- 設定ファイル: playwright.config.ts
- ベースURL: {baseURL}
- Laravel統合: {hyvor/laravel-playwright使用有無}

## Page Object設計

### {Category}{Screen}Page
- 継承: BasePage
- ファイル: tests/e2e/pages/{category}/{Category}{Screen}Page.ts

#### ロケーター一覧
| 名前 | セレクタ種別 | セレクタ値 |
|------|-------------|-----------|
| {locatorName} | getByLabel | {ラベル名} |
| {locatorName} | getByRole | button, { name: '{ボタン名}' } |
| ... | ... | ... |

#### アクションメソッド一覧
| メソッド名 | 引数 | 処理内容 |
|-----------|------|---------|
| {methodName}(args) | {型定義} | {処理の説明} |
| ... | ... | ... |

#### アサーションメソッド一覧
| メソッド名 | 検証内容 |
|-----------|---------|
| {methodName}() | {検証内容の説明} |
| ... | ... |

## テストコード設計

### ファイル構成
- tests/e2e/tests/{category}/{screen}.spec.ts

### テストケース一覧
| テストID | テスト名 | AAAパターン概要 |
|----------|----------|----------------|
| {ID} | {name} | Arrange: {準備内容}, Act: {操作内容}, Assert: {検証内容} |
| ... | ... | ... |

### 正常系テストケース詳細
#### {テストID}: {テスト名}
- **Arrange**: {前提条件・データ準備}
- **Act**: {実行する操作}
- **Assert**: {期待結果の検証}

### 異常系テストケース詳細
#### {テストID}: {テスト名}
- **Arrange**: {前提条件・データ準備}
- **Act**: {実行する操作}
- **Assert**: {エラー検証}

### 境界値テストケース詳細
#### {テストID}: {テスト名}
- **Arrange**: {境界値データ準備}
- **Act**: {実行する操作}
- **Assert**: {境界条件の検証}

## フィクスチャ設計

### testSetup.ts
- Page Objectの自動初期化
- カスタムフィクスチャ定義

### テストデータ
| データ種別 | ファイル/値 |
|-----------|------------|
| {dataType} | {value} |
| ... | ... |

## 実装手順

1. [ ] BasePage確認・作成
2. [ ] {Category}{Screen}Page生成
3. [ ] testSetup.ts更新
4. [ ] テストコード生成（正常系）
5. [ ] テストコード生成（異常系）
6. [ ] テストコード生成（境界値）
7. [ ] テスト実行・検証
8. [ ] 完了レポート

## 重要な実装ルール

### テストコード作成のルール
1. **AAAパターン遵守**: Arrange-Act-Assert の構造を厳守
2. **テスト独立性**: 各テストは他のテストに依存しない
3. **手動waitは禁止**: `waitForTimeout()` を使用しない、Auto-waitingを信頼
4. **Web-first Assertions**: `expect(locator).toBeVisible()` を使用

### セレクタのルール
1. **ロールベース優先**: `getByRole()`, `getByLabel()` を最優先
2. **CSSセレクタ禁止**: クラス名やIDに依存しない
3. **XPath禁止**: DOM構造に依存しない
4. **TestIDは最後の手段**: 上記で特定できない場合のみ

### セレクタ優先順位
1. `getByRole()` - ボタン、チェックボックス、見出し、リンク
2. `getByLabel()` - ラベル付きフォーム要素
3. `getByPlaceholder()` - プレースホルダー付き入力欄
4. `getByText()` - 非インタラクティブ要素
5. `getByTestId()` - 上記で特定できない場合のみ（最後の手段）
```

### 計画書のセルフレビュー（任意）

生成した計画書を確認し、問題があれば修正してください：

1. **Page Object設計の妥当性**: ロケーターとメソッドが仕様書の要件を満たしているか
2. **テストケースの網羅性**: 正常系・異常系・境界値が適切に設計されているか
3. **AAAパターンの明確さ**: 各テストケースのArrange-Act-Assertが明確か

---

## [3/4] 実装方法の選択

### 実装方法の確認

AskUserQuestionツールで実装方法を選択させてください：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "実装計画書が生成されました。実装方法を選択してください。\n\n計画書: .claude/e2e-impl-plans/{category}/{screen}-impl-plan.md",
      header: "実装方法",
      options: [
        {
          label: "Yes（自動実装）(Recommended)",
          description: "コンテキストクリア＋サブエージェントで自動実装（大規模テスト向け）"
        },
        {
          label: "このセッションで続行",
          description: "現在の会話内で実装を続行（小規模テスト向け）"
        },
        {
          label: "完了（手動実装）",
          description: "計画書のみ保存、後で手動実装"
        }
      ],
      multiSelect: false
    }
  ]
})
```

### 「Yes（自動実装）」を選択された場合

Taskツールでサブエージェントを起動し、新しいコンテキストで実装を開始：

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
1. BasePage確認・作成
   - tests/e2e/pages/BasePage.ts が存在しない場合は作成
2. ディレクトリ作成
   - mkdir -p tests/e2e/pages/{category}
3. {Category}{Screen}Page生成
   - 出力先: tests/e2e/pages/{category}/{Category}{Screen}Page.ts
   - インポート: import { BasePage } from '../BasePage' (親ディレクトリへ)
   - 計画書のロケーター一覧、アクションメソッド一覧、アサーションメソッド一覧に基づいて生成
4. testSetup.ts更新
   - tests/e2e/fixtures/testSetup.ts にPage Objectを追加
   - インポート: import { {Category}{Screen}Page } from '../pages/{category}/{Category}{Screen}Page'
5. テストコード生成
   - 正常系、異常系、境界値のテストケースを計画書の詳細に基づいて生成
6. テスト実行・検証
   - npx playwright test tests/e2e/tests/{category}/{screen}.spec.ts で実行
7. 完了レポート
   - 生成したファイル一覧とテスト結果を報告

## 重要事項
- AAAパターン（Arrange-Act-Assert）を遵守
- ロールベースセレクタを優先（getByRole, getByLabel）
- 手動waitは禁止（Auto-waitingを信頼）
- 各ステップ完了後に進捗を報告
- Page ObjectのBasePageインポートは '../BasePage' を使用（親ディレクトリ参照）

## 参照スキル
必要に応じて Skill('playwright-guidelines') を参照してください。`,
  subagent_type: "implement-review",
  allowed_tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Skill"],
  model: "sonnet"
})
```

サブエージェント完了後、結果を表示してコマンドを終了。

### 「このセッションで続行」を選択された場合

[4/4] 実装実行（このセッション）に進む。

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

## [4/4] 実装実行（このセッション）

### Page Object生成

#### BasePage確認・作成

Readツールで `tests/e2e/pages/BasePage.ts` の存在を確認してください。

**存在しない場合**、以下のテンプレートで作成：

```typescript
// tests/e2e/pages/BasePage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByRole('banner');
    this.footer = page.getByRole('contentinfo');
    this.loadingIndicator = page.getByRole('progressbar');
  }

  abstract goto(): Promise<void>;

  async waitForPageLoad() {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 10000 });
  }

  async expectTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }
}
```

#### 画面固有Page Object生成

Page Objectを格納するディレクトリを作成：

```bash
mkdir -p tests/e2e/pages/{category}
```

計画書の「Page Object設計」セクションに基づいて、Page Objectを生成：

```typescript
// tests/e2e/pages/{category}/{Category}{Screen}Page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class {Category}{Screen}Page extends BasePage {
  // 計画書のロケーター一覧に基づいて定義
  readonly {locatorName}: Locator;
  // ...

  constructor(page: Page) {
    super(page);
    // 計画書のセレクタ種別・セレクタ値に基づいて初期化
    this.{locatorName} = page.{セレクタ種別}('{セレクタ値}');
    // ...
  }

  async goto() {
    await this.page.goto('/{endpoint}');
    await this.waitForPageLoad();
  }

  // 計画書のアクションメソッド一覧に基づいて実装
  async {methodName}({args}) {
    // 処理内容
  }

  // 計画書のアサーションメソッド一覧に基づいて実装
  async {methodName}() {
    // 検証内容
  }
}
```

### フィクスチャ確認・作成

`tests/e2e/fixtures/testSetup.ts` を確認し、なければ作成、あれば更新：

```typescript
// tests/e2e/fixtures/testSetup.ts
import { test as baseTest, expect } from '@playwright/test';
import { {Category}{Screen}Page } from '../pages/{category}/{Category}{Screen}Page';

type Pages = {
  {category}{Screen}Page: {Category}{Screen}Page;
};

export const test = baseTest.extend<Pages>({
  {category}{Screen}Page: async ({ page }, use) => {
    const {category}{Screen}Page = new {Category}{Screen}Page(page);
    await {category}{Screen}Page.goto();
    await use({category}{Screen}Page);
  },
});

export { expect };
```

### テストコード生成

計画書のテストケース詳細に基づいて、AAAパターンでテストコードを生成：

```typescript
// tests/e2e/tests/{category}/{screen}.spec.ts
import { test, expect } from '../../fixtures/testSetup';

test.describe('{画面名}', () => {
  // 正常系
  test.describe('正常系', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page, page }) => {
      // Arrange（計画書のArrange内容）
      // ...

      // Act（計画書のAct内容）
      // ...

      // Assert（計画書のAssert内容）
      // ...
    });
  });

  // 異常系
  test.describe('異常系', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page }) => {
      // Arrange
      // ...

      // Act
      // ...

      // Assert
      // ...
    });
  });

  // 境界値
  test.describe('境界値', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page }) => {
      // Arrange
      // ...

      // Act
      // ...

      // Assert
      // ...
    });
  });
});
```

### テスト実行（サブエージェント）

トークン消費を抑えるため、テスト実行はTaskツールでサブエージェントに委譲：

```javascript
Task({
  description: "Playwrightテスト実行",
  prompt: `Playwrightテストを実行し、結果を報告してください。

テストコマンド: npx playwright test tests/e2e/tests/{category}/{screen}.spec.ts

報告形式:
- 全テスト成功の場合: "SUCCESS: X tests passed in Y seconds"
- 失敗がある場合: "FAILED: 以下のテストが失敗" + 失敗したテスト名とエラーメッセージのみ

注意: 成功したテストの詳細は報告不要。失敗したテストの情報のみ返すこと。`,
  subagent_type: "general-purpose",
  model: "haiku"
})
```

### 失敗時の対応

テスト失敗時、AskUserQuestionツールで対応を選択：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "以下のテストが失敗しました：\n\n[失敗したテスト名]\n[エラーメッセージ]\n\nどのように対応しますか？",
      header: "テスト失敗",
      options: [
        {
          label: "自動修正 (Recommended)",
          description: "エラーを分析してテストコードを自動修正"
        },
        {
          label: "スキップ",
          description: "失敗したテストをスキップして続行"
        },
        {
          label: "手動対応",
          description: "コマンドを終了して手動で修正"
        }
      ],
      multiSelect: false
    }
  ]
})
```

**「自動修正」を選択された場合**：
1. エラーメッセージを分析
2. 原因を特定（セレクタ不一致、タイミング問題、データ問題等）
3. テストコードまたはPage Objectを修正
4. テストを再実行
5. 成功するまで最大3回繰り返す

**「スキップ」を選択された場合**：
- 失敗したテストに `test.skip()` を追加
- 完了レポートに進む

### 完了レポート

以下の情報を表示してください：

```
✓ Playwrightテストコードの生成が完了しました

生成ファイル:
- tests/e2e/pages/{category}/{Category}{Screen}Page.ts (Page Object)
- tests/e2e/tests/{category}/{screen}.spec.ts (テストコード)
- tests/e2e/fixtures/testSetup.ts (フィクスチャ)

テスト結果:
- 合計: X tests
- 成功: Y tests
- 失敗: Z tests
- スキップ: W tests

実行時間: N seconds

カバレッジ:
- 正常系: A件
- 異常系: B件
- 境界値: C件
```

### 次のアクション確認

AskUserQuestionツールで次のアクションを確認：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "すべてのテストが完了しました。次のアクションを選択してください。",
      header: "次のアクション",
      options: [
        {
          label: "コミット (Recommended)",
          description: "変更をコミットする"
        },
        {
          label: "完了",
          description: "テストコード生成を終了"
        }
      ],
      multiSelect: false
    }
  ]
})
```

**「コミット (Recommended)」を選択された場合**：
```bash
git add tests/e2e/
git commit -m "test(e2e): add {category}/{screen} E2E tests

- Add {Category}{Screen}Page Page Object
- Add {screen}.spec.ts test cases
- Configure test fixtures

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**「完了」を選択された場合**：
- コマンドを終了
- 「テストコード生成が完了しました。テストを実行する場合は `npx playwright test` を使用してください」と表示

---

## ワークフロー図

```
/e2e-spec-design                    /e2e-spec-impl
      │                                   │
      ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│ 画面仕様書  │───────────────────▶│ テスト仕様書 │
│   読み込み   │                    │   読み込み   │
└─────────────┘                    └─────────────┘
      │                                   │
      ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│ テストケース │                    │  実装計画書  │
│    設計     │                    │    生成     │
└─────────────┘                    └─────────────┘
      │                                   │
      ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│ テスト仕様書 │                    │  実装方法   │
│    生成     │                    │    選択     │
└─────────────┘                    └─────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             ┌────────────┐       ┌────────────┐       ┌────────────┐
             │Yes（自動）  │       │このセッション│       │完了（手動）│
             │サブエージェント│      │  で続行    │       │計画書保存 │
             │ 新コンテキスト │      │既存コンテキスト│      │後で実装  │
             └────────────┘       └────────────┘       └────────────┘
                    │                     │
                    ▼                     ▼
             ┌─────────────────────────────┐
             │     Page Object生成         │
             │     テストコード生成        │
             │     テスト実行・検証        │
             └─────────────────────────────┘
```

---

## 重要な注意事項

### なぜ2段階ワークフローなのか

1. **コンテキスト蓄積問題の解決**: 仕様書読み込み → Page Object設計 → テストコード生成を1セッションで行うと、コンテキストが蓄積し後半で実装がブレる
2. **計画書が真実の情報源**: 計画書を生成してからサブエージェントに渡すことで、一貫した実装が可能
3. **柔軟な実行オプション**: 大規模テストは自動実装、小規模テストは現セッション継続など、状況に応じた選択が可能

### playwright-guidelinesとの連携

テストコードは以下のガイドラインに準拠：

- **Page Object Model**: 保守性を高めるためPOMパターンを適用
- **セレクタ戦略**: references/selector-strategy.md に従う
- **Laravel統合**: references/laravel-integration.md に従う
- **テスト安定性**: references/test-stability.md に従う

### エラーハンドリング

- テスト実行エラー時は明確なエラーメッセージを表示
- ユーザーに修正オプションを提供
- 自動修正は最大3回まで
- 3回失敗した場合は手動対応を促す
