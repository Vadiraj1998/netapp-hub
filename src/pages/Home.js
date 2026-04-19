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

// ── Feature Card ──────────────────────────────────────────────
function FeatureCard({ icon, title, description, to }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to} className="feature-link">
        {title === 'Commands Reference' && 'Browse Commands →'}
        {title === 'NetApp Cheatsheet' && 'Explore NetApp Cheatsheet →'}
        {title === 'Python Automation' && 'Explore Python →'}
        {title === 'PowerShell Automation' && 'Learn PowerShell →'}
        {title === 'Tips & Tricks' && 'View Tips →'}
        {title === 'Blogs & Articles from Community' && 'Read Articles →'}
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
      icon: '⌨',
      title: 'Commands Reference',
      description: 'ONTAP CLI commands organized by category with examples and descriptions. Perfect for quick lookups.',
      to: '/commands',
    },
    {
      icon: '🧠',
      title: 'NetApp Cheatsheet',
      description: 'ONTAP CLI commands organized by category with examples and descriptions. Perfect for quick lookups.',
      to: '/cheatsheet',
    },
    {
      icon: '🐍',
      title: 'Python Automation',
      description: 'Complete Python examples using the netapp-ontap library. REST API patterns and production-ready scripts.',
      to: '/python',
    },
    {
      icon: '⚡',
      title: 'PowerShell Automation',
      description: 'PowerShell cmdlets and scripts for ONTAP management. Direct REST API calls and PSTK patterns.',
      to: '/powershell',
    },
    {
      icon: '💡',
      title: 'Tips & Tricks',
      description: 'Field-tested practices, common gotchas, and expert shortcuts from real NetApp automation work.',
      to: '/tips',
    },
    {
      icon: '📝',
      title: 'Blogs & Articles from Community',
      description: 'Real-world stories and deep dives from NetApp engineers. Submit your own post and get featured.',
      to: '/blog',
    },
  ]

  const audience = [
    {
      icon: '👨‍💻',
      title: 'Storage Administrators',
      desc: 'Quick reference for ONTAP commands and day-to-day operations. Automate repetitive tasks.',
    },
    {
      icon: '🤖',
      title: 'DevOps Engineers',
      desc: 'Python and PowerShell automation patterns. CI/CD pipeline integration. Infrastructure as Code.',
    },
    {
      icon: '🏗️',
      title: 'Solutions Architects',
      desc: 'Reference implementation patterns. Enterprise automation strategy. Best practices and design patterns.',
    },
    {
      icon: '📚',
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