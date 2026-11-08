import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useListMembership from '../../hooks/useListMembership.js'
import { BUTTON_IDLE_CLASS, actionButtonClass } from '../../hooks/useLibraryAction.js'
import { ActionLabel, ListPlusIcon } from '../movies/ActionIcons.jsx'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './listStyles.js'

const LINK_CLASS = 'text-accent underline underline-offset-2 hover:text-accent-hover'

function ListCheckbox({ list, onToggle }) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleChange() {
    if (pending) return
    setPending(true)
    setFailed(false)
    try {
      await onToggle(list)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <li>
      <label className={`flex items-center gap-3 py-2 ${pending ? 'opacity-60' : ''}`}>
        <input
          type="checkbox"
          checked={list.hasMovie}
          onChange={handleChange}
          aria-busy={pending}
          className="size-4 accent-accent"
        />
        <span className="min-w-0 break-words">{list.name}</span>
      </label>
      {failed && (
        <p role="alert" className="text-xs text-error">
          Couldn&apos;t update &ldquo;{list.name}&rdquo;. Try again.
        </p>
      )}
    </li>
  )
}

function AddToListButton({ movie, compact = false }) {
  const { status, lists, load, toggle } = useListMembership(movie)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const headingId = useId()

  function open() {
    load()
    dialogRef.current.showModal()
  }

  function close() {
    dialogRef.current.close()
  }

  // Fires for Done, Escape and backdrop clicks alike.
  function handleClose() {
    triggerRef.current?.focus()
  }

  // A click whose target is the dialog itself landed on the backdrop, outside the panel.
  function handleDialogClick(event) {
    if (event.target === dialogRef.current) close()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={`Add to list: ${movie.title}`}
        className={`${actionButtonClass(compact)} ${BUTTON_IDLE_CLASS}`}
      >
        <ListPlusIcon />
        <ActionLabel compact={compact} align="end">
          Add to list
        </ActionLabel>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={handleClose}
        onClick={handleDialogClick}
        className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-text shadow-soft backdrop:bg-bg/70"
      >
        <div className="p-5">
          <h2 id={headingId} className="text-lg font-bold wrap-anywhere">
            Add &ldquo;{movie.title}&rdquo; to a list
          </h2>

          <div className="mt-4">
            {status === 'loading' && (
              <p role="status" className="text-muted">
                Loading lists...
              </p>
            )}

            {status === 'error' && (
              <div role="alert">
                <p className="text-error">We couldn&apos;t load your lists.</p>
                <button type="button" onClick={load} className={`mt-3 ${PRIMARY_BUTTON}`}>
                  Try again
                </button>
              </div>
            )}

            {status === 'ready' && lists.length === 0 && (
              <p className="text-muted">
                You have no lists yet.{' '}
                <Link to="/lists" onClick={close} className={LINK_CLASS}>
                  Create one on your lists page
                </Link>
              </p>
            )}

            {status === 'ready' && lists.length > 0 && (
              <ul className="max-h-72 list-none overflow-y-auto">
                {lists.map((list) => (
                  <ListCheckbox key={list.id} list={list} onToggle={toggle} />
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={close} className={SECONDARY_BUTTON}>
              Done
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default AddToListButton
