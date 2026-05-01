import Header from './Header.jsx'
import Footer from './Footer.jsx'

/**
 * App-wide layout shell: sticky header on top, static footer on the bottom,
 * children fill the space in between. Use this around every page so the chrome
 * is defined in exactly one place.
 *
 * The `font-[Inter,system-ui,sans-serif]` rule applies the Inter typeface
 * loaded in index.html globally; individual pages never need to repeat it.
 */
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-[Inter,system-ui,sans-serif] antialiased">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout

