<?php

declare(strict_types=1);

namespace App\UseCases\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * ログアウトユースケース
 *
 * セッションの無効化とCSRFトークンの再生成を行う。
 */
final class LogoutUseCase
{
    /**
     * ログアウト処理を実行する
     */
    public function execute(Request $request): void
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
