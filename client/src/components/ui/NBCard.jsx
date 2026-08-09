/**
 * Neo-Brutalist card.
 * Square corners, thick black border, hard offset shadow.
 * Optional accent header strip colour.
 */
const NBCard = ({
  shadow = 'md',
  className = '',
  children,
  style,
  ...props
}) => {
  const shadowStyle =
    shadow === 'lg' ? 'var(--nb-shadow-lg)' :
    shadow === 'sm' ? 'var(--nb-shadow-sm)' :
                      'var(--nb-shadow)';

  return (
    <div
      className={className}
      style={{
        background: 'var(--nb-surface)',
        border: 'var(--nb-border)',
        borderRadius: 0,
        boxShadow: shadowStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default NBCard;
