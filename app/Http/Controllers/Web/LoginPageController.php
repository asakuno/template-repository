<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ログインページコントローラ
 */
final class LoginPageController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Login');
    }
}
