import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import COMMANDS_DATA from '../../data/CommandsData'

const NAV_LINKS = [
  { to: '/',            icon: '⌂',  label: 'Home' },
  { to: '/get-started', icon: '🚀', label: 'Get Started' },
  { to: '/commands',    icon: '⌨',  label: 'Commands Reference' },
  { to: '/cheatsheet',  icon: '🧠', label: 'NetApp Cheatsheet' },
  { to: '/tips',        icon: '💡', label: 'Tips & Tricks' },
  { to: '/python',      icon: '🐍', label: 'Python Automation' },
  { to: '/powershell',  icon: '⚡', label: 'PowerShell Automation' },
  { to: '/blog',        icon: '📝', label: 'Blogs and Articles' },
  { to: '/about',       icon: '👤', label: 'About Me' },
]

// Static page content index — searchable prose snippets per route
const PAGE_INDEX = [
  { label: 'Home',                  path: '/',            desc: 'NetApp Hub overview, features, FAQ' },
  { label: 'Get Started',           path: '/get-started', desc: 'Setup guide, stack overview, Python, PowerShell, Ansible' },
  { label: 'Commands Reference',    path: '/commands',    desc: 'Full ONTAP CLI command table with examples' },
  { label: 'NetApp Cheatsheet',     path: '/cheatsheet',  desc: 'Quick reference cards grouped by category' },
  { label: 'Tips & Tricks',         path: '/tips',        desc: 'Best practices, CLI tips, REST API gotchas, Python and PowerShell tips' },
  { label: 'Python Automation',     path: '/python',      desc: 'netapp-ontap library, HostConnection, Volume, Snapshot, REST requests, Aggregate' },
  { label: 'PowerShell Automation', path: '/powershell',  desc: 'PSTK, Connect-NcController, Get-NcVol, Invoke-RestMethod, error handling' },
  { label: 'Blogs & Articles',      path: '/blog',        desc: 'Community posts, SnapMirror, ZAPI migration, automation stories' },
  { label: 'About Me',              path: '/about',       desc: 'Vadiraja Tantri, storage automation engineer, toolkit, philosophy' },
  { label: 'Privacy Policy',        path: '/privacy',     desc: 'Privacy policy, disclaimer, liability, governing law' },
]

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function SearchResults({ results, query, onSelect }) {
  if (!query.trim() || results.length === 0) return null

  return (
    <div className="search-results" style={{ display: 'block' }}>
      {results.length === 0 && (
        <div style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: '13px' }}>
          No results for "{query}"
        </div>
      )}
      {results.map((r, i) => (
        <div
          key={i}
          className="search-result-item"
          onClick={() => onSelect(r.path)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '1px 6px',
                borderRadius: '3px',
                background: r.type === 'command' ? 'rgba(245,166,35,0.12)' : 'rgba(139,233,253,0.12)',
                color: r.type === 'command' ? 'var(--accent-cmd)' : '#8be9fd',
                border: `1px solid ${r.type === 'command' ? 'rgba(245,166,35,0.3)' : 'rgba(139,233,253,0.3)'}`,
                flexShrink: 0,
              }}
            >
              {r.type === 'command' ? 'CMD' : 'PAGE'}
            </span>
            <span className="result-name" style={{ color: 'var(--text-bright)', fontSize: '13px' }}>
              {r.label}
            </span>
          </div>
          <span
            className="result-desc"
            style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '2px', display: 'block', paddingLeft: '2px' }}
          >
            {r.desc}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  // Close results when clicking outside
  useClickOutside(searchRef, () => setShowResults(false))

  // Close results & clear on route change
  useEffect(() => {
    setSearch('')
    setShowResults(false)
    setSidebarOpen(false)
  }, [location.pathname])

  const results = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q || q.length < 2) return []

    const hits = []

    // Search commands (max 6)
    COMMANDS_DATA
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.example || '').toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .forEach((c) => hits.push({
        type: 'command',
        label: c.name,
        desc: c.description,
        path: '/commands',
      }))

    // Search static pages (max 4)
    PAGE_INDEX
      .filter((p) =>
        p.label.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach((p) => hits.push({
        type: 'page',
        label: p.label,
        desc: p.desc,
        path: p.path,
      }))

    return hits
  }, [search])

  const handleSelect = (path) => {
    navigate(path)
    setSearch('')
    setShowResults(false)
    setSidebarOpen(false)
  }

  return (
    <>
      <div className="noise" />

      <nav className={`sidebar${sidebarOpen ? ' open active' : ''}`} id="sidebar">
        <div className="sidebar-logo">
          <Link
            to="/"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="logo-icon">⬡</span>
            <span className="logo-text">
              NetApp<br />
              <span className="logo-sub">Hub</span>
            </span>
          </Link>
        </div>

        <div className="sidebar-search" ref={searchRef} style={{ position: 'relative' }}>
          <input
            type="text"
            id="globalSearch"
            placeholder="Global Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => search.length >= 2 && setShowResults(true)}
            autoComplete="off"
          />
          <span className="search-icon">⌕</span>

          {showResults && (
            <SearchResults
              results={results}
              query={search}
              onSelect={handleSelect}
            />
          )}
        </div>

        <ul className="nav-links">
          <li className="nav-section-label">Navigation</li>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <li key={to} className={location.pathname === to ? 'active' : ''}>
              <Link to={to} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">{icon}</span> {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <span>Built for NetApp Engineers</span>
        </div>
      </nav>

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      <ScrollToTop />
      {children}
      <Footer />
    </>
  )
}