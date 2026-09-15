import { NavLink, Outlet } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report a wait' },
  { to: '/stats', label: 'Statistics' },
  { to: '/methodology', label: 'Methodology' },
]

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="text-base font-bold text-slate-900">
            TRICARE Access Watch
          </NavLink>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1.5 font-medium ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-4xl space-y-1">
          <p>
            TRICARE Access Watch is an independent, privately run project —{' '}
            <strong>not affiliated with or endorsed by</strong> the Department of Defense or any
            branch of the U.S. military.
          </p>
          <p>
            Reports are appointment-access data, not medical records — see{' '}
            <NavLink to="/methodology" className="underline">
              methodology
            </NavLink>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
