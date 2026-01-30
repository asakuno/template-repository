/**
 * サイドナビゲーション項目コンポーネント
 *
 * Material Symbols アイコン + ラベルのリンク。active 状態でハイライト表示。
 */
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

export function NavItem({ href, icon, label, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      )}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </Link>
  );
}
