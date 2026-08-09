/**
 * Neo-Brutalist badge.
 * Small monospace text, thick bordered, hard shadow.
 */
const colorClass = {
  yellow:   'nb-badge-yellow',
  blue:     'nb-badge-blue',
  green:    'nb-badge-green',
  pink:     'nb-badge-pink',
  black:    'nb-badge-black',
  white:    'nb-badge-white',
  orange:   'nb-badge-orange',
  lavender: 'nb-badge-lavender',
};

const NBBadge = ({ color = 'black', children, className = '' }) => (
  <span className={`${colorClass[color] ?? 'nb-badge-black'} ${className}`}>
    {children}
  </span>
);

export default NBBadge;
