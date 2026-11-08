import { Link } from 'react-router-dom'
import FormField from '../components/auth/FormField.jsx'
import useAuth from '../hooks/useAuth.js'
import useAuthForm from '../hooks/useAuthForm.js'
import { validateRegister } from '../lib/authValidation.js'

const INITIAL_VALUES = { username: '', email: '', password: '' }

function RegisterPage() {
  const { register } = useAuth()
  const { values, errors, formError, pending, handleChange, handleSubmit } = useAuthForm({
    initialValues: INITIAL_VALUES,
    validate: validateRegister,
    submit: register,
  })

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-gradient text-3xl font-bold tracking-tight min-[860px]:text-4xl">Register</h1>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-card border border-border bg-surface p-4 shadow-soft min-[860px]:p-6"
      >
        <div role="alert" className="text-sm text-error empty:hidden">
          {formError}
        </div>
        <FormField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={values.username}
          error={errors.username}
          onChange={handleChange}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={handleChange}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          value={values.password}
          error={errors.password}
          onChange={handleChange}
        />
        <button
          type="submit"
          aria-disabled={pending}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent underline underline-offset-2 hover:text-accent-hover">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
