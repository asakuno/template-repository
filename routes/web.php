<?php

use App\Http\Controllers\Web\AuthPageController;
use App\Http\Controllers\Web\DashboardPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 未認証ユーザー用（guestミドルウェア）
Route::middleware(['guest', 'precognitive'])->group(function () {
    Route::get('/login', [AuthPageController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthPageController::class, 'login']);
});

// 認証済みユーザー用
Route::middleware(['auth', 'precognitive'])->group(function () {
    Route::get('/dashboard', DashboardPageController::class)->name('dashboard');
    Route::post('/logout', [AuthPageController::class, 'logout'])->name('logout');
});
