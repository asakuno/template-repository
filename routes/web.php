<?php

use App\Http\Controllers\Web\LoginPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', [LoginPageController::class, 'show'])->name('login');
