/**
 * Neo-Brutalist code input.
 * Large monospace tracking, thick border, physical feel.
 * Used for share codes and P2P session codes.
 */
const NBCodeInput = ({
  value,
  onChange,
  error,
  placeholder = 'XXXXX',
  label,
  maxLength = 5,
  id,
  autoFocus,
}) => {
  const inputId = id || 'nb-code-input';

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    onChange?.(val);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="nb-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        aria-label={label || 'Enter code'}
        className={`nb-input text-center text-2xl font-bold tracking-[0.5em] py-4 ${error ? 'nb-input-error' : ''}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      />
      {error && (
        <p className="mt-1.5 text-xs font-bold flex items-center justify-center gap-1" style={{ color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)' }}>
          ✕ {error}
        </p>
      )}
    </div>
  );
};

export default NBCodeInput;
