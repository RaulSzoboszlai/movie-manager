import { useState } from 'react'
import { flushSync } from 'react-dom'
import { validateList } from '../lib/lists.js'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'
const EMPTY_VALUES = { name: '', description: '' }

function useListForm({ initialValues = EMPTY_VALUES, submit, resetOnSuccess = false }) {
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

  function showErrors(form, nextErrors) {
    flushSync(() => setErrors(nextErrors))
    form.elements[Object.keys(nextErrors)[0]].focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return

    const form = event.currentTarget
    const nextErrors = validateList(values)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('')
      showErrors(form, nextErrors)
      return
    }

    setErrors({})
    setFormError('')
    setPending(true)
    try {
      await submit({ name: values.name.trim(), description: values.description.trim() })
      if (resetOnSuccess) setValues(EMPTY_VALUES)
    } catch (err) {
      const message = err.response?.data?.message
      // A duplicate name belongs to the name field; anything else is about the whole form.
      if (err.response?.status === 409 && typeof message === 'string') {
        showErrors(form, { name: message })
      } else {
        const status = err.response?.status
        setFormError(status >= 400 && status <= 499 && typeof message === 'string' ? message : FALLBACK_MESSAGE)
      }
    } finally {
      setPending(false)
    }
  }

  return { values, errors, formError, pending, handleChange, handleSubmit }
}

export default useListForm
