<?php

use App\Http\Controllers\Web\AuthPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 未認証ユーザー用（guestミドルウェア）
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthPageController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthPageController::class, 'login']);
});

// 認証済みユーザー用
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthPageController::class, 'logout'])->name('logout');
});
