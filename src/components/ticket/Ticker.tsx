// Text as little flip cards. A character that changes flips in, the rest stay put.
export function Ticker({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <div role="img" aria-label={`${label}: ${text}`} className="flex flex-wrap gap-0.75">
        {[...text].map((char, i) => (
          <span
            // Keyed on the character too, so a changed one remounts and plays its animation again
            key={`${i}:${char}`}
            aria-hidden="true"
            style={{ "--i": i, fontFamily: '"DM Mono", monospace' } as React.CSSProperties}
            className="tk-char grid h-8 min-w-5.5 place-items-center rounded-md border border-outline-variant bg-on-surface px-0.75 text-[15px] text-surface"
          >
            {char === " " ? "\u00a0" : char}
          </span>
        ))}
      </div>
    </div>
  );
}
