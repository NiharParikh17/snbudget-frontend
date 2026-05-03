/**
 * IconPieChart — pie-chart glyph used for the Reports tab.
 */
function IconPieChart({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9v9h9Z" />
      <path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2Z" />
    </svg>
  )
}

export default IconPieChart

