import * as React from 'react';
import { cn } from '@/lib/utils';

/** ボタンのバリアント定義 */
const buttonVariants = {
  variant: {
    default: 'bg-primary text-white shadow-xs hover:bg-primary/90',
    destructive: 'bg-red-500 text-white shadow-xs hover:bg-red-500/90',
    outline:
      'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9',
  },
} as const;

type ButtonVariant = keyof typeof buttonVariants.variant;
type ButtonSize = keyof typeof buttonVariants.size;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * ボタンコンポーネント
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, type ButtonProps };
