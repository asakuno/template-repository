/**
 * メール認証待ちページ
 *
 * 登録後にメール認証を促すページコンポーネント。
 * GuestLayout でラップし、認証メール再送機能を提供する。
 */

import { Head, Link, useForm } from '@inertiajs/react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GuestLayout } from '@/layouts/GuestLayout';

interface VerifyEmailProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const { post, processing } = useForm({});

  const handleResend = () => {
    post('/email/verification-notification');
  };

  return (
    <>
      <Head title="メール認証" />
      <GuestLayout title="メール認証">
        <p className="-mt-8 mb-6 text-center text-slate-500 text-sm">
          登録いただいたメールアドレスに認証リンクを送信しました。
          メール内のリンクをクリックして認証を完了してください。
        </p>

        {status === 'verification-link-sent' && (
          <div className="mb-6 rounded-md bg-green-50 p-3 text-center text-green-700 text-sm">
            認証リンクを再送しました。
          </div>
        )}

        <PrimaryButton processing={processing} onClick={handleResend}>
          認証メールを再送する
        </PrimaryButton>

        <hr className="my-6 border-slate-200" />

        <div className="text-center text-[13px] text-slate-600">
          <Link
            href="/logout"
            method="post"
            as="button"
            className="transition hover:text-[#326CCB] hover:underline"
          >
            ログアウト
          </Link>
        </div>
      </GuestLayout>
    </>
  );
}
