function TrailerEmbed({ trailerKey, title }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold tracking-tight min-[860px]:text-2xl">Trailer</h2>
      <div className="aspect-video w-full overflow-hidden rounded-card border border-border bg-surface shadow-soft">
        {/* YouTube refuses to play embeds that send no referrer. */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}`}
          title={`${title} trailer`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="h-full w-full"
        />
      </div>
    </section>
  )
}

export default TrailerEmbed
