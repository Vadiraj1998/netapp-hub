import { useState } from 'react'
import SubNav from '../components/SubNav'
import SEO from '../components/SEO'
import { DISK_MODELS, DISK_TYPE_LABELS } from '../data/DiskData'

const ACCENT = 'var(--accent-tools)'

const TABS = [
  { id: 'aggregate', label: 'Aggregate Calculator' },
  { id: 'parity',    label: 'RAID Parity' },
  { id: 'usable',    label: 'Usable Capacity' },
]

// ── Segment colours (fixed — represent specific concepts) ─────────────────
const SEG = {
  usable:    '#10b981',
  parity:    '#f59e0b',
  wafl:      '#3b82f6',
  snapshot:  '#8b5cf6',
  spare:     '#64748b',
}

// ── Math helpers ─────────────────────────────────────────────────────────
const gbToGib  = gb  => gb * 1e9 / (1024 ** 3)           // decimal GB → binary GiB
const fmt = gib => gib >= 1024
  ? `${(gib / 1024).toFixed(2)} TiB`
  : `${Math.round(gib)} GiB`

const PARITY_PER_RG = { 'RAID-DP': 2, 'RAID-TEC': 3, 'RAID4': 1 }
const RAID_DESC = {
  'RAID-DP':  'Double Parity — 2 parity disks per RAID group. Default for SSD/SAS.',
  'RAID-TEC': 'Triple Erasure Code — 3 parity disks per RAID group. Recommended for large NL-SAS.',
  'RAID4':    'Single Parity — 1 parity disk per RAID group. Legacy, rarely used in new deployments.',
}

function calcRaid(activeDisks, rgSize, raidType) {
  const p = PARITY_PER_RG[raidType]
  if (activeDisks < p + 1 || rgSize < p + 1) return null
  const fullRGs    = Math.floor(activeDisks / rgSize)
  const remaining  = activeDisks % rgSize
  const hasPartial = remaining > p
  const totalRGs   = fullRGs + (hasPartial ? 1 : 0)
  const dataDisks  = fullRGs * (rgSize - p) + (hasPartial ? remaining - p : 0)
  const parityDisks = totalRGs * p
  // Build per-RG breakdown
  const groups = []
  for (let i = 0; i < fullRGs; i++) groups.push({ data: rgSize - p, parity: p, size: rgSize })
  if (hasPartial) groups.push({ data: remaining - p, parity: p, size: remaining })
  return { totalRGs, dataDisks, parityDisks, groups }
}

// ── Shared small components ───────────────────────────────────────────────

function CalcSlider({ label, value, min, max, step = 1, unit = '', onChange, hint }) {
  return (
    <div className="calc-control">
      <div className="calc-control-header">
        <label className="calc-label">{label}</label>
        <span className="calc-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className="calc-range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className="calc-range-bounds">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {hint && <p className="calc-hint">{hint}</p>}
    </div>
  )
}

function RaidSelector({ value, onChange }) {
  return (
    <div className="calc-control">
      <label className="calc-label">RAID Type</label>
      <div className="raid-type-btns">
        {Object.keys(PARITY_PER_RG).map(rt => (
          <button
            key={rt}
            className={`raid-btn${value === rt ? ' active' : ''}`}
            style={value === rt ? { background: ACCENT, color: '#fff', borderColor: ACCENT } : {}}
            onClick={() => onChange(rt)}
          >{rt}</button>
        ))}
      </div>
      <p className="calc-hint">{RAID_DESC[value]}</p>
    </div>
  )
}

function CapBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.pct, 0)
  if (total === 0) return null
  return (
    <div className="cap-bar-wrap">
      <div className="cap-bar">
        {segments.filter(s => s.pct > 0).map(s => (
          <div key={s.label} className="cap-segment"
            style={{ width: `${(s.pct / total * 100).toFixed(2)}%`, background: s.color }}
            title={`${s.label}: ${fmt(s.gib)}`}
          />
        ))}
      </div>
      <div className="cap-legend">
        {segments.filter(s => s.pct > 0).map(s => (
          <div key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-val">&nbsp;{fmt(s.gib)}&nbsp;·&nbsp;{(s.pct / total * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Aggregate Calculator ──────────────────────────────────────────────────

function AggregateCalcTab() {
  const defaultDisk = DISK_MODELS.find(d => d.id === 'ssd-3p8')
  const [diskId,     setDiskId]     = useState(defaultDisk.id)
  const [diskCount,  setDiskCount]  = useState(24)
  const [raidType,   setRaidType]   = useState('RAID-DP')
  const [rgSize,     setRgSize]     = useState(defaultDisk.defaultRGSize)
  const [rgMaxSize,  setRgMaxSize]  = useState(defaultDisk.maxRGSize)
  const [spareCount, setSpareCount] = useState(2)

  function handleDiskChange(id) {
    const d = DISK_MODELS.find(x => x.id === id)
    setDiskId(id)
    setRgSize(d.defaultRGSize)
    setRgMaxSize(d.maxRGSize)
  }

  const disk         = DISK_MODELS.find(d => d.id === diskId)
  const rawGibPerDisk = gbToGib(disk.rawGB)
  const spares       = Math.min(spareCount, diskCount - (PARITY_PER_RG[raidType] + 1))
  const active       = diskCount - spares
  const raid         = calcRaid(active, Math.min(rgSize, active), raidType)

  const rawTotalGiB  = diskCount * rawGibPerDisk
  const spareGiB     = spares * rawGibPerDisk
  const parityGiB    = raid ? raid.parityDisks * rawGibPerDisk : 0
  const dataGiB      = raid ? raid.dataDisks  * rawGibPerDisk : 0
  const waflGiB      = dataGiB * 0.10
  const usableGiB    = dataGiB * 0.90
  const efficiencyPct = rawTotalGiB > 0 ? (usableGiB / rawTotalGiB * 100) : 0

  const barSegments = [
    { label: 'Usable',        gib: usableGiB,  pct: usableGiB,  color: SEG.usable  },
    { label: 'WAFL Reserve',  gib: waflGiB,    pct: waflGiB,    color: SEG.wafl    },
    { label: 'Parity',        gib: parityGiB,  pct: parityGiB,  color: SEG.parity  },
    { label: 'Spare Disks',   gib: spareGiB,   pct: spareGiB,   color: SEG.spare   },
  ]

  // Group disk models by type for optgroup
  const grouped = Object.keys(DISK_TYPE_LABELS).reduce((acc, type) => {
    acc[type] = DISK_MODELS.filter(d => d.type === type)
    return acc
  }, {})

  return (
    <div className="calc-layout">
      {/* ── Inputs ── */}
      <div className="calc-panel">
        <div className="calc-panel-title">Configuration</div>

        <div className="calc-control">
          <label className="calc-label">Disk Model</label>
          <select className="calc-select" value={diskId} onChange={e => handleDiskChange(e.target.value)}>
            {Object.entries(DISK_TYPE_LABELS).map(([type, label]) => (
              <optgroup key={type} label={label}>
                {grouped[type].map(d => (
                  <option key={d.id} value={d.id}>{d.label} — {d.model}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="calc-hint">{disk.rawGB >= 1000 ? (disk.rawGB / 1000).toFixed(2) : disk.rawGB} GB raw → {fmt(rawGibPerDisk)} per disk (binary)</p>
        </div>

        <CalcSlider label="Number of Disks" value={diskCount} min={4} max={80}
          unit=" disks" onChange={setDiskCount} />

        <RaidSelector value={raidType} onChange={rt => {
          setRaidType(rt)
          const minRg = PARITY_PER_RG[rt] + 1
          if (rgSize < minRg) setRgSize(minRg)
        }} />

        <CalcSlider label="RAID Group Size" value={Math.min(rgSize, rgMaxSize)} min={PARITY_PER_RG[raidType] + 1} max={rgMaxSize}
          unit=" disks" onChange={setRgSize}
          hint={`Default for ${DISK_TYPE_LABELS[disk.type]}: ${disk.defaultRGSize} disks`} />

        <CalcSlider label="Hot Spare Disks" value={spares} min={0} max={Math.min(8, diskCount - PARITY_PER_RG[raidType] - 1)}
          onChange={setSpareCount}
          hint="Spares are reserved outside the aggregate and not counted toward capacity." />
      </div>

      {/* ── Results ── */}
      <div className="calc-results-panel">
        {!raid ? (
          <div className="calc-warning">Not enough active disks for the selected RAID type and group size. Reduce spare count or increase disk count.</div>
        ) : (
          <>
            <div className="result-card">
              <div className="result-card-title">Aggregate Usable Capacity</div>
              <div className="result-big">
                {usableGiB >= 1024 ? (usableGiB / 1024).toFixed(2) : Math.round(usableGiB)}
                <span>{usableGiB >= 1024 ? 'TiB' : 'GiB'}</span>
              </div>
              <div className="result-sub">{efficiencyPct.toFixed(1)}% efficiency from {diskCount} × {disk.label}</div>

              <CapBar segments={barSegments} />
            </div>

            <div className="result-card">
              <div className="result-card-title">Capacity Breakdown</div>
              <table className="breakdown-table">
                <thead>
                  <tr><th>Item</th><th>Disks</th><th>Capacity</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Raw</td>
                    <td>{diskCount}</td>
                    <td className="highlight">{fmt(rawTotalGiB)}</td>
                    <td className="dim">{disk.rawGB >= 1000 ? (disk.rawGB/1000).toFixed(2) : disk.rawGB} GB per disk × {diskCount}</td>
                  </tr>
                  <tr>
                    <td>Hot Spares</td>
                    <td className="dim">−{spares}</td>
                    <td className="dim">−{fmt(spareGiB)}</td>
                    <td className="dim">Reserved outside aggregate</td>
                  </tr>
                  <tr>
                    <td>Parity Overhead</td>
                    <td className="dim">−{raid.parityDisks}</td>
                    <td className="dim">−{fmt(parityGiB)}</td>
                    <td className="dim">{PARITY_PER_RG[raidType]} parity disk(s) × {raid.totalRGs} RAID group(s)</td>
                  </tr>
                  <tr>
                    <td>WAFL Reserve</td>
                    <td className="dim">—</td>
                    <td className="dim">−{fmt(waflGiB)}</td>
                    <td className="dim">10% internal ONTAP overhead (fixed)</td>
                  </tr>
                  <tr>
                    <td>Usable</td>
                    <td className="accent-val">{raid.dataDisks} data</td>
                    <td className="accent-val">{fmt(usableGiB)}</td>
                    <td className="dim">{efficiencyPct.toFixed(1)}% of raw</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="result-card">
              <div className="result-card-title">RAID Group Layout — {raid.totalRGs} group(s)</div>
              <div className="rg-detail-grid">
                {raid.groups.map((g, i) => (
                  <div key={i} className="rg-detail-card">
                    <div className="rg-num">RAID Group {i + 1}{i >= Math.floor(active / rgSize) ? ' (partial)' : ''}</div>
                    <div className="rg-row"><span>Total disks</span><span>{g.size}</span></div>
                    <div className="rg-row"><span>Data disks</span><span>{g.data}</span></div>
                    <div className="rg-row"><span>Parity disks</span><span>{g.parity}</span></div>
                    <div className="rg-row"><span>Usable</span><span>{fmt(g.data * rawGibPerDisk * 0.9)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── RAID Parity Calculator ────────────────────────────────────────────────

function ParityCalcTab() {
  const [totalDisks, setTotalDisks] = useState(14)
  const [raidType,   setRaidType]   = useState('RAID-DP')
  const [rgSize,     setRgSize]     = useState(14)

  const p     = PARITY_PER_RG[raidType]
  const minRg = p + 1
  const clampedRg = Math.max(minRg, Math.min(rgSize, totalDisks))
  const raid  = calcRaid(totalDisks, clampedRg, raidType)

  const overheadPct  = raid ? (raid.parityDisks / totalDisks * 100) : 0
  const efficiencyPct = raid ? (raid.dataDisks   / totalDisks * 100) : 0

  const barSegments = raid ? [
    { label: 'Data Disks',   gib: raid.dataDisks,   pct: raid.dataDisks,   color: SEG.usable  },
    { label: 'Parity Disks', gib: raid.parityDisks, pct: raid.parityDisks, color: SEG.parity  },
  ] : []

  return (
    <div className="calc-layout">
      <div className="calc-panel">
        <div className="calc-panel-title">Configuration</div>

        <CalcSlider label="Total Disk Count" value={totalDisks} min={minRg} max={80}
          unit=" disks" onChange={v => setTotalDisks(v)} />

        <RaidSelector value={raidType} onChange={rt => {
          setRaidType(rt)
          const mn = PARITY_PER_RG[rt] + 1
          if (rgSize < mn) setRgSize(mn)
        }} />

        <CalcSlider label="RAID Group Size" value={clampedRg} min={minRg} max={Math.min(28, totalDisks)}
          unit=" disks" onChange={setRgSize}
          hint={`Min ${minRg} for ${raidType} · Max 28 (NVMe/SSD) or 20 (SAS/NL-SAS)`} />
      </div>

      <div className="calc-results-panel">
        {!raid ? (
          <div className="calc-warning">Increase disk count or reduce RAID group size to get a valid configuration.</div>
        ) : (
          <>
            <div className="result-card">
              <div className="result-card-title">RAID Efficiency</div>
              <div className="result-big">
                {efficiencyPct.toFixed(1)}<span>%</span>
              </div>
              <div className="result-sub">{raid.dataDisks} data disks out of {totalDisks} total — {overheadPct.toFixed(1)}% parity overhead</div>

              <CapBar segments={barSegments.map(s => ({ ...s, gib: s.gib }))} />
            </div>

            <div className="result-card">
              <div className="result-card-title">Disk Allocation</div>
              <table className="breakdown-table">
                <thead>
                  <tr><th>Category</th><th>Count</th><th>% of Total</th></tr>
                </thead>
                <tbody>
                  <tr><td>Total Disks</td><td className="highlight">{totalDisks}</td><td className="dim">—</td></tr>
                  <tr><td>RAID Groups</td><td className="accent-val">{raid.totalRGs}</td><td className="dim">{clampedRg} disks/group (max)</td></tr>
                  <tr><td>Data Disks</td><td className="accent-val">{raid.dataDisks}</td><td className="accent-val">{efficiencyPct.toFixed(1)}%</td></tr>
                  <tr><td>Parity Disks</td><td className="dim">{raid.parityDisks}</td><td className="dim">{overheadPct.toFixed(1)}%</td></tr>
                </tbody>
              </table>
            </div>

            <div className="result-card">
              <div className="result-card-title">RAID Group Breakdown</div>
              <div className="rg-detail-grid">
                {raid.groups.map((g, i) => (
                  <div key={i} className="rg-detail-card">
                    <div className="rg-num">Group {i + 1}{g.size < clampedRg ? ' (partial)' : ''}</div>
                    <div className="rg-row"><span>Size</span><span>{g.size} disks</span></div>
                    <div className="rg-row"><span>Data</span><span>{g.data}</span></div>
                    <div className="rg-row"><span>Parity</span><span>{g.parity}</span></div>
                    <div className="rg-row"><span>Efficiency</span><span>{(g.data / g.size * 100).toFixed(1)}%</span></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Usable Capacity Calculator ────────────────────────────────────────────

function UsableCalcTab() {
  const [rawGiB,       setRawGiB]       = useState(10240)
  const [snapReserve,  setSnapReserve]  = useState(5)
  const [dedupRatio,   setDedupRatio]   = useState(10)  // stored as ×10, so 10 = 1.0x
  const [volCount,     setVolCount]     = useState(1)

  const afterWafl    = rawGiB * 0.90
  const waflLoss     = rawGiB * 0.10
  const perVolTotal  = afterWafl / volCount
  const perVolSnap   = perVolTotal * (snapReserve / 100)
  const perVolData   = perVolTotal - perVolSnap
  const ratio        = dedupRatio / 10
  const totalLogical = perVolData * ratio * volCount

  const barSegments = [
    { label: 'Logical Usable', gib: totalLogical,           pct: totalLogical,           color: SEG.usable   },
    { label: 'Snapshot Reserve', gib: perVolSnap * volCount, pct: perVolSnap * volCount,  color: SEG.snapshot },
    { label: 'WAFL Reserve',   gib: waflLoss,               pct: waflLoss,               color: SEG.wafl     },
  ]

  const steps = [
    {
      icon: '1',
      label: 'Raw Aggregate Capacity',
      val: fmt(rawGiB),
      meta: 'Input — from disks after RAID parity',
      delta: null,
      color: SEG.spare,
    },
    {
      icon: '2',
      label: 'After WAFL Reserve (−10%)',
      val: fmt(afterWafl),
      meta: 'ONTAP internal overhead — fixed, not configurable',
      delta: `−${fmt(waflLoss)}`,
      color: SEG.wafl,
    },
    {
      icon: '3',
      label: `Per Volume (÷ ${volCount} vol${volCount > 1 ? 's' : ''})`,
      val: fmt(perVolTotal),
      meta: 'Available per volume before snapshot reserve',
      delta: null,
      color: SEG.parity,
    },
    {
      icon: '4',
      label: `After Snapshot Reserve (−${snapReserve}%)`,
      val: fmt(perVolData),
      meta: 'Space available for active data per volume',
      delta: `−${fmt(perVolSnap)}`,
      color: SEG.snapshot,
    },
    {
      icon: '5',
      label: `After Dedup/Compression (${ratio.toFixed(1)}:1)`,
      val: fmt(totalLogical),
      meta: `Logical usable across all ${volCount} volume(s)`,
      delta: ratio > 1 ? `+${fmt(totalLogical - perVolData * volCount)} logical gain` : 'No savings applied',
      color: SEG.usable,
    },
  ]

  return (
    <div className="calc-layout">
      <div className="calc-panel">
        <div className="calc-panel-title">Parameters</div>

        <CalcSlider label="Raw Aggregate Capacity" value={rawGiB} min={512} max={524288} step={512}
          unit=" GiB" onChange={setRawGiB}
          hint={`${(rawGiB / 1024).toFixed(1)} TiB — use the Aggregate Calculator to derive this value`} />

        <CalcSlider label="Snapshot Reserve per Volume" value={snapReserve} min={0} max={20}
          unit="%" onChange={setSnapReserve}
          hint="Default 5%. Increase if heavy snapshot usage is expected." />

        <CalcSlider label="Number of Volumes" value={volCount} min={1} max={50}
          onChange={setVolCount}
          hint="Aggregate usable is split evenly across volumes for this estimate." />

        <div className="calc-control">
          <div className="calc-control-header">
            <label className="calc-label">Dedup / Compression Ratio</label>
            <span className="calc-value">{(dedupRatio / 10).toFixed(1)}:1</span>
          </div>
          <input type="range" className="calc-range" min={10} max={50} step={1}
            value={dedupRatio} onChange={e => setDedupRatio(Number(e.target.value))} />
          <div className="calc-range-bounds"><span>1:1 (off)</span><span>5:1</span></div>
          <p className="calc-hint">All-flash AFF typically achieves 2–4:1 total efficiency. Set to 1:1 for conservative planning.</p>
        </div>
      </div>

      <div className="calc-results-panel">
        <div className="result-card">
          <div className="result-card-title">Total Logical Usable Capacity</div>
          <div className="result-big">
            {totalLogical >= 1024 ? (totalLogical / 1024).toFixed(2) : Math.round(totalLogical)}
            <span>{totalLogical >= 1024 ? 'TiB' : 'GiB'}</span>
          </div>
          <div className="result-sub">
            Across {volCount} volume{volCount > 1 ? 's' : ''} · {(totalLogical / rawGiB * 100).toFixed(1)}% of raw · {ratio.toFixed(1)}:1 efficiency ratio
          </div>
          <CapBar segments={barSegments} />
        </div>

        <div className="result-card">
          <div className="result-card-title">Step-by-Step Breakdown</div>
          <div className="step-list">
            {steps.map(s => (
              <div key={s.icon} className="step-row">
                <div className="step-row-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                <div className="step-row-body">
                  <div className="step-row-label">{s.label}</div>
                  <div className="step-row-val">{s.val}</div>
                  {s.meta && <div className="step-row-meta">{s.meta}</div>}
                </div>
                {s.delta && <div className="step-row-delta">{s.delta}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="result-card">
          <div className="result-card-title">Per-Volume Summary</div>
          <table className="breakdown-table">
            <thead>
              <tr><th>Metric</th><th>Per Volume</th><th>Total ({volCount} vols)</th></tr>
            </thead>
            <tbody>
              <tr><td>Allocated</td><td>{fmt(perVolTotal)}</td><td>{fmt(perVolTotal * volCount)}</td></tr>
              <tr><td>Snapshot Reserve</td><td className="dim">{fmt(perVolSnap)}</td><td className="dim">{fmt(perVolSnap * volCount)}</td></tr>
              <tr><td>Active Data Space</td><td>{fmt(perVolData)}</td><td>{fmt(perVolData * volCount)}</td></tr>
              <tr><td>Logical (after efficiency)</td><td className="accent-val">{fmt(perVolData * ratio)}</td><td className="accent-val">{fmt(totalLogical)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────

const TAB_CONTENT = {
  aggregate: <AggregateCalcTab />,
  parity:    <ParityCalcTab />,
  usable:    <UsableCalcTab />,
}

export default function Tools() {
  const [active, setActive] = useState('aggregate')

  return (
    <main className="main-content">
      <SEO
        title="NetApp Storage Calculators | Aggregate, RAID Parity & Usable Capacity | NetApp Hub"
        description="Interactive NetApp ONTAP storage calculators — aggregate usable capacity, RAID-DP/TEC parity overhead, and usable capacity planning with dedup and snapshot reserve."
        keywords="NetApp Calculator, ONTAP Aggregate, RAID-DP, Usable Capacity, Storage Planning"
        canonical="/tools"
        ogTitle="NetApp Storage Calculators"
        ogDescription="Aggregate, RAID parity, and usable capacity calculators for NetApp ONTAP."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: ACCENT, background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)' }}>Tools</div>
        <h1 className="page-title">Tools &amp; Calculators</h1>
        <p className="page-subtitle">
          Interactive capacity planning for NetApp ONTAP. Select a disk model, adjust sliders, and get live results — aggregate usable, RAID parity overhead, and volume capacity breakdown.
        </p>
      </header>

      <SubNav tabs={TABS} active={active} onChange={setActive} accent={ACCENT} />

      {TAB_CONTENT[active]}
    </main>
  )
}
