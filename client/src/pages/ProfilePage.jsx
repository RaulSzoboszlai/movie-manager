import { useId, useRef } from 'react'
import { PRIMARY_BUTTON } from '../components/lists/listStyles.js'
import RatingDistribution from '../components/profile/RatingDistribution.jsx'
import StatCard from '../components/profile/StatCard.jsx'
import TopGenres from '../components/profile/TopGenres.jsx'
import useProfileStats from '../hooks/useProfileStats.js'
import { formatMovieCount } from '../lib/lists.js'

function ProfileStats({ stats }) {
  const { watchedCount, watchlistCount, ratedCount, averageRating, ratingDistribution, topGenres, listCount } = stats
  const rated = averageRating !== null

  return (
    <>
      <dl className="grid gap-3 min-[480px]:grid-cols-2 min-[860px]:grid-cols-4">
        <StatCard label="Watched" value={watchedCount} />
        <StatCard label="Want to watch" value={watchlistCount} />
        <StatCard
          label="Average rating"
          value={rated ? `${averageRating.toFixed(1)} / 5` : 'No ratings yet'}
          detail={rated ? `from ${formatMovieCount(ratedCount)}` : undefined}
        />
        <StatCard label="Lists" value={listCount} />
      </dl>

      <div className="mt-6 grid gap-6 min-[860px]:grid-cols-2">
        <RatingDistribution distribution={ratingDistribution} ratedCount={ratedCount} />
        <TopGenres genres={topGenres} />
      </div>
    </>
  )
}

function ProfilePage() {
  const { status, stats, retry } = useProfileStats()
  const headingId = useId()
  const sectionRef = useRef(null)

  // The retry removes this button, so focus moves first to a place that stays.
  function handleRetry() {
    sectionRef.current.focus()
    retry()
  }

  return (
    <>
      <h1 className="text-gradient text-3xl font-bold tracking-tight min-[860px]:text-4xl">Profile</h1>

      <section ref={sectionRef} tabIndex={-1} aria-labelledby={headingId} className="mt-6 outline-none">
        <h2 id={headingId} className="sr-only">
          Your stats
        </h2>

        {status === 'loading' && (
          <p role="status" className="text-muted">
            Loading your stats...
          </p>
        )}

        {status === 'error' && (
          <div role="alert">
            <p className="text-error">We couldn&apos;t load your stats.</p>
            <button type="button" onClick={handleRetry} className={`mt-4 ${PRIMARY_BUTTON}`}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && <ProfileStats stats={stats} />}
      </section>
    </>
  )
}

export default ProfilePage
