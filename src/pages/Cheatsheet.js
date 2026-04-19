import { useState, useMemo } from 'react'
import COMMANDS_DATA from '../data/CommandsData'
import SEO from '../components/SEO'

// Sort once at module level — never changes
const SORTED_COMMANDS = [...COMMANDS_DATA].sort((a, b) => {
  if (a.tag !== b.tag) return a.tag.localeCompare(b.tag)
  return a.name.localeCompare(b.name)
})

export default function Cheatsheet() {
  const [filter, setFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Derive unique tags once
  const categories = useMemo(
    () => [...new Set(SORTED_COMMANDS.map((c) => c.tag))].sort(),
    []
  )

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim()
    return SORTED_COMMANDS.filter((cmd) => {
      const matchCat = activeCategory === 'all' || cmd.tag === activeCategory
      const matchText =
        !q ||
        `${cmd.name} ${cmd.description} ${cmd.tag} ${cmd.category}`
          .toLowerCase()
          .includes(q)
      return matchCat && matchText
    })
  }, [filter, activeCategory])

  // Group by tag
  const grouped = useMemo(
    () =>
      filtered.reduce((acc, cmd) => {
        if (!acc[cmd.tag]) acc[cmd.tag] = []
        acc[cmd.tag].push(cmd)
        return acc
      }, {}),
    [filtered]
  )

  return (
    <main className="main-content">
      <SEO
        title="NetApp ONTAP Cheatsheet | CLI Commands Quick Reference | NetApp Hub"
        description="NetApp ONTAP cheat sheet with common CLI commands for storage engineers, including volume, aggregate, SVM, network, snapshot, and troubleshooting commands."
        keywords="NetApp ONTAP cheat sheet, NetApp commands, ONTAP CLI, storage commands, NetApp automation"
        canonical="/cheatsheet"
        ogTitle="NetApp ONTAP CheatSheet | NetApp Hub"
        ogDescription="Quick reference for common NetApp ONTAP CLI commands."
        twitterCard="summary"
      />
      <header className="page-header">
        <div className="header-badge">QUICK REF</div>
        <h1 className="page-title">NetApp ONTAP Cheatsheet</h1>
        <p className="page-subtitle">
          Common CLI commands for daily storage administration, troubleshooting, and automation
          workflows.
        </p>
      </header>

      <section className="content-section">
        <div className="cmd-filter-bar">
          <input
            type="text"
            placeholder="Filter commands..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="result-count">
            {filtered.length} command{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="cheat-grid" id="cheatGrid">
          {Object.keys(grouped)
            .sort()
            .map((groupName) => (
              <div className="cheat-card" key={groupName}>
                <h3>{groupName}</h3>
                {grouped[groupName].map((cmd) => (
                  <div className="cmd-item" key={cmd.id}>
                    <code className="cmd-code">{cmd.name}</code>
                    <div className="cmd-desc">{cmd.description}</div>
                  </div>
                ))}
              </div>
            ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-dim)' }}>No commands found for the current filter.</p>
          )}
        </div>
      </section>
    </main>
  )
}