import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import SEO from '../components/SEO'

// ── Firebase singleton ────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAozsRXTtidH65UhWv2bqFk3J2fZ2iOtsw',
  authDomain:        'netapp-hub.firebaseapp.com',
  projectId:         'netapp-hub',
  storageBucket:     'netapp-hub.firebasestorage.app',
  messagingSenderId: '599153057916',
  appId:             '1:599153057916:web:b9030d0a2d5d2563a1a9f9',
}
const app     = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG)
const db      = getFirestore(app)
const storage = getStorage(app)

const POSTS_PER_PAGE = 10

// ── Submit Modal ──────────────────────────────────────────────
function SubmitModal({ open, onClose }) {
  const [step, setStep]           = useState('form') // form | uploading | success | error
  const [uploadPct, setUploadPct] = useState(0)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const fileRef = useRef(null)

  // Reset when modal opens
  useEffect(() => {
    if (open) { setStep('form'); setUploadPct(0); setImageFile(null); setImagePreview(null); setErrorMsg('') }
  }, [open])

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setErrorMsg('Please pick an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setErrorMsg('Image must be under 5 MB.'); return }
    setErrorMsg('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStep('uploading')
    setErrorMsg('')

    const form    = e.target
    const title   = form.title.value.trim()
    const author  = form.author.value.trim()
    const email   = form.email.value.trim()
    const excerpt = form.excerpt.value.trim()
    const content = form.content.value.trim()
    const tags    = form.tags.value.trim()
    const category = form.category.value

    try {
      let imageUrl = ''

      // 1 — Upload image to Firebase Storage if provided
      if (imageFile) {
        const fileExt  = imageFile.name.split('.').pop()
        const fileName = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const sRef     = storageRef(storage, fileName)
        const task     = uploadBytesResumable(sRef, imageFile)

        imageUrl = await new Promise((resolve, reject) => {
          task.on(
            'state_changed',
            (snap) => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            async () => resolve(await getDownloadURL(task.snapshot.ref))
          )
        })
      }

      // 2 — Save submission to Firestore
      await addDoc(collection(db, 'submissions'), {
        title, author, email, excerpt, content, tags, category,
        imageUrl,
        status:    'pending',
        createdAt: serverTimestamp(),
      })

      setStep('success')
      form.reset()
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      console.error(err)
      setErrorMsg('Something went wrong. Please try again.')
      setStep('form')
    }
  }

  if (!open) return null

  const inputStyle = {
    width: '100%', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: 6,
    padding: '10px 14px', color: 'var(--text-bright)',
    fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      className="modal"
      style={{ display: 'flex' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content"
        style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '560px', boxSizing: 'border-box' }}
      >
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: 24, color: 'var(--text-bright)' }}>Submit Your Blog Post</h2>

        {/* ── Success ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 16, color: 'var(--accent-py)', marginBottom: 8 }}>Submission received!</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
              Thanks! Your post is under review. Featured posts go live within a few days.
            </p>
            <button className="btn btn-primary" onClick={() => { setStep('form'); onClose() }}>Close</button>
          </div>
        )}

        {/* ── Uploading progress ── */}
        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              {imageFile ? `Uploading image… ${uploadPct}%` : 'Saving submission…'}
            </p>
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'var(--accent-py)',
                width: `${imageFile ? uploadPct : 80}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            {[
              { id: 'title',  label: 'Post Title *',         type: 'text',  placeholder: 'e.g., Automating Volume Creation', required: true },
              { id: 'author', label: 'Your Name / Handle *', type: 'text',  placeholder: 'John Doe',                         required: true },
              { id: 'email',  label: 'Email Address *',      type: 'email', placeholder: 'your@email.com',                   required: true },
            ].map((f) => (
              <div className="form-group" key={f.id} style={{ marginBottom: 14 }}>
                <label htmlFor={f.id} style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>{f.label}</label>
                <input type={f.type} id={f.id} name={f.id} required={f.required} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="excerpt" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>Excerpt (short summary) *</label>
              <textarea id="excerpt" name="excerpt" required rows={2} placeholder="A one-line summary..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="content" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>Article Content *</label>
              <textarea id="content" name="content" required rows={8} placeholder="Write your article here..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="tags" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>Tags (comma-separated)</label>
              <input type="text" id="tags" name="tags" placeholder="Python, SnapMirror, Automation" style={inputStyle} />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="category" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>Category *</label>
              <select id="category" name="category" required style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select a category</option>
                <option value="python">Python Automation</option>
                <option value="powershell">PowerShell Automation</option>
                <option value="ansible">Ansible &amp; IaC</option>
                <option value="rest-api">REST API</option>
                <option value="best-practices">Best Practices</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Image upload */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-dim)' }}>
                Featured Image <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional, max 5 MB)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${imageFile ? 'var(--accent-py)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  background: imageFile ? 'rgba(61,200,160,0.04)' : 'transparent',
                }}
              >
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, objectFit: 'cover', marginBottom: 8 }}
                    />
                    <p style={{ fontSize: 12, color: 'var(--accent-py)', fontFamily: 'var(--font-mono)' }}>
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Click to change</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Click to upload an image</p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>PNG, JPG, WEBP — max 5 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                style={{ display: 'none' }}
              />
            </div>

            {/* Agree checkbox */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
                <input
                  type="checkbox"
                  name="agree"
                  required
                  style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-py)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  I agree to have my article published with my name credited on NetApp Hub.
                </span>
              </label>
            </div>

            {errorMsg && (
              <p style={{ color: '#ff5555', fontSize: 13, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                ⚠ {errorMsg}
              </p>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Post</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Blog Card ─────────────────────────────────────────────────
function BlogCard({ post }) {
  const isFeatured = post.featured === 'true'
  const [year, month, day] = post.date.split('-').map(Number)
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
  const tags = Array.isArray(post.tags) ? post.tags : post.tags.split(',').map((t) => t.trim())
  const slug = post.file.replace('posts/', '').replace('.html', '')

  return (
    <article className="blog-card">
      <div className="blog-card-body">
        {isFeatured && <span className="blog-featured-badge">⭐ Featured</span>}
        <div className="blog-meta">
          <span className="blog-author">{post.author}</span>
          <span className="blog-dot">•</span>
          <span className="blog-date">{formattedDate}</span>
        </div>
        <h3 className="blog-title">{post.title}</h3>
        <p className="blog-excerpt">{post.excerpt}</p>
        <div className="blog-tags">
          {tags.map((tag) => <span className="blog-tag" key={tag}>{tag}</span>)}
        </div>
        <Link to={`/blog/${slug}`} className="blog-read-more">Read Article →</Link>
      </div>
      {post.image && (
        <div className="blog-image">
          <img
            src={`/assets/images/blog/${post.image}`}
            alt={post.title}
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}
    </article>
  )
}

// ── Main Blog page ────────────────────────────────────────────
export default function Blog() {
  const [allPosts, setAllPosts]   = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [activeFilter, setFilter] = useState('all')
  const [page, setPage]           = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetch('/assets/data/posts-index.json')
      .then((r) => r.json())
      .then((data) => {
        const posts = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date))
        setAllPosts(posts)
        setFiltered(posts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let result = allPosts
    if (activeFilter === 'featured') result = result.filter((p) => p.featured === 'true')
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => {
        const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : p.tags
        return (
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          tagsStr.toLowerCase().includes(q)
        )
      })
    }
    setFiltered(result)
    setPage(1)
  }, [search, activeFilter, allPosts])

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE)
  const pagePosts  = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  return (
    <main className="main-content">
      <SEO
        title="NetApp Automation Blogs & ONTAP Guides | Community | NetApp Hub"
        description="NetApp automation blogs, ONTAP guides, and storage engineering tutorials from the community."
        keywords="NetApp Blogs, ONTAP Guides, Automation, DevOps, Storage"
        canonical="/blog"
        ogTitle="NetApp Automation Blogs | NetApp Hub"
        ogDescription="Community blogs on NetApp ONTAP, automation, and DevOps."
      />
      <header className="page-header">
        <div className="header-badge">Community</div>
        <h1 className="page-title">Blogs &amp; Articles from Community</h1>
        <p className="page-subtitle">
          Community-driven insights and deep dives into NetApp. Share your story with fellow engineers.
          Best ones will get featured. I read everything. Eventually. 👀
        </p>
      </header>

      <section className="content-section">
        <h2 className="section-title"><span className="section-num">Latest Posts</span></h2>

        <div className="blog-search-bar">
          <span className="blog-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search posts by title, author, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && <button className="blog-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        {search && (
          <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            {filtered.length === 0
              ? `No posts found for "${search}"`
              : `${filtered.length} post${filtered.length > 1 ? 's' : ''} found for "${search}"`}
          </div>
        )}

        <div className="blog-filters">
          <button className={`filter-btn${activeFilter === 'all'      ? ' active' : ''}`} onClick={() => setFilter('all')}>All Posts</button>
          <button className={`filter-btn${activeFilter === 'featured' ? ' active' : ''}`} onClick={() => setFilter('featured')}>⭐ Featured</button>
        </div>

        <div className="blog-grid">
          {pagePosts.length > 0
            ? pagePosts.map((post) => <BlogCard key={post.id} post={post} />)
            : <p style={{ color: 'var(--text-dim)' }}>No posts yet. Be the first to submit one!</p>}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="submit-post-card">
          <div className="submit-post-content">
            <h3>✍️ Share Your Experience</h3>
            <p>Got a story? Send us your post and we'll feature it!</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Submit a Post</button>
          </div>
        </div>
      </section>

      <SubmitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  )
}