<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\UseCases\Auth\LoginUseCase;
use App\UseCases\Auth\LogoutUseCase;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * 認証関連ページコントローラー
 */
final class AuthPageController extends Controller
{
    public function __construct(
        private readonly LoginUseCase $loginUseCase,
        private readonly LogoutUseCase $logoutUseCase,
    ) {}

    /**
     * ログインページ表示
     */
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * ログイン処理
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $data = $request->toLoginData();
        $this->loginUseCase->execute($data, $request);

        return redirect()->intended('/dashboard');
    }

    /**
     * ログアウト処理
     */
    public function logout(): RedirectResponse
    {
        $this->logoutUseCase->execute();

        return redirect('/login');
    }
}
