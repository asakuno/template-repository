<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

/**
 * ユーザーリポジトリ実装
 */
final class UserRepository implements UserRepositoryInterface
{
    /**
     * メールアドレスでユーザーを検索する
     */
    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }
}
