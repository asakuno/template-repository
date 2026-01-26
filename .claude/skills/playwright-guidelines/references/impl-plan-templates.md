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

## カバレッジサマリー

| タイプ | 対象件数 | 実装件数 | カバレッジ |
|--------|---------|---------|-----------|
| 正常系 | X | - | 0% |
| 異常系 | Y | - | 0% |
| 境界値 | Z | - | 0% |
| **合計** | **N** | **0** | **0%** |

※ 実装完了後、各タイプの実装件数とカバレッジを更新すること

## Page Object設計

### {Category}{Screen}Page
- 継承: BasePage
- ファイル: tests/e2e/pages/{category}/{Category}{Screen}Page.ts

#### ロケーター一覧
| 名前 | セレクタ種別 | セレクタ値 | 代替セレクタ | DOM確認結果 |
|------|-------------|-----------|-------------|------------|
| {locatorName} | `getByLabel` | `'メールアドレス'` | `getByRole('textbox')` | ✓ `<input aria-label="メールアドレス">` |
| {locatorName} | `getByRole` | `'button', { name: 'ログイン' }` | `getByText('ログイン')` | ✓ `<button>ログイン</button>` |

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

### テストデータ設計

| モデル | ファクトリー | ステート | カスタム属性 | 用途 |
|--------|-------------|---------|-------------|------|
| User | UserFactory | - | `{ email: 'test@example.com', password: 'password123' }` | 正常ログイン用ユーザー |
| User | UserFactory | unverified | `{ email: 'unverified@example.com' }` | 未認証エラーテスト用 |
| User | UserFactory | admin | `{ email: 'admin@example.com' }` | 管理者権限テスト用 |

### テストデータ（固定値）
| データ種別 | 値 | 用途 |
|-----------|-----|------|
| {dataType} | {value} | {用途の説明} |

## 実装手順

1. [ ] BasePage確認・作成
2. [ ] {Category}{Screen}Page生成
3. [ ] testSetup.ts更新
4. [ ] テストコード生成（正常系）
5. [ ] テストコード生成（異常系）
6. [ ] テストコード生成（境界値）
7. [ ] テスト実行・検証
8. [ ] カバレッジサマリー更新
9. [ ] 完了レポート

## 完了レポートフォーマット

実装完了時に以下のレポートを生成：

```markdown
# 実装完了レポート

## 実装サマリー
- 画面: {画面名}
- 実装日: {YYYY-MM-DD}
- 実装者: Claude Code

## カバレッジ結果

| タイプ | 対象件数 | 実装件数 | カバレッジ |
|--------|---------|---------|-----------|
| 正常系 | X | X | 100% |
| 異常系 | Y | Y | 100% |
| 境界値 | Z | Z | 100% |
| **合計** | **N** | **N** | **100%** |

## テスト実行結果
- 成功: {X}件
- 失敗: {Y}件
- スキップ: {Z}件

## 生成ファイル
- Page Object: tests/e2e/pages/{category}/{Category}{Screen}Page.ts
- テストコード: tests/e2e/tests/{category}/{screen}.spec.ts
- フィクスチャ更新: tests/e2e/fixtures/testSetup.ts

## 次のアクション
- [ ] コードレビュー依頼
- [ ] CI/CDでの実行確認
- [ ] 他画面との統合テスト
```
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

---

## 完全な実装例: ログイン画面

実際のプロジェクトで使用できる具体的な実装例。テンプレートの各セクションがどのように記述されるかを示す。

### 参照仕様書情報

```markdown
# ログイン画面 E2E実装計画書

## 参照仕様書
- パス: tests/e2e/specs/auth/login.spec.md
- 画面ID: SCR-AUTH-001
- テストケース数: 正常系2件, 異常系4件, 境界値3件（計9件）

## Playwright環境
- 設定ファイル: playwright.config.ts
- ベースURL: http://localhost:8000
- Laravel統合: hyvor/laravel-playwright 使用
```

### Page Object設計

#### AuthLoginPage

- 継承: BasePage
- ファイル: tests/e2e/pages/auth/AuthLoginPage.ts

#### ロケーター一覧

| 名前 | セレクタ種別 | セレクタ値 | 代替セレクタ | DOM確認結果 |
|------|-------------|-----------|-------------|------------|
| emailInput | `getByLabel` | `'メールアドレス'` | `getByRole('textbox', { name: 'メールアドレス' })` | ✓ `<input type="email" aria-label="メールアドレス">` |
| passwordInput | `getByLabel` | `'パスワード'` | `getByRole('textbox', { name: 'パスワード' })` | ✓ `<input type="password" aria-label="パスワード">` |
| loginButton | `getByRole` | `'button', { name: 'ログイン' }` | `getByText('ログイン')` | ✓ `<button type="submit">ログイン</button>` |
| errorMessage | `getByRole` | `'alert'` | `getByTestId('login-error')` | ✓ `<div role="alert" class="text-red-500">` |
| forgotPasswordLink | `getByRole` | `'link', { name: 'パスワードをお忘れですか？' }` | - | ✓ `<a href="/forgot-password">` |

#### アクションメソッド一覧

| メソッド名 | 引数 | 処理内容 |
|-----------|------|---------|
| `fillEmail(email: string)` | email: メールアドレス | メールアドレス入力欄に値を入力 |
| `fillPassword(password: string)` | password: パスワード | パスワード入力欄に値を入力 |
| `clickLogin()` | なし | ログインボタンをクリック |
| `login(email: string, password: string)` | email, password | 一連のログイン操作を実行 |

#### アサーションメソッド一覧

| メソッド名 | 検証内容 |
|-----------|---------|
| `expectErrorMessage(message: string)` | エラーメッセージが表示されていることを検証 |
| `expectNoErrorMessage()` | エラーメッセージが表示されていないことを検証 |
| `expectRedirectToDashboard()` | ダッシュボードへリダイレクトされたことを検証 |

### テストケース詳細

#### 正常系テストケース

##### AUTH_LOGIN_001: 有効な認証情報でログイン成功

- **Arrange**:
  - ユーザーを作成: `UserFactory::create(['email' => 'test@example.com', 'password' => Hash::make('password123')])`
  - ログイン画面にアクセス: `/login`
- **Act**:
  - メールアドレス欄に `test@example.com` を入力
  - パスワード欄に `password123` を入力
  - ログインボタンをクリック
- **Assert**:
  - ダッシュボード画面 (`/dashboard`) にリダイレクトされる
  - URL が `/dashboard` になっている
  - ナビゲーションにユーザー名が表示されている

##### AUTH_LOGIN_002: ログイン後にセッションが維持される

- **Arrange**:
  - `AUTH_LOGIN_001` と同様にログイン済み状態
- **Act**:
  - 別のページ (`/profile`) にアクセス
- **Assert**:
  - ログイン状態が維持されている
  - ログイン画面にリダイレクトされない

#### 異常系テストケース

##### AUTH_LOGIN_ERR_001: 存在しないメールアドレスでログイン失敗

- **Arrange**:
  - ログイン画面にアクセス
- **Act**:
  - メールアドレス欄に `nonexistent@example.com` を入力
  - パスワード欄に `password123` を入力
  - ログインボタンをクリック
- **Assert**:
  - エラーメッセージ「認証に失敗しました。」が表示される
  - URL が `/login` のまま

##### AUTH_LOGIN_ERR_002: 間違ったパスワードでログイン失敗

- **Arrange**:
  - ユーザーを作成: `UserFactory::create(['email' => 'test@example.com'])`
  - ログイン画面にアクセス
- **Act**:
  - メールアドレス欄に `test@example.com` を入力
  - パスワード欄に `wrongpassword` を入力
  - ログインボタンをクリック
- **Assert**:
  - エラーメッセージ「認証に失敗しました。」が表示される

##### AUTH_LOGIN_ERR_003: メールアドレス未入力でバリデーションエラー

- **Arrange**:
  - ログイン画面にアクセス
- **Act**:
  - メールアドレス欄を空のまま
  - パスワード欄に `password123` を入力
  - ログインボタンをクリック
- **Assert**:
  - エラーメッセージ「メールアドレスは必須です。」が表示される

##### AUTH_LOGIN_ERR_004: パスワード未入力でバリデーションエラー

- **Arrange**:
  - ログイン画面にアクセス
- **Act**:
  - メールアドレス欄に `test@example.com` を入力
  - パスワード欄を空のまま
  - ログインボタンをクリック
- **Assert**:
  - エラーメッセージ「パスワードは必須です。」が表示される

#### 境界値テストケース

##### AUTH_LOGIN_BND_001: メールアドレス最大長での入力

- **Arrange**:
  - 254文字のメールアドレスを持つユーザーを作成
  - ログイン画面にアクセス
- **Act**:
  - 254文字のメールアドレスを入力
  - 正しいパスワードを入力
  - ログインボタンをクリック
- **Assert**:
  - 正常にログインできる

##### AUTH_LOGIN_BND_002: パスワード最小長（8文字）での入力

- **Arrange**:
  - パスワード `12345678`（8文字）のユーザーを作成
  - ログイン画面にアクセス
- **Act**:
  - メールアドレスを入力
  - パスワード `12345678` を入力
  - ログインボタンをクリック
- **Assert**:
  - 正常にログインできる

##### AUTH_LOGIN_BND_003: 不正な形式のメールアドレス

- **Arrange**:
  - ログイン画面にアクセス
- **Act**:
  - メールアドレス欄に `invalid-email` を入力
  - パスワード欄に `password123` を入力
  - ログインボタンをクリック
- **Assert**:
  - エラーメッセージ「有効なメールアドレスを入力してください。」が表示される

### フィクスチャ設計

#### テストデータ設計

| モデル | ファクトリー | ステート | カスタム属性 | 用途 |
|--------|-------------|---------|-------------|------|
| User | UserFactory | - | `{ email: 'test@example.com', password: Hash::make('password123') }` | 正常ログイン用ユーザー |
| User | UserFactory | - | `{ email: 'max254chars...@example.com' }` | 最大長メールアドレステスト用 |
| User | UserFactory | - | `{ password: Hash::make('12345678') }` | 最小長パスワードテスト用 |

#### テストデータ（固定値）

| データ種別 | 値 | 用途 |
|-----------|-----|------|
| 無効メールアドレス | `nonexistent@example.com` | 存在しないユーザーテスト |
| 無効パスワード | `wrongpassword` | 認証失敗テスト |
| 不正形式メール | `invalid-email` | バリデーションエラーテスト |

### 完全なコード例

#### Page Object: AuthLoginPage.ts

```typescript
// tests/e2e/pages/auth/AuthLoginPage.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AuthLoginPage extends BasePage {
  // ロケーター定義
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('メールアドレス');
    this.passwordInput = page.getByLabel('パスワード');
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'パスワードをお忘れですか？' });
  }

  // ページ遷移
  async goto() {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  // アクションメソッド
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // アサーションメソッド
  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectNoErrorMessage() {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

#### フィクスチャ: testSetup.ts

```typescript
// tests/e2e/fixtures/testSetup.ts
import { test as baseTest, expect } from '@playwright/test';
import { AuthLoginPage } from '../pages/auth/AuthLoginPage';

type Pages = {
  authLoginPage: AuthLoginPage;
};

export const test = baseTest.extend<Pages>({
  authLoginPage: async ({ page }, use) => {
    const authLoginPage = new AuthLoginPage(page);
    await authLoginPage.goto();
    await use(authLoginPage);
  },
});

export { expect };
```

#### テストコード: login.spec.ts

```typescript
// tests/e2e/tests/auth/login.spec.ts
import { test, expect } from '../../fixtures/testSetup';

test.describe('ログイン画面', () => {
  test.describe('正常系', () => {
    test('AUTH_LOGIN_001: 有効な認証情報でログイン成功', async ({ authLoginPage, page }) => {
      // Arrange
      // Laravel ファクトリーでユーザー作成（hyvor/laravel-playwright使用時）
      // await page.request.post('/playwright/factory/User', {
      //   data: { email: 'test@example.com', password: 'password123' }
      // });

      // Act
      await authLoginPage.login('test@example.com', 'password123');

      // Assert
      await authLoginPage.expectRedirectToDashboard();
      await expect(page).toHaveURL('/dashboard');
    });

    test('AUTH_LOGIN_002: ログイン後にセッションが維持される', async ({ authLoginPage, page }) => {
      // Arrange
      await authLoginPage.login('test@example.com', 'password123');
      await authLoginPage.expectRedirectToDashboard();

      // Act
      await page.goto('/profile');

      // Assert
      await expect(page).not.toHaveURL('/login');
      await expect(page).toHaveURL('/profile');
    });
  });

  test.describe('異常系', () => {
    test('AUTH_LOGIN_ERR_001: 存在しないメールアドレスでログイン失敗', async ({ authLoginPage }) => {
      // Arrange - ログイン画面は fixture で既にアクセス済み

      // Act
      await authLoginPage.login('nonexistent@example.com', 'password123');

      // Assert
      await authLoginPage.expectErrorMessage('認証に失敗しました。');
    });

    test('AUTH_LOGIN_ERR_002: 間違ったパスワードでログイン失敗', async ({ authLoginPage }) => {
      // Arrange - ユーザーは事前にseeder等で作成済みと想定

      // Act
      await authLoginPage.login('test@example.com', 'wrongpassword');

      // Assert
      await authLoginPage.expectErrorMessage('認証に失敗しました。');
    });

    test('AUTH_LOGIN_ERR_003: メールアドレス未入力でバリデーションエラー', async ({ authLoginPage }) => {
      // Arrange - メールは入力しない

      // Act
      await authLoginPage.fillPassword('password123');
      await authLoginPage.clickLogin();

      // Assert
      await authLoginPage.expectErrorMessage('メールアドレスは必須です。');
    });

    test('AUTH_LOGIN_ERR_004: パスワード未入力でバリデーションエラー', async ({ authLoginPage }) => {
      // Arrange - パスワードは入力しない

      // Act
      await authLoginPage.fillEmail('test@example.com');
      await authLoginPage.clickLogin();

      // Assert
      await authLoginPage.expectErrorMessage('パスワードは必須です。');
    });
  });

  test.describe('境界値', () => {
    test('AUTH_LOGIN_BND_001: メールアドレス最大長での入力', async ({ authLoginPage }) => {
      // Arrange
      const maxLengthEmail = 'a'.repeat(245) + '@test.com'; // 254文字

      // Act
      await authLoginPage.login(maxLengthEmail, 'password123');

      // Assert
      await authLoginPage.expectRedirectToDashboard();
    });

    test('AUTH_LOGIN_BND_002: パスワード最小長（8文字）での入力', async ({ authLoginPage }) => {
      // Arrange - 8文字パスワードのユーザーを事前に作成

      // Act
      await authLoginPage.login('minpassword@example.com', '12345678');

      // Assert
      await authLoginPage.expectRedirectToDashboard();
    });

    test('AUTH_LOGIN_BND_003: 不正な形式のメールアドレス', async ({ authLoginPage }) => {
      // Arrange - 不正形式のメールアドレス

      // Act
      await authLoginPage.login('invalid-email', 'password123');

      // Assert
      await authLoginPage.expectErrorMessage('有効なメールアドレスを入力してください。');
    });
  });
});
```

### トレーサビリティマトリクス

| 画面要素ID | 要素名 | 機能種別 | テストケース | カバレッジ状況 |
|-----------|--------|---------|-------------|--------------|
| ELM-001 | メールアドレス入力欄 | 入力 | AUTH_LOGIN_001, AUTH_LOGIN_ERR_001, AUTH_LOGIN_ERR_003, AUTH_LOGIN_BND_001, AUTH_LOGIN_BND_003 | 正常系✓ 異常系✓ 境界値✓ |
| ELM-002 | パスワード入力欄 | 入力 | AUTH_LOGIN_001, AUTH_LOGIN_ERR_002, AUTH_LOGIN_ERR_004, AUTH_LOGIN_BND_002 | 正常系✓ 異常系✓ 境界値✓ |
| ELM-003 | ログインボタン | ナビゲーション | AUTH_LOGIN_001 | 正常系✓ 異常系- 境界値- |
| ELM-004 | エラーメッセージ表示エリア | 表示 | AUTH_LOGIN_ERR_001, AUTH_LOGIN_ERR_002, AUTH_LOGIN_ERR_003, AUTH_LOGIN_ERR_004 | 正常系✓ 異常系✓ 境界値- |
| ELM-005 | パスワードリセットリンク | ナビゲーション | - | 正常系✗ 異常系- 境界値- |

※ ELM-005（パスワードリセットリンク）は別仕様書 `forgot-password.spec.md` でカバー

---

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
