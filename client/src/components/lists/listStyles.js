const buttonBase =
  'rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-reduce:transition-none'

export const PRIMARY_BUTTON = `${buttonBase} bg-accent text-accent-ink hover:bg-accent-hover`
export const SECONDARY_BUTTON = `${buttonBase} border border-border-strong text-text hover:bg-surface-raised`
export const DANGER_BUTTON = `${buttonBase} border border-error text-error hover:bg-surface-raised`
