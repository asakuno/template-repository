# 認証機能セットアップガイド

## 前提条件

- Docker Compose環境が起動済み
- データベースマイグレーション済み

## 環境変数設定

`.env` に以下を設定:

```env
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000
```

## セットアップ手順

### 1. Sanctumインストール（済み）

```bash
docker compose exec app composer require laravel/sanctum
```

### 2. マイグレーション

```bash
docker compose exec app php artisan migrate
```

### 3. 動作確認

```bash
# CSRFトークン取得
curl -c cookies.txt http://localhost/sanctum/csrf-cookie

# ログイン
curl -b cookies.txt -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# ユーザー情報取得
curl -b cookies.txt http://localhost/api/user

# ログアウト
curl -b cookies.txt -X POST http://localhost/api/logout
```

## テスト実行

```bash
# 全認証テスト
docker compose exec app ./vendor/bin/phpunit tests/Feature/Api/AuthControllerTest.php
docker compose exec app ./vendor/bin/phpunit tests/Unit/UseCases/Auth/
docker compose exec app ./vendor/bin/phpunit tests/Unit/Repositories/UserRepositoryTest.php
```
