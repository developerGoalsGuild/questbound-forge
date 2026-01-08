import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends React.ComponentProps<'input'> {
  inputClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputClassName, id, name, placeholder, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const inputId = id || name || 'password';
    const toggle = () => setVisible((v) => !v);

    return (
      <div className={cn('relative', className)}>
        <Input
          {...props}
          id={inputId}
          name={name}
          ref={ref}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className={cn('pr-10', inputClassName)}
          autoComplete={props.autoComplete || (visible ? 'off' : 'current-password')}
          aria-describedby={props['aria-describedby']}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={visible ? 'Hide' : 'Show'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-1 my-auto px-2"
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff aria-hidden data-testid="icon-eye-off" />
          ) : (
            <Eye aria-hidden data-testid="icon-eye" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
