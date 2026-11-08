import FormField from '../auth/FormField.jsx'

function ListFields({ form, nameRef }) {
  const { values, errors, formError, handleChange } = form

  return (
    <>
      <div role="alert" className="text-sm text-error empty:hidden">
        {formError}
      </div>
      <FormField
        ref={nameRef}
        label="Name"
        name="name"
        autoComplete="off"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
      />
      <FormField
        label="Description (optional)"
        name="description"
        autoComplete="off"
        required={false}
        value={values.description}
        error={errors.description}
        onChange={handleChange}
      />
    </>
  )
}

export default ListFields
