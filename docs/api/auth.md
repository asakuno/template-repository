# 認証API仕様書

## エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | /api/login | 不要 | ログイン |
| POST | /api/logout | 必要 | ログアウト |
| GET | /api/user | 必要 | 認証済みユーザー取得 |

## POST /api/login

### リクエスト

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

| フィールド | 型 | 必須 | ルール |
|-----------|-----|------|--------|
| email | string | Yes | email形式 |
| password | string | Yes | 8文字以上 |

### レスポンス

**200 OK**
```json
{
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "user@example.com"
  }
}
```

**422 Unprocessable Entity** - バリデーションエラーまたは認証失敗
```json
{
  "message": "...",
  "errors": {
    "email": ["認証情報が正しくありません。"]
  }
}
```

**429 Too Many Requests** - レート制限超過（5回/分、email+IPで制限）

## POST /api/logout

### リクエスト

ボディなし。

### レスポンス

**200 OK**
```json
{
  "message": "ログアウトしました。"
}
```

**401 Unauthorized** - 未認証

## GET /api/user

### レスポンス

**200 OK**
```json
{
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "user@example.com"
  }
}
```

**401 Unauthorized** - 未認証

## 認証方式

Laravel Sanctum SPA認証（セッションベース）を使用。

### SPA認証フロー

1. `GET /sanctum/csrf-cookie` でCSRFトークン取得
2. `POST /api/login` でログイン
3. 以降のリクエストはCookieベースで認証

### 必要なヘッダ

```
Accept: application/json
Content-Type: application/json
X-XSRF-TOKEN: <CSRFトークン>（Cookie `XSRF-TOKEN` から取得）
```

### Axios設定例

```typescript
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
```
