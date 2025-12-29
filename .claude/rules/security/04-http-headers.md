# HTTPヘッダ系脆弱性対策

## 1. HTTPヘッダ・インジェクション

### 脅威

HTTPレスポンスヘッダのフィールド値を外部パラメータから動的に生成する際に発生し、**XSSと同等の脅威、任意のCookie発行、キャッシュサーバの汚染**を引き起こす。

### 根本的対策

Laravel の `redirect()` や `response()` ヘルパーを使用し、改行コードを削除する。

```php
// ✅ 安全: Laravelのredirect()を使用
public function safeRedirect(Request $request)
{
    $url = $request->input('url');

    // 改行コードを削除
    $url = str_replace(["\r", "\n", "\r\n"], '', $url);

    // URLホワイトリストによる検証
    $allowedHosts = ['example.com', 'app.example.com'];
    $parsedUrl = parse_url($url);

    if (!isset($parsedUrl['host']) ||
        !in_array($parsedUrl['host'], $allowedHosts)) {
        return redirect('/');
    }

    // Laravelのredirect()を使用（内部で安全に処理）
    return redirect($url);
}
```

### 禁止パターン

```php
// ❌ 危険: 生のヘッダ出力
header("Location: " . $_GET['url']);
```

---

## 2. メールヘッダ・インジェクション

### 脅威

メール送信機能において、外部入力がメールヘッダに反映される場合、**スパムメールの踏み台利用、フィッシングメールの送信**が発生する。

### 根本的対策

Laravel の Mailable クラスを使用し、件名から改行コードを削除する。

```php
// ✅ 安全: Mailableクラスを使用
public function send(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:100',
        'email' => 'required|email:rfc,dns',
        'subject' => 'required|string|max:200',
        'body' => 'required|string|max:5000',
    ]);

    // 改行コードを削除（件名に対して）
    $subject = preg_replace('/[\r\n\x00-\x1F\x7F]/', '', $validated['subject']);

    // Mailableクラスを使用した安全なメール送信
    Mail::to('admin@example.com')
        ->send(new ContactMail([
            'subject' => $subject,
            'name' => $validated['name'],
            'body' => $validated['body'],
        ]));

    return back()->with('success', 'お問い合わせを送信しました。');
}
```

### 禁止パターン

```php
// ❌ 危険: mail()関数での直接使用
mail($to, $_POST['subject'], $_POST['body']);
```

---

## 3. クリックジャッキング

### 脅威

透明化されたiframe内にターゲットサイトを埋め込み、ユーザーを視覚的に騙して**意図しないクリック操作**をさせる攻撃。

### 根本的対策

セキュリティヘッダミドルウェアを実装し、すべてのレスポンスに適用する。

---

## セキュリティヘッダミドルウェア（包括的実装）

以下のミドルウェアをすべてのレスポンスに適用する。

```php
// app/Http/Middleware/SecurityHeadersMiddleware.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // クリックジャッキング対策
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // CSP（クリックジャッキング + XSS対策）
        $csp = $this->buildContentSecurityPolicy();

        // 開発環境では一部ヘッダを緩和
        if (app()->environment('local', 'development')) {
            // CSPをReport-Onlyモードに
            $response->headers->set('Content-Security-Policy-Report-Only', $csp);
        } else {
            $response->headers->set('Content-Security-Policy', $csp);
        }

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

    private function buildContentSecurityPolicy(): string
    {
        $policies = [
            "default-src 'self'",
            "script-src 'self'",
            // ✅ 推奨: Vite/Webpackビルド時（本プロジェクト）
            "style-src 'self'",
            // ⚠️ CDN使用時のみ: "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ];

        return implode('; ', $policies);
    }
}
```

**重要**: Tailwind CSS と CSP の設定:
- **Vite/Webpack ビルド時**: `style-src 'self'` のみ（推奨）
- **CDN版**: `style-src 'self' 'unsafe-inline'` が必要（セキュリティリスクあり）

---

## ミドルウェアの登録

```php
// bootstrap/app.php（Laravel 11）
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // セキュリティヘッダをすべてのレスポンスに適用
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);
    })
    ->create();
```

---

## セキュリティヘッダ一覧

| ヘッダ名 | 目的 | 推奨値 | 優先度 |
|---------|------|--------|--------|
| **X-Frame-Options** | クリックジャッキング対策 | `SAMEORIGIN` | 高 |
| **Content-Security-Policy** | XSS・リソース制御 | アプリに応じて設定 | 高 |
| **X-Content-Type-Options** | MIMEスニッフィング防止 | `nosniff` | 高 |
| **Strict-Transport-Security** | HTTPS強制 | `max-age=31536000; includeSubDomains` | 高（本番） |
| **Referrer-Policy** | リファラー情報制御 | `strict-origin-when-cross-origin` | 中 |
| **X-XSS-Protection** | XSSフィルター（レガシー） | `1; mode=block` | 低 |
| **Permissions-Policy** | ブラウザ機能制限 | `geolocation=(), microphone=()` | 中 |

---

## Content-Security-Policy（CSP）詳細設定

### 基本ディレクティブ

| ディレクティブ | 推奨設定 | 説明 |
|--------------|---------|------|
| `default-src` | `'self'` | デフォルトで同一オリジンのみ許可 |
| `script-src` | `'self'` | スクリプトは同一オリジンのみ |
| `style-src` | `'self' 'unsafe-inline'` | インラインスタイル許可（Tailwind用） |
| `img-src` | `'self' data: https:` | 画像はdata URIとHTTPS許可 |
| `frame-ancestors` | `'self'` | iframe埋め込み制限 |
| `form-action` | `'self'` | フォーム送信先制限 |
| `base-uri` | `'self'` | `<base>` タグのURL制限 |
| `object-src` | `'none'` | Flash等のプラグイン禁止 |

### 外部リソース使用時の設定例

```php
// CDN使用時の例
$policies = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
];
```

### CSP Report-Only モード

本番環境導入前に Report-Only モードで動作確認を行う。

```php
// 違反をレポートするが、ブロックはしない
$response->headers->set('Content-Security-Policy-Report-Only', $csp);
```

---

## HTTPヘッダ対策チェックリスト

- [ ] SecurityHeadersMiddleware を実装している
- [ ] すべてのレスポンスにセキュリティヘッダが適用されている
- [ ] X-Frame-Options: SAMEORIGIN を設定している
- [ ] Content-Security-Policy を適切に設定している
- [ ] X-Content-Type-Options: nosniff を設定している
- [ ] Strict-Transport-Security を本番環境で設定している（HTTPS必須）
- [ ] Referrer-Policy を設定している
- [ ] X-Powered-By, Server ヘッダを削除している
- [ ] リダイレクト時に改行コードを削除している
- [ ] URLリダイレクトにはホワイトリスト検証を実装している
- [ ] メール送信は Mailable クラスを使用している
- [ ] メールの件名から改行コードを削除している
