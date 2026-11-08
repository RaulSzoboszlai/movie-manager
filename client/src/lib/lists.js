const MAX_NAME_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 500

// Errors are added in form order so the first key is the first invalid field.
export function validateList({ name, description }) {
  const errors = {}
  const trimmedName = name.trim()
  if (trimmedName === '') {
    errors.name = 'Name is required'
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_NAME_LENGTH} characters`
  }
  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
  }
  return errors
}

export function formatMovieCount(count) {
  return count === 1 ? '1 movie' : `${count} movies`
}
