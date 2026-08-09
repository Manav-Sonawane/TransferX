import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

/**
 * Neo-Brutalist file drop zone.
 * States: idle / drag-active (yellow) / drag-reject (pink) / disabled.
 * Does NOT handle upload logic — calls onFileAccepted with the File object.
 */
const NBDropzone = ({
  onFileAccepted,
  disabled   = false,
  accept,
  maxSize    = 100 * 1024 * 1024,
  className  = '',
  activeText = 'DROP IT HERE',
  idleText   = 'DROP FILE OR CLICK TO BROWSE',
  subText    = 'Max 100 MB · Any file type',
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length > 0) onFileAccepted?.(acceptedFiles[0]);
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize,
    disabled,
    accept,
  });

  const stateClass = isDragReject
    ? 'nb-dropzone-reject'
    : isDragActive
    ? 'nb-dropzone-active'
    : '';

  const disabledClass = disabled ? 'nb-dropzone-disabled pointer-events-none' : '';

  const iconBg = isDragActive || isDragReject ? 'rgba(0,0,0,0.15)' : 'var(--nb-black)';
  const iconColor = isDragActive || isDragReject ? 'var(--nb-black)' : '#FAFAF7';

  return (
    <div
      {...getRootProps()}
      className={`nb-dropzone ${stateClass} ${disabledClass} ${className}`}
      role="button"
      aria-label="File upload area"
    >
      <input {...getInputProps()} />

      <div
        className="w-14 h-14 flex items-center justify-center mb-4 flex-shrink-0"
        style={{ border: 'var(--nb-border)', background: iconBg }}
      >
        <UploadCloud size={24} color={iconColor} />
      </div>

      <p className="font-bold uppercase tracking-wider text-sm mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        {isDragReject ? 'FILE NOT SUPPORTED' : isDragActive ? activeText : disabled ? 'CONNECT FIRST' : idleText}
      </p>

      {!isDragReject && (
        <p className="text-xs font-medium" style={{ color: '#6b7280' }}>
          {subText}
        </p>
      )}
    </div>
  );
};

export default NBDropzone;
