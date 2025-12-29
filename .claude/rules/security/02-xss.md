# クロスサイト・スクリプティング（XSS）対策

## 脅威

XSSは**IPA届出件数の約5割を占める最も多い脆弱性**である。攻撃者はスクリプトを挿入し、**偽ページ表示、Cookie窃取によるセッションハイジャック、マルウェア感染**を引き起こす。

## XSSの3つのタイプ

| タイプ | 特徴 | 例 |
|--------|------|-----|
| **反射型XSS** | URLパラメータから即座に反映 | 検索結果画面、エラー表示 |
| **格納型XSS** | DBに保存され全員に影響 | 掲示板、コメント機能 |
| **DOM-based XSS** | クライアントサイドで完結 | innerHTML操作 |

---

## Laravel / Bladeでの対策

### 根本的対策

Blade テンプレートでは**必ず `{{ }}` を使用**する。これにより自動的に `htmlentities()` が適用される。

```blade
{{-- ✅ 安全: Bladeの自動エスケープ --}}
<div>{{ $content }}</div>

{{-- ✅ 安全: 属性値の適切なクォート --}}
<input type="text" value="{{ $text }}">

{{-- ✅ 安全: JavaScript内での安全な出力 --}}
<script>
const data = @json($data);
</script>
```

### HTML許可が必要な場合

HTML入力を許可する場合は**HTMLPurifier を必須**とする。

```bash
composer require mews/purifier
```

```php
// Eloquent モデルでの自動サニタイズ（推奨）
use Mews\Purifier\Casts\CleanHtml;

class Post extends Model
{
    protected $casts = [
        'body' => CleanHtml::class,  // 入出力時に自動サニタイズ
    ];
}

// Controller での使用
$cleanHtml = Purifier::clean($dirtyHtml);
```

```blade
{{-- HTMLPurifier でサニタイズ済みのみ {!! !!} 使用可 --}}
<div>{!! Purifier::clean($userContent) !!}</div>
```

### 禁止パターン

```blade
{{-- ❌ 危険: エスケープなしの出力 --}}
<div>{!! $content !!}</div>

{{-- ❌ 危険: 属性値のクォートなし --}}
<input type="text" value={{ $text }}>

{{-- ❌ 危険: JavaScript内での不適切な出力 --}}
<button onclick="test({{$text}})">ボタン</button>
```

---

## Reactでの対策

### 根本的対策

JSXのデフォルト動作（自動エスケープ）を活用する。

```jsx
// ✅ 安全: JSXの自動エスケープ（デフォルト）
function SafeComponent({ userInput }) {
  // <script>タグは文字列として表示される
  return <div>{userInput}</div>;
}
```

### HTML許可が必要な場合

`dangerouslySetInnerHTML` を使用する場合は**DOMPurify によるサニタイズを必須**とする。

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```tsx
// ✅ 安全: DOMPurifyによるサニタイズ
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  content: string;
}

export function SafeHTML({ content }: SafeHTMLProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

// より厳格な設定例（タグのみ許可、属性なし）
export function StrictSafeHTML({ content }: SafeHTMLProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],  // 属性を一切許可しない
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

// リンクを許可する場合（外部リンク対策込み）
export function SafeHTMLWithLinks({ content }: SafeHTMLProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^https?:\/\//,  // HTTP(S)のみ許可
    ADD_ATTR: ['target', 'rel'],
    ADD_VALUES: { target: '_blank', rel: 'noopener noreferrer' },
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

**推奨**: セキュリティレベルに応じて適切な設定を選択する。デフォルトは `StrictSafeHTML` を使用し、必要に応じて許可範囲を拡大する。

---

### URL検証（javascript:スキーム対策）

ユーザー入力のURLは必ず検証する。

```tsx
// ✅ 安全: URLの検証
interface SafeLinkProps {
  userUrl: string;
  children: React.ReactNode;
}

export function SafeLink({ userUrl, children }: SafeLinkProps) {
  const getSafeUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '#';
      }
      return url;
    } catch (e) {
      return '#';
    }
  };

  return <a href={getSafeUrl(userUrl)}>{children}</a>;
}
```

### 禁止パターン

```jsx
// ❌ 極めて危険: サニタイズなしのdangerouslySetInnerHTML
function UnsafeComponent({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// ❌ 危険: javascript: URLスキーム
function LinkComponent({ userUrl }) {
  return <a href={userUrl}>Click me</a>;
}
// 攻撃例: userUrl = "javascript:alert('XSS')"
```

---

## Content Security Policy（CSP）

### Laravel ミドルウェアでの実装

すべてのレスポンスにCSPヘッダを設定する。

```php
// app/Http/Middleware/AddContentSecurityPolicy.php
class AddContentSecurityPolicy
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        $csp = "default-src 'self'; " .
               "script-src 'self'; " .
               "style-src 'self' 'unsafe-inline'; " .
               "img-src 'self' data: https:; " .
               "frame-ancestors 'self'; " .
               "object-src 'none'; " .
               "base-uri 'self';";

        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
```

### CSP設定ガイドライン

| ディレクティブ | 推奨設定 | 目的 |
|--------------|---------|------|
| `default-src` | `'self'` | デフォルトで同一オリジンのみ許可 |
| `script-src` | `'self'` | スクリプトは同一オリジンのみ |
| `style-src` | `'self'` | スタイルは同一オリジンのみ（Tailwind CSSビルド時） |
| `img-src` | `'self' data: https:` | 画像はdata URIとHTTPS許可 |
| `frame-ancestors` | `'self'` | iframe埋め込み制限 |
| `object-src` | `'none'` | Flash等のプラグイン禁止 |
| `base-uri` | `'self'` | `<base>` タグのURL制限 |

### Tailwind CSS と CSP

**重要**: Tailwind CSS の使用方法により CSP 設定が異なる:

- **Vite/Webpack ビルド時**: インラインスタイルは不要 → `'unsafe-inline'` 削除可能
- **CDN版**: `'unsafe-inline'` が必要（本番環境では非推奨）

```php
// ✅ 推奨: ビルド時スタイル生成（本プロジェクトはこちら）
"style-src 'self'",

// ⚠️ やむを得ない場合のみ（セキュリティリスクあり）
"style-src 'self' 'unsafe-inline'",
```

### 注意事項

- `'unsafe-inline'` と `'unsafe-eval'` は可能な限り使用しない
- `'unsafe-inline'` はCSPの保護を弱体化させるため、ビルド時スタイル生成を推奨
- 本番環境では Report-Only モードで動作確認後、Enforce モードに移行する

---

## XSS対策まとめ

| 環境 | 基本対策 | HTML許可時 | URL検証 |
|------|---------|-----------|---------|
| **Laravel/Blade** | `{{ }}` 使用 | HTMLPurifier | - |
| **React** | JSX自動エスケープ | DOMPurify | protocol検証 |
| **共通** | CSP設定 | - | - |
