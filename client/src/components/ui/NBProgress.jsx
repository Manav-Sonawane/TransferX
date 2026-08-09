/**
 * Neo-Brutalist progress bar.
 * Chunky block-style — NOT a thin SaaS progress bar.
 */
const accentColor = {
  black:  '#0A0A0A',
  yellow: '#FFD23F',
  blue:   '#4A90D9',
  green:  '#5CB85C',
  pink:   '#FF6B6B',
};

const NBProgress = ({ progress = 0, accent = 'black', label, showPercent = true }) => {
  const fill = accentColor[accent] ?? '#0A0A0A';
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full space-y-1.5">
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div className="nb-progress-track">
        <div
          className="nb-progress-bar"
          style={{ width: `${clamped}%`, backgroundColor: fill }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default NBProgress;
