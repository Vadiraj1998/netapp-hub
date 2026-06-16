import { useState } from 'react'
import CopyBlock from '../components/CopyBlock'
import SubNav from '../components/SubNav'
import SEO from '../components/SEO'

const ACCENT = 'var(--accent-py)'
const TABS = [
  { id: 'setup',      label: 'Setup' },
  { id: 'volumes',    label: 'Volumes' },
  { id: 'snapshots',  label: 'Snapshots' },
  { id: 'svm',        label: 'SVM' },
  { id: 'snapmirror', label: 'SnapMirror' },
  { id: 'rest',       label: 'REST API' },
  { id: 'advanced',   label: 'Advanced' },
  { id: 'usecases',   label: 'Use Cases' },
]

function SNum({ num }) {
  return (
    <span className="section-num" style={{ color: ACCENT, background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
      {num}
    </span>
  )
}

function SetupTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Installation</h2>
        <div className="prose">
          <p>Install the official NetApp ONTAP Python client library. Requires Python 3.8+.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`pip install netapp-ontap requests urllib3 pandas`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Collecting netapp-ontap
  Downloading netapp_ontap-9.13.1.0-py3-none-any.whl (3.2 MB)
Collecting requests
  Downloading requests-2.31.0-py3-none-any.whl (62 kB)
Collecting urllib3
  Downloading urllib3-2.1.0-py3-none-any.whl (104 kB)
Collecting pandas
  Downloading pandas-2.1.4-cp311-cp311-win_amd64.whl (10.8 MB)
Successfully installed netapp-ontap-9.13.1.0 requests-2.31.0 urllib3-2.1.0 pandas-2.1.4`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Connect to ONTAP</h2>
        <div className="prose">
          <p>Use <code style={{ color: ACCENT }}>HostConnection</code> as a context manager. Always pull credentials from environment variables — never hardcode them.</p>
          <p>The <code style={{ color: ACCENT }}>HostConnection</code> context manager handles authentication, sets a thread-local default connection, and tears it down cleanly when the block exits. Setting <code style={{ color: ACCENT }}>verify=False</code> disables SSL certificate verification — acceptable in lab environments, but in production you should supply a CA bundle or set <code style={{ color: ACCENT }}>verify="/path/to/ca-bundle.crt"</code> to prevent man-in-the-middle attacks.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import Volume

cluster_ip = os.getenv("ONTAP_HOST")
username   = os.getenv("ONTAP_USER", "admin")
password   = os.getenv("ONTAP_PASS")

with HostConnection(
    cluster_ip,
    username=username,
    password=password,
    verify=False  # set True with a valid cert in production
):
    for vol in Volume.get_collection():
        print(vol.name)`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`vol_root
vol_data_01
vol_log_01
vol_app_02
vol_snapmirror_dst`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Cluster Info</h2>
        <div className="prose">
          <p>Retrieve top-level cluster metadata — name, ONTAP version string, physical location, and admin contact — in a single REST call. This is a useful connectivity smoke-test at the start of any automation script: if the call succeeds you know credentials are valid and the management LIF is reachable. The <code style={{ color: ACCENT }}>fields</code> parameter limits what ONTAP serialises in the response, reducing payload size.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Cluster

cluster = Cluster()
cluster.get(fields="name,version,location,contact")

print(f"Cluster : {cluster.name}")
print(f"ONTAP   : {cluster.version.full}")
print(f"Location: {cluster.location}")
print(f"Contact : {cluster.contact}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Cluster : cluster01
ONTAP   : NetApp Release 9.13.1: Fri Oct 20 12:30:00 UTC 2023
Location: US-East-DC1 Row-3 Rack-7
Contact : storage-team@example.com`}</CopyBlock>
      </section>
    </>
  )
}

function VolumesTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> List Volumes</h2>
        <div className="prose">
          <p>Retrieve a summary of every volume on the cluster, including its owning SVM, provisioned size, space utilisation, and operational state. Requesting only the fields you need via the <code style={{ color: ACCENT }}>fields</code> parameter keeps the REST response compact and speeds up iteration on large clusters. The computed <code style={{ color: ACCENT }}>used_pct</code> gives at-a-glance capacity health per volume without a separate API call.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume

for vol in Volume.get_collection(
    fields="name,svm,size,state,space,type"
):
    used_pct = (vol.space.used / vol.size * 100) if vol.size else 0
    print(
        f"{vol.name:<30} {vol.svm.name:<15} "
        f"{vol.size // 1024**3:>6} GB  "
        f"{used_pct:>5.1f}% used  {vol.state}"
    )`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`vol_root                       svm0              1 GB    12.3% used  online
vol_data_01                    svm_prod_01     100 GB    67.4% used  online
vol_log_01                     svm_prod_01      50 GB    45.1% used  online
vol_app_02                     svm_prod_01     200 GB    83.9% used  online
vol_snapmirror_dst             svm_dr           100 GB     0.0% used  online`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create FlexVol</h2>
        <div className="prose">
          <p>Provision a new NFS-accessible FlexVol with thin provisioning and a 5 % snapshot reserve. Using <code style={{ color: ACCENT }}>guarantee: none</code> means ONTAP does not pre-allocate physical blocks, so you can over-provision relative to aggregate capacity — common in virtualised or containerised environments. Always handle <code style={{ color: ACCENT }}>NetAppRestError</code> to surface ONTAP-level validation failures (duplicate name, aggregate full, etc.) rather than letting the script crash silently.</p>
        </div>
        <ol className="step-list">
          <li>Build a volume descriptor dict with name, SVM, target aggregate, size in bytes, snapshot reserve percentage, NFS junction path, and guarantee type.</li>
          <li>Call <code style={{ color: ACCENT }}>Volume.from_dict()</code> to construct a resource object without hitting the API yet.</li>
          <li>Call <code style={{ color: ACCENT }}>vol.post(hydrate=True)</code> to create the volume; <code style={{ color: ACCENT }}>hydrate=True</code> instructs the SDK to populate the object with all fields returned by ONTAP (including the generated UUID).</li>
          <li>Print the volume name and UUID on success, or catch and display any ONTAP error.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume
from netapp_ontap import NetAppRestError

vol = Volume.from_dict({
    "name": "vol_data_01",
    "svm": {"name": "svm0"},
    "aggregates": [{"name": "aggr1"}],
    "size": 100 * 1024 ** 3,          # 100 GB in bytes
    "space.snapshot.reserve_percent": 5,
    "nas": {"path": "/vol_data_01"},
    "guarantee": {"type": "none"},     # thin provision
})

try:
    vol.post(hydrate=True)
    print(f"Created: {vol.name}  UUID: {vol.uuid}")
except NetAppRestError as err:
    print(f"Error: {err}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Created: vol_data_01  UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Resize Volume</h2>
        <div className="prose">
          <p>Grow (or shrink) an existing volume by locating it with <code style={{ color: ACCENT }}>Volume.find()</code> and updating its <code style={{ color: ACCENT }}>size</code> attribute before calling <code style={{ color: ACCENT }}>patch()</code>. ONTAP enforces that the new size must be at least equal to the amount of data currently written; shrinking below used space returns an error. This is a non-disruptive online operation — no downtime or remount required on the client side.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume

vol = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})
vol.size = 200 * 1024 ** 3   # 200 GB
vol.patch()
print(f"Resized {vol.name} to 200 GB")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Resized vol_data_01 to 200 GB`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Modify Volume Properties</h2>
        <div className="prose">
          <p>Enable storage efficiency features — deduplication and compression — on an existing online volume. These are post-creation settings that do not require the volume to be taken offline. Deduplication eliminates duplicate data blocks, while compression reduces individual block sizes; together they can reclaim significant capacity on workloads with repetitive data such as VDI images or database temp files. Cross-volume deduplication is disabled here as it carries additional CPU overhead and is only beneficial when multiple volumes share a common dataset.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume

vol = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})

# Enable deduplication and compression
vol.efficiency = {
    "dedupe": True,
    "compression": True,
    "cross_volume_dedupe": False,
}
vol.patch()
print(f"Efficiency settings updated on {vol.name}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Efficiency settings updated on vol_data_01`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="05" /> Delete Volume</h2>
        <div className="prose">
          <p>Safely remove a volume from ONTAP. A volume with an active NFS or CIFS junction path cannot be deleted directly — ONTAP will reject the request. This script unmounts the volume first by setting the junction path to an empty string, then issues the delete. Always confirm the volume name and SVM before running this in production; the operation is irreversible once the volume is purged from the aggregate.</p>
        </div>
        <ol className="step-list">
          <li>Locate the volume by name and SVM using <code style={{ color: ACCENT }}>Volume.find()</code>.</li>
          <li>Check whether the volume has an active junction path via the <code style={{ color: ACCENT }}>nas</code> attribute.</li>
          <li>If a junction path exists, clear it by setting <code style={{ color: ACCENT }}>nas.path</code> to an empty string and calling <code style={{ color: ACCENT }}>patch()</code> to unmount.</li>
          <li>Call <code style={{ color: ACCENT }}>vol.delete()</code> to remove the volume from ONTAP.</li>
          <li>Catch <code style={{ color: ACCENT }}>NetAppRestError</code> and print the reason on failure.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume
from netapp_ontap import NetAppRestError

vol = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})

try:
    # Unmount first if it has a junction path
    if hasattr(vol, 'nas') and vol.nas.path:
        vol.nas = {"path": ""}
        vol.patch()

    vol.delete()
    print(f"Deleted: {vol.name}")
except NetAppRestError as err:
    print(f"Delete failed: {err}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Deleted: vol_data_01`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="06" /> Aggregate Capacity Report</h2>
        <div className="prose">
          <p>Produce a capacity summary for every aggregate on the cluster, flagging those above 80 % utilisation. Aggregates are the physical storage pools from which volumes are carved; if an aggregate fills up, volume creation and growth operations against it will fail. Running this report regularly — or scheduling it with a cron job — gives advance warning before capacity limits cause outages. The <code style={{ color: ACCENT }}>!</code> flag in the output makes at-risk aggregates immediately visible in terminal output or log files.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Aggregate

print(f"{'Aggregate':<25} {'Total GB':>10} {'Used GB':>10} {'Used %':>8}")
print("-" * 57)

for aggr in Aggregate.get_collection(fields="name,space,node"):
    s        = aggr.space.block_storage
    total_gb = s.size / 1024 ** 3
    used_gb  = s.used / 1024 ** 3
    pct      = (s.used / s.size * 100) if s.size else 0
    flag     = " !" if pct > 80 else ""
    print(f"{aggr.name:<25} {total_gb:>10.1f} {used_gb:>10.1f} {pct:>7.1f}%{flag}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Aggregate                   Total GB    Used GB    Used %
---------------------------------------------------------
aggr0_node01                    800.0      210.3    26.3%
aggr1                          4096.0     1843.2    45.0%
aggr2_ssd                      2048.0     1740.8    85.0% !
aggr_dr_node02                 4096.0      614.4    15.0%`}</CopyBlock>
      </section>
    </>
  )
}

function SnapshotsTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Create Snapshot</h2>
        <div className="prose">
          <p>Create a point-in-time, read-only snapshot of a volume. Snapshots on ONTAP are instantaneous and space-efficient — they consume capacity only for blocks that change after the snapshot is taken. They are the foundation of NetApp data protection: used directly for quick file recovery, as source points for SnapMirror replication, and as the baseline for SnapVault archive transfers. The comment field is optional but recommended; it helps operators identify the purpose of the snapshot during recovery.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Snapshot, Volume

vol = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})

snap = Snapshot(vol.uuid)
snap.name    = "snap_20240901_daily"
snap.comment = "Daily automated snapshot"
snap.post(hydrate=True)
print(f"Snapshot created: {snap.name}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Snapshot created: snap_20240901_daily`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> List Snapshots</h2>
        <div className="prose">
          <p>Enumerate all snapshots on a volume along with their creation timestamp and delta size. The size field reflects how much additional space the snapshot is consuming relative to the volume's current data — not the full volume size. A snapshot with a very large size indicates that a significant amount of data has changed since it was taken. This list is essential for capacity planning and for identifying snapshots that are safe to delete.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Snapshot, Volume

vol = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})

print(f"Snapshots on {vol.name}:")
for snap in Snapshot.get_collection(
    vol.uuid,
    fields="name,create_time,size,comment"
):
    size_mb = (snap.size or 0) / 1024 ** 2
    print(f"  {snap.name:<35} {snap.create_time}  {size_mb:.1f} MB")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Snapshots on vol_data_01:
  snap_20240901_daily                 2024-09-01T02:00:05+00:00  143.2 MB
  snap_20240902_daily                 2024-09-02T02:00:07+00:00   98.7 MB
  snap_20240903_daily                 2024-09-03T02:00:04+00:00  211.5 MB
  snap_20240903_hourly.2024-09-03_08  2024-09-03T08:00:03+00:00   12.1 MB
  snap_20240903_hourly.2024-09-03_12  2024-09-03T12:00:02+00:00   18.4 MB`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Delete Old Snapshots</h2>
        <div className="prose">
          <p>Automate the cleanup of snapshots older than a rolling 30-day window. Over time, accumulated snapshots consume snapshot reserve space; when the reserve fills up, ONTAP begins consuming user data space instead, which can trigger capacity alerts. Running this script nightly keeps the snapshot footprint predictable. Note that snapshots locked by a SnapMirror or SnapVault relationship cannot be deleted and ONTAP will return an error — add error handling if your volumes are protected by replication.</p>
        </div>
        <ol className="step-list">
          <li>Locate the target volume by name and SVM.</li>
          <li>Calculate a cutoff timestamp: <code style={{ color: ACCENT }}>now(UTC) - 30 days</code>.</li>
          <li>Iterate all snapshots on the volume, requesting only <code style={{ color: ACCENT }}>name</code> and <code style={{ color: ACCENT }}>create_time</code> to minimise response size.</li>
          <li>Compare each snapshot's <code style={{ color: ACCENT }}>create_time</code> against the cutoff; call <code style={{ color: ACCENT }}>snap.delete()</code> for those that are older.</li>
          <li>Print a running count of deleted snapshots and a final summary.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from datetime import datetime, timezone, timedelta
from netapp_ontap.resources import Snapshot, Volume

vol     = Volume.find(name="vol_data_01", **{"svm.name": "svm0"})
cutoff  = datetime.now(timezone.utc) - timedelta(days=30)
deleted = 0

for snap in Snapshot.get_collection(vol.uuid, fields="name,create_time"):
    if snap.create_time < cutoff:
        snap.delete()
        deleted += 1
        print(f"Deleted: {snap.name}")

print(f"Total deleted: {deleted}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Deleted: snap_20240801_daily
Deleted: snap_20240802_daily
Deleted: snap_20240803_daily
Deleted: snap_20240810_weekly
Deleted: snap_20240817_weekly
Total deleted: 5`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Snapshot Policy</h2>
        <div className="prose">
          <p>List all snapshot policies defined on the cluster, showing each policy's enabled state and the schedule/retention pairs it contains. Snapshot policies are cluster-level objects that can be assigned to multiple volumes; modifying a policy affects every volume using it. Review policies before changing them to avoid accidentally removing the retention protection on critical volumes. The <code style={{ color: ACCENT }}>copies</code> list maps each schedule name (e.g. <code style={{ color: ACCENT }}>hourly</code>, <code style={{ color: ACCENT }}>daily</code>) to a retention count.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import SnapshotPolicy

# List all snapshot policies
for policy in SnapshotPolicy.get_collection(fields="name,enabled,copies"):
    print(f"Policy: {policy.name}  Enabled: {policy.enabled}")
    for copy in (policy.copies or []):
        print(f"  Schedule: {copy.schedule.name}  Keep: {copy.count}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Policy: default  Enabled: True
  Schedule: hourly   Keep: 6
  Schedule: daily    Keep: 2
  Schedule: weekly   Keep: 2
Policy: none  Enabled: True
Policy: snap_30day_policy  Enabled: True
  Schedule: daily    Keep: 30
  Schedule: weekly   Keep: 8`}</CopyBlock>
      </section>
    </>
  )
}

function SvmTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> List SVMs</h2>
        <div className="prose">
          <p>List all Storage Virtual Machines (SVMs) on the cluster with their operational state and protocol subtype. SVMs are the primary multi-tenancy boundary in ONTAP — each SVM has its own namespace, network interfaces, and protocol configuration. The <code style={{ color: ACCENT }}>subtype</code> field distinguishes data SVMs (<code style={{ color: ACCENT }}>default</code>) from the admin SVM (<code style={{ color: ACCENT }}>admin</code>) and disaster recovery SVMs (<code style={{ color: ACCENT }}>dp-destination</code>). Use this listing to verify which SVMs are online before provisioning volumes or LIFs against them.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Svm

for svm in Svm.get_collection(
    fields="name,state,subtype,ip_interfaces,dns"
):
    print(f"SVM: {svm.name:<20} State: {svm.state:<10} Type: {svm.subtype}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`SVM: cluster01             State: online      Type: admin
SVM: svm0                  State: online      Type: default
SVM: svm_prod_01           State: online      Type: default
SVM: svm_dr                State: online      Type: dp-destination`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create SVM</h2>
        <div className="prose">
          <p>Provision a new data SVM with NFS enabled, CIFS and iSCSI explicitly disabled, and DNS pre-configured. Creating SVMs programmatically is common in automated tenant-onboarding pipelines where each application team or project gets an isolated storage namespace. The <code style={{ color: ACCENT }}>ipspace</code> determines which network routing domain the SVM belongs to; use a non-default IPspace only if your environment has dedicated network segments. DNS configuration is required for Kerberos and Active Directory integration but can be omitted for simple NFS-only SVMs.</p>
        </div>
        <ol className="step-list">
          <li>Build the SVM descriptor dict, specifying name, IPspace, language locale, protocol flags, and DNS settings.</li>
          <li>Call <code style={{ color: ACCENT }}>Svm.from_dict()</code> to create a resource object.</li>
          <li>Call <code style={{ color: ACCENT }}>svm.post(hydrate=True)</code> to create the SVM; ONTAP assigns a UUID.</li>
          <li>Print the SVM name and UUID on success, or surface the <code style={{ color: ACCENT }}>NetAppRestError</code> message on failure.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Svm
from netapp_ontap import NetAppRestError

svm = Svm.from_dict({
    "name": "svm_prod_01",
    "ipspace": {"name": "Default"},
    "subtype": "default",
    "language": "en_us.utf_8",
    "protocols": {
        "nfs": {"enabled": True},
        "cifs": {"enabled": False},
        "iscsi": {"enabled": False},
    },
    "dns": {
        "domains": ["corp.example.com"],
        "servers": ["192.168.1.10", "192.168.1.11"],
    },
})

try:
    svm.post(hydrate=True)
    print(f"SVM created: {svm.name}  UUID: {svm.uuid}")
except NetAppRestError as err:
    print(f"Error: {err}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`SVM created: svm_prod_01  UUID: b2c3d4e5-f6a7-8901-bcde-f23456789012`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Configure NFS on SVM</h2>
        <div className="prose">
          <p>Enable the NFS service on an existing SVM and configure which NFS protocol versions to advertise. Enabling NFSv3 ensures compatibility with legacy clients, while NFSv4.0 and NFSv4.1 add stateful file locking and parallel NFS (pNFS) capabilities respectively. This configuration is separate from creating the SVM: the SVM must already exist before the NFS service object can be posted against it. Re-running this script on an SVM that already has NFS enabled will return an error; use <code style={{ color: ACCENT }}>patch()</code> instead of <code style={{ color: ACCENT }}>post()</code> to update an existing NFS service.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import NfsService

nfs = NfsService("svm_prod_01")
nfs.enabled   = True
nfs.protocol  = {"v3_enabled": True, "v40_enabled": True, "v41_enabled": True}
nfs.post(hydrate=True)
print("NFS service configured")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`NFS service configured`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Create IP Interface</h2>
        <div className="prose">
          <p>Create a data LIF (Logical Interface) on an SVM to provide a network endpoint for NFS or CIFS clients. A LIF is the IP address that clients mount; it can be migrated between physical ports for load balancing or high availability. The <code style={{ color: ACCENT }}>service_policy</code> determines which protocols the LIF serves — <code style={{ color: ACCENT }}>default-data-files</code> is appropriate for NFS and CIFS data traffic. The home node and broadcast domain are used by ONTAP to place the LIF on an appropriate physical port at creation time. Caveat: the broadcast domain must already exist in the cluster's network configuration.</p>
        </div>
        <ol className="step-list">
          <li>Build the LIF descriptor with name, parent SVM, IP address and netmask, home node, broadcast domain, service policy, and enabled state.</li>
          <li>Call <code style={{ color: ACCENT }}>IpInterface.from_dict()</code> to construct the resource object.</li>
          <li>Call <code style={{ color: ACCENT }}>lif.post(hydrate=True)</code> — ONTAP selects a physical port from the broadcast domain and brings the LIF online.</li>
          <li>Print the LIF name and assigned IP address for confirmation.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import IpInterface

lif = IpInterface.from_dict({
    "name": "lif_nfs_01",
    "svm": {"name": "svm_prod_01"},
    "ip": {
        "address": "192.168.10.50",
        "netmask": "255.255.255.0",
    },
    "location": {
        "broadcast_domain": {"name": "Default"},
        "home_node": {"name": "node01"},
    },
    "service_policy": {"name": "default-data-files"},
    "enabled": True,
})

lif.post(hydrate=True)
print(f"LIF created: {lif.name}  IP: {lif.ip.address}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`LIF created: lif_nfs_01  IP: 192.168.10.50`}</CopyBlock>
      </section>
    </>
  )
}

function SnapMirrorTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> List Relationships</h2>
        <div className="prose">
          <p>Display all SnapMirror relationships cluster-wide, including source and destination paths, replication state, current lag time, and health status. The lag time indicates how far behind the destination is relative to the source — a growing lag can signal network issues, resource contention, or a stuck transfer. The <code style={{ color: ACCENT }}>healthy</code> flag is ONTAP's own assessment: <code style={{ color: ACCENT }}>False</code> means the relationship needs attention even if the last transfer completed. Use this as the first step when investigating a potential data-loss scenario before a failover.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import SnapmirrorRelationship

for rel in SnapmirrorRelationship.get_collection(
    fields="source,destination,state,lag_time,healthy"
):
    lag = str(rel.lag_time) if rel.lag_time else "N/A"
    health = "OK" if rel.healthy else "WARN"
    print(
        f"{rel.source.path:<30} -> {rel.destination.path:<30} "
        f"State: {rel.state:<12} Lag: {lag:<15} [{health}]"
    )`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`svm_src:vol_data_01            -> svm_dst:vol_data_01_dr         State: snapmirrored  Lag: PT4H2M3S       [OK]
svm_src:vol_log_01             -> svm_dst:vol_log_01_dr          State: snapmirrored  Lag: PT4H1M55S      [OK]
svm_src:vol_app_02             -> svm_dst:vol_app_02_dr          State: broken-off    Lag: P1DT3H12M      [WARN]`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create Relationship</h2>
        <div className="prose">
          <p>Establish a new SnapMirror replication relationship between a source and destination volume, then trigger the initial baseline transfer. The destination volume must not already exist — ONTAP creates it as a data-protection (DP) volume automatically during initialisation. The policy <code style={{ color: ACCENT }}>MirrorAllSnapshots</code> replicates every snapshot that exists on the source, making it suitable for full DR coverage. The schedule controls how frequently incremental updates run after the baseline completes. Initialisation can take minutes to hours depending on the source data size.</p>
        </div>
        <ol className="step-list">
          <li>Build the relationship descriptor with source path, destination path, replication policy, and update schedule.</li>
          <li>Call <code style={{ color: ACCENT }}>SnapmirrorRelationship.from_dict()</code> to construct the object without triggering any API calls.</li>
          <li>Call <code style={{ color: ACCENT }}>rel.post(hydrate=True)</code> to create the relationship; ONTAP creates the DP destination volume.</li>
          <li>Call <code style={{ color: ACCENT }}>rel.initialize()</code> to start the baseline transfer — this is a long-running asynchronous operation.</li>
          <li>Catch and display any <code style={{ color: ACCENT }}>NetAppRestError</code> (e.g. destination SVM not peered, policy not found).</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import SnapmirrorRelationship
from netapp_ontap import NetAppRestError

rel = SnapmirrorRelationship.from_dict({
    "source":      {"path": "svm_src:vol_data_01"},
    "destination": {"path": "svm_dst:vol_data_01_dr"},
    "policy":      {"name": "MirrorAllSnapshots"},
    "schedule":    {"name": "hourly"},
})

try:
    rel.post(hydrate=True)
    print(f"Relationship created: {rel.uuid}")
    # Initialize (baseline transfer)
    rel.initialize()
    print("Baseline transfer initiated")
except NetAppRestError as err:
    print(f"Error: {err}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Relationship created: c3d4e5f6-a7b8-9012-cdef-345678901234
Baseline transfer initiated`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Update & Break/Resync</h2>
        <div className="prose">
          <p>Manually trigger an on-demand SnapMirror update, break a relationship for planned failover, or resync it after failback. An on-demand update is useful before a planned maintenance window to minimise data loss. Breaking the relationship makes the destination volume writable so applications can fail over to it; this is a deliberate, controlled action that should only be taken after confirming the source is truly unavailable or is being decommissioned. Resync reverses the relationship direction (source becomes destination) to replicate changes made on the formerly passive side back after a failback.</p>
        </div>
        <CopyBlock lang="python · Manual Update" langColor={ACCENT}>{`from netapp_ontap.resources import SnapmirrorRelationship

rel = SnapmirrorRelationship.find(
    **{"destination.path": "svm_dst:vol_data_01_dr"}
)
rel.transfer.post()   # trigger an on-demand update
print("SnapMirror update triggered")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`SnapMirror update triggered`}</CopyBlock>
        <CopyBlock lang="python · Break (for failover)" langColor={ACCENT}>{`# Break the relationship to make destination writable
rel = SnapmirrorRelationship.find(
    **{"destination.path": "svm_dst:vol_data_01_dr"}
)
rel.break_()
print(f"Relationship broken — destination is now R/W")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Relationship broken — destination is now R/W`}</CopyBlock>
        <CopyBlock lang="python · Resync" langColor={ACCENT}>{`# Resync after failback
rel = SnapmirrorRelationship.find(
    **{"destination.path": "svm_dst:vol_data_01_dr"}
)
rel.resync()
print("Resync initiated")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Resync initiated`}</CopyBlock>
      </section>
    </>
  )
}

function RestTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Session Setup</h2>
        <div className="prose">
          <p>Use a <code style={{ color: ACCENT }}>requests.Session</code> for connection reuse, persistent headers, and clean SSL handling.</p>
          <p>A <code style={{ color: ACCENT }}>requests.Session</code> maintains a persistent TCP connection pool and attaches authentication credentials and headers to every request automatically, removing boilerplate from individual calls. The helper functions <code style={{ color: ACCENT }}>get()</code> and <code style={{ color: ACCENT }}>post()</code> wrap the session with base-URL prefixing and raise HTTP errors as Python exceptions rather than requiring callers to check status codes manually. This pattern scales well to scripts that make dozens of API calls across a workflow.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import requests, urllib3, os

urllib3.disable_warnings()

BASE = f"https://{os.getenv('ONTAP_HOST')}/api"
session = requests.Session()
session.auth    = (os.getenv("ONTAP_USER", "admin"), os.getenv("ONTAP_PASS"))
session.headers = {"Content-Type": "application/json", "Accept": "application/json"}
session.verify  = False

def get(path, **params):
    r = session.get(f"{BASE}{path}", params=params)
    r.raise_for_status()
    return r.json()

def post(path, body):
    r = session.post(f"{BASE}{path}", json=body)
    r.raise_for_status()
    return r.json()

# Quick test
info = get("/cluster", **{"fields": "name,version"})
print(f"Connected to: {info['name']}  ONTAP: {info['version']['full']}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Connected to: cluster01  ONTAP: NetApp Release 9.13.1: Fri Oct 20 12:30:00 UTC 2023`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Pagination</h2>
        <div className="prose">
          <p>ONTAP REST API responses are paginated: large collections are split across multiple pages, each containing up to <code style={{ color: ACCENT }}>max_records</code> entries and a <code style={{ color: ACCENT }}>_links.next.href</code> pointer to the next page. If you only read the first page you will silently miss records — on a cluster with hundreds of volumes this means incomplete inventory data. The <code style={{ color: ACCENT }}>get_all()</code> helper follows the pagination chain automatically, accumulating results until there are no more pages. Always use this pattern when the result count is unbounded.</p>
        </div>
        <ol className="step-list">
          <li>Issue the initial GET request with <code style={{ color: ACCENT }}>max_records=100</code> and any filter/field parameters.</li>
          <li>Extend the local <code style={{ color: ACCENT }}>records</code> list with the <code style={{ color: ACCENT }}>records</code> array from the response.</li>
          <li>Check for a <code style={{ color: ACCENT }}>_links.next.href</code> key in the response; construct the full next-page URL.</li>
          <li>Clear the params dict — subsequent page URLs already include all query parameters encoded in the href.</li>
          <li>Repeat until <code style={{ color: ACCENT }}>_links.next</code> is absent, then return the accumulated list.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`def get_all(path, **params):
    """Fetch all records across paginated responses."""
    params.setdefault("max_records", 100)
    records = []
    url = f"{BASE}{path}"
    while url:
        r = session.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        records.extend(data.get("records", []))
        next_href = data.get("_links", {}).get("next", {}).get("href")
        url    = f"https://{os.getenv('ONTAP_HOST')}{next_href}" if next_href else None
        params = {}   # params already encoded in next URL
    return records

volumes = get_all("/storage/volumes", fields="name,svm,size,state")
print(f"Total volumes: {len(volumes)}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Total volumes: 47`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Async Job Tracking</h2>
        <div className="prose">
          <p>Long-running operations return a job object. Poll until it completes.</p>
          <p>Many ONTAP REST operations — volume creation, SnapMirror initialisation, aggregate relocation — are asynchronous: the API returns immediately with a job reference rather than blocking until completion. Ignoring the job and assuming success can cause downstream steps in a pipeline to act on resources that do not yet exist. The <code style={{ color: ACCENT }}>wait_for_job()</code> helper polls the job URL at a configurable interval and raises a Python exception with ONTAP's own error message if the job fails, or a <code style={{ color: ACCENT }}>TimeoutError</code> if it does not complete within the specified window.</p>
        </div>
        <ol className="step-list">
          <li>Accept a job href, poll interval (default 3 s), and timeout (default 300 s).</li>
          <li>Construct the full job URL from the href and calculate a deadline timestamp.</li>
          <li>Loop: GET the job URL, parse the <code style={{ color: ACCENT }}>state</code> field.</li>
          <li>Return the full job dict on <code style={{ color: ACCENT }}>success</code>; raise <code style={{ color: ACCENT }}>RuntimeError</code> on <code style={{ color: ACCENT }}>failure</code> with ONTAP's message.</li>
          <li>Sleep for the poll interval and retry; raise <code style={{ color: ACCENT }}>TimeoutError</code> if the deadline is exceeded.</li>
          <li>Use the helper immediately after any POST that returns a <code style={{ color: ACCENT }}>job</code> key in its response.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`import time

def wait_for_job(job_href, interval=3, timeout=300):
    """Poll a job URL until it succeeds or fails."""
    url      = f"https://{os.getenv('ONTAP_HOST')}{job_href}"
    deadline = time.time() + timeout
    while time.time() < deadline:
        r    = session.get(url)
        r.raise_for_status()
        job  = r.json()
        state = job["state"]
        if state == "success":
            return job
        if state == "failure":
            raise RuntimeError(f"Job failed: {job.get('message', 'unknown error')}")
        time.sleep(interval)
    raise TimeoutError(f"Job did not complete within {timeout}s")

# Example: create a volume and track the job
resp = post("/storage/volumes", {
    "name": "vol_async_01",
    "svm": {"name": "svm0"},
    "aggregates": [{"name": "aggr1"}],
    "size": 10 * 1024 ** 3,
})

if "job" in resp:
    job = wait_for_job(resp["job"]["_links"]["self"]["href"])
    print(f"Done: {job['message']}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Done: Volume create job completed successfully.`}</CopyBlock>
      </section>
    </>
  )
}

function AdvancedTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Bulk Operations</h2>
        <div className="prose">
          <p>Provision multiple volumes in a single script run, collecting successes and failures independently so a single bad spec does not abort the whole batch. This pattern is essential for tenant-onboarding or environment-rebuild scripts where you want maximum throughput while still capturing every error for post-run review. The standard Python <code style={{ color: ACCENT }}>logging</code> module is used instead of bare <code style={{ color: ACCENT }}>print()</code> so that output can be directed to a file or monitoring system without changing the script logic.</p>
        </div>
        <ol className="step-list">
          <li>Define a list of volume spec dicts, each containing at least a name and size.</li>
          <li>Initialise empty <code style={{ color: ACCENT }}>created</code> and <code style={{ color: ACCENT }}>failed</code> lists to track outcomes.</li>
          <li>Iterate the spec list; for each spec, merge common fields (SVM, aggregate, guarantee) with the per-spec overrides.</li>
          <li>Call <code style={{ color: ACCENT }}>vol.post(hydrate=True)</code> inside a try/except block; append to <code style={{ color: ACCENT }}>created</code> on success.</li>
          <li>On <code style={{ color: ACCENT }}>NetAppRestError</code>, append to <code style={{ color: ACCENT }}>failed</code> and log the error without raising, allowing the loop to continue.</li>
          <li>Print a summary count of created vs. failed volumes after the loop completes.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume
from netapp_ontap import NetAppRestError
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

specs = [
    {"name": "vol_app_01", "size": 100 * 1024**3},
    {"name": "vol_app_02", "size": 200 * 1024**3},
    {"name": "vol_log_01", "size":  50 * 1024**3},
]

created, failed = [], []

for spec in specs:
    try:
        vol = Volume.from_dict({
            **spec,
            "svm": {"name": "svm0"},
            "aggregates": [{"name": "aggr1"}],
            "guarantee": {"type": "none"},
        })
        vol.post(hydrate=True)
        created.append(spec["name"])
        log.info(f"Created: {spec['name']}")
    except NetAppRestError as e:
        failed.append(spec["name"])
        log.error(f"Failed {spec['name']}: {e}")

print(f"Created: {len(created)}  Failed: {len(failed)}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`INFO Created: vol_app_01
INFO Created: vol_app_02
ERROR Failed vol_log_01: 409: Volume with the same name already exists in the SVM.
Created: 2  Failed: 1`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Capacity Alert Script</h2>
        <div className="prose">
          <p>Scan all online volumes for space utilisation above a configurable threshold and send a consolidated email alert to the storage team. Automated capacity alerting is preferable to relying solely on ONTAP's built-in EMS events because it can aggregate multiple volumes into a single actionable message and route it through your organisation's existing email infrastructure. The script skips offline volumes and volumes with no size reported to avoid division-by-zero errors or false positives from recently created volumes still being initialised.</p>
        </div>
        <ol className="step-list">
          <li>Iterate all volumes, filtering to those that are <code style={{ color: ACCENT }}>online</code> and have a non-zero size.</li>
          <li>Calculate used percentage as <code style={{ color: ACCENT }}>space.used / size * 100</code>.</li>
          <li>Collect alert strings for volumes at or above the threshold (default 80 %).</li>
          <li>If the alerts list is non-empty, compose a plain-text email body and build a <code style={{ color: ACCENT }}>MIMEText</code> message.</li>
          <li>Connect to the SMTP relay and send the message; print a confirmation or a clean message if no volumes exceeded the threshold.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap.resources import Volume
import smtplib
from email.mime.text import MIMEText

THRESHOLD = 80   # percent

alerts = []
for vol in Volume.get_collection(fields="name,svm,size,space,state"):
    if vol.state != "online" or not vol.size:
        continue
    pct = vol.space.used / vol.size * 100
    if pct >= THRESHOLD:
        alerts.append(f"  {vol.name} ({vol.svm.name}): {pct:.1f}% used")

if alerts:
    body = "Volumes exceeding capacity threshold:\\n\\n" + "\\n".join(alerts)
    msg  = MIMEText(body)
    msg["Subject"] = f"[NetApp] {len(alerts)} volume(s) above {THRESHOLD}%"
    msg["From"]    = "ontap-monitor@example.com"
    msg["To"]      = "storage-team@example.com"

    with smtplib.SMTP("smtp.example.com", 25) as server:
        server.send_message(msg)
    print(f"Alert sent for {len(alerts)} volume(s)")
else:
    print("All volumes within threshold")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Alert sent for 2 volume(s)

--- Email body ---
Volumes exceeding capacity threshold:

  vol_app_02 (svm_prod_01): 83.9% used
  aggr2_vol01 (svm0): 91.2% used`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Error Handling Patterns</h2>
        <div className="prose">
          <p>A reusable <code style={{ color: ACCENT }}>safe_get_volume()</code> helper that converts raw ONTAP HTTP error codes into human-readable messages and exits cleanly. Centralising error handling in a helper avoids duplicating try/except blocks throughout a script and ensures consistent behaviour across all code paths. The HTTP status code is inspected to distinguish authentication failures (401), authorisation denials (403), and not-found errors (404) from unexpected API errors — each requires a different remediation action from the operator.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`from netapp_ontap import NetAppRestError
from netapp_ontap.resources import Volume
import sys

def safe_get_volume(name, svm):
    try:
        vol = Volume.find(name=name, **{"svm.name": svm})
        if vol is None:
            raise ValueError(f"Volume '{name}' not found in SVM '{svm}'")
        return vol
    except NetAppRestError as e:
        # Parse the ONTAP error code from the response
        code = e.status_code
        if code == 401:
            print("Authentication failed — check credentials")
        elif code == 403:
            print("Permission denied — check ONTAP RBAC role")
        elif code == 404:
            print(f"Resource not found: {e}")
        else:
            print(f"API error {code}: {e}")
        sys.exit(1)

vol = safe_get_volume("vol_data_01", "svm0")
print(f"Found: {vol.name}  Size: {vol.size // 1024**3} GB")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Found: vol_data_01  Size: 100 GB`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Inventory Export to CSV</h2>
        <div className="prose">
          <p>Export a full volume inventory to a timestamped CSV file for capacity planning, auditing, or import into a CMDB. CSV is a portable format that downstream teams — finance, security, capacity planning — can open directly in Excel or load into a database without any special tooling. The timestamp in the filename makes it safe to run repeatedly without overwriting previous snapshots, building a historical record over time. The <code style={{ color: ACCENT }}>getattr</code> guard on the <code style={{ color: ACCENT }}>type</code> field handles volumes where the attribute may not be populated depending on ONTAP version.</p>
        </div>
        <ol className="step-list">
          <li>Generate a timestamped filename such as <code style={{ color: ACCENT }}>ontap_volumes_20240903_0200.csv</code>.</li>
          <li>Open the file for writing and create a <code style={{ color: ACCENT }}>DictWriter</code> with the desired column order.</li>
          <li>Write the header row.</li>
          <li>Iterate all volumes, requesting the fields needed for each column.</li>
          <li>Guard against missing <code style={{ color: ACCENT }}>space</code> attribute (e.g. root volume) by defaulting used bytes to 0.</li>
          <li>Convert bytes to GB and round to 2 decimal places; write each row to the CSV.</li>
          <li>Print the output filename on completion.</li>
        </ol>
        <CopyBlock lang="python" langColor={ACCENT}>{`import csv
from datetime import datetime
from netapp_ontap.resources import Volume

filename = f"ontap_volumes_{datetime.now():%Y%m%d_%H%M}.csv"
fields   = ["name", "svm", "size_gb", "used_gb", "used_pct", "state", "type"]

with open(filename, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for vol in Volume.get_collection(fields="name,svm,size,space,state,type"):
        used = vol.space.used if hasattr(vol, "space") else 0
        size = vol.size or 1
        writer.writerow({
            "name":     vol.name,
            "svm":      vol.svm.name,
            "size_gb":  round(size / 1024**3, 2),
            "used_gb":  round(used / 1024**3, 2),
            "used_pct": round(used / size * 100, 1),
            "state":    vol.state,
            "type":     getattr(vol, "type", "rw"),
        })

print(f"Exported to {filename}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Exported to ontap_volumes_20240903_0200.csv

--- File preview (first 4 rows) ---
name,svm,size_gb,used_gb,used_pct,state,type
vol_root,svm0,1.0,0.12,12.3,online,rw
vol_data_01,svm_prod_01,100.0,67.4,67.4,online,rw
vol_log_01,svm_prod_01,50.0,22.55,45.1,online,rw`}</CopyBlock>
      </section>
    </>
  )
}

const USE_CASES = [
  {
    id: 'dr-failover',
    title: 'DR Failover Automation',
    desc: 'Break all SnapMirror relationships and mount DR volumes in a single automated sequence.',
    fullDesc: 'When a primary site becomes unavailable, this script automates the failover sequence: it lists every SnapMirror relationship, breaks them to make destination volumes writable, and mounts each DR volume at its expected junction path. Running this script reduces failover time from hours of manual CLI work to minutes.',
    tags: ['DR', 'SnapMirror', 'Failover'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>The script connects to the cluster, iterates all SnapMirror relationships, breaks each one, then mounts the destination volume at its expected NFS path. A final status table confirms which steps succeeded and which require manual attention.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os, sys
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import SnapmirrorRelationship, Volume

CLUSTER  = os.getenv("ONTAP_HOST")
USER     = os.getenv("ONTAP_USER", "admin")
PASSWORD = os.getenv("ONTAP_PASS")

results = []

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):
    # 1. Collect all SnapMirror relationships
    rels = list(SnapmirrorRelationship.get_collection(
        fields="uuid,source,destination,state,healthy"
    ))
    print(f"Found {len(rels)} SnapMirror relationship(s)")

    for rel in rels:
        src  = rel.source.path
        dst  = rel.destination.path
        status = {"src": src, "dst": dst, "break": False, "mount": False}

        # 2. Break the relationship to make destination writable
        try:
            rel.break_()
            status["break"] = True
            print(f"  [BREAK OK ] {src} -> {dst}")
        except NetAppRestError as e:
            print(f"  [BREAK FAIL] {dst}: {e}")
            results.append(status)
            continue

        # 3. Mount the destination volume at its NFS junction path
        # Derive SVM name and volume name from destination path "svm:vol"
        svm_name, vol_name = dst.split(":")
        try:
            vol = Volume.find(name=vol_name, **{"svm.name": svm_name})
            vol.nas = {"path": f"/{vol_name}"}
            vol.patch()
            status["mount"] = True
            print(f"  [MOUNT OK ] {vol_name} mounted at /{vol_name}")
        except NetAppRestError as e:
            print(f"  [MOUNT FAIL] {vol_name}: {e}")

        results.append(status)

    # 4. Print final status table
    print()
    print(f"{'Destination':<35} {'Break':>6} {'Mount':>6}")
    print("-" * 50)
    for r in results:
        b = "OK" if r["break"] else "FAIL"
        m = "OK" if r["mount"] else "FAIL"
        print(f"{r['dst']:<35} {b:>6} {m:>6}")

    failed = [r for r in results if not r["break"] or not r["mount"]]
    if failed:
        print(f"\\n{len(failed)} relationship(s) require manual attention.")
        sys.exit(1)
    else:
        print("\\nFailover complete — all DR volumes are online and mounted.")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Found 3 SnapMirror relationship(s)
  [BREAK OK ] svm_src:vol_data_01 -> svm_dst:vol_data_01_dr
  [MOUNT OK ] vol_data_01_dr mounted at /vol_data_01_dr
  [BREAK OK ] svm_src:vol_log_01 -> svm_dst:vol_log_01_dr
  [MOUNT OK ] vol_log_01_dr mounted at /vol_log_01_dr
  [BREAK OK ] svm_src:vol_app_02 -> svm_dst:vol_app_02_dr
  [MOUNT OK ] vol_app_02_dr mounted at /vol_app_02_dr

Destination                         Break  Mount
--------------------------------------------------
svm_dst:vol_data_01_dr                 OK     OK
svm_dst:vol_log_01_dr                  OK     OK
svm_dst:vol_app_02_dr                  OK     OK

Failover complete — all DR volumes are online and mounted.`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'cluster-onboarding',
    title: 'New Cluster Onboarding',
    desc: 'Create an SVM, configure NFS, add a LIF, set an export policy, and provision a data volume in one script.',
    fullDesc: 'Onboarding a new cluster tenant involves a fixed sequence of steps that are error-prone when done manually. This script encodes the full provisioning workflow — SVM creation, NFS service configuration, LIF placement, root export policy, and first data volume — into a single idempotent run, making it safe to re-execute or integrate into a CI/CD pipeline.',
    tags: ['Setup', 'SVM', 'LIF'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <line x1="9" y1="9" x2="15" y2="9"/>
        <line x1="12" y1="6" x2="12" y2="12"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>Each provisioning step is wrapped in its own try/except so a partial failure does not silently skip later steps. The script prints a progress line for every action and exits non-zero if any critical step fails.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import (
    Svm, NfsService, IpInterface, ExportPolicy, Volume
)

CLUSTER  = os.getenv("ONTAP_HOST")
USER     = os.getenv("ONTAP_USER", "admin")
PASSWORD = os.getenv("ONTAP_PASS")

# Onboarding parameters — adjust per tenant
SVM_NAME   = "svm_tenant_01"
LIF_NAME   = "lif_nfs_tenant01"
LIF_IP     = "192.168.20.100"
LIF_MASK   = "255.255.255.0"
HOME_NODE  = "node01"
BCAST_DOM  = "Default"
AGGR_NAME  = "aggr1"
VOL_NAME   = "vol_tenant01_data"
VOL_SIZE   = 500 * 1024 ** 3   # 500 GB

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):

    # Step 1: Create the SVM
    print(f"[1/5] Creating SVM '{SVM_NAME}' ...")
    svm = Svm.from_dict({
        "name": SVM_NAME,
        "ipspace": {"name": "Default"},
        "subtype": "default",
        "language": "en_us.utf_8",
        "protocols": {"nfs": {"enabled": True}, "cifs": {"enabled": False}},
        "dns": {"domains": ["corp.example.com"], "servers": ["192.168.1.10"]},
    })
    try:
        svm.post(hydrate=True)
        print(f"    SVM created: {svm.name} ({svm.uuid})")
    except NetAppRestError as e:
        print(f"    FAILED: {e}"); raise

    # Step 2: Enable NFS service
    print(f"[2/5] Configuring NFS service ...")
    nfs = NfsService(SVM_NAME)
    nfs.enabled  = True
    nfs.protocol = {"v3_enabled": True, "v40_enabled": True, "v41_enabled": True}
    try:
        nfs.post(hydrate=True)
        print("    NFS service enabled (v3/v4.0/v4.1)")
    except NetAppRestError as e:
        print(f"    FAILED: {e}"); raise

    # Step 3: Create the data LIF
    print(f"[3/5] Creating LIF '{LIF_NAME}' ({LIF_IP}) ...")
    lif = IpInterface.from_dict({
        "name": LIF_NAME,
        "svm": {"name": SVM_NAME},
        "ip": {"address": LIF_IP, "netmask": LIF_MASK},
        "location": {
            "broadcast_domain": {"name": BCAST_DOM},
            "home_node": {"name": HOME_NODE},
        },
        "service_policy": {"name": "default-data-files"},
        "enabled": True,
    })
    try:
        lif.post(hydrate=True)
        print(f"    LIF created: {lif.name} -> {lif.ip.address}")
    except NetAppRestError as e:
        print(f"    FAILED: {e}"); raise

    # Step 4: Create root export policy (open for lab; restrict in production)
    print(f"[4/5] Creating root export policy ...")
    policy = ExportPolicy.from_dict({
        "name": "default",
        "svm": {"name": SVM_NAME},
        "rules": [{"clients": [{"match": "0.0.0.0/0"}], "protocols": ["nfs"],
                   "ro_rule": ["sys"], "rw_rule": ["sys"], "index": 1}],
    })
    try:
        policy.post(hydrate=True)
        print("    Export policy 'default' created with open rule")
    except NetAppRestError as e:
        print(f"    FAILED: {e}"); raise

    # Step 5: Create the first data volume
    print(f"[5/5] Creating volume '{VOL_NAME}' ({VOL_SIZE // 1024**3} GB) ...")
    vol = Volume.from_dict({
        "name": VOL_NAME,
        "svm": {"name": SVM_NAME},
        "aggregates": [{"name": AGGR_NAME}],
        "size": VOL_SIZE,
        "nas": {"path": f"/{VOL_NAME}"},
        "guarantee": {"type": "none"},
        "space": {"snapshot": {"reserve_percent": 5}},
    })
    try:
        vol.post(hydrate=True)
        print(f"    Volume created: {vol.name} ({vol.uuid})")
    except NetAppRestError as e:
        print(f"    FAILED: {e}"); raise

    print()
    print("Onboarding complete.")
    print(f"  SVM  : {SVM_NAME}")
    print(f"  LIF  : {LIF_IP}")
    print(f"  Mount: {LIF_IP}:/{VOL_NAME}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`[1/5] Creating SVM 'svm_tenant_01' ...
    SVM created: svm_tenant_01 (d4e5f6a7-b8c9-0123-def0-456789012345)
[2/5] Configuring NFS service ...
    NFS service enabled (v3/v4.0/v4.1)
[3/5] Creating LIF 'lif_nfs_tenant01' (192.168.20.100) ...
    LIF created: lif_nfs_tenant01 -> 192.168.20.100
[4/5] Creating root export policy ...
    Export policy 'default' created with open rule
[5/5] Creating volume 'vol_tenant01_data' (500 GB) ...
    Volume created: vol_tenant01_data (e5f6a7b8-c9d0-1234-ef01-567890123456)

Onboarding complete.
  SVM  : svm_tenant_01
  LIF  : 192.168.20.100
  Mount: 192.168.20.100:/vol_tenant01_data`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'health-check',
    title: 'Cluster Health Check',
    desc: 'Check node health, aggregate utilisation, volume states, and SnapMirror lag with a colour-coded report.',
    fullDesc: 'A daily health check script that interrogates four key areas — node availability, aggregate fill level, volume operational state, and SnapMirror replication lag — then prints a structured report. The script exits with a non-zero return code if any critical issue is found, making it compatible with monitoring systems that use exit codes to detect problems.',
    tags: ['Monitoring', 'Health', 'Alerts'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>Issues are accumulated in a list throughout the script. The final section prints a summary and returns exit code 1 if any critical items were found, so the script can be driven by cron or a monitoring agent that alerts on non-zero exits.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os, sys
from datetime import timedelta
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import Node, Aggregate, Volume, SnapmirrorRelationship

CLUSTER  = os.getenv("ONTAP_HOST")
USER     = os.getenv("ONTAP_USER", "admin")
PASSWORD = os.getenv("ONTAP_PASS")

AGGR_WARN  = 75   # %
AGGR_CRIT  = 90   # %
SM_LAG_WARN = timedelta(hours=6)
SM_LAG_CRIT = timedelta(hours=24)

issues = []

def ok(msg):    print(f"  [OK  ] {msg}")
def warn(msg):  print(f"  [WARN] {msg}"); issues.append(("WARN",  msg))
def crit(msg):  print(f"  [CRIT] {msg}"); issues.append(("CRIT",  msg))

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):

    # --- Node health ---
    print("=== Node Health ===")
    for node in Node.get_collection(fields="name,state,uptime"):
        if node.state == "online":
            ok(f"{node.name}  uptime {node.uptime // 3600}h")
        else:
            crit(f"{node.name} is {node.state}")

    # --- Aggregate utilisation ---
    print("\\n=== Aggregate Utilisation ===")
    for aggr in Aggregate.get_collection(fields="name,space"):
        s   = aggr.space.block_storage
        pct = (s.used / s.size * 100) if s.size else 0
        msg = f"{aggr.name}  {pct:.1f}% used ({s.used // 1024**3}/{s.size // 1024**3} GB)"
        if pct >= AGGR_CRIT:
            crit(msg)
        elif pct >= AGGR_WARN:
            warn(msg)
        else:
            ok(msg)

    # --- Volume states ---
    print("\\n=== Volume States ===")
    for vol in Volume.get_collection(fields="name,svm,state"):
        if vol.state == "online":
            ok(f"{vol.svm.name}:{vol.name}")
        else:
            crit(f"{vol.svm.name}:{vol.name} is {vol.state}")

    # --- SnapMirror lag ---
    print("\\n=== SnapMirror Lag ===")
    for rel in SnapmirrorRelationship.get_collection(
        fields="source,destination,state,lag_time,healthy"
    ):
        dst = rel.destination.path
        if not rel.healthy:
            crit(f"{dst}  relationship is unhealthy (state={rel.state})")
            continue
        if rel.lag_time:
            # lag_time is an ISO 8601 duration string like "PT4H2M3S"
            # Parse it simply via the seconds field on the timedelta
            # ONTAP SDK returns it as a string; parse manually
            lag_str = str(rel.lag_time)
            # crude seconds extraction — works for PT...S format
            import re
            m = re.match(r'P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', lag_str)
            if m:
                d, h, mi, s = (int(x or 0) for x in m.groups())
                lag = timedelta(days=d, hours=h, minutes=mi, seconds=s)
                msg = f"{dst}  lag {lag}"
                if lag >= SM_LAG_CRIT:
                    crit(msg)
                elif lag >= SM_LAG_WARN:
                    warn(msg)
                else:
                    ok(msg)
        else:
            ok(f"{dst}  no lag data (possibly idle)")

    # --- Summary ---
    print("\\n=== Summary ===")
    if not issues:
        print("All checks passed — cluster is healthy.")
        sys.exit(0)
    else:
        crits = [i for i in issues if i[0] == "CRIT"]
        warns = [i for i in issues if i[0] == "WARN"]
        print(f"CRITICAL: {len(crits)}  WARNING: {len(warns)}")
        for level, msg in issues:
            print(f"  [{level}] {msg}")
        sys.exit(1)`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`=== Node Health ===
  [OK  ] node01  uptime 312h
  [OK  ] node02  uptime 312h

=== Aggregate Utilisation ===
  [OK  ] aggr0_node01  26.3% used (210/800 GB)
  [OK  ] aggr1  45.0% used (1843/4096 GB)
  [CRIT] aggr2_ssd  85.0% used (1741/2048 GB)
  [OK  ] aggr_dr_node02  15.0% used (614/4096 GB)

=== Volume States ===
  [OK  ] svm0:vol_root
  [OK  ] svm_prod_01:vol_data_01
  [CRIT] svm_prod_01:vol_log_01 is offline

=== SnapMirror Lag ===
  [OK  ] svm_dst:vol_data_01_dr  lag 4:02:03
  [WARN] svm_dst:vol_log_01_dr  lag 8:15:44
  [CRIT] svm_dst:vol_app_02_dr  relationship is unhealthy (state=broken-off)

=== Summary ===
CRITICAL: 3  WARNING: 1
  [CRIT] aggr2_ssd  85.0% used (1741/2048 GB)
  [CRIT] svm_prod_01:vol_log_01 is offline
  [CRIT] svm_dst:vol_app_02_dr  relationship is unhealthy (state=broken-off)
  [WARN] svm_dst:vol_log_01_dr  lag 8:15:44`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'capacity-report',
    title: 'Capacity Report & Alert',
    desc: 'Scan all volumes, generate a CSV report, and send an email alert if any volume exceeds the threshold.',
    fullDesc: 'This script combines inventory export with proactive alerting. It scans every online volume, calculates space utilisation, writes the full dataset to a timestamped CSV for trend analysis, and then sends an email alert via smtplib listing only the volumes that have crossed the configured threshold. Running it on a schedule gives both a historical data series and immediate notification of at-risk volumes.',
    tags: ['Capacity', 'Email', 'Reporting'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
        <line x1="2"  y1="20" x2="22" y2="20"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>The script writes a CSV regardless of whether any volumes are over threshold, so the file is always present for downstream consumption. The email alert is only sent when at least one volume exceeds the configured percentage.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os, csv, smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from netapp_ontap import HostConnection
from netapp_ontap.resources import Volume

CLUSTER   = os.getenv("ONTAP_HOST")
USER      = os.getenv("ONTAP_USER", "admin")
PASSWORD  = os.getenv("ONTAP_PASS")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.example.com")
ALERT_TO  = os.getenv("ALERT_TO",  "storage-team@example.com")
ALERT_FROM = "ontap-capacity@example.com"
THRESHOLD = 80   # alert if used % >= this value

timestamp = datetime.now().strftime("%Y%m%d_%H%M")
csv_file  = f"capacity_report_{timestamp}.csv"
csv_cols  = ["cluster", "svm", "volume", "size_gb", "used_gb", "used_pct", "state"]
alerts    = []

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):
    rows = []
    for vol in Volume.get_collection(fields="name,svm,size,space,state"):
        if not vol.size:
            continue
        used    = vol.space.used if hasattr(vol, "space") else 0
        used_pct = round(used / vol.size * 100, 1)
        row = {
            "cluster":  CLUSTER,
            "svm":      vol.svm.name,
            "volume":   vol.name,
            "size_gb":  round(vol.size / 1024**3, 2),
            "used_gb":  round(used / 1024**3, 2),
            "used_pct": used_pct,
            "state":    vol.state,
        }
        rows.append(row)
        if vol.state == "online" and used_pct >= THRESHOLD:
            alerts.append(row)

# Write CSV
with open(csv_file, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=csv_cols)
    writer.writeheader()
    writer.writerows(rows)

print(f"Report written: {csv_file}  ({len(rows)} volumes)")

# Send email if any volumes exceeded threshold
if alerts:
    alert_lines = "\n".join(
        f"  {r['svm']}:{r['volume']}  {r['used_pct']}% used ({r['used_gb']}/{r['size_gb']} GB)"
        for r in alerts
    )
    body = (
        f"Capacity threshold alert ({THRESHOLD}% used)\n"
        f"Cluster: {CLUSTER}\n"
        f"Time   : {datetime.now().isoformat()}\n\n"
        f"Volumes over threshold ({len(alerts)}):\n{alert_lines}\n\n"
        f"Full report attached: {csv_file}"
    )

    msg = MIMEMultipart()
    msg["Subject"] = f"[NetApp] {len(alerts)} volume(s) over {THRESHOLD}% — {CLUSTER}"
    msg["From"]    = ALERT_FROM
    msg["To"]      = ALERT_TO
    msg.attach(MIMEText(body, "plain"))

    # Attach the CSV
    with open(csv_file, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f'attachment; filename="{csv_file}"')
    msg.attach(part)

    with smtplib.SMTP(SMTP_HOST, 25) as smtp:
        smtp.send_message(msg)

    print(f"Alert email sent to {ALERT_TO} ({len(alerts)} volume(s) over {THRESHOLD}%)")
else:
    print(f"All volumes within {THRESHOLD}% threshold — no alert sent")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Report written: capacity_report_20240903_0600.csv  (52 volumes)
Alert email sent to storage-team@example.com (3 volume(s) over 80%)

--- CSV preview (first 5 data rows) ---
cluster,svm,volume,size_gb,used_gb,used_pct,state
cluster01,svm0,vol_root,1.0,0.12,12.0,online
cluster01,svm_prod_01,vol_data_01,100.0,67.4,67.4,online
cluster01,svm_prod_01,vol_app_02,200.0,167.8,83.9,online
cluster01,svm_prod_01,vol_log_01,50.0,22.55,45.1,online`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'snapmirror-batch',
    title: 'SnapMirror Batch Setup',
    desc: 'Read source/destination pairs from a CSV, initialise SnapMirror for each, and poll until baseline transfers complete.',
    fullDesc: 'When setting up DR replication for many volumes at once, manually creating each SnapMirror relationship is tedious and error-prone. This script reads a CSV of source-destination pairs, creates and initialises all relationships in parallel passes, then polls the transfer status of each until the baseline is done or an error occurs. The final output is a status table showing the outcome for every pair.',
    tags: ['SnapMirror', 'DR', 'Replication'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>The input CSV must have columns <code style={{ color: ACCENT }}>source</code> and <code style={{ color: ACCENT }}>destination</code> in the format <code style={{ color: ACCENT }}>svm:volume</code>. Relationships are created first in a batch, then the script enters a polling loop that exits only when every relationship has reached a terminal state (idle, failed, or timed out).</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`import os, csv, time
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import SnapmirrorRelationship, SnapmirrorTransfer

CLUSTER   = os.getenv("ONTAP_HOST")
USER      = os.getenv("ONTAP_USER", "admin")
PASSWORD  = os.getenv("ONTAP_PASS")
CSV_FILE  = "snapmirror_pairs.csv"   # columns: source, destination
POLICY    = "MirrorAllSnapshots"
SCHEDULE  = "hourly"
POLL_SECS = 30
TIMEOUT   = 7200   # 2 hours per relationship

# --- Read pairs from CSV ---
pairs = []
with open(CSV_FILE, newline="") as f:
    for row in csv.DictReader(f):
        pairs.append({"src": row["source"].strip(), "dst": row["destination"].strip()})

print(f"Loaded {len(pairs)} pair(s) from {CSV_FILE}")

status = {p["dst"]: {"src": p["src"], "state": "pending", "start": None} for p in pairs}

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):

    # --- Phase 1: Create and initialise all relationships ---
    print("\\n[Phase 1] Creating relationships ...")
    for p in pairs:
        try:
            rel = SnapmirrorRelationship.from_dict({
                "source":      {"path": p["src"]},
                "destination": {"path": p["dst"]},
                "policy":      {"name": POLICY},
                "schedule":    {"name": SCHEDULE},
            })
            rel.post(hydrate=True)
            rel.initialize()
            status[p["dst"]]["state"] = "initializing"
            status[p["dst"]]["start"] = time.time()
            print(f"  [INIT] {p['src']} -> {p['dst']}")
        except NetAppRestError as e:
            status[p["dst"]]["state"] = f"error: {e}"
            print(f"  [FAIL] {p['dst']}: {e}")

    # --- Phase 2: Poll until all transfers complete ---
    print("\\n[Phase 2] Polling transfer status ...")
    pending = [dst for dst, s in status.items() if s["state"] == "initializing"]

    while pending:
        time.sleep(POLL_SECS)
        still_pending = []
        for dst in pending:
            try:
                rel = SnapmirrorRelationship.find(**{"destination.path": dst})
                rel.get(fields="state,transfer,healthy")
                transfer_state = getattr(rel, "transfer", None)
                elapsed = time.time() - status[dst]["start"]

                if rel.state in ("snapmirrored", "in_sync"):
                    status[dst]["state"] = "complete"
                    print(f"  [DONE ] {dst}  ({elapsed:.0f}s)")
                elif elapsed > TIMEOUT:
                    status[dst]["state"] = "timeout"
                    print(f"  [TIMEOUT] {dst}")
                elif not rel.healthy:
                    status[dst]["state"] = "unhealthy"
                    print(f"  [WARN ] {dst} unhealthy — check manually")
                else:
                    still_pending.append(dst)
                    pct = getattr(transfer_state, "bytes_transferred", 0)
                    print(f"  [WAIT ] {dst}  state={rel.state}  {elapsed:.0f}s elapsed")
            except NetAppRestError as e:
                status[dst]["state"] = f"poll error: {e}"
                print(f"  [ERR  ] {dst}: {e}")

        pending = still_pending

    # --- Final status table ---
    print("\\n=== Final Status ===")
    print(f"{'Destination':<35} {'State':<20} Source")
    print("-" * 75)
    for dst, s in status.items():
        print(f"{dst:<35} {s['state']:<20} {s['src']}")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Loaded 3 pair(s) from snapmirror_pairs.csv

[Phase 1] Creating relationships ...
  [INIT] svm_src:vol_data_01 -> svm_dst:vol_data_01_dr
  [INIT] svm_src:vol_log_01 -> svm_dst:vol_log_01_dr
  [INIT] svm_src:vol_app_02 -> svm_dst:vol_app_02_dr

[Phase 2] Polling transfer status ...
  [WAIT ] svm_dst:vol_data_01_dr  state=transferring  30s elapsed
  [WAIT ] svm_dst:vol_log_01_dr   state=transferring  30s elapsed
  [WAIT ] svm_dst:vol_app_02_dr   state=transferring  30s elapsed
  [DONE ] svm_dst:vol_log_01_dr  (58s)
  [WAIT ] svm_dst:vol_data_01_dr  state=transferring  60s elapsed
  [WAIT ] svm_dst:vol_app_02_dr   state=transferring  60s elapsed
  [DONE ] svm_dst:vol_data_01_dr  (91s)
  [DONE ] svm_dst:vol_app_02_dr  (124s)

=== Final Status ===
Destination                         State                Source
---------------------------------------------------------------------------
svm_dst:vol_data_01_dr              complete             svm_src:vol_data_01
svm_dst:vol_log_01_dr               complete             svm_src:vol_log_01
svm_dst:vol_app_02_dr               complete             svm_src:vol_app_02`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'decommission-svm',
    title: 'Decommission SVM',
    desc: 'Safely offline volumes, remove SnapMirror relationships, delete LIFs, and destroy an SVM with a --dry-run option.',
    fullDesc: 'Decommissioning an SVM requires removing dependencies in the correct order: SnapMirror relationships must be deleted before volumes can be removed, and volumes must be offlined and unmounted before the SVM itself can be deleted. This script accepts an SVM name and an optional --dry-run flag, lists everything it would remove, prompts for confirmation, then executes the teardown sequence. Dry-run mode prints every action without executing any of them.',
    tags: ['Cleanup', 'SVM', 'Safety'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/>
        <path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    content: (
      <>
        <div className="prose">
          <p>Always run with <code style={{ color: ACCENT }}>--dry-run</code> first to review what will be deleted. The script will not proceed past the confirmation prompt unless you type <code style={{ color: ACCENT }}>yes</code> in full. Dry-run mode never modifies any resource.</p>
        </div>
        <CopyBlock lang="python" langColor={ACCENT}>{`#!/usr/bin/env python3
"""
decommission_svm.py  --svm <name> [--dry-run]

Safely removes an SVM and all its resources in dependency order:
  1. List all resources
  2. Confirm (skipped in --dry-run)
  3. Delete SnapMirror relationships
  4. Offline and unmount volumes
  5. Delete volumes
  6. Delete LIFs
  7. Delete the SVM
"""
import os, sys, argparse
from netapp_ontap import HostConnection, NetAppRestError
from netapp_ontap.resources import (
    Svm, Volume, IpInterface, SnapmirrorRelationship
)

parser = argparse.ArgumentParser()
parser.add_argument("--svm",     required=True, help="SVM name to decommission")
parser.add_argument("--dry-run", action="store_true", help="Print actions without executing")
args = parser.parse_args()

SVM_NAME = args.svm
DRY_RUN  = args.dry_run
CLUSTER  = os.getenv("ONTAP_HOST")
USER     = os.getenv("ONTAP_USER", "admin")
PASSWORD = os.getenv("ONTAP_PASS")

def act(label, fn):
    """Execute fn() unless in dry-run mode."""
    if DRY_RUN:
        print(f"  [DRY-RUN] {label}")
    else:
        print(f"  [EXEC   ] {label}")
        fn()

with HostConnection(CLUSTER, username=USER, password=PASSWORD, verify=False):

    # --- Verify SVM exists ---
    svm = Svm.find(name=SVM_NAME)
    if svm is None:
        print(f"ERROR: SVM '{SVM_NAME}' not found on {CLUSTER}")
        sys.exit(1)

    # --- Collect resources ---
    volumes = list(Volume.get_collection(fields="name,state,nas", **{"svm.name": SVM_NAME}))
    lifs    = list(IpInterface.get_collection(fields="name,ip", **{"svm.name": SVM_NAME}))
    rels    = list(SnapmirrorRelationship.get_collection(
        fields="uuid,source,destination",
        **{"destination.path": f"{SVM_NAME}:*"}
    ))

    # Also find relationships where this SVM is the source
    src_rels = list(SnapmirrorRelationship.get_collection(
        fields="uuid,source,destination",
        **{"source.path": f"{SVM_NAME}:*"}
    ))
    all_rels = rels + src_rels

    print(f"\\nDecommission plan for SVM: {SVM_NAME}")
    print(f"  Volumes  : {len(volumes)}")
    print(f"  LIFs     : {len(lifs)}")
    print(f"  SM rels  : {len(all_rels)}")
    print(f"  Dry-run  : {DRY_RUN}")

    if not DRY_RUN:
        confirm = input("\\nType 'yes' to proceed: ").strip()
        if confirm != "yes":
            print("Aborted.")
            sys.exit(0)

    print("\\n[Step 1] Removing SnapMirror relationships ...")
    for rel in all_rels:
        label = f"Delete SM rel {rel.source.path} -> {rel.destination.path}"
        act(label, lambda r=rel: r.delete())

    print("\\n[Step 2] Offlining and unmounting volumes ...")
    for vol in volumes:
        if hasattr(vol, "nas") and getattr(vol.nas, "path", None):
            act(f"Unmount {vol.name}", lambda v=vol: (
                setattr(v, "nas", {"path": ""}), v.patch()
            ))
        act(f"Offline {vol.name}", lambda v=vol: (
            setattr(v, "state", "offline"), v.patch()
        ))

    print("\\n[Step 3] Deleting volumes ...")
    for vol in volumes:
        act(f"Delete volume {vol.name}", lambda v=vol: v.delete())

    print("\\n[Step 4] Deleting LIFs ...")
    for lif in lifs:
        act(f"Delete LIF {lif.name} ({lif.ip.address})", lambda l=lif: l.delete())

    print("\\n[Step 5] Deleting SVM ...")
    act(f"Delete SVM {SVM_NAME}", lambda: svm.delete())

    print("\\nDone." if not DRY_RUN else "\\nDry-run complete — no changes were made.")`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`# Dry-run first:
$ python decommission_svm.py --svm svm_old_tenant --dry-run

Decommission plan for SVM: svm_old_tenant
  Volumes  : 3
  LIFs     : 1
  SM rels  : 2
  Dry-run  : True

[Step 1] Removing SnapMirror relationships ...
  [DRY-RUN] Delete SM rel svm_src:vol_data_01 -> svm_old_tenant:vol_data_01_dr
  [DRY-RUN] Delete SM rel svm_old_tenant:vol_app -> svm_dst:vol_app_dr

[Step 2] Offlining and unmounting volumes ...
  [DRY-RUN] Unmount vol_data_01_dr
  [DRY-RUN] Offline vol_data_01_dr
  [DRY-RUN] Offline vol_root
  [DRY-RUN] Unmount vol_app
  [DRY-RUN] Offline vol_app

[Step 3] Deleting volumes ...
  [DRY-RUN] Delete volume vol_data_01_dr
  [DRY-RUN] Delete volume vol_root
  [DRY-RUN] Delete volume vol_app

[Step 4] Deleting LIFs ...
  [DRY-RUN] Delete LIF lif_nfs_old (192.168.30.55)

[Step 5] Deleting SVM ...
  [DRY-RUN] Delete SVM svm_old_tenant

Dry-run complete — no changes were made.

# Live run:
$ python decommission_svm.py --svm svm_old_tenant

Type 'yes' to proceed: yes

[Step 1] Removing SnapMirror relationships ...
  [EXEC   ] Delete SM rel svm_src:vol_data_01 -> svm_old_tenant:vol_data_01_dr
  [EXEC   ] Delete SM rel svm_old_tenant:vol_app -> svm_dst:vol_app_dr

[Step 2] Offlining and unmounting volumes ...
  [EXEC   ] Unmount vol_data_01_dr
  [EXEC   ] Offline vol_data_01_dr
  [EXEC   ] Offline vol_root
  [EXEC   ] Unmount vol_app
  [EXEC   ] Offline vol_app

[Step 3] Deleting volumes ...
  [EXEC   ] Delete volume vol_data_01_dr
  [EXEC   ] Delete volume vol_root
  [EXEC   ] Delete volume vol_app

[Step 4] Deleting LIFs ...
  [EXEC   ] Delete LIF lif_nfs_old (192.168.30.55)

[Step 5] Deleting SVM ...
  [EXEC   ] Delete SVM svm_old_tenant

Done.`}</CopyBlock>
      </>
    ),
  },
]

function UseCaseCard({ uc, accent, onClick }) {
  return (
    <div
      className="usecase-card"
      style={{ '--uc-accent': accent }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="usecase-card-icon">{uc.icon}</div>
      <div className="usecase-card-title">{uc.title}</div>
      <div className="usecase-card-desc">{uc.desc}</div>
      <div className="usecase-card-tags">
        {uc.tags.map(t => <span key={t} className="usecase-tag">{t}</span>)}
      </div>
      <div className="usecase-card-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </div>
  )
}

function UseCaseDetail({ uc, onBack, accent }) {
  return (
    <>
      <button className="usecase-detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Use Cases
      </button>
      <div className="usecase-detail-header" style={{ '--uc-accent': accent }}>
        <div className="usecase-detail-icon">{uc.icon}</div>
        <div>
          <div className="usecase-detail-title">{uc.title}</div>
          <div className="usecase-detail-subtitle">{uc.fullDesc}</div>
        </div>
      </div>
      {uc.content}
    </>
  )
}

function UseCasesTab() {
  const [selectedCase, setSelectedCase] = useState(null)
  if (selectedCase) {
    const uc = USE_CASES.find(u => u.id === selectedCase)
    return <UseCaseDetail uc={uc} onBack={() => setSelectedCase(null)} accent={ACCENT} />
  }
  return (
    <div className="usecase-grid">
      {USE_CASES.map(uc => (
        <UseCaseCard key={uc.id} uc={uc} accent={ACCENT} onClick={() => setSelectedCase(uc.id)} />
      ))}
    </div>
  )
}

const TAB_CONTENT = {
  setup:      <SetupTab />,
  volumes:    <VolumesTab />,
  snapshots:  <SnapshotsTab />,
  svm:        <SvmTab />,
  snapmirror: <SnapMirrorTab />,
  rest:       <RestTab />,
  advanced:   <AdvancedTab />,
  usecases:   <UseCasesTab />,
}

export default function Python() {
  const [active, setActive] = useState('setup')

  return (
    <main className="main-content">
      <SEO
        title="NetApp Python Automation Scripts | ONTAP APIs & DevOps | NetApp Hub"
        description="Python automation scripts for NetApp ONTAP — volumes, snapshots, SVM, SnapMirror, REST API and advanced patterns."
        keywords="NetApp Python, ONTAP API, Automation Scripts, DevOps, Storage Monitoring"
        canonical="/python"
        ogTitle="NetApp Python Automation Scripts"
        ogDescription="Python scripts for NetApp ONTAP automation and APIs."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: ACCENT, background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>Python</div>
        <h1 className="page-title">Python Automation</h1>
        <p className="page-subtitle">Production-ready scripts using the netapp-ontap SDK and direct REST API. Covers volumes, snapshots, SVM, SnapMirror, and advanced patterns.</p>
      </header>

      <SubNav tabs={TABS} active={active} onChange={setActive} accent={ACCENT} />

      {TAB_CONTENT[active]}
    </main>
  )
}
