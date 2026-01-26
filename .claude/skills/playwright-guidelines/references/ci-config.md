# CI/CD設定

Playwright テストをCI/CD環境で安定して実行するための設定ガイド。

## 目次

- [クイックスタート](#クイックスタート)
- [playwright.config.ts](#playwrightconfigts)
- [GitHub Actions](#github-actions)
- [Docker対応](#docker対応)
- [環境変数](#環境変数)
- [レポート設定](#レポート設定)
- [トラブルシューティング](#トラブルシューティング)

---

## クイックスタート

E2Eテスト環境を素早くセットアップするためのコマンドと初期化スクリプト。

### 1. プロジェクト初期化コマンド

```bash
# 1. Playwright と依存関係のインストール
npm init playwright@latest

# 2. Laravel 統合パッケージのインストール
composer require hyvor/laravel-playwright --dev

# 3. Playwright ブラウザのインストール
npx playwright install --with-deps chromium

# 4. テストディレクトリ構造の作成
mkdir -p tests/e2e/{pages,tests,fixtures,specs}
mkdir -p tests/e2e/pages/{auth,dashboard}
mkdir -p tests/e2e/tests/{auth,dashboard}

# 5. 初期化スクリプトの実行（オプション）
./scripts/setup-e2e.sh
```

### 2. 初期化スクリプトテンプレート

以下のスクリプトを `scripts/setup-e2e.sh` として保存し、`chmod +x scripts/setup-e2e.sh` で実行権限を付与：

```bash
#!/bin/bash
# scripts/setup-e2e.sh
# E2Eテスト環境の初期化スクリプト

set -e

echo "🎭 E2Eテスト環境を初期化しています..."

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ステップ1: ディレクトリ構造の作成
echo -e "${YELLOW}[1/6] ディレクトリ構造を作成中...${NC}"
mkdir -p tests/e2e/{pages,tests,fixtures,specs}
mkdir -p tests/e2e/pages/{auth,dashboard,common}
mkdir -p tests/e2e/tests/{auth,dashboard}
mkdir -p tests/e2e/specs/{auth,dashboard}
mkdir -p .claude/e2e-impl-plans/{auth,dashboard}
echo -e "${GREEN}✓ ディレクトリ構造を作成しました${NC}"

# ステップ2: Playwright設定ファイルの確認
echo -e "${YELLOW}[2/6] Playwright設定を確認中...${NC}"
if [ ! -f "playwright.config.ts" ]; then
    echo "playwright.config.ts が見つかりません。作成しますか？ (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        npx playwright init --quiet
        echo -e "${GREEN}✓ playwright.config.ts を作成しました${NC}"
    fi
else
    echo -e "${GREEN}✓ playwright.config.ts は既に存在します${NC}"
fi

# ステップ3: Laravel Playwright パッケージ
echo -e "${YELLOW}[3/6] Laravel Playwright パッケージを確認中...${NC}"
if ! grep -q "hyvor/laravel-playwright" composer.json 2>/dev/null; then
    echo "hyvor/laravel-playwright をインストールしますか？ (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        composer require hyvor/laravel-playwright --dev
        php artisan vendor:publish --tag=playwright-config
        echo -e "${GREEN}✓ hyvor/laravel-playwright をインストールしました${NC}"
    fi
else
    echo -e "${GREEN}✓ hyvor/laravel-playwright は既にインストールされています${NC}"
fi

# ステップ4: ブラウザのインストール
echo -e "${YELLOW}[4/6] Playwright ブラウザを確認中...${NC}"
if ! npx playwright --version > /dev/null 2>&1; then
    npm install -D @playwright/test
fi
npx playwright install --with-deps chromium
echo -e "${GREEN}✓ Chromium ブラウザをインストールしました${NC}"

# ステップ5: BasePage の作成
echo -e "${YELLOW}[5/6] BasePage を確認中...${NC}"
if [ ! -f "tests/e2e/pages/BasePage.ts" ]; then
    cat > tests/e2e/pages/BasePage.ts << 'EOF'
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
EOF
    echo -e "${GREEN}✓ BasePage.ts を作成しました${NC}"
else
    echo -e "${GREEN}✓ BasePage.ts は既に存在します${NC}"
fi

# ステップ6: testSetup.ts の作成
echo -e "${YELLOW}[6/6] testSetup.ts を確認中...${NC}"
if [ ! -f "tests/e2e/fixtures/testSetup.ts" ]; then
    cat > tests/e2e/fixtures/testSetup.ts << 'EOF'
import { test as baseTest, expect } from '@playwright/test';

// Page Object をここにインポート
// import { AuthLoginPage } from '../pages/auth/AuthLoginPage';

type Pages = {
  // Page Object の型定義をここに追加
  // authLoginPage: AuthLoginPage;
};

export const test = baseTest.extend<Pages>({
  // Page Object のフィクスチャをここに追加
  // authLoginPage: async ({ page }, use) => {
  //   const authLoginPage = new AuthLoginPage(page);
  //   await authLoginPage.goto();
  //   await use(authLoginPage);
  // },
});

export { expect };
EOF
    echo -e "${GREEN}✓ testSetup.ts を作成しました${NC}"
else
    echo -e "${GREEN}✓ testSetup.ts は既に存在します${NC}"
fi

echo ""
echo -e "${GREEN}🎉 E2Eテスト環境の初期化が完了しました！${NC}"
echo ""
echo "次のステップ:"
echo "  1. playwright.config.ts を環境に合わせて調整"
echo "  2. /e2e-spec-design でテスト仕様書を作成"
echo "  3. /e2e-spec-impl でテストコードを生成"
echo ""
echo "テスト実行:"
echo "  npx playwright test                    # 全テスト実行"
echo "  npx playwright test --ui               # UIモードで実行"
echo "  npx playwright test --debug            # デバッグモードで実行"
```

### 3. package.json スクリプト追加

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:debug": "playwright test --debug",
    "e2e:report": "playwright show-report",
    "e2e:setup": "./scripts/setup-e2e.sh"
  }
}
```

### 4. 次のステップ

| ステップ | コマンド | 説明 |
|---------|---------|------|
| 環境セットアップ | `npm run e2e:setup` または `./scripts/setup-e2e.sh` | ディレクトリ構造とBasePage作成 |
| テスト仕様書作成 | `/e2e-spec-design docs/specs/auth/login.md` | 画面仕様書からテスト仕様書生成 |
| テストコード生成 | `/e2e-spec-impl tests/e2e/specs/auth/login.spec.md` | 仕様書からPlaywrightコード生成 |
| テスト実行 | `npm run e2e` | 全E2Eテスト実行 |
| レポート確認 | `npm run e2e:report` | HTMLレポート表示 |

---

## playwright.config.ts

### 本番向け設定

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e/tests',

  // 並列実行
  fullyParallel: true,

  // CI環境ではtest.onlyを禁止
  forbidOnly: !!process.env.CI,

  // リトライ設定（CIでは2回リトライ）
  retries: process.env.CI ? 2 : 0,

  // ワーカー数（CIでは1、ローカルでは自動）
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: process.env.CI
    ? [
        ['blob'],                                           // シャーディング用
        ['github'],                                         // GitHub Actions統合
        ['junit', { outputFile: 'test-results/results.xml' }]  // JUnit形式
      ]
    : [
        ['html'],   // HTMLレポート
        ['list']    // コンソール出力
      ],

  // グローバル設定
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',

    // 失敗時のみトレース保存
    trace: 'retain-on-failure',

    // 失敗時のみスクリーンショット
    screenshot: 'only-on-failure',

    // 失敗時のみ動画保存
    video: 'retain-on-failure',
  },

  // タイムアウト設定
  timeout: 60000,        // テスト全体
  expect: {
    timeout: 10000       // アサーション
  },

  // CI環境での最大失敗数（早期終了）
  maxFailures: process.env.CI ? 10 : undefined,

  // プロジェクト設定
  projects: [
    // 認証セットアップ
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    // Chromiumテスト
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },
    // Firefoxテスト（オプション）
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },
    // モバイルテスト（オプション）
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    }
  ],

  // ローカルサーバー設定
  webServer: {
    command: 'php artisan serve --port=8000 --env=testing',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

## 並列実行の考慮事項

ワーカー数の設定は環境によって適切な値が異なる。

### ワーカー数の推奨設定

| 環境 | Workers | 理由 |
|------|---------|------|
| ローカル | `undefined`（自動） | 開発速度優先、CPU数に応じて自動調整 |
| CI（小規模） | `1` | データベース競合回避、リソース節約 |
| CI（大規模） | `2-4` | テスト時間短縮（シャーディング併用推奨） |

### 設定例

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

// ワーカー数を環境変数で設定可能に
const workers = process.env.PLAYWRIGHT_WORKERS
  ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
  : process.env.CI ? 1 : undefined;

export default defineConfig({
  workers,
  // ...
});
```

### CI環境変数での制御

```yaml
# .github/workflows/e2e.yml
env:
  PLAYWRIGHT_WORKERS: 2  # ワーカー数を指定
  PLAYWRIGHT_RETRIES: 2  # フレーキーテスト対策（最大2回リトライ）
```

### シャーディング vs ワーカー

| 方式 | 説明 | 使い分け |
|------|------|----------|
| **Workers** | 1ジョブ内での並列実行 | テスト数が少ない場合（〜50件） |
| **Sharding** | 複数ジョブでの並列実行 | テスト数が多い場合（50件〜） |
| **組み合わせ** | シャード×ワーカー | 大規模テストスイート |

シャーディングを使用する場合は、下記「シャーディング対応」セクションを参照。

## GitHub Actions

### 基本設定

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  playwright-tests:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: testing
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v4

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.4'
        extensions: mbstring, dom, fileinfo, mysql

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 'lts/*'
        cache: 'npm'

    - name: Install PHP dependencies
      run: composer install --no-progress --prefer-dist

    - name: Install Node dependencies
      run: npm ci

    - name: Setup environment
      run: |
        cp .env.testing .env
        php artisan key:generate
        php artisan migrate --force

    - name: Build assets
      run: npm run build

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Run Playwright tests
      run: npx playwright test
      env:
        BASE_URL: http://localhost:8000

    - name: Upload test results
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 14
```

### シャーディング対応（並列実行）

```yaml
# .github/workflows/playwright-sharded.yml
name: Playwright Tests (Sharded)
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

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: testing
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v4

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.4'

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 'lts/*'
        cache: 'npm'

    - name: Install dependencies
      run: |
        composer install --no-progress --prefer-dist
        npm ci

    - name: Setup environment
      run: |
        cp .env.testing .env
        php artisan key:generate
        php artisan migrate --force

    - name: Build assets
      run: npm run build

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
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 'lts/*'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Download blob reports
      uses: actions/download-artifact@v4
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

## Docker対応

### Dockerfile

```dockerfile
# Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

# Node依存関係
COPY package*.json ./
RUN npm ci

# PHPインストール
RUN apt-get update && apt-get install -y \
    php8.3-cli \
    php8.3-mysql \
    php8.3-xml \
    php8.3-curl \
    php8.3-mbstring \
    && rm -rf /var/lib/apt/lists/*

# Composerインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# PHP依存関係
COPY composer.json composer.lock ./
RUN composer install --no-scripts

# アプリケーションコピー
COPY . .

# アセットビルド
RUN npm run build

CMD ["npx", "playwright", "test"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    environment:
      - BASE_URL=http://app:8000
      - CI=true
    depends_on:
      - app
      - mysql
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results

  app:
    build: .
    command: php artisan serve --host=0.0.0.0 --port=8000 --env=testing
    environment:
      - DB_HOST=mysql
      - DB_DATABASE=testing
      - DB_USERNAME=root
      - DB_PASSWORD=password
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: testing
    ports:
      - "3306:3306"
```

## 環境変数

### .env.testing

```env
APP_NAME="Laravel Testing"
APP_ENV=testing
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=testing
DB_USERNAME=root
DB_PASSWORD=password

CACHE_DRIVER=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
SESSION_LIFETIME=120

PLAYWRIGHT_ENABLED=true
```

### CI環境変数

```yaml
# GitHub Actions環境変数
env:
  BASE_URL: http://localhost:8000
  CI: true
  DB_CONNECTION: mysql
  DB_HOST: 127.0.0.1
  DB_DATABASE: testing
  DB_USERNAME: root
  DB_PASSWORD: password
```

## レポート設定

### HTMLレポート

```typescript
// playwright.config.ts
reporter: [
  ['html', {
    outputFolder: 'playwright-report',
    open: 'never'  // CI環境では自動で開かない
  }]
]
```

### JUnitレポート

```typescript
reporter: [
  ['junit', {
    outputFile: 'test-results/results.xml',
    embedAnnotationsAsProperties: true
  }]
]
```

### カスタムレポーター

```typescript
// reporters/custom-reporter.ts
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class CustomReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Test ${test.title}: ${result.status}`);
  }

  onEnd() {
    console.log('All tests completed');
  }
}

export default CustomReporter;
```

## トラブルシューティング

### よくある問題と解決策

#### ブラウザインストールエラー

```bash
# 依存関係も含めてインストール
npx playwright install --with-deps

# 特定ブラウザのみ
npx playwright install --with-deps chromium
```

#### タイムアウトエラー

```typescript
// タイムアウトを延長
test.setTimeout(120000);

// アサーションタイムアウト
expect.configure({ timeout: 20000 });
```

#### ネットワークエラー

```typescript
// リトライ設定を追加
export default defineConfig({
  retries: 2,
  use: {
    navigationTimeout: 30000,
    actionTimeout: 15000,
  }
});
```

#### メモリ不足

```yaml
# GitHub Actionsでメモリ制限
- name: Run tests with memory limit
  run: node --max-old-space-size=4096 node_modules/.bin/playwright test
```

### デバッグ用設定

```typescript
// ローカルデバッグ用設定
export default defineConfig({
  use: {
    // 全てのトレースを保存
    trace: 'on',
    // 全てのスクリーンショット
    screenshot: 'on',
    // 全ての動画
    video: 'on',
    // ヘッドモード
    headless: false,
    // スローモーション
    launchOptions: {
      slowMo: 500
    }
  }
});
```
