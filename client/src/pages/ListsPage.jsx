import { useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import CreateListForm from '../components/lists/CreateListForm.jsx'
import { PRIMARY_BUTTON } from '../components/lists/listStyles.js'
import useLists from '../hooks/useLists.js'
import { formatMovieCount } from '../lib/lists.js'

function ListsPage() {
  const { status, lists, retry, createList } = useLists()
  const headingId = useId()
  const sectionRef = useRef(null)

  // The retry removes this button, so focus moves first to a place that stays.
  function handleRetry() {
    sectionRef.current.focus()
    retry()
  }

  return (
    <>
      <h1 className="text-gradient text-3xl font-bold tracking-tight min-[860px]:text-4xl">My lists</h1>

      {status === 'ready' && (
        <div className="mt-6 max-w-xl">
          <CreateListForm onCreate={createList} />
        </div>
      )}

      <section ref={sectionRef} tabIndex={-1} aria-labelledby={headingId} className="mt-8 outline-none">
        <h2 id={headingId} className="sr-only">
          Your lists
        </h2>

        {status === 'loading' && (
          <p role="status" className="text-muted">
            Loading your lists...
          </p>
        )}

        {status === 'error' && (
          <div role="alert">
            <p className="text-error">We couldn&apos;t load your lists.</p>
            <button type="button" onClick={handleRetry} className={`mt-4 ${PRIMARY_BUTTON}`}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && lists.length === 0 && (
          <p className="text-muted">No lists yet. Create your first one above.</p>
        )}

        {status === 'ready' && lists.length > 0 && (
          <ul className="grid list-none gap-3 min-[860px]:grid-cols-2">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  to={`/lists/${list.id}`}
                  className="block rounded-card border border-border bg-surface p-4 shadow-soft transition-colors hover:border-border-strong hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
                >
                  <span className="block font-bold break-words">{list.name}</span>
                  <span className="mt-1 block text-sm text-muted">{formatMovieCount(list.movieCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default ListsPage
