/**
 * ウェルカムバナーコンポーネント
 *
 * ログイン後のユーザーへの挨拶メッセージを表示する。
 */

interface WelcomeBannerProps {
  userName: string;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white dark:from-blue-700 dark:to-blue-600">
      <h2 className="font-bold text-xl">おかえりなさい、{userName}さん</h2>
      <p className="mt-1 text-blue-100">今日も良い一日をお過ごしください。</p>
    </div>
  );
}
