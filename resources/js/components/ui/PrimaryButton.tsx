/**
 * プライマリボタンコンポーネント
 *
 * フォーム送信用の青色ボタン。processing状態とdisabled状態に対応。
 */
import type React from 'react';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps {
  type?: 'button' | 'submit';
  disabled?: boolean;
  processing?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function PrimaryButton({
  type = 'submit',
  disabled,
  processing,
  children,
  className,
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || processing}
      onClick={onClick}
      className={cn(
        'w-full bg-[#2767cf] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 shadow-md',
        (disabled || processing) && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {processing ? '処理中...' : children}
    </button>
  );
}
