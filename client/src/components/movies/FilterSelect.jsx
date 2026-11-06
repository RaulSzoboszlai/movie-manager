import { Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'

function FilterSelect({ label, value, options, onChange, disabled = false }) {
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    <Field disabled={disabled} className="min-w-0">
      <Label className="block text-sm font-medium">{label}</Label>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <ListboxButton className="mt-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-left text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-disabled:cursor-not-allowed data-disabled:text-muted">
          <span className="truncate">{selected.label}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0 text-muted">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.2 7.2a.75.75 0 0 1 1.06.03L10 11.2l3.74-3.97a.75.75 0 1 1 1.09 1.03l-4.28 4.54a.75.75 0 0 1-1.1 0L5.17 8.26a.75.75 0 0 1 .03-1.06Z"
            />
          </svg>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          modal={false}
          className="z-10 w-(--button-width) overflow-y-auto rounded-md border border-border bg-surface-raised py-1 shadow-lift [--anchor-gap:0.25rem] [--anchor-max-height:16rem] focus:outline-none"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="cursor-pointer truncate px-3 py-2 text-text data-focus:bg-accent-soft data-selected:font-semibold data-selected:text-accent"
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </Field>
  )
}

export default FilterSelect
