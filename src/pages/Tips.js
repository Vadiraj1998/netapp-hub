import CopyBlock from '../components/CopyBlock'
import SEO from '../components/SEO'

function TipCard({ type, label, title, children }) {
  return (
    <div className={`tip-card tip-${type}`}>
      <div className="tip-label">{label}</div>
      <div className="tip-title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="tip-body">{children}</div>
    </div>
  )
}

export default function Tips() {
  return (
    <main className="main-content">
      <SEO
        title="NetApp Tips & Best Practices | Storage & Automation | NetApp Hub"
        description="Best practices, tips, and troubleshooting guides for NetApp storage and automation workflows."
        keywords="NetApp Tips, Storage Best Practices, ONTAP Troubleshooting, Automation Tips"
        canonical="/tips"
        ogTitle="NetApp Tips & Best Practices"
        ogDescription="Helpful tips for NetApp storage and automation."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: 'var(--accent-cmd)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.25)' }}>Tips</div>
        <h1 className="page-title">Tips & Tricks</h1>
        <p className="page-subtitle">Field-tested practices, common gotchas, and expert shortcuts from real NetApp automation work.</p>
      </header>

      {/* 01 CLI Tips */}
      <section className="content-section">
        <h2 className="section-title" id="ontap-cli-tips">
          <span className="section-num" style={{ color: 'var(--accent-cmd)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}>01</span> ONTAP CLI Tips
        </h2>
        <div className="tips-grid">
          <TipCard type="warn" label="CLI Tip" title="Use <code>-fields *</code> to discover available fields">
            Not sure what fields a command supports? Run <code>volume show -fields ?</code> to see all available field names for that object. Then narrow your query with only the fields you need.
          </TipCard>
          <TipCard type="info" label="Efficiency" title="Use <code>set -privilege advanced</code> to unlock more commands">
            Many diagnostic and low-level commands are hidden at the default privilege level. Use <code>set -privilege advanced</code> to access them. Remember to return to <code>set -privilege admin</code> when done to avoid accidental destructive changes.
          </TipCard>
          <TipCard type="good" label="Shortcut" title="Tab completion and <code>?</code> work everywhere in ONTAP CLI">
            Press Tab to auto-complete command names, flags, and even values like volume names or vserver names. Append <code>?</code> to any partial command to see available options. This alone saves significant time during operations.
          </TipCard>
          <TipCard type="danger" label="Danger" title="Test destructive operations in ONTAP Simulator first">
            Before running scripts that delete snapshots, move volumes, or break SnapMirror relationships in production, test them in ONTAP Select or the ONTAP Simulator. Many operations are irreversible or require lengthy recovery if run incorrectly.
          </TipCard>
          <TipCard type="good" label="Filtering" title="Master wildcard patterns with <code>*</code>, <code>?</code>, and <code>!</code>">
            <code>*</code> matches any characters. <code>?</code> matches single character. <code>!</code> negates (e.g., <code>!root*</code> excludes root). Combine: <code>vserver show -vserver !*root*</code> lists all non-root vservers.
          </TipCard>
        </div>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--text-bright)', marginBottom: 16 }}>Advanced Filtering Examples</h3>
          <CopyBlock lang="bash · ONTAP CLI filtering patterns">{`# List all non-root vservers
vserver show -vserver !*root*

# Show volumes larger than 10GB
volume show -size >10GB

# Show volumes between 5GB and 100GB
volume show -size >=5GB -size <=100GB

# List volumes matching pattern
volume show -vserver * -volume vol_prod_*

# Show only online volumes
volume show -state online

# Show all aggregates NOT containing "ssd"
storage aggregate show -aggregate !*ssd*

# Show SnapMirror relationships in idle state
snapmirror show -status idle

# Count volumes by vserver
volume show -fields vserver,volume,size -vserver *`}</CopyBlock>
        </div>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--text-bright)', marginBottom: 16 }}>Combining Multiple Filters</h3>
          <CopyBlock lang="bash · Complex filter chains">{`# Find all data vservers with prod volumes larger than 50GB
volume show -vserver *data* -volume *prod* -size >50GB -state online

# List all SnapMirror destinations that are NOT idle
snapmirror show -type DP -status !idle

# Show non-root vservers NOT in running state
vserver show -vserver !*root* -state !running

# Find volumes on SSD aggregates larger than 100GB
volume show -size >100GB -aggregate *ssd*

# Show failed or initializing SnapMirror relationships
snapmirror show -status !healthy,!idle`}</CopyBlock>
        </div>
      </section>

      {/* 02 REST API Tips */}
      <section className="content-section">
        <h2 className="section-title" id="rest-api-tips">
          <span className="section-num" style={{ color: 'var(--accent-tips)', background: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.2)' }}>02</span> REST API Tips
        </h2>
        <div className="tips-grid">
          <TipCard type="good" label="Best Practice" title="Always use <code>-fields</code> to filter API responses">
            ONTAP REST API returns all fields by default, which can be massive. Specifying <code>?fields=name,size,state</code> dramatically reduces payload size and response time.
          </TipCard>
          <TipCard type="warn" label="Heads Up" title="Handle pagination — default limit is 1000 records">
            The ONTAP REST API caps records per response. Check for <code>_links.next.href</code> in the response body and loop until it's absent. Miss this and you silently get incomplete data in large clusters.
          </TipCard>
          <TipCard type="warn" label="Important" title="Poll async jobs — don't assume POST = done">
            Many ONTAP REST operations (volume create, move, SnapMirror) return a job object instead of waiting. Always check for <code>job.uuid</code> in the response and poll <code>/api/cluster/jobs/{'{uuid}'}</code> until <code>state == "success"</code>.
          </TipCard>
          <TipCard type="danger" label="Security" title="Never hardcode credentials in scripts">
            Use environment variables (<code>os.getenv()</code> in Python, <code>$env:VAR</code> in PowerShell) or a secrets manager. Credentials committed to Git are a significant security incident waiting to happen.
          </TipCard>
          <TipCard type="info" label="Migration" title="Migrate from ZAPI to REST — ZAPI is deprecated">
            NetApp has deprecated ZAPI. All new automation should use the ONTAP REST API. ONTAP 9.12.1+ restricts ZAPI in some contexts. Use the ONTAP API Explorer (<code>https://&lt;cluster&gt;/docs/api</code>) to explore endpoints.
          </TipCard>
        </div>
      </section>

      {/* 03 Python Tips */}
      <section className="content-section">
        <h2 className="section-title" id="python-specific-tips">
          <span className="section-num" style={{ color: 'var(--accent-py)', background: 'rgba(61,200,160,0.08)', borderColor: 'rgba(61,200,160,0.2)' }}>03</span> Python-Specific Tips
        </h2>
        <div className="tips-grid">
          <TipCard type="good" label="Pattern" title="Use <code>get_collection(fields=...)</code> not <code>get_all()</code>">
            <code>Volume.get_collection(fields="name,size")</code> is lazy — it pages automatically. Avoid <code>list(Volume.get_collection())</code> without filters on large clusters as it fetches everything into memory.
          </TipCard>
          <TipCard type="good" label="Pattern" title="Use <code>hydrate=True</code> after POST to get UUID back">
            When calling <code>.post(hydrate=True)</code>, the library automatically fetches the created resource back so you have access to server-assigned fields like <code>uuid</code> and <code>create_time</code> immediately after creation.
          </TipCard>
          <TipCard type="warn" label="Gotcha" title="Size values are in bytes, not GB">
            All size fields in the ONTAP REST API and <code>netapp-ontap</code> library use bytes. Always convert: <code>10 * 1024 ** 3</code> for 10 GB. Forgetting this will create a 10-byte volume.
          </TipCard>
          <TipCard type="info" label="Tip" title="Use the ONTAP API Explorer for discovery">
            Browse to <code>https://&lt;your-cluster&gt;/docs/api</code> for an interactive Swagger UI of all available REST endpoints. You can try requests live and see the exact JSON structures before coding.
          </TipCard>
        </div>
      </section>

      {/* 04 PowerShell Tips */}
      <section className="content-section">
        <h2 className="section-title" id="powershell-specific-tips">
          <span className="section-num" style={{ color: 'var(--accent-ps)', background: 'rgba(123,97,255,0.08)', borderColor: 'rgba(123,97,255,0.2)' }}>04</span> PowerShell-Specific Tips
        </h2>
        <div className="tips-grid">
          <TipCard type="ps" label="PSTK" title="Use <code>-Query</code> to filter server-side, not client-side">
            Instead of <code>Get-NcVol | Where-Object {'{'} $_.State -eq 'online' {'}'}</code>, use <code>Get-NcVol -Query @{'{'} State="online" {'}'}</code>. The latter filters on the cluster, reducing data transfer significantly.
          </TipCard>
          <TipCard type="ps" label="PSTK" title="Store the controller object for multi-cluster scripts">
            <code>$ctrl = Connect-NcController ...</code> then pass <code>-Controller $ctrl</code> to every cmdlet. This lets you manage multiple clusters in the same script without accidentally running commands on the wrong cluster.
          </TipCard>
          <TipCard type="good" label="Reporting" title="Pipe to <code>Export-Csv</code> for instant reports">
            <code>Get-NcVol | Select Name,TotalSize,Used | Export-Csv report.csv -NoTypeInformation</code> is a fast way to produce capacity reports. Combine with <code>ConvertTo-Html</code> for email-ready HTML reports.
          </TipCard>
        </div>
      </section>

      {/* 05 Quick Checklist */}
      <section className="content-section">
        <h2 className="section-title" id="quick-environment-checklist">
          <span className="section-num">05</span> Quick Environment Checklist
        </h2>
        <CopyBlock lang="bash · pre-flight checklist">{`# Verify ONTAP REST API is reachable
curl -sk -u admin:password https://<cluster>/api/cluster | python3 -m json.tool

# Check ONTAP version (must be 9.6+ for REST)
curl -sk -u admin:password https://<cluster>/api/cluster?fields=version

# Verify Python library version
python3 -c "import netapp_ontap; print(netapp_ontap.__version__)"

# Verify PSTK version
(Get-Module NetApp.ONTAP).Version

# Check API Explorer (open in browser)
echo "Open: https://<cluster>/docs/api"`}</CopyBlock>
      </section>
    </main>
  )
}