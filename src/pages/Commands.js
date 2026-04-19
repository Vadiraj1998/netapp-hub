import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import COMMANDS_DATA from '../data/CommandsData'
import SEO from '../components/SEO'

// Dracula-palette pool — cycles through as new categories appear
const COLOR_POOL = [
  '#f5a623', // amber
  '#50fa7b', // green
  '#8be9fd', // cyan
  '#7b61ff', // purple
  '#ff6b6b', // red
  '#ffb86c', // orange
  '#f1fa8c', // yellow
  '#ff79c6', // pink
  '#3dc8a0', // teal
  '#bd93f9', // lavender
]

// Assign a color to each unique category deterministically (order of first appearance)
function buildColorMap(commands) {
  const map = {}
  let i = 0
  commands.forEach(({ category }) => {
    if (!map[category]) {
      map[category] = COLOR_POOL[i % COLOR_POOL.length]
      i++
    }
  })
  return map
}

const CATEGORY_COLORS = buildColorMap(COMMANDS_DATA)

function CategoryBadge({ category, tag }) {
  const color = CATEGORY_COLORS[category] || '#a0a0b0'
  return (
    <span
      className="category-badge"
      style={{
        color,
        background: `${color}18`,
        borderColor: `${color}55`,
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.05em',
        border: '1px solid',
        whiteSpace: 'nowrap',
      }}
    >
      {tag}
    </span>
  )
}

export default function Commands() {
  const [filter, setFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  const categories = useMemo(
    () => [...new Set(COMMANDS_DATA.map((c) => c.category))],
    []
  )

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim()
    return COMMANDS_DATA.filter((cmd) => {
      const matchCat = !activeCategory || cmd.category === activeCategory
      const matchText =
        !q ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        (cmd.example || '').toLowerCase().includes(q)
      return matchCat && matchText
    })
  }, [filter, activeCategory])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <main className="main-content">
      <SEO
        title="NetApp ONTAP Commands Reference | CLI & Automation | NetApp Hub"
        description="Complete NetApp ONTAP commands reference with CLI examples, automation scripts, and storage operations."
        keywords="NetApp Commands, ONTAP CLI, Storage Commands, NetApp Automation"
        canonical="/commands"
        ogTitle="NetApp ONTAP Commands Reference"
        ogDescription="CLI commands and automation examples for NetApp ONTAP."
      />
      <header className="page-header">
        <div
          className="header-badge"
          style={{
            color: 'var(--accent-cmd)',
            background: 'rgba(245,166,35,0.08)',
            borderColor: 'rgba(245,166,35,0.25)',
          }}
        >
          ONTAP CLI
        </div>
        <h1 className="page-title">Commands Reference</h1>
        <p className="page-subtitle">
          ONTAP CLI commands organized by category. Use the filter to find commands by keyword or type.
        </p>
      </header>

      <section className="content-section">
        <div className="cmd-table-wrapper" id="commands-reference">
          <div className="cmd-filter-bar">
            <Link to="/cheatsheet" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              📋 Cheat Sheet
            </Link>
            <input
              type="text"
              placeholder="Filter commands..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <span className="result-count">
              {filtered.length} command{filtered.length !== 1 ? 's' : ''}
            </span>

            {/* Category filter chips — colored to match their badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className={`filter-btn${!activeCategory ? ' active' : ''}`}
                onClick={() => setActiveCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => {
                const color = CATEGORY_COLORS[cat] || '#a0a0b0'
                const isActive = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: `1px solid ${isActive ? color : `${color}55`}`,
                      background: isActive ? `${color}25` : 'transparent',
                      color: isActive ? color : 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Command</th>
                <th>Description</th>
                <th>Example / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cmd) => (
                <tr key={cmd.id} data-cat={cmd.category}>
                  <td>
                    <CategoryBadge category={cmd.category} tag={cmd.tag} />
                  </td>
                  <td>
                    <div className="cmd-cell">
                      <code>{cmd.name}</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(cmd.name)}>
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{cmd.description}</td>
                  <td>
                    <div className="example-cell">
                      <code>{cmd.example}</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(cmd.example)}>
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>
                    No commands found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}