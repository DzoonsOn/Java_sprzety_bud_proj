'use client';

/** Gwiazdki: tryb tylko do odczytu albo klikalny (gdy podano onChange). */
export default function Stars({ value = 0, onChange, size = 18 }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= Math.round(value) ? 'star on' : 'star'}
          onClick={onChange ? () => onChange(n) : undefined}
          style={onChange ? { cursor: 'pointer' } : undefined}
          role={onChange ? 'button' : undefined}
          aria-label={onChange ? `${n} / 5` : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
