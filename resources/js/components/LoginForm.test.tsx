import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

// laravel-precognition-react のモック（React stateベース）
const mockSubmit = vi.fn();
const mockValidate = vi.fn();

vi.mock('laravel-precognition-react', () => ({
  useForm: (_method: string, _url: string, initialData: Record<string, string>) => {
    // React の useState を使ってモックの状態を管理
    const [data, setDataState] = useState({ ...initialData });
    return {
      data,
      errors: {} as Record<string, string>,
      processing: false,
      setData: (key: string, value: string) => {
        setDataState((prev) => ({ ...prev, [key]: value }));
      },
      validate: mockValidate,
      submit: mockSubmit,
    };
  },
}));

describe('LoginForm', () => {
  it('メールアドレスとパスワードのフィールドが表示される', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
  });

  it('ログインするボタンが表示される', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: 'ログインする' })).toBeInTheDocument();
  });

  it('メールアドレスにplaceholderが設定されている', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
  });

  it('メールアドレスに入力できる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('パスワードに入力できる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  it('フォームを送信できる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const submitButton = screen.getByRole('button', { name: 'ログインする' });
    await user.click(submitButton);
    expect(mockSubmit).toHaveBeenCalled();
  });
});
