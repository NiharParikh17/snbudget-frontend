/**
 * IconUsers — two-people glyph used for the Groups tab.
 */
function IconUsers({ className = 'h-5 w-5' }) {
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
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.31 2.686-6 6-6s6 2.69 6 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M21 19c0-2.21-1.567-4-3.5-4" />
    </svg>
  )
}

export default IconUsers

