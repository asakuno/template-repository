import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';

// Inertia Head のモック
vi.mock('@inertiajs/react', () => ({
  Head: ({ title }: { title: string }) => <title>{title}</title>,
}));

// laravel-precognition-react のモック
vi.mock('laravel-precognition-react', () => ({
  useForm: (_method: string, _url: string, initialData: Record<string, string>) => ({
    data: { ...initialData },
    errors: {},
    processing: false,
    setData: vi.fn(),
    validate: vi.fn(),
    submit: vi.fn(),
  }),
}));

describe('Login ページ', () => {
  it('ログインタイトルが表示される', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('ログインフォームが表示される', () => {
    render(<Login />);
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログインする' })).toBeInTheDocument();
  });

  it('フッターリンクが表示される', () => {
    render(<Login />);
    expect(screen.getByText('パスワードをお忘れですか？')).toBeInTheDocument();
    expect(screen.getByText('新規登録はこちら')).toBeInTheDocument();
  });
});
