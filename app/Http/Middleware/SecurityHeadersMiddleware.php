<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

final class SecurityHeadersMiddleware
{
    /**
     * すべてのレスポンスにセキュリティヘッダを追加する
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vite が出力するスクリプト/スタイルタグにnonce属性を付与
        $nonce = Vite::useCspNonce();

        $response = $next($request);

        // クリックジャッキング対策
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // CSP（クリックジャッキング + XSS対策）
        $csp = $this->buildContentSecurityPolicy($nonce);
        $response->headers->set('Content-Security-Policy', $csp);

        // MIMEスニッフィング防止
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // XSSフィルター（レガシーブラウザ向け）
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // HTTPS強制（本番環境のみ）
        if (app()->environment('production')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // リファラーポリシー
        $response->headers->set(
            'Referrer-Policy',
            'strict-origin-when-cross-origin'
        );

        // Permissions-Policy（機能制限）
        $response->headers->set(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=()'
        );

        // サーバー情報の隠蔽
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }

    /**
     * Content-Security-Policy を構築する
     */
    private function buildContentSecurityPolicy(string $nonce): string
    {
        $isLocal = app()->environment('local', 'development');

        $scriptSrc = $isLocal
            ? "script-src 'self' 'nonce-{$nonce}' http://localhost:5173"
            : "script-src 'self' 'nonce-{$nonce}'";

        $styleSrc = $isLocal
            ? "style-src 'self' 'nonce-{$nonce}' 'unsafe-inline' http://localhost:5173"
            : "style-src 'self' 'nonce-{$nonce}'";

        $connectSrc = $isLocal
            ? "connect-src 'self' ws://localhost:5173"
            : "connect-src 'self'";

        $policies = [
            "default-src 'self'",
            $scriptSrc,
            $styleSrc,
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            $connectSrc,
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ];

        return implode('; ', $policies);
    }
}
