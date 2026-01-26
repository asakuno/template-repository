# 実装計画書テンプレート

E2Eテスト実装計画書のテンプレートとガイドライン。

## 実装計画書フォーマット

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

#### アクションメソッド一覧
| メソッド名 | 引数 | 処理内容 |
|-----------|------|---------|
| {methodName}(args) | {型定義} | {処理の説明} |

#### アサーションメソッド一覧
| メソッド名 | 検証内容 |
|-----------|---------|
| {methodName}() | {検証内容の説明} |

## テストコード設計

### ファイル構成
- tests/e2e/tests/{category}/{screen}.spec.ts

### テストケース一覧
| テストID | テスト名 | AAAパターン概要 |
|----------|----------|----------------|
| {ID} | {name} | Arrange: {準備内容}, Act: {操作内容}, Assert: {検証内容} |

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

## 実装手順

1. [ ] BasePage確認・作成
2. [ ] {Category}{Screen}Page生成
3. [ ] testSetup.ts更新
4. [ ] テストコード生成（正常系）
5. [ ] テストコード生成（異常系）
6. [ ] テストコード生成（境界値）
7. [ ] テスト実行・検証
8. [ ] 完了レポート
```

## 実装ルール

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

## コードテンプレート

### BasePage

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

### Page Object

```typescript
// tests/e2e/pages/{category}/{Category}{Screen}Page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class {Category}{Screen}Page extends BasePage {
  readonly {locatorName}: Locator;

  constructor(page: Page) {
    super(page);
    this.{locatorName} = page.{セレクタ種別}('{セレクタ値}');
  }

  async goto() {
    await this.page.goto('/{endpoint}');
    await this.waitForPageLoad();
  }

  // アクションメソッド
  async {methodName}({args}) {
    // 処理内容
  }

  // アサーションメソッド
  async {assertMethodName}() {
    // 検証内容
  }
}
```

### フィクスチャ

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

### テストコード

```typescript
// tests/e2e/tests/{category}/{screen}.spec.ts
import { test, expect } from '../../fixtures/testSetup';

test.describe('{画面名}', () => {
  test.describe('正常系', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page, page }) => {
      // Arrange
      // ...

      // Act
      // ...

      // Assert
      // ...
    });
  });

  test.describe('異常系', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page }) => {
      // Arrange / Act / Assert
    });
  });

  test.describe('境界値', () => {
    test('{テストID}: {テスト名}', async ({ {category}{Screen}Page }) => {
      // Arrange / Act / Assert
    });
  });
});
```
