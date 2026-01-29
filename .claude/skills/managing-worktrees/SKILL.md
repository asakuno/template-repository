---
name: managing-worktrees
description: Git worktreeを使用した並列開発セッションを管理する。ワークツリーの作成・一覧・削除、依存関係のインストール、セッション起動案内を実行する。「並列開発」「ワークツリー作成」「worktree」で起動。
---

# 並列開発管理（Git Worktree）

同一リポジトリの複数ブランチを別ディレクトリで同時チェックアウトし、独立したセッションで並列開発する。

## ワークフロー

### Step 1: 操作の選択

ユーザーの意図に応じて以下の操作を実行する:

| 操作 | 説明 |
|------|------|
| `create` | 新しいワークツリーを作成し開発環境を初期化 |
| `list` | 既存ワークツリーの一覧表示 |
| `remove` | 不要なワークツリーを削除 |
| `status` | 全ワークツリーの状態確認 |

### Step 2: ワークツリーの作成（create）

#### 2-1. ワークツリーの作成

```bash
# 新しいブランチで作成（推奨）
git worktree add ../[project-name]-[feature] -b [branch-name]

# 既存ブランチで作成
git worktree add ../[project-name]-[feature] [existing-branch]
```

**命名規則:**
- ディレクトリ名: `../[project-name]-[feature-short-name]`
- ブランチ名: `feat/[feature-name]` or `fix/[bug-name]`

#### 2-2. 依存関係のインストール

ワークツリー作成後、プロジェクトの依存関係をインストールする:

```bash
# ワークツリーディレクトリに移動
cd ../[worktree-dir]

# PHP依存関係
composer install

# Node.js依存関係
yarn install

# 環境ファイルのコピー（存在しない場合）
cp ../${SOURCE_DIR}/.env .env 2>/dev/null || true
```

#### 2-3. セットアップの検証

依存関係のインストール成功を確認する:

```bash
# PHP依存関係の確認
php artisan --version

# Node.js依存関係の確認
yarn --version && ls node_modules/.package-lock.json 2>/dev/null || ls node_modules/.yarn-integrity 2>/dev/null
```

失敗時は以下を確認:
- `composer.lock` / `yarn.lock` が存在するか
- PHP / Node.js のバージョンが要件を満たしているか

#### 2-4. セッションの起動案内

以下の案内をユーザーに表示する:

```
ワークツリーが作成されました。

新しいターミナルで以下を実行してClaude Codeセッションを開始してください:

  cd ../[worktree-dir]
  claude

ヒント:
- 各ワークツリーでは独立したClaude Codeセッションが実行されます
- セッション間でファイルの競合は発生しません
- /rename でセッションに名前を付けると後で再開しやすくなります
```

### Step 3: ワークツリーの一覧表示（list）

```bash
git worktree list
```

各ワークツリーの以下を確認:
- パス
- ブランチ名
- コミットハッシュ

### Step 4: ワークツリーの状態確認（status）

全ワークツリーの作業状態を確認する:

```bash
# ワークツリー一覧を取得
git worktree list --porcelain
```

各ワークツリーのディレクトリで `git status` を実行し、未コミットの変更を確認する。

### Step 5: ワークツリーの削除（remove）

```bash
# ワークツリーを削除
git worktree remove ../[worktree-dir]

# 削除後、プルーニングを実行
git worktree prune
```

**注意:** 未コミットの変更がある場合は警告を表示し、`--force` オプションの使用を確認する。

## ベストプラクティス

### ワークツリー管理
- 説明的なディレクトリ名を使用する（例: `manage-app-auth`, `manage-app-dashboard`）
- 完了したワークツリーは速やかに削除する
- 定期的に `git worktree prune` を実行して古い参照を整理する

### セッション管理
- 各ワークツリーのClaude Codeセッションに `/rename` で名前を付ける
- 再開時は `claude --resume [name]` を使用する
- 長時間タスクは別ワークツリーに分離する

### 注意事項
- 同じブランチを複数のワークツリーでチェックアウトできない
- ワークツリーのディレクトリはメインリポジトリと同じ親ディレクトリに作成する
- 各ワークツリーで `composer install` と `yarn install` が必要
- `.env` ファイルはワークツリー間で共有されないため、コピーが必要
