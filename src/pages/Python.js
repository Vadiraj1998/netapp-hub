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

const TAB_CONTENT = {
  setup:      <SetupTab />,
  volumes:    <VolumesTab />,
  snapshots:  <SnapshotsTab />,
  svm:        <SvmTab />,
  snapmirror: <SnapMirrorTab />,
  rest:       <RestTab />,
  advanced:   <AdvancedTab />,
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
