import { useState } from 'react'

const BUTTON_SHARED_CLASS =
  'rounded-md border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none'

// Full-width text button, e.g. Remove on a list's movie cards.
export const BUTTON_BASE_CLASS = `w-full px-2 py-1.5 ${BUTTON_SHARED_CLASS}`
export const BUTTON_IDLE_CLASS = 'border-border-strong hover:border-accent hover:text-accent'

// Library actions: square icon buttons on movie cards, icon plus label elsewhere.
export function actionButtonClass(compact) {
  const shape = compact ? 'size-8 justify-center' : 'gap-1.5 px-3 py-1.5'
  return `group/action relative inline-flex items-center ${shape} ${BUTTON_SHARED_CLASS}`
}

// Error message under a row of action buttons, after every button in the row.
export const ACTION_ERROR_CLASS = 'order-last basis-full text-xs text-error'

// On the library page the next card's button takes this one's place, under both the
// pointer and the focus, so a double click or a held key would change several movies.
function ignoreKeyRepeat(event) {
  if (event.repeat && event.key === 'Enter') event.preventDefault()
}

function useLibraryAction() {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function run(event, action) {
    if (pending || event.detail > 1) return

    setPending(true)
    setFailed(false)
    try {
      await action()
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return { pending, failed, run, ignoreKeyRepeat }
}

export default useLibraryAction
