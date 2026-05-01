/**
 * Reusable button styles. Keep this as the single source of truth for button
 * Tailwind classes so we don't repeat utility soups across the app.
 */
const base =
  'inline-flex items-center justify-center rounded-xl font-semibold px-5 py-2.5 text-sm transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed select-none'

const variants = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-md hover:shadow-violet-200 dark:hover:shadow-violet-900/50 hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 dark:bg-slate-800 dark:text-violet-300 dark:border-violet-800 dark:hover:bg-slate-700 shadow-sm hover:-translate-y-px active:translate-y-0',
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

