#!/bin/bash
set -euo pipefail

# ワークツリー用の並列開発環境セットアップスクリプト
#
# 使い方:
#   ../manage-app/scripts/setup-worktree.sh <port_offset> <name>
#
# 例:
#   ../manage-app/scripts/setup-worktree.sh 100 register
#   ../manage-app/scripts/setup-worktree.sh 200 dashboard
#
# ポートマッピング（オフセット=100の場合）:
#   nginx:    180    (80 + 100)
#   mysql:    3406   (3306 + 100)
#   redis:    6479   (6379 + 100)
#   php-fpm:  9100   (9000 + 100)
#   vite:     5273   (5173 + 100)
#   storybook:6106   (6006 + 100)
#   minio-api:9101   (9001 + 100)
#   minio-ui: 9102   (9002 + 100)
#   mailhog:  8125   (8025 + 100)

PORT_OFFSET="${1:?ポートオフセットを指定してください（例: 100, 200）}"
ENV_NAME="${2:?環境名を指定してください（例: register, dashboard）}"

# 数値チェック
if ! [[ "$PORT_OFFSET" =~ ^[0-9]+$ ]]; then
    echo "エラー: ポートオフセットは数値で指定してください" >&2
    exit 1
fi

WORKTREE_DIR="$(pwd)"

echo "=== ワークツリー並列環境セットアップ ==="
echo "  ディレクトリ: ${WORKTREE_DIR}"
echo "  環境名:       ${ENV_NAME}"
echo "  ポートオフセット: ${PORT_OFFSET}"
echo ""

# .env がなければ .env.example からコピー
if [ ! -f "${WORKTREE_DIR}/.env" ]; then
    echo "[1/6] .env.example → .env コピー"
    cp "${WORKTREE_DIR}/.env.example" "${WORKTREE_DIR}/.env"
else
    echo "[1/6] .env は既に存在します（スキップ）"
fi

# .env にポート変数を追記（既存のポート変数は上書き）
echo "[2/6] .env にポート変数を設定"

# 既存のポート変数を削除
sed -i '/^NGINX_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^APP_PHP_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^APP_VITE_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^APP_STORYBOOK_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^MYSQL_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^REDIS_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^MINIO_API_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^MINIO_CONSOLE_PORT=/d' "${WORKTREE_DIR}/.env"
sed -i '/^MAILHOG_PORT=/d' "${WORKTREE_DIR}/.env"

# ポート変数を追記
cat >> "${WORKTREE_DIR}/.env" <<EOF

# === Parallel Dev Ports (offset: ${PORT_OFFSET}) ===
NGINX_PORT=$((80 + PORT_OFFSET))
APP_PHP_PORT=$((9000 + PORT_OFFSET))
APP_VITE_PORT=$((5173 + PORT_OFFSET))
APP_STORYBOOK_PORT=$((6006 + PORT_OFFSET))
MYSQL_PORT=$((3306 + PORT_OFFSET))
REDIS_PORT=$((6379 + PORT_OFFSET))
MINIO_API_PORT=$((9001 + PORT_OFFSET))
MINIO_CONSOLE_PORT=$((9002 + PORT_OFFSET))
MAILHOG_PORT=$((8025 + PORT_OFFSET))
EOF

# DB_DATABASE を環境名に変更
sed -i "s/^DB_DATABASE=.*/DB_DATABASE=manage-app-${ENV_NAME}/" "${WORKTREE_DIR}/.env"

# APP_URL を変更
sed -i "s|^APP_URL=.*|APP_URL=http://localhost:$((80 + PORT_OFFSET))|" "${WORKTREE_DIR}/.env"

echo "  ポート設定完了"

# Docker Compose 起動
echo "[3/6] Docker Compose 起動"
cd "${WORKTREE_DIR}"
docker compose up -d --build

# 依存関係インストール
echo "[4/6] composer install"
docker compose exec -T app composer install --no-interaction

echo "[5/6] yarn install"
docker compose exec -T app yarn install --frozen-lockfile

# Laravel セットアップ
echo "[6/6] Laravel セットアップ"
docker compose exec -T app php artisan key:generate --no-interaction
docker compose exec -T app php artisan migrate --no-interaction
docker compose exec -T app yarn build

echo ""
echo "=== セットアップ完了 ==="
echo "  アプリ URL: http://localhost:$((80 + PORT_OFFSET))"
echo "  Vite:       http://localhost:$((5173 + PORT_OFFSET))"
echo "  MySQL:      localhost:$((3306 + PORT_OFFSET))"
echo "  MailHog:    http://localhost:$((8025 + PORT_OFFSET))"
echo "  MinIO:      http://localhost:$((9002 + PORT_OFFSET))"
