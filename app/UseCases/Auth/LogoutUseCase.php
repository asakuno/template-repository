<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class LogoutUseCase
{
    /**
     * ログアウト処理を実行
     */
    public function execute(?Request $request = null): void
    {
        Auth::guard('web')->logout();

        $req = $request ?? request();
        if ($req->hasSession()) {
            $req->session()->invalidate();
            $req->session()->regenerateToken();
        }
    }
}
