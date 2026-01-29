<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Data\Auth\LoginData;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * ログインユースケース
 *
 * 認証情報を検証し、セッションを再生成してログインを完了する。
 */
final class LoginUseCase
{
    /**
     * ログイン処理を実行する
     *
     * @throws ValidationException 認証情報が不正な場合
     */
    public function execute(LoginData $data, Request $request): User
    {
        if (! Auth::attempt(['email' => $data->email, 'password' => $data->password])) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        return $user;
    }
}
