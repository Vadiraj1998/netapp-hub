export default function SubNav({ tabs, active, onChange, accent = 'var(--accent)' }) {
  return (
    <nav className="sub-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`sub-nav-btn${active === tab.id ? ' active' : ''}`}
          style={active === tab.id ? { background: accent, color: '#fff' } : {}}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
