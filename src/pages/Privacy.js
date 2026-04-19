import SEO from '../components/SEO'

function SNum({ num, color, bg, border }) {
    return <span className="section-num" style={{ color, background: bg, borderColor: border }}>{num}</span>
  }
  
  export default function Privacy() {
    return (
      <main className="main-content">
        <SEO
          title="Privacy Policy | NetApp Hub | Vadiraj Dev"
          description="Privacy policy and disclaimer for NetApp Hub by Vadiraj Dev."
          keywords="Privacy Policy"
          canonical="/privacy"
          ogTitle="Privacy Policy | NetApp Hub"
          ogDescription="Privacy policy of NetApp Hub."
        />
        <header className="page-header">
          <div className="header-badge">Legal</div>
          <h1 className="page-title">Privacy Policy & Disclaimer</h1>
          <p className="page-subtitle">Important information about usage, liability, and your rights.</p>
        </header>
  
        {/* 01 Privacy */}
        <section className="content-section">
          <h2 className="section-title" id="privacy">
            <SNum num="01" color="var(--accent-py)" bg="rgba(61,200,160,0.08)" border="rgba(61,200,160,0.2)" /> Privacy Policy
          </h2>
          <div className="prose">
            <h3>Information I Collect</h3>
            <p>This website does not collect, store, or transmit any personal information. The search functionality and documentation are entirely client-side and do not connect to external servers.</p>
            <h3>Cookies & Tracking</h3>
            <p>I do not use cookies, analytics, or tracking technology. Your browsing activity is not monitored or recorded.</p>
            <h3>External Links</h3>
            <p>This site may contain links to external resources (NetApp documentation, GitHub, LinkedIn). I am not responsible for the privacy practices of external websites. Please review their privacy policies independently.</p>
            <h3>Data Security</h3>
            <p>Since I do not collect personal data, there is no data to secure. All content is static and served over HTTPS where applicable.</p>
          </div>
        </section>
  
        {/* 02 Fair Use */}
        <section className="content-section">
          <h2 className="section-title" id="fair-use">
            <SNum num="02" color="var(--accent-cmd)" bg="rgba(245,166,35,0.08)" border="rgba(245,166,35,0.2)" /> Fair Use & Disclaimer
          </h2>
          <div className="prose">
            <h3>Informational Purpose Only</h3>
            <p>All content on this website, including code examples, documentation, and tutorials, is provided <strong>for informational and educational purposes only</strong>. The information herein is not intended to provide professional advice and should not be relied upon as such.</p>
            <h3>Code Examples & Scripts</h3>
            <p>All code examples, scripts, and automation solutions provided are:</p>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>Provided "AS IS" without warranty of any kind</li>
              <li>To be used at the <strong>sole discretion and risk of the user</strong></li>
              <li>Intended for use by experienced professionals in controlled environments</li>
              <li>Must be thoroughly tested in non-production environments before any production use</li>
              <li>Subject to the user's full responsibility for proper implementation and testing</li>
            </ul>
            <h3>NetApp Products & Services</h3>
            <p>This is an independent educational resource and is <strong>not affiliated with, endorsed by, or authorized by NetApp, Inc.</strong> All references to NetApp products, services, and trademarks are for informational purposes only. For official NetApp documentation, please visit <a href="https://docs.netapp.com" target="_blank" rel="noreferrer">docs.netapp.com</a>.</p>
            <h3>Usage Responsibility</h3>
            <p>By accessing and using this website and its content, you acknowledge that:</p>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>You are solely responsible for any consequences arising from your use of this content</li>
              <li>You understand the risks involved in using automation and scripting</li>
              <li>You will not use this content in any manner that violates laws or regulations</li>
              <li>You have obtained appropriate authorizations before implementing any solutions</li>
              <li>You will maintain backups and recovery procedures before making infrastructure changes</li>
            </ul>
          </div>
        </section>
  
        {/* 03 Liability */}
        <section className="content-section">
          <h2 className="section-title" id="liability">
            <SNum num="03" color="var(--accent-tips)" bg="rgba(255,107,107,0.08)" border="rgba(255,107,107,0.2)" /> Liability Disclaimer
          </h2>
          <div className="prose">
            <h3>No Warranty</h3>
            <p><strong>THIS WEBSITE AND ALL CONTENT ARE PROVIDED "AS IS" WITHOUT ANY EXPRESS OR IMPLIED WARRANTY OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</strong></p>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>Warranty of merchantability</li>
              <li>Warranty of fitness for a particular purpose</li>
              <li>Warranty of accuracy, completeness, or timeliness</li>
              <li>Warranty that the content will meet your requirements</li>
              <li>Warranty that the content is free from errors or defects</li>
            </ul>
            <h3>Limitation of Liability</h3>
            <p><strong>Under no circumstances shall Vadiraj Tantri, the author, or any contributors be liable for any damages whatsoever, including but not limited to:</strong></p>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>Direct, indirect, incidental, consequential, or punitive damages</li>
              <li>Loss of data, business, profits, or revenue</li>
              <li>Business interruption or downtime</li>
              <li>Damage to computer systems or infrastructure</li>
              <li>Any other loss or damage arising from or relating to your use of this website</li>
            </ul>
            <h3>Testing Requirement</h3>
            <p><strong>ALL CODE AND AUTOMATION MUST BE TESTED IN A NON-PRODUCTION ENVIRONMENT FIRST.</strong> This is a mandatory requirement, not a suggestion. Never directly implement untested solutions in production systems.</p>
          </div>
        </section>
  
        {/* 04 Governing Law */}
        <section className="content-section">
          <h2 className="section-title" id="governing-law">
            <SNum num="04" color="var(--accent-ps)" bg="rgba(123,97,255,0.08)" border="rgba(123,97,255,0.2)" /> Governing Law & Jurisdiction
          </h2>
          <div className="prose">
            <p>This website and all content are governed by the laws of <strong>India</strong>. Any disputes arising from your use of this website shall be subject to the exclusive jurisdiction of the courts in India.</p>
            <h3>Applicable Laws</h3>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>Information Technology Act, 2000</li>
              <li>Indian Contract Act, 1872</li>
              <li>Consumer Protection Act, 2019</li>
              <li>Data Protection and Privacy Laws of India</li>
            </ul>
          </div>
        </section>
  
        {/* 05 Contact */}
        <section className="content-section">
          <h2 className="section-title" id="contact">
            <SNum num="05" color="var(--accent-cmd)" bg="rgba(245,166,35,0.08)" border="rgba(245,166,35,0.2)" /> Questions or Concerns?
          </h2>
          <div className="prose">
            <p>If you have any questions regarding this privacy policy or disclaimer, please contact me:</p>
            <ul style={{ marginLeft: 20, marginTop: 12, listStyle: 'disc' }}>
              <li>Email: <strong>vadirajatantri@outlook.com</strong></li>
              <li>LinkedIn: <a href="https://www.linkedin.com/in/vadiraja-tantri-m-s" target="_blank" rel="noreferrer">linkedin.com/in/vadiraja-tantri-m-s</a></li>
            </ul>
          </div>
        </section>
  
        <div style={{ marginTop: 48, padding: 20, background: 'var(--bg2)', borderLeft: '4px solid var(--accent-py)', borderRadius: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            <strong>Policy Last Updated:</strong> March 29, 2026
          </p>
        </div>
      </main>
    )
  }