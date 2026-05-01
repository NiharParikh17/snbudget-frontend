import { useId } from 'react'

/**
 * Labelled form input with inline error support and proper a11y wiring.
 *
 * Keeps form fields visually consistent across auth pages and any future
 * forms (settings, transactions, etc.) — extract before the second copy.
 */
function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  autoComplete,
  placeholder,
  helpText,
  ...rest
}) {
  const reactId = useId()
  const inputId = `${name}-${reactId}`
  const errorId = `${inputId}-error`
  const helpId = `${inputId}-help`

  const describedBy =
    [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-violet-600 dark:text-violet-400">
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`mt-1 block w-full rounded-xl border px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
          error
            ? 'border-red-400 dark:border-red-500'
            : 'border-slate-300 dark:border-slate-700'
        }`}
        {...rest}
      />
      {helpText && !error ? (
        <p id={helpId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default FormField

