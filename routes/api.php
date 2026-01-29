<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// 認証API（セッションベース認証）
// Sanctum SPA認証のためweb middlewareでセッションを有効化
Route::middleware('web')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('api.login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
        Route::get('/user', [AuthController::class, 'user'])->name('api.user');
    });
});
