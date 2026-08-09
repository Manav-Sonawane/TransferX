import { forwardRef } from 'react';

const variants = {
  primary:  'nb-btn-primary',
  blue:     'nb-btn-blue',
  green:    'nb-btn-green',
  ghost:    'nb-btn-ghost',
  danger:   'nb-btn-danger',
  black:    'nb-btn-black',
  lavender: 'nb-btn-lavender',
};

const sizes = {
  sm: 'nb-btn-sm',
  md: '',
  lg: 'nb-btn-lg',
};

/**
 * Neo-Brutalist button.
 * Physically pressable — translate + shadow shift on hover/active.
 */
const NBButton = forwardRef(({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  children,
  className = '',
  type = 'button',
  ...props
}, ref) => (
  <button
    ref={ref}
    type={type}
    className={`${variants[variant] ?? 'nb-btn-primary'} ${sizes[size] ?? ''} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading
      ? <span className="nb-mono text-xs tracking-widest">LOADING...</span>
      : children}
  </button>
));

NBButton.displayName = 'NBButton';
export default NBButton;
