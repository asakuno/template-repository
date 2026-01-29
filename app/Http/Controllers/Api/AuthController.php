<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\UseCases\Auth\GetAuthenticatedUserUseCase;
use App\UseCases\Auth\LoginUseCase;
use App\UseCases\Auth\LogoutUseCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 認証APIコントローラ
 */
final class AuthController extends Controller
{
    /**
     * ログイン処理
     */
    public function login(LoginRequest $request, LoginUseCase $useCase): JsonResponse
    {
        $user = $useCase->execute($request->toData(), $request);

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    /**
     * ログアウト処理
     */
    public function logout(Request $request, LogoutUseCase $useCase): JsonResponse
    {
        $useCase->execute($request);

        return response()->json([
            'message' => 'ログアウトしました。',
        ]);
    }

    /**
     * 認証済みユーザー取得
     */
    public function user(Request $request, GetAuthenticatedUserUseCase $useCase): JsonResponse
    {
        $user = $useCase->execute($request);

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }
}
