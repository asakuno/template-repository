---
description: "E2Eテスト仕様書からPlaywrightテストコードを生成。Page Object Modelパターンを適用し、hyvor/laravel-playwright統合でLaravelファクトリーを活用。"
argument-hint: "<テスト仕様書パス> (例: tests/e2e/specs/auth/login.spec.md)"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion", "TodoWrite", "Task", "Skill"]
---

# /e2e-spec-impl - Playwrightテストコード生成コマンド

このコマンドは、E2Eテスト仕様書からPlaywrightテストコードを生成します。
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

## [1/5] 仕様書読み込み・環境確認

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

```bash
# Playwrightインストール
npm init playwright@latest

# hyvor/laravel-playwright インストール
composer require hyvor/laravel-playwright --dev
npm install @hyvor/laravel-playwright
```

---

## [2/5] Page Object生成

### スキル参照

Skillツールでplaywright-guidelinesを参照し、POMパターンを確認してください：

```javascript
Skill({
  skill: "playwright-guidelines"
})
```

### TodoWriteでタスク管理

Page Object生成のタスクを登録：

```javascript
TodoWrite({
  todos: [
    { content: "BasePage 確認・作成", activeForm: "BasePageを確認中", status: "pending" },
    { content: "[Screen]Page 生成", activeForm: "[Screen]Pageを生成中", status: "pending" }
  ]
})
```

### BasePage確認・作成

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

### 画面固有Page Object生成

仕様書の「Page Object要件」セクションを参照し、以下のパターンでPage Objectを生成：

```typescript
// tests/e2e/pages/{Screen}Page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class {Screen}Page extends BasePage {
  // ロケーター定義（constructor内で初期化）
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // ロールベースロケーター優先
    this.emailInput = page.getByLabel('メールアドレス');
    this.passwordInput = page.getByLabel('パスワード');
    this.submitButton = page.getByRole('button', { name: 'ログイン' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/[endpoint]');
    await this.waitForPageLoad();
  }

  // アクションメソッド（ユーザー操作を表現）
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // アサーションメソッド（期待結果を検証）
  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
```

### セレクタ戦略

セレクタは以下の優先順位で選択：

1. **`getByRole()`** - ボタン、チェックボックス、見出し、リンク
2. **`getByLabel()`** - ラベル付きフォーム要素
3. **`getByPlaceholder()`** - プレースホルダー付き入力欄
4. **`getByText()`** - 非インタラクティブ要素
5. **`getByTestId()`** - 上記で特定できない場合のみ（最後の手段）

### Page Object確認

AskUserQuestionツールでPage Objectを確認：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "以下のPage Objectを生成しました：\n\n- tests/e2e/pages/{Screen}Page.ts\n  - ロケーター: X個\n  - アクションメソッド: Y個\n  - アサーションメソッド: Z個\n\nこのPage Objectで進めてよろしいですか？",
      header: "Page Object確認",
      options: [
        {
          label: "承認",
          description: "このPage Objectでテストコード生成に進む"
        },
        {
          label: "却下",
          description: "コマンドを終了"
        }
      ],
      multiSelect: false
    }
  ]
})
```

---

## [3/5] テストコード生成

### TodoWriteでタスク管理

テストコード生成のタスクを登録：

```javascript
TodoWrite({
  todos: [
    { content: "フィクスチャ確認・作成", activeForm: "フィクスチャを確認中", status: "pending" },
    { content: "正常系テストコード生成", activeForm: "正常系テストを生成中", status: "pending" },
    { content: "異常系テストコード生成", activeForm: "異常系テストを生成中", status: "pending" },
    { content: "境界値テストコード生成", activeForm: "境界値テストを生成中", status: "pending" }
  ]
})
```

### フィクスチャ確認・作成

`tests/e2e/fixtures/testSetup.ts` を確認し、なければ作成：

```typescript
// tests/e2e/fixtures/testSetup.ts
import { test as baseTest, expect } from '@playwright/test';
import { {Screen}Page } from '../pages/{Screen}Page';

type Pages = {
  {screen}Page: {Screen}Page;
};

export const test = baseTest.extend<Pages>({
  {screen}Page: async ({ page }, use) => {
    const {screen}Page = new {Screen}Page(page);
    await {screen}Page.goto();
    await use({screen}Page);
  },
});

export { expect };
```

### テストコード生成

仕様書のテストケースに基づいて、AAAパターンでテストコードを生成：

```typescript
// tests/e2e/tests/{category}/{screen}.spec.ts
import { test, expect } from '../../fixtures/testSetup';

test.describe('[画面名]', () => {
  // 正常系
  test.describe('正常系', () => {
    test('[テストID]: [テスト名]', async ({ {screen}Page, page }) => {
      // Arrange（前提条件）
      const testData = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Act（操作実行）
      await {screen}Page.login(testData.email, testData.password);

      // Assert（期待結果検証）
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  // 異常系
  test.describe('異常系', () => {
    test('[テストID]: [テスト名]', async ({ {screen}Page }) => {
      // Arrange
      const invalidData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      // Act
      await {screen}Page.login(invalidData.email, invalidData.password);

      // Assert
      await {screen}Page.expectError('認証情報が正しくありません');
    });
  });

  // 境界値
  test.describe('境界値', () => {
    test('[テストID]: [テスト名]', async ({ {screen}Page }) => {
      // Arrange
      const emptyData = { email: '', password: '' };

      // Act
      await {screen}Page.login(emptyData.email, emptyData.password);

      // Assert
      await expect({screen}Page.submitButton).toBeDisabled();
    });
  });
});
```

### Laravel統合（hyvor/laravel-playwright使用時）

Laravelファクトリーを使用するテストケースの場合：

```typescript
import { test } from '@hyvor/laravel-playwright';

test.describe('[画面名] with Laravel Integration', () => {
  test.beforeEach(async ({ laravel }) => {
    // データベースリセット
    await laravel.artisan('migrate:fresh');
  });

  test('[テストID]: [テスト名]', async ({ laravel, page }) => {
    // Arrange - Laravelファクトリーでデータ作成
    const user = await laravel.factory('User', {
      name: 'テストユーザー',
      email: 'test@example.com'
    });

    // Act
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(user.email);
    await page.getByLabel('パスワード').fill('password');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // Assert
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### テストコード確認

AskUserQuestionツールでテストコードを確認：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "以下のテストコードを生成しました：\n\n- tests/e2e/tests/{category}/{screen}.spec.ts\n  - 正常系: X件\n  - 異常系: Y件\n  - 境界値: Z件\n\nこのテストコードで実行に進みますか？",
      header: "テストコード確認",
      options: [
        {
          label: "承認",
          description: "テスト実行に進む"
        },
        {
          label: "却下",
          description: "コマンドを終了"
        }
      ],
      multiSelect: false
    }
  ]
})
```

---

## [4/5] テスト実行・検証

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
- 次のフェーズに進む

### 成功時の処理

すべてのテストが成功したら、次のフェーズに進む。

---

## [5/5] 完了レポート

### サマリー表示

以下の情報を表示してください：

```
✓ Playwrightテストコードの生成が完了しました

生成ファイル:
- tests/e2e/pages/{Screen}Page.ts (Page Object)
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
          label: "コミット",
          description: "変更をコミットする"
        },
        {
          label: "別の仕様書を実装",
          description: "別のテスト仕様書からテストコードを生成"
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

**「コミット」を選択された場合**：
```bash
git add tests/e2e/
git commit -m "test(e2e): add {screen} E2E tests

- Add {Screen}Page Page Object
- Add {screen}.spec.ts test cases
- Configure test fixtures

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**「別の仕様書を実装」を選択された場合**：
- [1/5] 仕様書読み込み・環境確認に戻る

**「完了」を選択された場合**：
- コマンドを終了
- 「テストコード生成が完了しました。テストを実行する場合は `npx playwright test` を使用してください」と表示

---

## 重要な注意事項

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
