/**
 * IconWallet — wallet glyph used for the Budget tab.
 */
function IconWallet({ className = 'h-5 w-5' }) {
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
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2V7Z" />
      <path d="M3 9h17a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V9Z" />
      <circle cx="16.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default IconWallet

