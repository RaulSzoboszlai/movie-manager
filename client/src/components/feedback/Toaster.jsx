import { useEffect, useState } from 'react'

const DURATION_MS = 5000

function Toast({ toast, onDismiss }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const { id, message } = toast

  // Reading or reaching for a toast holds it on screen; the full time restarts after.
  useEffect(() => {
    if (hovered || focused) return undefined
    const timer = setTimeout(() => onDismiss(id), DURATION_MS)
    return () => clearTimeout(timer)
  }, [hovered, focused, id, onDismiss])

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  // A focused close button leaves with its toast, so focus moves back to the page.
  function handleDismiss(event) {
    if (event.currentTarget === document.activeElement) document.getElementById('main-content')?.focus({ preventScroll: true })
    onDismiss(id)
  }

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      className="pointer-events-auto flex items-start gap-3 rounded-card border border-border-strong bg-surface-raised py-3 pr-2 pl-4 text-sm text-text opacity-100 shadow-lift transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
    >
      <p className="min-w-0 flex-1 py-1 wrap-anywhere">{message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex size-7 flex-none items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-text motion-reduce:transition-none"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-4"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}

// Always mounted, so screen readers already watch the region when a toast arrives.
// Only additions are announced; older toasts are not read again.
function Toaster({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 min-[480px]:inset-x-auto min-[480px]:right-4 min-[480px]:w-88"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default Toaster
