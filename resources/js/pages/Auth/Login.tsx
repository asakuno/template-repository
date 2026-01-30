/**
 * ログインページ
 *
 * Inertia useForm によるフォーム管理・送信を行うページコンポーネント。
 * GuestLayout でラップし、メールアドレス・パスワード入力を提供する。
 */
import type React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { InputField } from '@/components/ui/InputField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GuestLayout } from '@/layouts/GuestLayout';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <>
      <Head title="ログイン" />
      <GuestLayout>
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="mb-6">
            <InputField
              id="email"
              label="メールアドレス"
              type="email"
              value={data.email}
              placeholder="example@email.com"
              error={errors.email}
              onChange={(e) => setData('email', e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* パスワード */}
          <div className="mb-10">
            <PasswordInput
              id="password"
              label="パスワード"
              value={data.password}
              placeholder="••••••••••••"
              error={errors.password}
              onChange={(e) => setData('password', e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {/* 送信ボタン */}
          <PrimaryButton processing={processing}>ログインする</PrimaryButton>

          {/* フッターリンク */}
          <div className="mt-6 flex justify-between items-center text-[13px] text-slate-600">
            <Link href="#" className="hover:text-[#326CCB] hover:underline transition">
              パスワードをお忘れですか？
            </Link>
            <Link href="#" className="hover:text-[#326CCB] hover:underline transition">
              新規登録はこちら
            </Link>
          </div>
        </form>
      </GuestLayout>
    </>
  );
}
