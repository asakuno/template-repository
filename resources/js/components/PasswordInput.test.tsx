import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('パスワード入力フィールドがデフォルトでtype=passwordで表示される', () => {
    render(<PasswordInput id="password" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText('パスワード');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('トグルボタンでtype=textに切り替わる', async () => {
    const user = userEvent.setup();
    render(<PasswordInput id="password" value="" onChange={vi.fn()} />);
    const toggleButton = screen.getByRole('button', { name: 'パスワードを表示' });
    await user.click(toggleButton);
    const input = screen.getByLabelText('パスワード');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('再度トグルでtype=passwordに戻る', async () => {
    const user = userEvent.setup();
    render(<PasswordInput id="password" value="" onChange={vi.fn()} />);
    const toggleButton = screen.getByRole('button', { name: 'パスワードを表示' });
    await user.click(toggleButton);
    const hideButton = screen.getByRole('button', { name: 'パスワードを隠す' });
    await user.click(hideButton);
    const input = screen.getByLabelText('パスワード');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('エラーメッセージが表示される', () => {
    render(
      <PasswordInput id="password" value="" onChange={vi.fn()} error="パスワードは必須です" />,
    );
    expect(screen.getByText('パスワードは必須です')).toBeInTheDocument();
  });

  it('入力値が変更されるとonChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput id="password" value="" onChange={onChange} />);
    const input = screen.getByLabelText('パスワード');
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('onBlurが呼ばれる', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<PasswordInput id="password" value="" onChange={vi.fn()} onBlur={onBlur} />);
    const input = screen.getByLabelText('パスワード');
    await user.click(input);
    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });
});
