/**
 * TopNav コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
  router: {
    post: vi.fn(),
  },
  usePage: vi.fn(() => ({
    props: {
      auth: {
        user: { id: 1, name: '田中太郎' },
      },
    },
  })),
}));

import { TopNav } from '../TopNav';

describe('TopNav', () => {
  it('検索バーが表示されること', () => {
    render(<TopNav />);
    expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument();
  });

  it('ユーザー名が表示されること', () => {
    render(<TopNav />);
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
  });

  it('ログアウトボタンが表示されること', () => {
    render(<TopNav />);
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });

  it('通知バッジに aria-label が設定されること', () => {
    render(<TopNav />);
    expect(screen.getByLabelText('通知')).toBeInTheDocument();
  });
});
