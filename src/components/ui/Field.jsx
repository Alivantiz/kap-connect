import { useId } from 'react'

/**
 * Поле формы с настоящим <label for>. Раньше label не был связан с input,
 * поэтому по подписи нельзя было попасть в поле, а скринридер её не читал.
 */
export function Field({ label, hint, error, children, required }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ')
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {!required && <span className="field-optional">необязательно</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy || undefined, 'aria-invalid': !!error })}
      {hint && !error && (
        <div className="field-hint" id={`${id}-hint`}>
          {hint}
        </div>
      )}
      {error && (
        <div className="field-err" id={`${id}-err`}>
          {error}
        </div>
      )}
    </div>
  )
}

export function TextField({ label, hint, error, required, value, onChange, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a) => <input {...a} className="input" value={value} onChange={onChange} {...rest} />}
    </Field>
  )
}

export function TextArea({ label, hint, error, required, value, onChange, rows = 5, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a) => (
        <textarea
          {...a}
          className="input textarea"
          rows={rows}
          value={value}
          onChange={onChange}
          {...rest}
        />
      )}
    </Field>
  )
}

export function SelectField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  ...rest
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a) => (
        <div className="select-wrap">
          <select {...a} className="input select" value={value} onChange={onChange} {...rest}>
            <option value="">{placeholder || '— не выбрано —'}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )}
    </Field>
  )
}
