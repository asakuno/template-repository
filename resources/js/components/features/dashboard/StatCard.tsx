/**
 * 統計カードコンポーネント
 *
 * ラベル、値、変化率、アイコンを表示する統計情報カード。
 */
import { cn } from '@/lib/utils';
import type { StatCardData } from '@/types/dashboard';

export function StatCard({
  label,
  value,
  subLabel,
  subValue,
  change,
  changeDirection,
  icon,
  iconColorClass,
}: StatCardData) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm dark:text-gray-400">{label}</p>
          <p className="mt-1 font-bold text-2xl text-gray-900 dark:text-white">{value}</p>
          {subLabel != null && subValue != null && (
            <p className="mt-1 text-gray-400 text-xs dark:text-gray-500">
              {subLabel}: {subValue}
            </p>
          )}
        </div>
        <span className={cn('material-symbols-outlined text-[28px]', iconColorClass)}>{icon}</span>
      </div>
      {change != null && changeDirection != null && (
        <p
          className={cn(
            'mt-3 font-medium text-sm',
            changeDirection === 'up' && 'text-green-600 dark:text-green-400',
            changeDirection === 'down' && 'text-red-600 dark:text-red-400',
            changeDirection === 'neutral' && 'text-gray-500 dark:text-gray-400',
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
