import SEO from '../components/SEO'

export default function AboutMe() {
    const expertise = [
      { icon: '🏗️', title: 'Infrastructure Automation', desc: 'Design and implement automated storage solutions that scale from single clusters to global enterprises.' },
      { icon: '🔄', title: 'CI/CD Integration', desc: 'Build pipelines that automate storage provisioning, configuration, and disaster recovery workflows.' },
      { icon: '📊', title: 'Performance & Optimization', desc: 'Analyze metrics, optimize configurations, and ensure storage systems perform at peak efficiency.' },
      { icon: '🛡️', title: 'Disaster Recovery', desc: 'Architect and automate DR solutions that provide zero-downtime protection for critical data.' },
      { icon: '🚀', title: 'Modernization', desc: 'Guide enterprises through storage modernization — cloud, hybrid, and edge deployments.' },
      { icon: '👨‍🎓', title: 'Knowledge Transfer', desc: 'Document, teach, and empower teams to manage storage infrastructure independently.' },
    ]
  
    const toolkit = [
      { label: 'Languages & Scripting', color: 'var(--accent-py)', tags: ['Python', 'PowerShell', 'Bash', 'REST APIs', 'Groovy'] },
      { label: 'Storage Platforms', color: 'var(--accent-cmd)', tags: ['NetApp ONTAP', 'BlueXP', 'SnapCenter', 'System Manager', 'DII', 'AIQUM', 'ONTAP CVO'] },
      { label: 'Orchestration & Infrastructure', color: 'var(--accent-ps)', tags: ['Ansible', 'Jenkins', 'Github'] },
    ]
  
    const philosophy = [
      { title: 'Automate Everything', desc: "Manual work is error-prone and unscalable. If you're doing it thrice, it should be automated." },
      { title: 'Document as You Go', desc: 'Code without documentation is a burden to the next person. That person might be future you.' },
      { title: 'Test in Staging', desc: 'Production is not your testing ground. Always validate in an environment that mirrors reality.' },
      { title: 'Keep It Simple', desc: 'Complex solutions are hard to maintain. Elegant simplicity scales and survives organizational changes.' },
    ]
  
    return (
      <main className="main-content">
        <SEO
          title="About Vadiraj | NetApp Storage Engineer & Automation Specialist"
          description="About Vadiraja Tantri — NetApp Storage Engineer specializing in automation, Jenkins pipelines, Python, and DevOps workflows."
          keywords="NetApp Engineer, Storage Engineer, DevOps, Automation, Jenkins, Python"
          canonical="/about"
          ogTitle="About Vadiraj | NetApp Engineer"
          ogDescription="NetApp Storage Engineer focused on automation and DevOps."
        />
        <header className="page-header">
          <div className="header-badge" style={{ color: 'var(--accent-py)', background: 'rgba(61,200,160,0.08)', borderColor: 'rgba(61,200,160,0.25)' }}>Profile</div>
          <h1 className="page-title">Hey, I'm Vadiraj</h1>
          <p className="page-subtitle">Storage automation engineer. NetApp specialist. Built this hub to solve real problems.</p>
        </header>
  
        {/* Profile */}
        <section className="content-section profile-section">
          <div className="profile-hero">
            <div className="profile-picture-container">
              <img src="/assets/images/vadiraj.png" alt="Vadiraja Tantri M S" className="profile-picture" />
            </div>
            <div className="profile-info">
              <h3>Vadiraja Tantri M S</h3>
              <p className="profile-title">Storage Automation Engineer</p>
              <p className="profile-bio">NetApp Specialist | Infrastructure Automation | DevOps</p>
              <div className="profile-badges">
                <span className="profile-badge">6+ Years ONTAP</span>
                <span className="profile-badge">NetApp Expert</span>
                <span className="profile-badge">Automation Architect</span>
              </div>
            </div>
          </div>
        </section>
  
        {/* Who Am I */}
        <section className="content-section">
          <h2 className="section-title" id="who-am-i">
            <span className="section-num" style={{ color: 'var(--accent-py)', background: 'rgba(61,200,160,0.08)', borderColor: 'rgba(61,200,160,0.2)' }}>01</span> Who Am I
          </h2>
          <div className="prose">
            <p>I'm a storage automation engineer with a passion for making complex infrastructure simple. For years, I've been automating NetApp environments — from small deployments to massive multi-site enterprises.</p>
          </div>
        </section>
  
        {/* What I Do */}
        <section className="content-section">
          <h2 className="section-title" id="what-i-do">
            <span className="section-num" style={{ color: 'var(--accent-cmd)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}>02</span> What I Do
          </h2>
          <div className="expertise-grid">
            {expertise.map((e) => (
              <div className="expertise-card" key={e.title}>
                <div className="expertise-icon">{e.icon}</div>
                <h3>{e.title}</h3>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
        </section>
  
        {/* Toolkit */}
        <section className="content-section">
          <h2 className="section-title" id="my-toolkit">
            <span className="section-num" style={{ color: 'var(--accent-ps)', background: 'rgba(123,97,255,0.08)', borderColor: 'rgba(123,97,255,0.2)' }}>03</span> My Toolkit
          </h2>
          <div className="tech-expertise">
            {toolkit.map((cat) => (
              <div className="tech-category" key={cat.label}>
                <h4 style={{ color: cat.color }}>{cat.label}</h4>
                <div className="tech-items">
                  {cat.tags.map((tag) => <span className="tech-tag" key={tag}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
  
        {/* Philosophy */}
        <section className="content-section">
          <h2 className="section-title" id="philosophy">
            <span className="section-num" style={{ color: 'var(--accent-tips)', background: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.2)' }}>04</span> My Philosophy
          </h2>
          <div className="philosophy-cards">
            {philosophy.map((p) => (
              <div className="philosophy-card" key={p.title}>
                <div className="philosophy-title">{p.title}</div>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
  
        {/* Connect */}
        <section className="content-section">
          <h2 className="section-title" id="connect">
            <span className="section-num" style={{ color: 'var(--accent-cmd)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}>05</span> Let's Connect
          </h2>
          <div className="connect-card">
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 }}>
              Have questions? Found a bug? Want to suggest an improvement? I'd love to hear from you.
            </p>
            <div className="connect-links">
              <a href="https://www.linkedin.com/in/vadiraja-tantri-m-s" target="_blank" rel="noreferrer" className="connect-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.288c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.288h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="mailto:vadirajatantri@outlook.com" className="connect-link">
                <span className="connect-icon">✉️</span>
                <span>Email</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    )
  }