<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\User;

/**
 * ユーザーリポジトリインターフェース
 */
interface UserRepositoryInterface
{
    /**
     * メールアドレスでユーザーを検索する
     */
    public function findByEmail(string $email): ?User;
}
