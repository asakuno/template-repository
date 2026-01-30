<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Data\Auth\AuthenticatedUserData;
use App\Data\Auth\LoginData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class LoginUseCase
{
    /**
     * ログイン処理を実行
     *
     * @throws ValidationException 認証失敗時
     */
    public function execute(LoginData $data, ?Request $request = null): AuthenticatedUserData
    {
        $authenticated = Auth::attempt([
            'email' => $data->email,
            'password' => $data->password,
        ]);

        if (! $authenticated) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        // セッションフィクス化攻撃対策
        $req = $request ?? request();
        if ($req->hasSession()) {
            $req->session()->regenerate();
        }

        return AuthenticatedUserData::from(Auth::user());
    }
}
