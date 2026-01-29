import * as React from 'react';
import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

/**
 * ラベルコンポーネント
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: 汎用コンポーネントのため、使用側でhtmlForを設定する
    <label
      ref={ref}
      className={cn(
        'font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label, type LabelProps };
