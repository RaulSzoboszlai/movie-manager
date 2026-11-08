import { useId } from 'react'
import useListForm from '../../hooks/useListForm.js'
import useToast from '../../hooks/useToast.js'
import ListFields from './ListFields.jsx'
import { PRIMARY_BUTTON } from './listStyles.js'

function CreateListForm({ onCreate }) {
  const headingId = useId()
  const showToast = useToast()
  const form = useListForm({
    submit: async (values) => {
      await onCreate(values)
      showToast(`Created list “${values.name}”`)
    },
    resetOnSuccess: true,
  })

  return (
    <form
      noValidate
      aria-labelledby={headingId}
      onSubmit={form.handleSubmit}
      className="space-y-4 rounded-card border border-border bg-surface p-4 shadow-soft min-[860px]:p-6"
    >
      <h2 id={headingId} className="text-lg font-bold">
        New list
      </h2>
      <ListFields form={form} />
      <button type="submit" aria-disabled={form.pending} className={PRIMARY_BUTTON}>
        {form.pending ? 'Creating...' : 'Create list'}
      </button>
    </form>
  )
}

export default CreateListForm
