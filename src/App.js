import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ScrollToTop from "./components/layout/ScrollToTop"

// pages
import Home from './pages/Home'

// lazy pages
import { lazy, Suspense } from 'react'
const GetStarted = lazy(() => import('./pages/GetStarted'))
const Commands = lazy(() => import('./pages/Commands'))
const Cheatsheet = lazy(() => import('./pages/Cheatsheet'))
const Python = lazy(() => import('./pages/Python'))
const PowerShell = lazy(() => import('./pages/PowerShell'))
const Tips = lazy(() => import('./pages/Tips'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const AboutMe = lazy(() => import('./pages/AboutMe'))
const Privacy = lazy(() => import('./pages/Privacy'))

function PageLoader() {
  return (
    <div style={{ padding: '48px', color: 'var(--text-dim)' }}>
      Loading...
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop /> {/* ✅ correct place */}

      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/commands" element={<Commands />} />
            <Route path="/cheatsheet" element={<Cheatsheet />} />
            <Route path="/python" element={<Python />} />
            <Route path="/powershell" element={<PowerShell />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  )
}