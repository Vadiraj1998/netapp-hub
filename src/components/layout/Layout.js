import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import COMMANDS_DATA from '../../data/CommandsData'

// ── SVG Icons ────────────────────────────────────────────────────
const Icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  ),
  rocket: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  terminal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  grid: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  lightbulb: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  zap: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  fileText: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  sun: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  logoMark: (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <path d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <path d="M16 8L24 12.5V21.5L16 26L8 21.5V12.5L16 8Z" fill="currentColor" opacity="0.2"/>
      <circle cx="16" cy="16" r="3" fill="currentColor"/>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  ansible: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M8 16l5.5-9 2.5 8"/><line x1="10" y1="13" x2="14.5" y2="13"/>
    </svg>
  ),
}

// ── Theme helpers ─────────────────────────────────────────────────
function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch (_) {}
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light'
  return (
    <button
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span style={{ display: 'flex', color: isLight ? 'var(--accent-cmd)' : 'var(--text-muted)' }}>
        {isLight ? Icons.sun : Icons.moon}
      </span>
      <span>{isLight ? 'Light mode' : 'Dark mode'}</span>
      <div className={`theme-toggle-track${isLight ? ' is-light' : ''}`}>
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  )
}

// ── Nav config ────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',            icon: 'home',     label: 'Home' },
  { to: '/get-started', icon: 'rocket',   label: 'Get Started' },
  { to: '/commands',    icon: 'terminal', label: 'Commands Reference' },
  { to: '/cheatsheet',  icon: 'grid',     label: 'NetApp Cheatsheet' },
  { to: '/tips',        icon: 'lightbulb',label: 'Tips & Tricks' },
  { to: '/python',      icon: 'code',     label: 'Python Automation' },
  { to: '/powershell',  icon: 'zap',      label: 'PowerShell Automation' },
  { to: '/ansible',     icon: 'ansible',  label: 'Ansible Automation' },
  { to: '/blog',        icon: 'fileText', label: 'Blogs and Articles' },
  { to: '/about',       icon: 'user',     label: 'About Me' },
]

// ── Static search index ───────────────────────────────────────────
const PAGE_INDEX = [
  { label: 'Home',                  path: '/',            desc: 'NetApp Hub overview, features, FAQ' },
  { label: 'Get Started',           path: '/get-started', desc: 'Setup guide, stack overview, Python, PowerShell, Ansible' },
  { label: 'Commands Reference',    path: '/commands',    desc: 'Full ONTAP CLI command table with examples' },
  { label: 'NetApp Cheatsheet',     path: '/cheatsheet',  desc: 'Quick reference cards grouped by category' },
  { label: 'Tips & Tricks',         path: '/tips',        desc: 'Best practices, CLI tips, REST API gotchas, Python and PowerShell tips' },
  { label: 'Python Automation',     path: '/python',      desc: 'netapp-ontap library, HostConnection, Volume, Snapshot, REST requests, Aggregate' },
  { label: 'PowerShell Automation', path: '/powershell',  desc: 'PSTK, Connect-NcController, Get-NcVol, Invoke-RestMethod, error handling' },
  { label: 'Ansible Automation',    path: '/ansible',     desc: 'netapp.ontap collection, playbooks, volumes, SVM, SnapMirror, CI/CD roles' },
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
                background: r.type === 'command' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                color: r.type === 'command' ? 'var(--accent-cmd)' : 'var(--accent)',
                border: `1px solid ${r.type === 'command' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                flexShrink: 0,
              }}
            >
              {r.type === 'command' ? 'CMD' : 'PAGE'}
            </span>
            <span style={{ color: 'var(--text-bright)', fontSize: '13px' }}>{r.label}</span>
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '2px', display: 'block' }}>
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
  const [theme, setTheme] = useState(getInitialTheme)
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch (_) {}
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useClickOutside(searchRef, () => setShowResults(false))

  useEffect(() => {
    setSearch('')
    setShowResults(false)
    setSidebarOpen(false)
  }, [location.pathname])

  const results = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q || q.length < 2) return []

    const hits = []

    COMMANDS_DATA
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.example || '').toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .forEach((c) => hits.push({ type: 'command', label: c.name, desc: c.description, path: '/commands' }))

    PAGE_INDEX
      .filter((p) => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((p) => hits.push({ type: 'page', label: p.label, desc: p.desc, path: p.path }))

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
            <span className="logo-icon">{Icons.logoMark}</span>
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
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true) }}
            onFocus={() => search.length >= 2 && setShowResults(true)}
            autoComplete="off"
          />
          <span className="search-icon" style={{ display: 'flex' }}>{Icons.search}</span>

          {showResults && (
            <SearchResults results={results} query={search} onSelect={handleSelect} />
          )}
        </div>

        <ul className="nav-links">
          <li className="nav-section-label">Navigation</li>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <li key={to} className={location.pathname === to ? 'active' : ''}>
              <Link to={to} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">{Icons[icon]}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <span style={{ display: 'block', marginTop: 10 }}>Built for NetApp Engineers</span>
        </div>
      </nav>

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle navigation"
      >
        {Icons.menu}
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.4)' }}
        />
      )}

      <ScrollToTop />
      {children}
      <Footer />
    </>
  )
}
