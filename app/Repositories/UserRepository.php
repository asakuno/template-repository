<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;

/**
 * ユーザーリポジトリ実装
 */
final class UserRepository implements UserRepositoryInterface
{
    /**
     * 新規ユーザーを作成
     *
     * パスワードはUser Modelのhashedキャストにより自動ハッシュ化される
     */
    public function create(string $name, string $email, string $password): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
    }
}
