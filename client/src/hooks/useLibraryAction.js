import { useState } from 'react'

export const BUTTON_BASE_CLASS =
  'w-full rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none'
export const BUTTON_IDLE_CLASS = 'border-border-strong hover:border-accent hover:text-accent'

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
