<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * 認証済みユーザー取得ユースケース
 */
final class GetAuthenticatedUserUseCase
{
    /**
     * 認証済みユーザーを取得する
     */
    public function execute(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }
}
