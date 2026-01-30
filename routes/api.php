<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// 認証不要（ブルートフォース対策: 5回/分）
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// 認証必要
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
