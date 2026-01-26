---
name: playwright-guidelines
description: E2Eテスト仕様書の作成とPlaywrightテストコード生成のガイドライン。画面仕様書（Excel/Markdown）から日本語テスト仕様書を作成し、Playwrightテストコードを生成する2ステップワークフロー。Laravel + Inertia.js + React環境に特化し、hyvor/laravel-playwright統合をサポート。/e2e-spec-design（仕様書作成）と/e2e-spec-impl（テスト実装）の2コマンドで実行。E2Eテスト、Playwright、テスト仕様書、POM、Page Object Model、ブラウザテスト自動化、画面テスト、結合テストに使用。
---

# Playwright E2E Testing Guidelines

画面仕様書からE2Eテスト仕様書を作成し、Playwrightテストコードを生成するためのガイドライン。

## Overview

このスキルは以下の2ステップワークフローを提供する:

1. **Phase 1: 仕様書作成** (`/e2e-spec-design`)
   - 画面仕様書（Excel/Markdown）を入力として受け取る
   - 日本語でE2Eテスト仕様書を作成
   - ユーザー承認後にPhase 2へ

2. **Phase 2: テスト実装** (`/e2e-spec-impl`)
   - 承認済みテスト仕様書をもとにPlaywrightテストコードを生成
   - Page Object Model（POM）パターンを適用
   - hyvor/laravel-playwright統合でLaravelファクトリーを活用

## Quick Reference

### テスト仕様書作成時のチェックリスト

- [ ] 画面単位でテストケースを整理
- [ ] 正常系・異常系・境界値を網羅
- [ ] **バリデーションルール100%網羅（必須）**
- [ ] 前提条件（認証状態、データ状態）を明記
- [ ] 操作手順を具体的に記述
- [ ] 期待結果を検証可能な形式で記述
- [ ] テストIDを一意に付与（画面名_機能_連番）
- [ ] **トレーサビリティマトリクスを作成（必須）**
- [ ] **品質チェックで70%以上のスコアを達成**

### テストコード作成時のチェックリスト

- [ ] Page Object Modelパターンを適用
- [ ] ロールベースロケーター優先（`getByRole`, `getByLabel`）
- [ ] `data-testid`は最後の手段
- [ ] Auto-waitingを信頼（手動waitは禁止）
- [ ] Web-first Assertionsを使用
- [ ] AAAパターン（Arrange-Act-Assert）を遵守
- [ ] テスト間の状態分離を確保

## ディレクトリ構成

```
tests/e2e/
├── specs/                    # テスト仕様書（Markdown）
│   ├── auth/
│   │   └── login.spec.md
│   └── dashboard/
│       └── widgets.spec.md
├── tests/                    # Playwrightテストコード
│   ├── auth/
│   │   └── login.spec.ts
│   └── dashboard/
│       └── widgets.spec.ts
├── pages/                    # Page Object Models
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── BasePage.ts
├── fixtures/                 # カスタムフィクスチャ
│   └── testSetup.ts
├── utils/                    # ヘルパー関数
│   ├── dataFactory.ts
│   └── testHelpers.ts
└── auth.setup.ts             # 認証セットアップ
```

## Phase 1: テスト仕様書作成

### 入力形式

画面仕様書は以下の形式をサポート:

- **Markdown形式**: `.md`ファイル
- **Excel形式**: `.xlsx`ファイル（テキスト抽出して解析）

### テスト仕様書フォーマット

画面単位でMarkdown表形式のテスト仕様書を作成:

```markdown
# [画面名] E2Eテスト仕様書

## 画面概要
- **画面ID**: SCR-001
- **画面名**: ログイン画面
- **URL**: /login
- **認証**: 不要

## 前提条件
- テスト用ユーザーが存在すること
- セッションがクリアされていること

## テストケース

| テストID | テスト名 | 前提条件 | 操作手順 | 期待結果 | 優先度 |
|----------|----------|----------|----------|----------|--------|
| LOGIN_001 | 正常ログイン | テストユーザー存在 | 1. /loginにアクセス<br>2. メールアドレス入力<br>3. パスワード入力<br>4. ログインボタンクリック | ダッシュボード画面に遷移 | 高 |
| LOGIN_002 | 無効なパスワード | テストユーザー存在 | 1. /loginにアクセス<br>2. メールアドレス入力<br>3. 誤ったパスワード入力<br>4. ログインボタンクリック | エラーメッセージ「認証情報が正しくありません」表示 | 高 |
| LOGIN_003 | 未入力エラー | - | 1. /loginにアクセス<br>2. 何も入力せずログインボタンクリック | バリデーションエラー表示 | 中 |

## データ要件
- ユーザー: Laravelファクトリーで動的生成（セキュリティのため、クレデンシャルはハードコード禁止）
- 認証情報: `.env.testing` で管理、または `playwright/.auth/` にセキュアに保存

## トレーサビリティマトリクス

| 画面要素ID | 要素名 | テストケース | カバレッジ状況 |
|-----------|--------|-------------|--------------|
| ELEM_001 | メールアドレス入力 | LOGIN_001, LOGIN_002, LOGIN_003 | 正常系✓ 異常系✓ 境界値✓ |
| ELEM_002 | パスワード入力 | LOGIN_001, LOGIN_002, LOGIN_003 | 正常系✓ 異常系✓ 境界値✓ |
| ELEM_003 | ログインボタン | LOGIN_001, LOGIN_002, LOGIN_003 | 正常系✓ 異常系✓ |
| ELEM_004 | エラーメッセージ | LOGIN_002, LOGIN_003 | 異常系✓ |
```

### 仕様書作成の考慮事項

#### 1. テストケースの網羅性

**正常系**:
- 基本的な操作フロー
- 代替フロー（複数の正常パス）

**異常系**:
- バリデーションエラー（**仕様書記載の全ルールを網羅**）
- 認証・認可エラー
- サーバーエラー

**境界値**:
- 空入力
- 最大長入力
- 特殊文字

### バリデーションルール100%網羅（必須）

画面仕様書に記載されているすべてのバリデーションルールに対応するテストケースを作成すること。

| バリデーション種別 | テストケースの作成基準 |
|------------------|---------------------|
| **必須チェック** | 未入力/未選択時のエラー表示テスト |
| **文字数チェック** | 最大文字数+1の入力でエラー + 最大文字数での正常（境界値） |
| **形式チェック** | 不正形式の入力でエラー表示テスト |
| **範囲チェック** | 範囲外の値でエラー + 境界値での正常テスト |
| **相関チェック** | 項目間の整合性エラーテスト |
| **ファイルチェック** | ファイル形式、サイズ、画像サイズ等のエラーテスト |

**品質ゲート**: バリデーションカバレッジ100%未満の場合は不合格。不足テストケースを追加するまで次に進めない。

#### 2. 優先度の設定

| 優先度 | 説明 | 実装タイミング |
|--------|------|----------------|
| 高 | クリティカルパス、主要機能 | 必須 |
| 中 | 準主要機能、エラーハンドリング | 推奨 |
| 低 | エッジケース、UIの細かい確認 | 任意 |

## Phase 2: テストコード実装

### Page Object Model

詳細は [references/pom-patterns.md](references/pom-patterns.md) を参照。

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

### セレクタ戦略

詳細は [references/selector-strategy.md](references/selector-strategy.md) を参照。

**優先順位**:
1. `getByRole()` - ボタン、チェックボックス、見出し、リンク
2. `getByLabel()` - ラベル付きフォーム要素
3. `getByPlaceholder()` - プレースホルダー付き入力欄
4. `getByText()` - 非インタラクティブ要素
5. `getByTestId()` - 明示的なテスト用契約（最後の手段）

### Laravel統合（hyvor/laravel-playwright）

詳細は [references/laravel-integration.md](references/laravel-integration.md) を参照。

```typescript
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

  // テスト実行
  await page.goto('/login');
  // ...
});
```

### テストコード構造

```typescript
// tests/auth/login.spec.ts
import { test, expect } from '../../fixtures/testSetup';

test.describe('ログイン画面', () => {
  test('LOGIN_001: 正常ログイン', async ({ loginPage, page }) => {
    // Arrange
    const email = 'user@example.com';
    const password = 'password123';

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(page).toHaveURL(/dashboard/);
  });

  test('LOGIN_002: 無効なパスワードでエラー表示', async ({ loginPage }) => {
    // Arrange
    const email = 'user@example.com';
    const invalidPassword = 'wrongpassword';

    // Act
    await loginPage.login(email, invalidPassword);

    // Assert
    await loginPage.expectError('認証情報が正しくありません');
  });
});
```

## 禁止事項

### 絶対に避けるべきパターン

```typescript
// ❌ 手動待機（フレーキーの原因）
await page.waitForTimeout(3000);

// ❌ CSSセレクタ（DOM構造に依存）
page.locator('button.btn-primary.submit-form');
page.locator('#app > div:nth-child(2) > form > button');

// ❌ Generic assertion（リトライなし）
expect(await page.getByText('ようこそ').isVisible()).toBe(true);

// ❌ テスト間で状態を共有
let sharedState: string;
test('テスト1', async () => { sharedState = 'value'; });
test('テスト2', async () => { console.log(sharedState); }); // 依存
```

### 必ず守るべきパターン

```typescript
// ✅ Auto-waitingを信頼
await page.getByRole('button', { name: '送信' }).click();

// ✅ ロールベースロケーター
page.getByRole('button', { name: '送信' });
page.getByLabel('ユーザー名');

// ✅ Web-first assertion
await expect(page.getByText('ようこそ')).toBeVisible();

// ✅ テスト間の独立性
test('テスト1', async ({ page }) => { /* 独立した状態 */ });
test('テスト2', async ({ page }) => { /* 独立した状態 */ });
```

## CI/CD設定

詳細は [references/ci-config.md](references/ci-config.md) を参照。

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/tests',
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

## Reference Documentation

詳細なガイドラインと実装パターン:

- **[references/pom-patterns.md](references/pom-patterns.md)**: Page Object Modelの詳細パターン
- **[references/selector-strategy.md](references/selector-strategy.md)**: セレクタ戦略の詳細
- **[references/laravel-integration.md](references/laravel-integration.md)**: Laravel統合パターン
- **[references/security-testing.md](references/security-testing.md)**: セキュリティテストパターン（XSS/CSRF検証）
- **[references/ci-config.md](references/ci-config.md)**: CI/CD設定詳細
- **[references/ci-quickstart.md](references/ci-quickstart.md)**: E2E環境クイックスタート・初期化スクリプト
- **[references/test-stability.md](references/test-stability.md)**: テスト安定性のベストプラクティス
- **[references/impl-plan-templates.md](references/impl-plan-templates.md)**: 実装計画書テンプレート（/e2e-spec-impl用）
- **[references/examples/login-example.md](references/examples/login-example.md)**: ログイン画面の完全実装例

## Summary

1. **仕様書ファースト**: 画面仕様書→テスト仕様書→テストコードの順序を厳守
2. **画面単位の粒度**: 画面ごとにテストケースを整理
3. **バリデーション100%網羅**: 仕様書記載の全バリデーションルールをテストでカバー（必須）
4. **POMパターン**: 保守性を高めるためPage Object Modelを適用
5. **ロールベースセレクタ**: ユーザー視点のセレクタを優先
6. **Auto-waiting活用**: 手動待機は禁止、Playwrightの自動待機を信頼
7. **Laravel統合**: hyvor/laravel-playwrightでファクトリー・シーダーを活用
