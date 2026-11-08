const ICONS = {
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  list: <path d="M4 6h11M4 12h11M4 18h7M18 15v6M15 18h6" />,
}

// A calm panel for a view with nothing to show yet. `ref`, `tabIndex` and `role` pass
// through so a view can move focus here or announce it as a status message.
function EmptyState({ ref, icon = 'film', title, message, children, role, tabIndex, compact = false, className = '' }) {
  const spacing = compact ? 'gap-1 px-4 py-6' : 'gap-2 px-6 py-10'

  return (
    <div
      ref={ref}
      role={role}
      tabIndex={tabIndex}
      className={`flex flex-col items-center rounded-card border border-border bg-surface text-center shadow-soft outline-none ${spacing} ${className}`}
    >
      {!compact && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-1 size-10 text-muted"
        >
          {ICONS[icon]}
        </svg>
      )}
      <p className="max-w-full font-bold wrap-anywhere">{title}</p>
      {message && <p className="max-w-md text-sm text-muted wrap-anywhere">{message}</p>}
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  )
}

export default EmptyState
