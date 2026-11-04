import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

function readServerMessage(err) {
  const status = err.response?.status
  const message = err.response?.data?.message
  return status >= 400 && status <= 499 && typeof message === 'string' ? message : FALLBACK_MESSAGE
}

function useAuthForm({ initialValues, validate, submit }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return

    const form = event.currentTarget
    const nextErrors = validate(values)
    const [firstInvalid] = Object.keys(nextErrors)
    if (firstInvalid) {
      flushSync(() => {
        setErrors(nextErrors)
        setFormError('')
      })
      form.elements[firstInvalid].focus()
      return
    }

    setErrors({})
    setFormError('')
    setPending(true)
    try {
      await submit(values)
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(readServerMessage(err))
      setPending(false)
    }
  }

  return { values, errors, formError, pending, handleChange, handleSubmit }
}

export default useAuthForm
