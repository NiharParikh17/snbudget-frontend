/**
 * Reusable button styles. Keep this as the single source of truth for button
 * Tailwind classes so we don't repeat utility soups across the app.
 */
const base =
  'inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm',
  secondary:
    'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:border-slate-700 dark:hover:bg-slate-700',
  ghost:
    'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
}

function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  type,
  children,
  ...rest
}) {
  const resolvedType = Component === 'button' ? type ?? 'button' : type
  return (
    <Component
      type={resolvedType}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Button

