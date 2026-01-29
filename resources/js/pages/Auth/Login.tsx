import { Head } from '@inertiajs/react';
import { LoginForm } from '@/components/LoginForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ログインページ
 *
 * 中央配置のカードレイアウトでログインフォームを表示する。
 */
export default function Login() {
  return (
    <>
      <Head title="ログイン" />
      <div className="flex min-h-screen items-center justify-center bg-bg-auth">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-center text-sm">
            {/* TODO: パスワードリセットページ実装後にリンク先を設定 */}
            <button type="button" className="text-primary hover:underline">
              パスワードをお忘れですか？
            </button>
            {/* TODO: 新規登録ページ実装後にリンク先を設定 */}
            <button type="button" className="text-primary hover:underline">
              新規登録はこちら
            </button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
