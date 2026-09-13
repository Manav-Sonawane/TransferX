import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Neo-Brutalist QR code — renders `value` as a scannable code so a mobile
 * user can skip typing the link/code by hand. Always rendered true
 * black-on-white regardless of surrounding card color, since QR scanners
 * need that contrast to read reliably.
 */
const NBQRCode = ({ value, size = 168, label = 'Scan to open on mobile' }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    setError(false);
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0A0A0A', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).catch(() => setError(true));
  }, [value, size]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="inline-flex items-center justify-center p-2 flex-shrink-0"
        style={{ border: 'var(--nb-border)', background: 'white' }}
      >
        {error ? (
          <div
            className="flex items-center justify-center text-center px-2"
            style={{ width: size, height: size, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b7280' }}
          >
            QR unavailable
          </div>
        ) : (
          <canvas ref={canvasRef} width={size} height={size} />
        )}
      </div>
      {label && (
        <p
          className="text-xs font-bold uppercase tracking-widest text-center"
          style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default NBQRCode;
