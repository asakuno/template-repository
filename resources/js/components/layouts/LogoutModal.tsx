/**
 * ログアウト確認モーダルコンポーネント
 *
 * Glassmorphismデザインの確認モーダル。
 * shadcn/ui Dialog をベースにカスタムスタイルを適用。
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type LogoutModalProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  processing: boolean;
};

export function LogoutModal({
  open,
  onClose,
  onLogout,
  processing,
}: LogoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[360px] rounded-[2rem] border-white/60 bg-white/70 p-10 text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60 md:p-12"
      >
        {/* アイコン */}
        <div className="mb-8 text-slate-700 dark:text-slate-200">
          <span className="material-symbols-outlined text-4xl font-light opacity-90">
            logout
          </span>
        </div>

        {/* タイトル */}
        <DialogTitle className="mb-6 text-sm font-normal uppercase tracking-[0.2em] text-slate-800 dark:text-white">
          Logout
        </DialogTitle>

        {/* 説明文 */}
        <DialogDescription className="mb-10 text-xs font-light leading-7 tracking-wide text-slate-500 dark:text-slate-400">
          ログアウトしてもよろしいですか？
          <br />
          作業内容は自動的に保存されます。
        </DialogDescription>

        {/* ボタン */}
        <div className="flex w-full flex-col items-center gap-5">
          <button
            type="button"
            onClick={onLogout}
            disabled={processing}
            className="w-full rounded-lg bg-[#0F172A] px-6 py-3 text-xs font-medium tracking-widest text-white shadow-lg shadow-[#0F172A]/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1E1B4B] dark:shadow-black/40"
          >
            ログアウト
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-transparent border-b pb-0.5 text-xs font-light text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-800 dark:text-slate-500 dark:hover:border-slate-500 dark:hover:text-slate-200"
          >
            キャンセル
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
