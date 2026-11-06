export function formatRuntime(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}m`
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`
}

// A date-only string parses as UTC, so any other zone could show the previous day.
export function formatReleaseDate(releaseDate) {
  return new Date(releaseDate).toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
}
