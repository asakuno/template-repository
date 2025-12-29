# インジェクション系脆弱性対策

## 1. SQLインジェクション

### 脅威

SQLインジェクションは**IPA届出件数の上位**を占める重大な脆弱性である。攻撃により**個人情報漏洩、データ改ざん・消去、認証回避**が発生する。

### 根本的対策

Eloquent ORM または Query Builder のパラメータバインディングを必ず使用する。

```php
// ✅ 安全: Eloquent ORM（自動パラメータバインディング）
$user = User::where('email', $email)->first();

// ✅ 安全: Query Builder
$users = DB::table('users')->where('email', $email)->get();

// ✅ 安全: プリペアドステートメント
$users = DB::select('SELECT * FROM users WHERE email = ?', [$email]);

// ✅ 安全: whereRaw でのバインディング
User::whereRaw('email = ?', [$request->input('email')])->get();
```

### カラム名・テーブル名の動的指定

カラム名やテーブル名を動的に指定する場合は**ホワイトリスト検証**を必須とする。

```php
// ✅ 安全: カラム名のホワイトリスト検証
$allowedColumns = ['name', 'email', 'created_at'];
$sortColumn = $request->input('sort');

if (in_array($sortColumn, $allowedColumns)) {
    User::orderBy($sortColumn)->get();
}
```

### 禁止パターン

```php
// ❌ 危険: 文字列連結によるSQL構築
$email = $request->input('email');
$results = DB::select("SELECT * FROM users WHERE email = '$email'");

// ❌ 危険: whereRaw での直接埋め込み
User::whereRaw('email = "' . $request->input('email') . '"')->get();

// ❌ 危険: orderByRaw での未検証カラム名
User::orderByRaw($request->input('sort'))->get();
```

### 保険的対策

本番環境では必ず以下を実施する。

- `APP_DEBUG=false` の設定（エラーメッセージの非表示）
- データベースアカウントに最小権限を付与
- WAF（Web Application Firewall）の導入検討

---

## 2. OSコマンド・インジェクション

### 脅威

外部攻撃によりウェブサーバのOSコマンドが不正実行され、**サーバ内ファイルの閲覧・改ざん・削除、マルウェア感染、他システムへの攻撃の踏み台**となる。

### 根本的対策

**OSコマンド実行関数の使用を禁止**とする。必要な処理はPHP標準関数またはライブラリで実装する。

```php
// ✅ 最良: シェルコマンドを使用しない
mkdir('/path/to/dir');  // system("mkdir ...") の代わり
copy($source, $dest);   // shell_exec("cp ...") の代わり
```

### やむを得ず使用する場合

Symfony Process コンポーネントの使用を必須とする。`escapeshellarg()` のみに依存しない。

```php
// ✅ 推奨: Symfony Process コンポーネント使用
use Symfony\Component\Process\Process;

public function ping(Request $request)
{
    $request->validate(['ip' => 'required|ip']);

    $ip = $request->input('ip');
    $process = new Process(['ping', '-c', '4', $ip]);
    $process->run();

    return $process->getOutput();
}
```

### 禁止関数

以下の関数は原則使用禁止とする。

- `exec()`
- `shell_exec()`
- `system()`
- `passthru()`
- `proc_open()`
- `popen()`
- `pcntl_exec()`
- バッククォート演算子 `` `command` ``

### 禁止パターン

```php
// ❌ 危険: ユーザー入力を直接shell_exec
$ip = $request->input('ip');
$output = shell_exec("ping -c 4 " . $ip);
// 攻撃例: ip=127.0.0.1; cat /etc/passwd
```

---

## 3. ディレクトリ・トラバーサル

### 脅威

ファイル名を外部パラメータで指定する実装において、任意のファイルにアクセスされる。**/etc/passwd、.env等の機密ファイルの閲覧**や**認証情報の窃取**が発生する。

### 根本的対策

**ファイルアクセスは3つの方法のいずれかを使用**する。

#### 方法1: ホワイトリスト方式（最も安全）

```php
// ✅ 安全: ホワイトリスト方式
$allowedFiles = ['manual.pdf', 'report.csv', 'readme.txt'];
$filename = $request->input('file');

if (!in_array($filename, $allowedFiles)) {
    abort(403, 'Unauthorized file access');
}

return Storage::download('documents/' . $filename);
```

#### 方法2: basename() + ディレクトリ制限

```php
// ✅ 安全: basename() でファイル名のみ取得
Route::get('/download', function(Request $request) {
    $filename = basename($request->input('filename'));
    $path = storage_path('app/files/' . $filename);

    if (file_exists($path)) {
        return response()->download($path);
    }
    abort(404);
});
```

#### 方法3: realpath() + パス検証

**重要**: `realpath()` はファイルが存在しない場合に `false` を返すため、先に `file_exists()` でファイルの存在を確認する。

```php
// ✅ 安全: basename() + file_exists() + realpath() の組み合わせ
public function downloadFile(Request $request)
{
    $basePath = storage_path('app/files');
    $filename = $request->input('filename');

    // 1. basename()でファイル名のみ取得
    $safeFilename = basename($filename);

    // 2. パスを構築
    $requestedPath = $basePath . '/' . $safeFilename;

    // 3. ファイルの存在確認
    if (!file_exists($requestedPath)) {
        abort(404, 'File not found');
    }

    // 4. realpath()で正規化
    $realPath = realpath($requestedPath);

    // 5. ベースパス内か検証
    if ($realPath === false || !str_starts_with($realPath, $basePath)) {
        abort(403, 'Unauthorized file access');
    }

    return response()->download($realPath);
}
```

### 禁止パターン

```php
// ❌ 危険: ユーザー入力をそのままパス構築
Route::get('/download', function(Request $request) {
    return response()->download(
        storage_path('app/' . $request->input('filename'))
    );
});
// 攻撃例: filename=../../.env

// ❌ 不十分: "../" の単純削除（回避可能）
$page = str_replace('../', '', $_GET['page']);
// 攻撃例: ....//....//etc/passwd → ../../../etc/passwd
```

### 追加対策

ファイルアップロード時は以下も実装する。

- ファイルタイプのバリデーション（MIME typeとバイナリの検証）
- ファイルサイズの制限
- ファイル名のランダム化（`Storage::putFile()` 使用）
- 実行可能ファイルの保存禁止
