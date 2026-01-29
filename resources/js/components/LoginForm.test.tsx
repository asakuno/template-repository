import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

// laravel-precognition-react のモック
const mockSubmit = vi.fn();
const mockValidate = vi.fn();
const mockSetData = vi.fn();

vi.mock('laravel-precognition-react', () => ({
  useForm: (_method: string, _url: string, initialData: Record<string, string>) => ({
    data: { ...initialData },
    errors: {},
    processing: false,
    setData: mockSetData,
    validate: mockValidate,
    submit: mockSubmit,
  }),
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

  it('メールアドレスに入力するとsetDataが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'a');
    expect(mockSetData).toHaveBeenCalledWith('email', 'a');
  });

  it('パスワードに入力するとsetDataが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'a');
    expect(mockSetData).toHaveBeenCalledWith('password', 'a');
  });

  it('フォームを送信できる', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const submitButton = screen.getByRole('button', { name: 'ログインする' });
    await user.click(submitButton);
    expect(mockSubmit).toHaveBeenCalled();
  });
});
