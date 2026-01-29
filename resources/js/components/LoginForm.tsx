import { useForm } from 'laravel-precognition-react';
import type { FormEvent } from 'react';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * ログインフォームコンポーネント
 *
 * Laravel Precognition を使用してリアルタイムバリデーションを実行する。
 */
export function LoginForm() {
  const form = useForm('post', '/login', {
    email: '',
    password: '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.submit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* メールアドレス */}
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          value={form.data.email}
          onChange={(e) => {
            form.setData('email', e.target.value);
          }}
          onBlur={() => {
            form.validate('email');
          }}
          className={form.errors.email ? 'border-red-500' : ''}
          aria-describedby={form.errors.email ? 'email-error' : undefined}
        />
        {form.errors.email ? (
          <p id="email-error" className="text-red-500 text-sm">
            {form.errors.email}
          </p>
        ) : null}
      </div>

      {/* パスワード */}
      <PasswordInput
        id="password"
        value={form.data.password}
        onChange={(e) => {
          form.setData('password', e.target.value);
        }}
        onBlur={() => {
          form.validate('password');
        }}
        error={form.errors.password}
      />

      {/* 送信ボタン */}
      <Button type="submit" className="w-full" disabled={form.processing}>
        ログインする
      </Button>
    </form>
  );
}
