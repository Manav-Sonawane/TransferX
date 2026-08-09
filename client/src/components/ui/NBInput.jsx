import { forwardRef } from 'react';

/**
 * Neo-Brutalist input field with thick black border + hard shadow on focus.
 */
const NBInput = forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="nb-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`nb-input ${error ? 'nb-input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)' }}>
          ✕ {error}
        </p>
      )}
    </div>
  );
});

NBInput.displayName = 'NBInput';
export default NBInput;
