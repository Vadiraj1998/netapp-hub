import { useState } from 'react'

const C = {
  kw:   '#ff79c6',
  str:  '#f1fa8c',
  cmt:  '#6272a4',
  fn:   '#50fa7b',
  num:  '#bd93f9',
  var:  '#8be9fd',
  cls:  '#ffb86c',
  def:  '#c8d8e8',
}

function getRules(lang) {
  const common = [
    ['cmt', /^#[^\n]*/],
    ['str', /^f"""[\s\S]*?"""/],
    ['str', /^f"[^"\n]*"/],
    ['str', /^f'[^'\n]*'/],
    ['str', /^"""[\s\S]*?"""/],
    ['str', /^'''[\s\S]*?'''/],
    ['str', /^"[^"\n]*"/],
    ['str', /^'[^'\n]*'/],
    ['num', /^-?\b\d+(\.\d+)?\b/],
  ]

  if (lang === 'python') return [
    ...common,
    ['fn',  /^(print|len|range|open|str|int|float|list|dict|set|tuple|type|isinstance|sorted|enumerate|zip|map|filter|sum|max|min|abs|round|format|super)\s*(?=\()/],
    ['cls', /^[A-Z][a-zA-Z0-9_]*/],
    ['kw',  /^(import|from|as|if|elif|else|for|while|with|try|except|finally|return|def|class|pass|break|continue|raise|yield|lambda|not|and|or|in|is|None|True|False|self|async|await)\b/],
    ['var', /^[a-z_]\w*/],
  ]

  if (lang === 'powershell') return [
    ['cmt', /^#[^\n]*/],
    ['str', /^@"[\s\S]*?"@/],
    ['str', /^"[^"\n]*"/],
    ['str', /^'[^'\n]*'/],
    ['num', /^-?\d+(\.\d+)?/],
    ['var', /^\$[\w:]+/],
    ['fn',  /^[A-Z][a-z]+-[A-Z][a-zA-Z]+/],
    ['cls', /^\[[A-Za-z.]+\]/],
    ['kw',  /^(if|else|elseif|foreach|while|do|switch|try|catch|finally|return|function|param|break|continue|throw|exit|in)\b/i],
  ]

  return [
    ['cmt', /^#[^\n]*/],
    ['str', /^"[^"\n]*"/],
    ['str', /^'[^'\n]*'/],
    ['num', /^-?\d+(\.\d+)?/],
    ['fn',  /^(curl|pip|python3?|npm|node|echo|cd|ls|cat|grep|export)\b/],
    ['kw',  /^(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|export|local)\b/],
    ['var', /^\$\w+/],
  ]
}

function tokenize(code, lang) {
  const rules = getRules(lang)
  const tokens = []
  let s = code

  while (s.length > 0) {
    let hit = false
    for (const [type, re] of rules) {
      const m = s.match(re)
      if (m && m.index === 0) {
        tokens.push({ type, value: m[0] })
        s = s.slice(m[0].length)
        hit = true
        break
      }
    }
    if (!hit) {
      const last = tokens[tokens.length - 1]
      if (last && last.type === 'def') last.value += s[0]
      else tokens.push({ type: 'def', value: s[0] })
      s = s.slice(1)
    }
  }
  return tokens
}

const LANG_MAP = { python:'python', bash:'bash', powershell:'powershell', ps:'powershell', shell:'bash' }

export default function CopyBlock({ lang, langColor, children }) {
  const [copied, setCopied] = useState(false)
  const parseLang = LANG_MAP[lang.split(' · ')[0].toLowerCase().trim()] || 'bash'
  const tokens = tokenize(children || '', parseLang)

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang" style={langColor ? { color: langColor } : {}}>{lang}</span>
        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={() => {
          navigator.clipboard.writeText(children)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        }}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <pre style={{ margin:0, padding:'20px', overflowX:'auto', fontSize:'13px', lineHeight:'1.6', fontFamily:"'JetBrains Mono', monospace", background:'transparent', color: C.def }}>
        <code>
          {tokens.map((tok, i) =>
            tok.type === 'def'
              ? <span key={i}>{tok.value}</span>
              : <span key={i} style={{ color: C[tok.type], fontStyle: tok.type === 'cmt' ? 'italic' : 'normal' }}>{tok.value}</span>
          )}
        </code>
      </pre>
    </div>
  )
}