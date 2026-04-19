import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const socialLink = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  border: '1px solid #2a3545',
  borderRadius: 8,
  color: '#8aa0b6',
  textDecoration: 'none',
  fontSize: 18,
  transition: 'all 0.2s',
  background: 'transparent',
}

export default function Footer() {
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    fetch('/assets/data/site-meta.json')
      .then((r) => r.json())
      .then((data) => {
        const d = new Date(data.lastUpdated)
        setLastUpdated(
          d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        )
      })
      .catch(() => setLastUpdated('Unavailable'))
  }, [])

  return (
    <footer className="site-footer">
      <div className="footer-container">

        <div className="footer-section">
          <h4>NetApp Hub</h4>
          <p>
            A comprehensive resource for NetApp built by{' '}
            <strong>Vadiraja Tantri M S</strong>.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <a
              href="https://www.linkedin.com/in/vadiraja-tantri-m-s"
              target="_blank"
              rel="noreferrer"
              title="LinkedIn"
              style={socialLink}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#3dc8a0'
                e.currentTarget.style.borderColor = '#3dc8a0'
                e.currentTarget.style.color = '#0a0c0f'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = '#2a3545'
                e.currentTarget.style.color = '#8aa0b6'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.288c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.288h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>

            <a
              href="mailto:vadirajatantri@outlook.com"
              title="Email"
              style={socialLink}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#3dc8a0'
                e.currentTarget.style.borderColor = '#3dc8a0'
                e.currentTarget.style.color = '#0a0c0f'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = '#2a3545'
                e.currentTarget.style.color = '#8aa0b6'
              }}
            >
              ✉️
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Documentation</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/get-started">Get Started</Link></li>
            <li><Link to="/commands">Commands Reference</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><Link to="/blog">Blogs &amp; Articles</Link></li>
            <li><Link to="/powershell">PowerShell Automation</Link></li>
            <li><Link to="/python">Python Automation</Link></li>
            <li><Link to="/tips">Tips &amp; Tricks</Link></li>
            <li><Link to="/about">About Me</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/privacy#privacy">Privacy Policy</Link></li>
            <li><Link to="/privacy#fair-use">Fair Use &amp; Disclaimer</Link></li>
            <li><Link to="/privacy#liability">Liability Disclaimer</Link></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          &copy; 2026 <strong>Vadiraj Tantri M S</strong>. All rights reserved.
          NetApp is a trademark of NetApp, Inc.
        </p>
        {lastUpdated && (
          <p style={{ fontSize: 12, color: '#8aa0b6', marginTop: 8 }}>
            Built with ❤️ for NetApp Engineers | Last Updated:{' '}
            <span>{lastUpdated}</span>
          </p>
        )}
      </div>
    </footer>
  )
}