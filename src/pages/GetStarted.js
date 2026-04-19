import SEO from '../components/SEO'

export default function GetStarted() {
    const infoBlocks = [
      { label: 'Coverage', value: 'ONTAP 9.8+' },
      { label: 'Python', value: '3.8+' },
      { label: 'PowerShell', value: '5.1 / 7+' },
      { label: 'APIs', value: 'REST · ZAPI' },
    ]
  
    const stack = [
      { dot: 'dot-py', name: 'netapp-ontap', desc: 'Official Python client library for ONTAP REST API' },
      { dot: 'dot-ps', name: 'NetApp.ONTAP (PSTK)', desc: 'NetApp PowerShell Toolkit for ONTAP management' },
      { dot: 'dot-py', name: 'requests / httpx', desc: 'HTTP clients for direct ONTAP REST API calls' },
      { dot: 'dot-ps', name: 'Invoke-RestMethod', desc: 'PowerShell native REST client for ONTAP API' },
      { dot: 'dot-py', name: 'Ansible (na_ontap_*)', desc: 'Declarative automation using NetApp Ansible modules' },
    ]
  
    return (
      <main className="main-content">
        <SEO
          title="Getting Started Guide | NetApp Hub"
          description="Beginner guide to NetApp ONTAP, storage concepts, Python and PowerShell setup tutorials for engineers."
          keywords="NetApp Basics, ONTAP Guide, Storage Setup, NetApp Tutorial"
          canonical="/get-started"
          ogTitle="NetApp Getting Started Guide"
          ogDescription="Learn NetApp ONTAP basics and automation setup quickly."
        />
        <header className="page-header">
          <div className="header-badge">Documentation</div>
          <h1 className="page-title">Get Started</h1>
          <p className="page-subtitle">
            Everything you need to begin to learn NetApp storage infrastructure and automation using Python and PowerShell.
          </p>
        </header>
  
        <section className="content-section">
          <div className="prose">
            <p>This site is a living reference for NetApp storage engineers. It covers practical scripts, command references, and field-tested tips for working with ONTAP using Python and PowerShell.</p>
            <p>All examples are tested against ONTAP 9.x and use publicly available APIs and toolkits. Use the search bar to find anything across the site, or navigate by section using the sidebar.</p>
          </div>
  
          <div className="info-grid">
            {infoBlocks.map((b) => (
              <div className="info-block" key={b.label}>
                <div className="info-label">{b.label}</div>
                <div className="info-value">{b.value}</div>
              </div>
            ))}
          </div>
        </section>
  
        <section className="content-section">
          <h2 className="section-title">Stack Overview</h2>
          <div className="stack-list">
            {stack.map((s) => (
              <div className="stack-item" key={s.name}>
                <span className={`stack-dot ${s.dot}`} />
                <span className="stack-name">{s.name}</span>
                <span className="stack-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    )
  }