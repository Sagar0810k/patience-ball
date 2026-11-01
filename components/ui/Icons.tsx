/** One consistent stroke icon set (replaces emoji, which look different on every device). */
const P: Record<string, string> = {
  view: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  level: 'M4 12h16M12 6v0M7 17h10',
  restart: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
  on: 'M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  off: 'M4 9v6h4l5 4V5L8 9H4zM17 9l5 6M22 9l-5 6',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.01',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  pause: 'M9 5v14M15 5v14',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  tilt: 'M4 16l8-8 8 8M4 20l8-8 8 8',
  install: 'M12 4v11M7 11l5 5 5-5M5 20h14',
};
export type IconName = keyof typeof P;
export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[name]} />
    </svg>
  );
}
