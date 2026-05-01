/**
 * Logo — the SNBudget brand mark.
 *
 * Renders the SVG icon (a stylised lightning bolt that mirrors the favicon)
 * alongside the "SNBudget" wordmark.  Import this wherever the full brand
 * mark is needed so it stays DRY and updates in one place.
 *
 * Props
 *   iconOnly  {boolean}  render the SVG icon without the wordmark text
 *   className {string}   extra classes forwarded to the root element
 */
function Logo({ iconOnly = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Bolt icon — matches public/favicon.svg palette */}
      <svg
        aria-hidden="true"
        width="28"
        height="28"
        viewBox="0 0 48 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
          fill="url(#logo-grad)"
        />
        <defs>
          <linearGradient
            id="logo-grad"
            x1="0"
            y1="0"
            x2="48"
            y2="46"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>

      {!iconOnly && (
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-500 to-violet-700 dark:from-violet-300 dark:to-violet-500 bg-clip-text text-transparent leading-none select-none">
          SNBudget
        </span>
      )}
    </span>
  )
}

export default Logo
