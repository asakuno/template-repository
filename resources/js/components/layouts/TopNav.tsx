/**
 * トップナビゲーションコンポーネント
 *
 * 検索バー、通知ベル、ユーザー情報、ログアウトボタンを表示。
 */
import { router, usePage } from '@inertiajs/react';
import type { AppPageProps } from '@/types/index.d.ts';

export function TopNav() {
  const { props } = usePage<AppPageProps>();
  const userName = props.auth.user?.name ?? '';

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
      {/* 検索バー */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-gray-400">search</span>
        <input
          type="text"
          placeholder="検索..."
          className="border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
        />
      </div>

      {/* 右側: 通知・ユーザー情報 */}
      <div className="flex items-center gap-4">
        {/* 通知ベル */}
        <button type="button" aria-label="通知" className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* ユーザー名 */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>

        {/* ログアウト */}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
