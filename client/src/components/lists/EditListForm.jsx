import { useEffect, useRef } from 'react'
import useListForm from '../../hooks/useListForm.js'
import useToast from '../../hooks/useToast.js'
import ListFields from './ListFields.jsx'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './listStyles.js'

function EditListForm({ id, list, onSave, onClose }) {
  const nameRef = useRef(null)
  const showToast = useToast()
  const form = useListForm({
    initialValues: { name: list.name, description: list.description },
    submit: async (values) => {
      await onSave(values)
      showToast(`Saved list “${values.name}”`)
      onClose()
    },
  })

  useEffect(() => {
    nameRef.current.focus()
  }, [])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <form
      id={id}
      noValidate
      aria-label="Rename list"
      onSubmit={form.handleSubmit}
      onKeyDown={handleKeyDown}
      className="mt-6 space-y-4 rounded-card border border-border bg-surface p-4 shadow-soft min-[860px]:p-6"
    >
      <ListFields form={form} nameRef={nameRef} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" aria-disabled={form.pending} className={PRIMARY_BUTTON}>
          {form.pending ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default EditListForm
