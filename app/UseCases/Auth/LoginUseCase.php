<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use App\Data\Auth\LoginData;
use App\Models\User;
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
    public function execute(LoginData $data, ?Request $request = null): User
    {
        // Laravel標準のAuth::attempt()でメール・パスワード検証
        $authenticated = Auth::attempt([
            'email' => $data->email,
            'password' => $data->password,
        ]);

        if (! $authenticated) {
            throw ValidationException::withMessages([
                'email' => ['認証情報が正しくありません。'],
            ]);
        }

        // セッション再生成（セッションフィクス化攻撃対策）
        $req = $request ?? request();
        if ($req->hasSession()) {
            $req->session()->regenerate();
        }

        // 認証済みユーザーを返す
        return Auth::user();
    }
}
