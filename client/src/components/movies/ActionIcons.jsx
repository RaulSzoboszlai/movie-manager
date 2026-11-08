// Small decorative icons for the movie action buttons. The buttons carry the
// accessible names; saved and watched states use a filled shape, not color alone.

function Icon({ children }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      {children}
    </svg>
  )
}

export function BookmarkIcon({ filled = false }) {
  return (
    <Icon>
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" fill={filled ? 'currentColor' : 'none'} />
    </Icon>
  )
}

export function WatchedIcon({ filled = false }) {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} />
      <path d="m8 12.5 2.7 2.7L16 9.8" stroke={filled ? 'var(--color-bg)' : 'currentColor'} />
    </Icon>
  )
}

export function ListPlusIcon() {
  return (
    <Icon>
      <path d="M4 6h11M4 12h11M4 18h7M18 15v6M15 18h6" />
    </Icon>
  )
}

export function RetryIcon() {
  return (
    <Icon>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </Icon>
  )
}

const TOOLTIP_ALIGN = {
  // The first button in a row anchors left so the tooltip stays inside the card.
  center: 'left-1/2 -translate-x-1/2 group-first/action:left-0 group-first/action:translate-x-0',
  end: 'right-0',
}

// Visible label for an icon-only button. It repeats the button's accessible name, so
// assistive technology skips it.
function ActionTooltip({ children, align = 'center' }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-full z-20 mb-1.5 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs font-medium whitespace-nowrap text-text opacity-0 shadow-soft transition-opacity duration-100 group-hover/action:opacity-100 group-focus-visible/action:opacity-100 motion-reduce:transition-none ${TOOLTIP_ALIGN[align]}`}
    >
      {children}
    </span>
  )
}

// A tooltip on compact icon buttons, a plain visible label otherwise.
export function ActionLabel({ compact, align, children }) {
  return compact ? <ActionTooltip align={align}>{children}</ActionTooltip> : <span>{children}</span>
}
