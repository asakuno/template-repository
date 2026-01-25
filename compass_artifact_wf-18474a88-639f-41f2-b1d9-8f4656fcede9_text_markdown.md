# Playwrightで保守性を高める実践ガイド

**Laravel + Inertia + Reactプロジェクトでのテスト自動化を成功させる鍵は、適切なデザインパターン、安定したセレクタ戦略、そして再利用可能なテストコード設計にある。** 本レポートでは、2025-2026年時点での最新ベストプラクティスを網羅し、即座に適用可能な具体的なコード例を提供する。特にPlaywright v1.57以降の新機能と、Laravel固有の統合パターンに焦点を当てる。

---

## Page Object Modelで実現する保守性の高いテスト設計

Page Object Model（POM）は、UIテストの保守性を劇的に向上させる設計パターンである。ページの構造をクラスとしてカプセル化することで、UIが変更されても修正箇所を1箇所に限定できる。

### 基本的なPOM実装パターン

```typescript
// pages/LoginPage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // ロケーターはコンストラクタで定義（遅延評価される）
    this.emailInput = page.getByLabel('メールアドレス');
    this.passwordInput = page.getByLabel('パスワード');
    this.signInButton = page.getByRole('button', { name: 'ログイン' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### Fixtureと組み合わせた再利用パターン

POMをFixtureと組み合わせることで、テストコードがさらにシンプルになる：

```typescript
// fixtures/testSetup.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
```

```typescript
// tests/login.spec.ts
import { test, expect } from '../fixtures/testSetup';

test('有効な認証情報でログインできる', async ({ loginPage, page }) => {
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL(/dashboard/);
});

test('無効な認証情報でエラーが表示される', async ({ loginPage }) => {
  await loginPage.login('invalid@example.com', 'wrongpassword');
  await loginPage.expectError('認証情報が正しくありません');
});
```

---

## セレクタ戦略：安定性と保守性のバランス

Playwrightの公式ドキュメントでは、**ユーザー視点のセレクタを優先**することが推奨されている。以下に優先順位を示す：

| 優先度 | メソッド | 使用場面 |
|--------|----------|----------|
| 1️⃣ | `getByRole()` | ボタン、チェックボックス、見出し、リンク |
| 2️⃣ | `getByLabel()` | ラベル付きのフォーム要素 |
| 3️⃣ | `getByPlaceholder()` | プレースホルダー付き入力欄 |
| 4️⃣ | `getByText()` | 非インタラクティブ要素（div、span、p） |
| 5️⃣ | `getByTestId()` | 明示的なテスト用契約（data-testid） |
| ⚠️ | CSS/XPath | **最後の手段のみ** |

### 良いセレクタと悪いセレクタの比較

```typescript
// ❌ 悪い例：CSSクラスセレクタ（DOM構造に依存、脆弱）
page.locator('button.btn-primary.submit-form');
page.locator('#app > div:nth-child(2) > form > button');

// ✅ 良い例：ロールベースロケーター（DOM変更に強い）
page.getByRole('button', { name: '送信' });
page.getByRole('heading', { name: 'ユーザー登録' });
page.getByRole('checkbox', { name: 'ニュースレターを購読' });

// ✅ 良い例：ラベルベース（フォーム要素に最適）
page.getByLabel('ユーザー名');
page.getByLabel('パスワード');

// ✅ 良い例：テストID（複雑な要素の特定に有効）
page.getByTestId('submit-button');
```

### 高度なロケーターテクニック

```typescript
// チェーンでスコープを絞り込む
const product = page.getByRole('listitem').filter({ hasText: '商品A' });
await product.getByRole('button', { name: 'カートに追加' }).click();

// .and()で複数条件を組み合わせる
const button = page.getByRole('button').and(page.getByTitle('購読'));

// .or()で代替マッチング
const element = page.getByRole('button', { name: '新規' })
  .or(page.getByText('セキュリティ設定を確認'));

// 子要素でフィルタリング
await page.getByRole('listitem')
  .filter({ has: page.getByRole('heading', { name: '商品B' }) })
  .getByRole('button', { name: 'カートに追加' })
  .click();

// 特定のテキストを含まない要素
await expect(page.getByRole('listitem')
  .filter({ hasNotText: '在庫切れ' })).toHaveCount(5);
```

### カスタムTestID属性の設定

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    testIdAttribute: 'data-pw'  // data-testidの代わりにdata-pwを使用
  }
});
```

---

## テストの安定性を高める方法

### Auto-waitingの仕組みを理解する

Playwrightは**アクション実行前に自動的に要素の状態をチェック**する。手動での待機処理は原則不要である：

- **アタッチ済み**：DOMに存在している
- **可視**：表示されている（visibility:hiddenでない）
- **安定**：アニメーション中でない
- **有効**：disabledでない
- **イベント受信可能**：他の要素に覆われていない

```typescript
// ✅ Playwrightが自動的に待機する
await page.getByRole('button', { name: '送信' }).click();

// ❌ 絶対に使わない：任意の時間待機（フレーキーの原因）
await page.waitForTimeout(3000);
```

### Web-first Assertionsを活用する

**Web-first assertions**は条件が満たされるまで自動リトライする。**Generic assertions**は即座にチェックするだけでリトライしない：

```typescript
// ✅ Web-first assertion（自動リトライ、デフォルト5秒）
await expect(page.getByText('ようこそ')).toBeVisible();
await expect(page.locator('.status')).toHaveText('送信完了');
await expect(page).toHaveURL('/dashboard');

// ❌ Generic assertion（リトライなし、フレーキーの原因）
expect(await page.getByText('ようこそ').isVisible()).toBe(true);
```

### ネットワークモッキングで外部依存を排除

```typescript
test('APIレスポンスをモックしてテスト', async ({ page }) => {
  // APIリクエストをインターセプトしてモック
  await page.route('**/api/products', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'テスト商品', price: 2999 }
      ])
    });
  });

  await page.goto('/products');
  await expect(page.getByText('テスト商品')).toBeVisible();
});

// エラーレスポンスのテスト
test('APIエラー時のエラーハンドリング', async ({ page }) => {
  await page.route('**/api/data', route => route.abort());
  
  await page.goto('/');
  await expect(page.getByText('データの読み込みに失敗しました')).toBeVisible();
});

// HAR形式でレスポンスを記録・再生
test('HARファイルからレスポンスを再生', async ({ page }) => {
  await page.routeFromHAR('tests/fixtures/api.har', { 
    url: '**/api/**',
    update: false  // trueで記録、falseで再生
  });
  
  await page.goto('/');
});
```

### テスト分離とブラウザコンテキスト

Playwrightは**各テストに独立したBrowserContextを自動生成**する。これはシークレットモードと同等で、Cookie、localStorage、キャッシュがすべて分離される：

```typescript
test('テスト1', async ({ page, context }) => {
  // このcontextはテスト1専用
  await page.evaluate(() => localStorage.setItem('key', 'value'));
});

test('テスト2', async ({ page }) => {
  // テスト1とは完全に分離されている
  const value = await page.evaluate(() => localStorage.getItem('key'));
  expect(value).toBeNull(); // 共有されていない！
});
```

---

## 共通処理の再利用パターン

### Worker-scopedフィクスチャで認証を効率化

認証は一度だけ実行し、その状態を再利用することでテスト時間を大幅に短縮できる：

```typescript
// auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('認証', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('user@example.com');
  await page.getByLabel('パスワード').fill('password');
  await page.getByRole('button', { name: 'ログイン' }).click();
  
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFile });
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
        storageState: 'playwright/.auth/user.json' 
      },
      dependencies: ['setup']
    }
  ]
});
```

### データ生成ヘルパー

```typescript
// utils/dataFactory.ts
import { faker } from '@faker-js/faker';

export function generateUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
  };
}

export function generateProduct() {
  return {
    name: faker.commerce.productName(),
    price: faker.commerce.price({ min: 1000, max: 10000 }),
    description: faker.commerce.productDescription(),
  };
}
```

### 共通アクションの抽象化

```typescript
// utils/actions.ts
import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

export async function addToCart(page: Page, productId: string) {
  await page.goto(`/products/${productId}`);
  await page.getByRole('button', { name: 'カートに追加' }).click();
  await expect(page.getByText('カートに追加しました')).toBeVisible();
}
```

---

## Laravel + Inertia固有の考慮事項

### Laravel Playwrightパッケージの活用

**hyvor/laravel-playwright**（v2.0.2、2025年3月更新）を使用することで、PlaywrightからLaravelバックエンドを直接操作できる：

```bash
# Laravelプロジェクト
composer require --dev hyvor/laravel-playwright

# Playwright側
npm install @hyvor/laravel-playwright
```

```typescript
// Laravelのファクトリー・マイグレーションを直接呼び出す
import { test } from '@hyvor/laravel-playwright';

test('データベースセットアップ付きテスト', async ({ laravel, page }) => {
  // Artisanコマンド実行
  await laravel.artisan('migrate:fresh');
  await laravel.artisan('db:seed', ['--class', 'DatabaseSeeder']);
  
  // ファクトリーでモデル作成
  const user = await laravel.factory('User', { 
    name: '山田太郎',
    email: 'yamada@example.com' 
  });
  
  // 複数モデル作成
  const posts = await laravel.factory('Post', {}, 5);
  
  // DBクエリ実行
  await laravel.query('DELETE FROM sessions');
  
  // テーブルトランケート
  await laravel.truncate();
});
```

### Inertiaナビゲーションのテスト

```typescript
test('Inertiaナビゲーションが正しく動作する', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Inertiaリンクをクリック
  await page.click('a[href="/settings"]');
  
  // ページ遷移を待機（フルページリロードなし）
  await page.waitForURL('/settings');
  
  // コンポーネントがレンダリングされたことを確認
  await expect(page.locator('h1')).toContainText('設定');
});

test('Inertiaフォーム送信', async ({ page }) => {
  await page.goto('/posts/create');
  
  await page.fill('[name="title"]', 'テスト投稿');
  await page.fill('[name="content"]', 'テスト内容');
  
  // 送信（InertiaがAJAXで処理）
  await page.click('button[type="submit"]');
  
  // 成功後のリダイレクトを待機
  await page.waitForURL('/posts/*');
  
  await expect(page.getByText('投稿を作成しました')).toBeVisible();
});
```

### CSRF対策の処理

Laravel環境では`APP_ENV=testing`設定時にCSRF検証が自動スキップされる。手動で必要な場合：

```typescript
// ページからCSRFトークンを取得
const csrfToken = await page.evaluate(() => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
});
```

---

## CI/CD環境でのベストプラクティス

### GitHub Actions設定（シャーディング対応）

```yaml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  playwright-tests:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium
    - name: Run Playwright tests
      run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    - name: Upload blob report
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: blob-report-${{ matrix.shardIndex }}
        path: blob-report
        retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [playwright-tests]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Download blob reports
      uses: actions/download-artifact@v5
      with:
        path: all-blob-reports
        pattern: blob-report-*
        merge-multiple: true
    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports
    - name: Upload HTML report
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report
        retention-days: 14
```

### CI向けplaywright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: process.env.CI 
    ? [['blob'], ['github'], ['junit', { outputFile: 'test-results/results.xml' }]] 
    : [['html'], ['list']],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  timeout: 60000,
  expect: { timeout: 10000 },
  maxFailures: process.env.CI ? 10 : undefined,

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    }
  ],

  webServer: {
    command: 'php artisan serve --port=8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## 2025-2026年の最新機能と動向

Playwright **v1.57以降**で追加された注目機能：

- **Locator Descriptions**：デバッグ時のわかりやすさ向上
  ```typescript
  const button = page.getByTestId('btn-sub').describe('購読ボタン');
  console.log(button.description()); // "購読ボタン"
  ```

- **failOnFlakyTests設定**：CIでフレーキーテストを検出したら失敗扱い
  ```typescript
  export default defineConfig({
    failOnFlakyTests: true
  });
  ```

- **test.step.skip()**：まだ準備できていないステップをスキップ
  ```typescript
  await test.step.skip('未実装の機能', async () => { /* ... */ });
  ```

- **プロジェクト単位のworkers設定**
  ```typescript
  projects: [{
    name: 'chromium',
    workers: 4  // プロジェクト固有のworker数
  }]
  ```

---

## チーム開発での効率化

### 推奨フォルダ構成

```
tests/
├── fixtures/
│   └── testSetup.ts
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── BasePage.ts
├── utils/
│   ├── dataFactory.ts
│   └── testHelpers.ts
├── specs/
│   ├── auth/
│   │   └── login.spec.ts
│   └── dashboard/
│       └── widgets.spec.ts
└── auth.setup.ts
```

### 命名規則

| 項目 | 規則 | 例 |
|------|------|-----|
| テストファイル | kebab-case | `login-flow.spec.ts` |
| Pageクラス | PascalCase | `LoginPage`, `DashboardPage` |
| メソッド | camelCase | `login()`, `navigateToHome()` |
| ブール値 | is/has接頭辞 | `isLoggedIn`, `hasError` |

### レビューしやすいテストの書き方

```typescript
// ✅ 良い例：AAA（Arrange-Act-Assert）パターン
test('ユーザーが商品をカートに追加できる', async ({ page }) => {
  // Arrange（準備）
  const productPage = new ProductPage(page);
  await productPage.navigate();
  
  // Act（実行）
  await productPage.addToCart('商品A');
  
  // Assert（検証）
  await expect(productPage.cartCount).toHaveText('1');
});

// ✅ 良い例：テスト名が意図を明確に説明
test('無効なクレジットカードで決済が失敗する', async ({ page }) => {});

// ❌ 悪い例：曖昧なテスト名
test('test1', async ({ page }) => {});
test('ログインテスト', async ({ page }) => {});
```

---

## 結論

Playwrightでの保守性向上は、**設計パターンの適切な活用**と**安定したセレクタ戦略**の両輪で実現される。POMとFixtureの組み合わせにより、テストコードの重複を最小化しながらも、変更に強い構造を構築できる。

特にLaravel + Inertia + React環境では、`hyvor/laravel-playwright`パッケージを活用することで、バックエンドのデータベース操作とフロントエンドのE2Eテストをシームレスに統合できる。CI/CD環境ではシャーディングによる並列実行と、`trace: 'retain-on-failure'`によるデバッグ効率化が必須である。

重要なのは、**Auto-waitingを信頼し、手動waitを排除すること**、**Web-first Assertionsを徹底すること**、そして**テスト間の状態分離を保つこと**である。これらの原則を守ることで、フレーキーテストを根本から防ぎ、信頼性の高いテストスイートを維持できる。