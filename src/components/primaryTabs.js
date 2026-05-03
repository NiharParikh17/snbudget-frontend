import IconHome from './icons/IconHome.jsx'
import IconCreditCard from './icons/IconCreditCard.jsx'
import IconPieChart from './icons/IconPieChart.jsx'
import IconWallet from './icons/IconWallet.jsx'
import IconUsers from './icons/IconUsers.jsx'

/**
 * Single source of truth for the in-app primary navigation. Add or
 * reorder tabs here only — `Sidebar` derives its rendered list from this
 * array so we never duplicate route + label + icon triples elsewhere.
 *
 * Kept in its own module (no React component export) so Vite/React
 * Refresh's `react-refresh/only-export-components` rule stays happy when
 * `Sidebar` re-exports the array.
 */
export const PRIMARY_TABS = [
  { to: '/app/dashboard', label: 'Dashboard', Icon: IconHome },
  { to: '/app/transactions', label: 'Transactions', Icon: IconCreditCard },
  { to: '/app/reports', label: 'Reports', Icon: IconPieChart },
  { to: '/app/budget', label: 'Budget', Icon: IconWallet },
  { to: '/app/splitter', label: 'Splitter', Icon: IconUsers },
]

