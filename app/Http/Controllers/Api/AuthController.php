<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Data\Auth\AuthenticatedUserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\UseCases\Auth\GetAuthenticatedUserUseCase;
use App\UseCases\Auth\LoginUseCase;
use App\UseCases\Auth\LogoutUseCase;
use Illuminate\Http\JsonResponse;

final class AuthController extends Controller
{
    public function __construct(
        private readonly LoginUseCase $loginUseCase,
        private readonly LogoutUseCase $logoutUseCase,
        private readonly GetAuthenticatedUserUseCase $getAuthenticatedUserUseCase,
    ) {}

    /**
     * ログイン
     *
     * POST /api/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->toLoginData();
        $user = $this->loginUseCase->execute($data);

        return response()->json([
            'data' => AuthenticatedUserData::from($user),
        ]);
    }

    /**
     * ログアウト
     *
     * POST /api/logout
     */
    public function logout(): JsonResponse
    {
        $this->logoutUseCase->execute();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * 現在認証済みユーザー情報取得
     *
     * GET /api/user
     */
    public function user(): JsonResponse
    {
        $user = $this->getAuthenticatedUserUseCase->execute();

        return response()->json([
            'data' => $user,
        ]);
    }
}
