type StatusPillProps = {
  label: string;
  color: string;
  bg: string;
  className?: string;
};

export function StatusPill({ label, color, bg, className = "" }: StatusPillProps) {
  return (
    <span
      className={`status-pill ${className}`}
      style={{ color, background: bg }}
    >
      <span className="status-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
