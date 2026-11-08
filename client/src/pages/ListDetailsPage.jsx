import { useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EditListForm from '../components/lists/EditListForm.jsx'
import MovieGrid from '../components/movies/MovieGrid.jsx'
import useLibraryAction, { BUTTON_BASE_CLASS } from '../hooks/useLibraryAction.js'
import { DANGER_BUTTON, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/lists/listStyles.js'
import useList from '../hooks/useList.js'
import { formatMovieCount } from '../lib/lists.js'

const LINK_CLASS = 'text-accent underline underline-offset-2 hover:text-accent-hover'

const REMOVE_CLASS = 'border-border-strong hover:border-error hover:text-error'

function RemoveButton({ movie, listName, onRemove }) {
  const { pending, failed, run, ignoreKeyRepeat } = useLibraryAction()

  return (
    <>
      <button
        type="button"
        onClick={(event) => run(event, () => onRemove(movie.tmdbId))}
        onKeyDown={ignoreKeyRepeat}
        aria-label={`Remove ${movie.title} from ${listName}`}
        aria-busy={pending}
        aria-disabled={pending}
        className={`${BUTTON_BASE_CLASS} ${REMOVE_CLASS} ${pending ? 'cursor-default opacity-60' : ''}`}
      >
        {pending ? 'Removing...' : 'Remove'}
      </button>
      {failed && (
        <p role="alert" className="mt-1 text-xs text-error">
          Couldn&apos;t remove. Try again.
        </p>
      )}
    </>
  )
}

function ListDetails({ list, updateList, deleteList, removeMovie }) {
  const navigate = useNavigate()
  const formId = useId()
  const renameRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const moviesHeadingId = useId()
  const moviesHeadingRef = useRef(null)
  const emptyRef = useRef(null)

  function closeEditor() {
    setEditing(false)
    renameRef.current.focus()
  }

  async function handleDelete() {
    if (deleting || !window.confirm(`Delete the list "${list.name}"? This cannot be undone.`)) return

    setDeleting(true)
    setDeleteError('')
    try {
      await deleteList()
      navigate('/lists')
    } catch {
      setDeleteError("We couldn't delete this list. Please try again.")
      setDeleting(false)
    }
  }

  // The pressed button disappears with its card, so focus moves to what stays: the
  // Movies heading, or the empty state once the last movie is gone.
  async function handleRemove(tmdbId) {
    const lastMovie = list.movies.length === 1
    if (!(await removeMovie(tmdbId))) return
    if (lastMovie) {
      requestAnimationFrame(() => emptyRef.current?.focus())
    } else {
      moviesHeadingRef.current?.focus()
    }
  }

  return (
    <>
      <h1 className="text-gradient text-3xl font-bold tracking-tight break-words min-[860px]:text-4xl">{list.name}</h1>
      {list.description && <p className="mt-2 break-words text-muted">{list.description}</p>}
      <p className="mt-1 text-sm text-muted">{formatMovieCount(list.movies.length)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          ref={renameRef}
          type="button"
          aria-expanded={editing}
          aria-controls={editing ? formId : undefined}
          onClick={() => setEditing(true)}
          className={SECONDARY_BUTTON}
        >
          Rename
        </button>
        <button type="button" aria-disabled={deleting} onClick={handleDelete} className={DANGER_BUTTON}>
          {deleting ? 'Deleting...' : 'Delete list'}
        </button>
      </div>

      <div role="alert" className="mt-2 text-sm text-error empty:hidden">
        {deleteError}
      </div>

      {editing && <EditListForm id={formId} list={list} onSave={updateList} onClose={closeEditor} />}

      {list.movies.length === 0 ? (
        <p ref={emptyRef} tabIndex={-1} className="mt-8 text-muted outline-none">
          No movies in this list yet.
        </p>
      ) : (
        <section className="mt-8">
          <h2
            id={moviesHeadingId}
            ref={moviesHeadingRef}
            tabIndex={-1}
            className="text-xl font-bold tracking-tight outline-none"
          >
            Movies
          </h2>
          <MovieGrid
            movies={list.movies}
            labelledBy={moviesHeadingId}
            renderControls={(movie) => <RemoveButton movie={movie} listName={list.name} onRemove={handleRemove} />}
          />
        </section>
      )}
    </>
  )
}

function ListDetailsPage() {
  const { id } = useParams()
  const { status, list, retry, updateList, deleteList, removeMovie } = useList(id)
  const contentRef = useRef(null)

  // The retry removes this button, so focus moves first to a place that stays.
  function handleRetry() {
    contentRef.current.focus()
    retry()
  }

  return (
    <>
      <Link to="/lists" className={`text-sm ${LINK_CLASS}`}>
        Back to lists
      </Link>

      <div ref={contentRef} tabIndex={-1} className="mt-4 outline-none">
        {status === 'loading' && (
          <p role="status" className="text-muted">
            Loading list...
          </p>
        )}

        {status === 'notFound' && (
          <>
            <h1 className="text-gradient text-3xl font-bold tracking-tight min-[860px]:text-4xl">List not found</h1>
            <p className="mt-2 text-muted">
              This list doesn&apos;t exist or was deleted.{' '}
              <Link to="/lists" className={LINK_CLASS}>
                See your lists
              </Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <div role="alert">
            <p className="text-error">We couldn&apos;t load this list.</p>
            <button type="button" onClick={handleRetry} className={`mt-4 ${PRIMARY_BUTTON}`}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && (
          <ListDetails list={list} updateList={updateList} deleteList={deleteList} removeMovie={removeMovie} />
        )}
      </div>
    </>
  )
}

export default ListDetailsPage
