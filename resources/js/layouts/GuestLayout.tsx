/**
 * ゲスト用レイアウトコンポーネント
 *
 * 未認証ユーザー向けのレイアウト。背景グレー、中央配置の白カード。
 */
import type React from 'react';

interface GuestLayoutProps {
  children: React.ReactNode;
  /** カードの見出しテキスト（デフォルト: ログイン） */
  title?: string;
}

export function GuestLayout({ children, title = 'ログイン' }: GuestLayoutProps) {
  return (
    <div className="bg-[#EEF2F6] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[400px] bg-white rounded-lg shadow-lg p-8 sm:p-10">
        <header className="text-center mb-12">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
