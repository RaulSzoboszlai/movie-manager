const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,30}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_BYTES = 72

// Errors are added in form order so the first key is the first invalid field.
export function validateRegister({ username, email, password }) {
  const errors = {}
  if (!USERNAME_PATTERN.test(username.trim())) {
    errors.username = 'Username must be 3-30 letters, numbers, hyphens or underscores'
  }
  const trimmedEmail = email.trim()
  if (trimmedEmail.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address'
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = 'Password must be at least 8 characters'
  } else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    errors.password = 'Password is too long'
  }
  return errors
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) {
    errors.email = 'Email is required'
  }
  if (!password) {
    errors.password = 'Password is required'
  }
  return errors
}
