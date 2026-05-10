/**
 * Card — shared rounded surface used across authenticated pages
 * (Settings, Groups, …). Single source of truth for the
 * "white surface, slate border, soft shadow, dark-mode aware" pattern so
 * we don't repeat the utility soup at every callsite.
 */
function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export default Card

