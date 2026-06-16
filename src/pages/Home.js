import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

// ── Reusable SectionTitle ─────────────────────────────────────
function SectionTitle({ num, numColor, numBg, numBorder, children, id }) {
  return (
    <h2 className="section-title" id={id}>
      <span
        className="section-num"
        style={{
          color: numColor,
          background: numBg,
          borderColor: numBorder,
        }}
      >
        {num}
      </span>{' '}
      {children}
    </h2>
  )
}

// ── SVG Icons ─────────────────────────────────────────────────
const HomeIcons = {
  terminal: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  grid:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  code:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  zap:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  ansible:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 16l5.5-9 2.5 8"/><line x1="10" y1="13" x2="14.5" y2="13"/></svg>,
  lightbulb:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  fileText: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  server:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  settings: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  layers:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  book:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
}

const FEATURE_LINKS = {
  'Commands Reference':             'Browse Commands →',
  'NetApp Cheatsheet':              'Explore Cheatsheet →',
  'Python Automation':              'Explore Python →',
  'PowerShell Automation':          'Learn PowerShell →',
  'Ansible Automation':             'Explore Ansible →',
  'Tips & Tricks':                  'View Tips →',
  'Blogs & Articles from Community':'Read Articles →',
}

// ── Feature Card ──────────────────────────────────────────────
function FeatureCard({ icon, title, description, to }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to} className="feature-link">
        {FEATURE_LINKS[title] ?? 'Explore →'}
      </Link>
    </div>
  )
}

// ── FAQ Item ──────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`faq-item${open ? ' active' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{question}</span>
        <span
            className="faq-arrow"
            style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
            }}
            >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
            </span>
      </button>
      <div
        className="faq-answer"
        style={{ maxHeight: open ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}
      >
        <p dangerouslySetInnerHTML={{ __html: answer }} />
      </div>
    </div>
  )
}

// ── Main Home Page ────────────────────────────────────────────
export default function Home() {
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    fetch('/assets/data/site-meta.json')
      .then((r) => r.json())
      .then((data) => {
        const d = new Date(data.lastUpdated)
        setLastUpdated(
          d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        )
      })
      .catch(() => setLastUpdated('Unavailable'))
  }, [])

  const features = [
    {
      icon: HomeIcons.terminal,
      title: 'Commands Reference',
      description: 'ONTAP CLI commands organized by category with examples and descriptions. Perfect for quick lookups.',
      to: '/commands',
    },
    {
      icon: HomeIcons.grid,
      title: 'NetApp Cheatsheet',
      description: 'Quick-reference cards for the most common ONTAP operations, grouped by category.',
      to: '/cheatsheet',
    },
    {
      icon: HomeIcons.code,
      title: 'Python Automation',
      description: 'Complete Python examples using the netapp-ontap library. REST API patterns and production-ready scripts.',
      to: '/python',
    },
    {
      icon: HomeIcons.zap,
      title: 'PowerShell Automation',
      description: 'PowerShell cmdlets and scripts for ONTAP management. Direct REST API calls and PSTK patterns.',
      to: '/powershell',
    },
    {
      icon: HomeIcons.ansible,
      title: 'Ansible Automation',
      description: 'Declarative playbooks for NetApp ONTAP using the netapp.ontap collection. Volumes, SVM, SnapMirror, and CI/CD roles.',
      to: '/ansible',
    },
    {
      icon: HomeIcons.lightbulb,
      title: 'Tips & Tricks',
      description: 'Field-tested practices, common gotchas, and expert shortcuts from real NetApp automation work.',
      to: '/tips',
    },
    {
      icon: HomeIcons.fileText,
      title: 'Blogs & Articles from Community',
      description: 'Real-world stories and deep dives from NetApp engineers. Submit your own post and get featured.',
      to: '/blog',
    },
  ]

  const audience = [
    {
      icon: HomeIcons.server,
      title: 'Storage Administrators',
      desc: 'Quick reference for ONTAP commands and day-to-day operations. Automate repetitive tasks.',
    },
    {
      icon: HomeIcons.settings,
      title: 'DevOps Engineers',
      desc: 'Python and PowerShell automation patterns. CI/CD pipeline integration. Infrastructure as Code.',
    },
    {
      icon: HomeIcons.layers,
      title: 'Solutions Architects',
      desc: 'Reference implementation patterns. Enterprise automation strategy. Best practices and design patterns.',
    },
    {
      icon: HomeIcons.book,
      title: 'Learning Professionals',
      desc: 'Getting started with NetApp automation. Structured learning path from basics to advanced patterns.',
    },
  ]

  const techStack = [
    {
      label: 'Storage Platform',
      color: 'var(--accent-cmd)',
      tags: ['NetApp ONTAP', 'Cluster & 7-Mode', 'BlueXP / CVO'],
    },
    {
      label: 'Languages & Frameworks',
      color: 'var(--accent-py)',
      tags: ['Python 3.8+', 'netapp-ontap SDK', 'PowerShell 5.0+', 'ONTAP CLI'],
    },
    {
      label: 'Automation & Orchestration',
      color: 'var(--accent-ps)',
      tags: ['REST APIs', 'Ansible', 'Jenkins', 'CI/CD Pipelines'],
    },
    {
      label: 'Tools & Utilities',
      color: 'var(--accent-cmd)',
      tags: ['System Manager', 'SnapCenter', 'ActiveIQ', 'BlueXP'],
    },
  ]

  const flowSteps = [
    { num: '1', title: 'Search', desc: 'Use the search bar to find commands, tutorials, or tips. Results are indexed across all sections.' },
    { num: '2', title: 'Learn', desc: 'Read the documentation, understand the patterns, and see real examples with explanations.' },
    { num: '3', title: 'Apply', desc: 'Copy code examples, adapt them to your environment, and automate your workflows.' },
    { num: '4', title: 'Master', desc: 'Combine patterns, build sophisticated automation, and share your insights with the community.' },
  ]

  const faqs = [
    {
      question: 'Do I need ONTAP experience to use this hub?',
      answer: 'I include foundational concepts, but some prior ONTAP knowledge helps. Start with the <strong>Tips & Tricks</strong> section for basics, then move to specific topics.',
    },
    {
      question: 'Can I use these scripts in production?',
      answer: 'Yes, but always test in your environment first. All scripts follow best practices, but your cluster configuration is unique. I recommend a test run before production deployment.',
    },
    {
      question: 'What ONTAP versions are covered?',
      answer: 'Primarily ONTAP 9.x (Cluster mode) with some 7-Mode references where relevant. Check individual sections for version-specific notes.',
    },
    {
      question: 'Is there a way to contribute or request new content?',
      answer: 'Absolutely! This hub is a living resource. Feedback and suggestions are welcome. See the footer for contact information.',
    },
    {
      question: 'Can I use these examples with other automation tools?',
      answer: 'Yes. The REST API examples work with any tool (Terraform, Ansible, etc.). ONTAP CLI examples work in any environment. Python/PowerShell can be integrated into any workflow.',
    },
  ]

  return (
    <main className="main-content">
    <SEO
        title="Vadiraj Dev | NetApp Automation Engineer | ONTAP, Python, PowerShell"
        description="NetApp Hub — a comprehensive resource for NetApp storage engineers. ONTAP CLI commands, Python automation, PowerShell scripts, tips and tricks."
        keywords="NetApp, Storage Engineer, ONTAP, Python, PowerShell, DevOps, Automation"
        canonical="/"
        ogTitle="NetApp Hub | ONTAP at Scale"
        ogDescription="A comprehensive resource built by a NetApp professional for NetApp professionals."
        />
      <header className="page-header">
        <div className="header-badge">Documentation</div>
        <h1 className="page-title">NetApp Hub | ONTAP at Scale</h1>
        <p className="page-subtitle">
          A comprehensive resource built by NetApp professional for NetApp professionals.
          Learn, automate, and deploy ONTAP at scale.
        </p>
        {lastUpdated && (
          <p className="last-updated">
            Last updated: <span>{lastUpdated}</span>
          </p>
        )}
      </header>

      {/* 01 — What's Inside */}
      <section className="content-section">
        <SectionTitle
          num="01"
          id="whats-inside"
          numColor="var(--accent-cmd)"
          numBg="rgba(245,166,35,0.08)"
          numBorder="rgba(245,166,35,0.2)"
        >
          What's Inside
        </SectionTitle>
        <div className="feature-grid">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* 02 — Who This Is For */}
      <section className="content-section">
        <SectionTitle
          num="02"
          id="who-this-is-for"
          numColor="var(--accent-tips)"
          numBg="rgba(255,107,107,0.08)"
          numBorder="rgba(255,107,107,0.2)"
        >
          Who This Is For
        </SectionTitle>
        <div className="audience-grid">
          {audience.map((a) => (
            <div className="audience-card" key={a.title}>
              <div className="audience-icon">{a.icon}</div>
              <h4>{a.title}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — Technology Stack */}
      <section className="content-section">
        <SectionTitle
          num="03"
          id="technology-stack"
          numColor="var(--accent-ps)"
          numBg="rgba(123,97,255,0.08)"
          numBorder="rgba(123,97,255,0.2)"
        >
          Technology Stack
        </SectionTitle>
        <div className="tech-stack">
          {techStack.map((cat) => (
            <div className="tech-category" key={cat.label}>
              <h4 style={{ color: cat.color }}>{cat.label}</h4>
              <div className="tech-items">
                {cat.tags.map((tag) => (
                  <span className="tech-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 — How to Use */}
      <section className="content-section">
        <SectionTitle
          num="04"
          id="how-to-use"
          numColor="var(--accent-tips)"
          numBg="rgba(255,107,107,0.08)"
          numBorder="rgba(255,107,107,0.2)"
        >
          How to Use This Hub
        </SectionTitle>
        <div className="usage-flow">
          {flowSteps.map((step, i) => (
            <>
              <div className="flow-step" key={step.num}>
                <div className="flow-number">{step.num}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="flow-arrow" key={`arrow-${i}`}>→</div>
              )}
            </>
          ))}
        </div>
      </section>

      {/* 05 — FAQ */}
      <section className="content-section">
        <SectionTitle
          num="05"
          id="faq"
          numColor="var(--accent-py)"
          numBg="rgba(61,200,160,0.08)"
          numBorder="rgba(61,200,160,0.2)"
        >
          Frequently Asked Questions
        </SectionTitle>
        <div className="faq-list">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </main>
  )
}