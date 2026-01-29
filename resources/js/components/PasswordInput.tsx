import { type ChangeEvent, type FocusEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordInputProps {
  /** フィールドID */
  id: string;
  /** 現在の値 */
  value: string;
  /** 値変更ハンドラ */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** フォーカスアウトハンドラ */
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /** エラーメッセージ */
  error?: string | undefined;
}

/**
 * パスワード入力コンポーネント
 *
 * パスワードの表示/非表示をトグルできるEyeアイコン付き入力フィールド。
 */
export function PasswordInput({ id, value, onChange, onBlur, error }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>パスワード</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={error ? 'border-red-500' : ''}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-card-foreground"
          onClick={() => {
            setShowPassword((prev) => !prev);
          }}
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-red-500 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Eyeアイコン（表示） */
function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** EyeOffアイコン（非表示） */
function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
