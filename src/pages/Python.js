import CopyBlock from '../components/CopyBlock'
import SEO from '../components/SEO'

function SNum({ num }) {
  return (
    <span className="section-num" style={{ color: 'var(--accent-py)', background: 'rgba(61,200,160,0.08)', borderColor: 'rgba(61,200,160,0.2)' }}>
      {num}
    </span>
  )
}

export default function Python() {
  return (
    <main className="main-content">
      <SEO
        title="NetApp Python Automation Scripts | ONTAP APIs & DevOps | NetApp Hub"
        description="Python automation scripts for NetApp ONTAP APIs, storage monitoring, and DevOps pipelines."
        keywords="NetApp Python, ONTAP API, Automation Scripts, DevOps, Storage Monitoring"
        canonical="/python"
        ogTitle="NetApp Python Automation Scripts"
        ogDescription="Python scripts for NetApp ONTAP automation and APIs."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: 'var(--accent-py)', background: 'rgba(61,200,160,0.08)', borderColor: 'rgba(61,200,160,0.25)' }}>Python</div>
        <h1 className="page-title">Python Automation</h1>
        <p className="page-subtitle">Complete Python examples using the netapp-ontap library. REST API patterns and production-ready scripts.</p>
      </header>

      {/* 01 Installation */}
      <section className="content-section">
        <h2 className="section-title" id="installation-setup"><SNum num="01" /> Installation & Setup</h2>
        <div className="prose">
          <p>Install the official NetApp ONTAP Python client library and dependencies. Requires Python 3.8+.</p>
        </div>
        <CopyBlock lang="bash" langColor="var(--accent-py)">{`# Install NetApp ONTAP Python client
pip install netapp-ontap

# Also useful
pip install requests urllib3 pandas`}</CopyBlock>
      </section>

      {/* 02 Connect */}
      <section className="content-section">
        <h2 className="section-title" id="connect-to-ontap"><SNum num="02" /> Connect to ONTAP</h2>
        <div className="prose">
          <p>Establish a connection to the ONTAP cluster using the <code style={{ color: 'var(--accent-py)' }}>HostConnection</code> context manager. Always use environment variables or a secrets manager for credentials — never hardcode them.</p>
        </div>
        <CopyBlock lang="python" langColor="var(--accent-py)">{`import os
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import Volume

cluster_ip = os.getenv("ONTAP_HOST")
username   = os.getenv("ONTAP_USER", "admin")
password   = os.getenv("ONTAP_PASS")

with HostConnection(
    cluster_ip,
    username=username,
    password=password,
    verify=False  # use True with valid cert in prod
):
    # All API calls inside this block use this connection
    for vol in Volume.get_collection():
        print(vol.name)`}</CopyBlock>
      </section>

      {/* 03 Volume Operations */}
      <section className="content-section">
        <h2 className="section-title" id="volume-operations"><SNum num="03" /> Volume Operations</h2>
        <div className="prose">
          <p>List volumes, create a new FlexVol, and modify volume properties. All size values are in bytes.</p>
        </div>
        <CopyBlock lang="python · List Volumes" langColor="var(--accent-py)">{`from netapp_ontap.resources import Volume

for vol in Volume.get_collection(
    fields="name,svm,size,state,space"
):
    print(
        f"Name: {vol.name}",
        f"SVM: {vol.svm.name}",
        f"Size: {vol.size // (1024**3)} GB",
        f"State: {vol.state}"
    )`}</CopyBlock>
        <CopyBlock lang="python · Create Volume" langColor="var(--accent-py)">{`from netapp_ontap.resources import Volume
from netapp_ontap import NetAppRestError

vol = Volume.from_dict({
    "name": "my_new_vol",
    "svm": {"name": "svm0"},
    "aggregates": [{"name": "aggr1"}],
    "size": 10 * 1024 ** 3,  # 10 GB in bytes
    "space.snapshot.reserve_percent": 5,
    "nas": {"path": "/my_new_vol"},
})

try:
    vol.post(hydrate=True)
    print(f"Volume created: {vol.name} (UUID: {vol.uuid})")
except NetAppRestError as err:
    print(f"Error: {err}")`}</CopyBlock>
      </section>

      {/* 04 Snapshot */}
      <section className="content-section">
        <h2 className="section-title" id="snapshot-management"><SNum num="04" /> Snapshot Management</h2>
        <CopyBlock lang="python · Create & List Snapshots" langColor="var(--accent-py)">{`from netapp_ontap.resources import Snapshot

vol_uuid = "your-volume-uuid-here"

# Create a snapshot
snap = Snapshot(vol_uuid)
snap.name = "my_snap_20240801"
snap.post(hydrate=True)
print(f"Snapshot created: {snap.name}")

# List all snapshots for a volume
for snap in Snapshot.get_collection(vol_uuid):
    print(f"  {snap.name} created: {snap.create_time}")

# Delete oldest snapshot
old_snap = Snapshot(vol_uuid, name="old_snap_20240101")
old_snap.delete()`}</CopyBlock>
      </section>

      {/* 05 Direct REST */}
      <section className="content-section">
        <h2 className="section-title" id="direct-rest-api"><SNum num="05" /> Direct REST API with requests</h2>
        <div className="prose">
          <p>Sometimes you want raw HTTP control — useful for endpoints not yet wrapped by the SDK, or for quick scripting.</p>
        </div>
        <CopyBlock lang="python" langColor="var(--accent-py)">{`import requests
import urllib3
urllib3.disable_warnings()

BASE  = "https://192.168.1.100/api"
AUTH  = ("admin", "password")
HDRS  = {"Content-Type": "application/json"}

# List SVMs
r = requests.get(
    f"{BASE}/svm/svms",
    auth=AUTH, headers=HDRS, verify=False,
    params={"fields": "name,state,uuid"}
)
r.raise_for_status()

for svm in r.json()["records"]:
    print(f"SVM: {svm['name']} — {svm['state']}")

# Handle pagination
next_link = r.json().get("_links", {}).get("next", {}).get("href")
while next_link:
    r = requests.get(
        f"https://192.168.1.100{next_link}",
        auth=AUTH, headers=HDRS, verify=False
    )
    next_link = r.json().get("_links", {}).get("next", {}).get("href")`}</CopyBlock>
      </section>

      {/* 06 Aggregate Report */}
      <section className="content-section">
        <h2 className="section-title" id="aggregate-capacity-report"><SNum num="06" /> Aggregate Capacity Report</h2>
        <CopyBlock lang="python" langColor="var(--accent-py)">{`from netapp_ontap.resources import Aggregate

print(f"{'Aggregate':<25} {'Total GB':>10} {'Used GB':>10} {'Used %':>8}")
print("-" * 55)

for aggr in Aggregate.get_collection(
    fields="name,space"
):
    space    = aggr.space.block_storage
    total_gb = space.size / 1024**3
    used_gb  = space.used / 1024**3
    pct      = (space.used / space.size) * 100
    print(f"{aggr.name:<25} {total_gb:>10.1f} {used_gb:>10.1f} {pct:>7.1f}%")`}</CopyBlock>
      </section>
    </main>
  )
}