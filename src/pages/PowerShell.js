import { useState } from 'react'
import CopyBlock from '../components/CopyBlock'
import SubNav from '../components/SubNav'
import SEO from '../components/SEO'

const ACCENT = 'var(--accent-ps)'
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
    <span className="section-num" style={{ color: ACCENT, background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }}>
      {num}
    </span>
  )
}

function SetupTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Install NetApp PowerShell Toolkit</h2>
        <div className="prose">
          <p>The NetApp PowerShell Toolkit (PSTK) is published on the PowerShell Gallery and wraps both REST and ZAPI endpoints as native cmdlets. Installing it once per machine gives you access to hundreds of ONTAP-specific cmdlets without writing raw HTTP calls. The <code style={{ color: ACCENT }}>-Scope CurrentUser</code> flag avoids the need for administrator elevation. After installation you should see 300 or more available cmdlets — the <code style={{ color: ACCENT }}>Measure-Object</code> call at the end confirms the module loaded correctly.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# Install from PowerShell Gallery
Install-Module -Name NetApp.ONTAP -Scope CurrentUser -Force

# Import for the current session
Import-Module NetApp.ONTAP

# Confirm available cmdlets
Get-Command -Module NetApp.ONTAP | Measure-Object
Get-Command -Module NetApp.ONTAP | Select-Object -First 10 | Format-Table Name`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Count             : 316

Name
----
Add-NcAggr
Add-NcAggrDiskSet
Add-NcBgpPeer
Add-NcCifsPrivilegeLocalGroupMember
Add-NcDiskOwnership
Add-NcExportRule
Add-NcLicense
Add-NcNodeTemplateDisk
Add-NcQosPolicyGroup
Add-NcRole`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Connect to Cluster</h2>
        <div className="prose">
          <p>All PSTK cmdlets require an active controller session established by <code style={{ color: ACCENT }}>Connect-NcController</code>. The session is stored in the module's session state, so you only need to connect once per PowerShell session. In production always add <code style={{ color: ACCENT }}>-Https</code> and ensure your certificate is trusted; omitting it falls back to HTTP which exposes credentials in transit. The follow-up <code style={{ color: ACCENT }}>Get-NcController</code> call prints the active session so you can confirm the correct cluster is targeted before running destructive operations.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$ClusterIP   = "192.168.1.100"
$Credentials = Get-Credential          # prompts securely

# Connect — add -Https with a valid cert in production
Connect-NcController -Name $ClusterIP -Credential $Credentials

# Verify — shows active controller details
Get-NcController`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name                           : cluster1
Address                        : 192.168.1.100
Port                           : 80
Protocol                       : HTTP
Timeout                        : 60
Ontapi                         : 1.140
ONTAP                          : NetApp Release 9.13.1: Fri Sep 08 2023`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Cluster Information</h2>
        <div className="prose">
          <p>These three commands give you a quick health baseline after connecting. Node information confirms which hardware models are present and how long they have been up — a short uptime may indicate a recent reboot or failover. The version query is important before scripting because some cmdlets and parameters were introduced in specific ONTAP releases. License output lets you verify that features like SnapMirror or FlexClone are properly licensed before you attempt to use them.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# Cluster nodes
Get-NcNode | Select-Object Name, Model, SystemId, Uptime | Format-Table -AutoSize

# ONTAP version
Get-NcSystemVersionInfo

# Licenses
Get-NcLicense | Select-Object Package, Type, ExpirationDate | Format-Table -AutoSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name    Model       SystemId    Uptime
----    -----       --------    ------
node01  AFF A400    537123456   32.04:12:09
node02  AFF A400    537123457   32.04:11:55

BuildTimestamp    : Mon Sep 11 06:12:13 UTC 2023
NvramId           : 537123456
Version           : NetApp Release 9.13.1: Fri Sep 08 2023
VersionTuple      : NetApp Release 9.13.1

Package            Type       ExpirationDate
-------            ----       --------------
NFS                license
CIFS               license
iSCSI              license
SnapMirror         license
FlexClone          license    12/31/2025 00:00:00`}</CopyBlock>
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
          <p>Volume listing is the most common day-to-day operation. The first query retrieves all volumes cluster-wide with their raw sizes and state. The second query scopes to a single SVM and converts byte values into human-readable gigabytes and a usage percentage — this is especially useful for capacity reviews. The CSV export at the end is designed for recurring scheduled reports; the date stamp in the filename prevents overwrites and makes it easy to compare snapshots over time. Note that <code style={{ color: ACCENT }}>$_.Used</code> represents the space used by active data, not including snapshot reserve.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# All volumes with key properties
Get-NcVol | Select-Object Name, Vserver, TotalSize, Used, State | Format-Table -AutoSize

# Filter by SVM with usage %
Get-NcVol -Vserver "svm0" |
    Select-Object Name,
        @{N="Size GB"; E={[math]::Round($_.TotalSize/1GB,1)}},
        @{N="Used %";  E={[math]::Round($_.Used/$_.TotalSize*100,1)}},
        State |
    Format-Table -AutoSize

# Export to CSV
Get-NcVol |
    Select-Object Name, Vserver, TotalSize, Used, State |
    Export-Csv -Path "volumes_$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name           Vserver  TotalSize    Used         State
----           -------  ---------    ----         -----
vol_data_01    svm0     107374182400 45097156608  online
vol_data_02    svm0     214748364800 98784247808  online
vol_logs_01    svm0     53687091200  12884901888  online
svm0_root      svm0     1073741824   294912       online

Name           Size GB  Used %  State
----           -------  ------  -----
vol_data_01    100.0    42.0    online
vol_data_02    200.0    46.0    online
vol_logs_01    50.0     24.0    online

Exported to volumes_20240916.csv`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create Volume</h2>
        <div className="prose">
          <p><code style={{ color: ACCENT }}>New-NcVol</code> provisions a new FlexVol and, by specifying a <code style={{ color: ACCENT }}>-JunctionPath</code>, immediately mounts it in the SVM namespace so NFS and CIFS clients can access it without a separate mount step. Setting <code style={{ color: ACCENT }}>-SpaceReserve "none"</code> creates a thin-provisioned volume, meaning ONTAP only allocates physical blocks as data is written — this maximises aggregate utilisation but requires monitoring to prevent the aggregate from filling up unexpectedly. The backtick line-continuation characters make the long parameter list readable; they must not have any trailing whitespace after them.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`New-NcVol \`
    -Name         "vol_data_01" \`
    -Vserver      "svm0" \`
    -Aggregate    "aggr1" \`
    -Size         "100g" \`
    -JunctionPath "/vol_data_01" \`
    -SpaceReserve "none"

Write-Host "Volume created" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name        : vol_data_01
Vserver     : svm0
Aggregate   : aggr1
Size        : 100g
State       : online
JunctionPath: /vol_data_01

Volume created`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Resize & Modify</h2>
        <div className="prose">
          <p>Resizing a volume in ONTAP is non-disruptive — clients remain connected while the size change takes effect immediately. After resizing, the follow-up <code style={{ color: ACCENT }}>Get-NcVol</code> call confirms the new allocation. Enabling storage efficiency (dedup and compression) is a two-step process: <code style={{ color: ACCENT }}>Enable-NcSis</code> activates the efficiency engine on the volume path, and <code style={{ color: ACCENT }}>Set-NcSisConfig</code> turns on inline compression in addition to post-process deduplication. <code style={{ color: ACCENT }}>Start-NcSis</code> triggers an immediate deduplication scan rather than waiting for the next scheduled window — useful after loading a large dataset.</p>
        </div>
        <CopyBlock lang="powershell · Resize" langColor={ACCENT}>{`Set-NcVolSize -Name "vol_data_01" -Vserver "svm0" -NewSize "200g"
Get-NcVol -Name "vol_data_01" | Select-Object Name, TotalSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name        TotalSize
----        ---------
vol_data_01 214748364800`}</CopyBlock>

        <CopyBlock lang="powershell · Enable Dedup + Compression" langColor={ACCENT}>{`Enable-NcSis -Path "/vol/vol_data_01" -Vserver "svm0"
Set-NcSisConfig -Path "/vol/vol_data_01" -Vserver "svm0" -EnableCompression $true
Start-NcSis -Path "/vol/vol_data_01" -Vserver "svm0"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Path                    : /vol/vol_data_01
Enabled                 : True
CompressionEnabled      : True
State                   : active
ScheduleDescription     : Sun-Sat@0

Deduplication scan started on /vol/vol_data_01`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Delete Volume</h2>
        <div className="prose">
          <p>Volume deletion in ONTAP is a three-step process that cannot be shortcut: the volume must first be taken offline, then unmounted from the namespace junction, and finally removed. Skipping the offline step will cause <code style={{ color: ACCENT }}>Remove-NcVol</code> to fail with an error indicating the volume is still mounted. This sequence prevents accidental deletion of volumes that clients are actively using. The <code style={{ color: ACCENT }}>-Confirm:$false</code> flag suppresses the interactive confirmation prompt, which is appropriate in scripts but should be used with caution in one-off manual operations.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# Offline and unmount first
Set-NcVol -Name "vol_data_01" -Vserver "svm0" -Offline $true
Dismount-NcVol -Name "vol_data_01" -Vserver "svm0"

Remove-NcVol -Name "vol_data_01" -Vserver "svm0" -Confirm:$false
Write-Host "Volume deleted" -ForegroundColor Yellow`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`[vol_data_01] State changed to: offline
[vol_data_01] Junction path cleared
[vol_data_01] Volume deleted successfully

Volume deleted`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="05" /> Aggregate Capacity Report</h2>
        <div className="prose">
          <p>Aggregates are the physical disk pools that back your volumes. Monitoring their used percentage is critical because a full aggregate causes all volumes on it to go read-only. This script builds a custom report object for each aggregate, calculates a usage percentage, and flags any aggregate above 80% as a warning. The result is sorted with the most-used aggregates at the top so the most urgent items are immediately visible. Adjust the threshold to match your operational runbook — many teams use 75% as an early-warning level.</p>
        </div>
        <ol className="step-list">
          <li>Retrieve all aggregates with <code style={{ color: ACCENT }}>Get-NcAggr</code> and pipe each object into <code style={{ color: ACCENT }}>ForEach-Object</code>.</li>
          <li>Extract the raw byte values from the nested <code style={{ color: ACCENT }}>AggregateSpaceAttributes</code> object and convert to gigabytes with two decimal places.</li>
          <li>Calculate the used percentage by dividing used by total and multiplying by 100.</li>
          <li>Construct a <code style={{ color: ACCENT }}>PSCustomObject</code> with readable property names, adding a <code style={{ color: ACCENT }}>Status</code> field that evaluates to <code style={{ color: ACCENT }}>"WARNING"</code> when usage exceeds 80%.</li>
          <li>Sort the finished collection by usage percentage descending and display it as a formatted table.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$report = Get-NcAggr | ForEach-Object {
    $totalGB = [math]::Round($_.AggregateSpaceAttributes.SizeTotal / 1GB, 1)
    $usedGB  = [math]::Round($_.AggregateSpaceAttributes.SizeUsed  / 1GB, 1)
    $pct     = [math]::Round($usedGB / $totalGB * 100, 1)
    [PSCustomObject]@{
        Aggregate = $_.Name
        "Total GB" = $totalGB
        "Used GB"  = $usedGB
        "Used %"   = $pct
        Status     = if ($pct -gt 80) { "WARNING" } else { "OK" }
    }
}

$report | Sort-Object "Used %" -Descending | Format-Table -AutoSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Aggregate  Total GB  Used GB  Used %  Status
---------  --------  -------  ------  ------
aggr2      8192.0    7004.3   85.5    WARNING
aggr1      12288.0   9175.6   74.7    OK
aggr3      4096.0    2048.0   50.0    OK`}</CopyBlock>
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
          <p>Snapshots are point-in-time, space-efficient copies of a volume stored on the same aggregate. They consume no space at creation — space is used only as data diverges from the snapshot's baseline. Embedding the current date and time in the snapshot name using <code style={{ color: ACCENT }}>Get-Date -Format yyyyMMdd_HHmm</code> creates a self-documenting naming convention that makes it easy to identify when a snapshot was taken without querying the metadata. This pattern is well-suited to pre-change snapshots before patching or application upgrades.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`New-NcSnapshot \`
    -VolumeName   "vol_data_01" \`
    -SnapshotName "snap_$(Get-Date -Format yyyyMMdd_HHmm)" \`
    -Vserver      "svm0"

Write-Host "Snapshot created" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`VolumeName   : vol_data_01
SnapshotName : snap_20240916_1430
Vserver      : svm0
Created      : 9/16/2024 2:30:00 PM

Snapshot created`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> List Snapshots</h2>
        <div className="prose">
          <p>Listing snapshots for a volume shows you what recovery points are available and how much cumulative space they occupy. The <code style={{ color: ACCENT }}>CumulativePercentageOfUsedBlocks</code> property reflects the percentage of the volume's used blocks referenced by each snapshot relative to the active filesystem — higher values mean the snapshot captures a state that has drifted significantly from the current state and is therefore consuming more unique blocks. Sorting by creation time descending puts the most recent snapshot first, which is the most likely restore target in an incident.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`Get-NcSnapshot -VolumeName "vol_data_01" -Vserver "svm0" |
    Select-Object Name, Created,
        @{N="Size MB"; E={[math]::Round($_.CumulativePercentageOfUsedBlocks, 1)}} |
    Sort-Object Created -Descending |
    Format-Table -AutoSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Name                   Created                  Size MB
----                   -------                  -------
snap_20240916_1430     9/16/2024 2:30:00 PM     2.1
snap_20240915_0800     9/15/2024 8:00:00 AM     5.8
snap_20240910_0000     9/10/2024 12:00:00 AM    18.4
snap_20240901_0800     9/1/2024  8:00:00 AM     34.2`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Delete Old Snapshots</h2>
        <div className="prose">
          <p>Over time, accumulating snapshots consumes an increasing proportion of the volume's space reserve. This script automates the cleanup of snapshots older than a configurable number of days. It is safe to run on a schedule because it only deletes snapshots whose <code style={{ color: ACCENT }}>Created</code> timestamp predates the cutoff; newer snapshots are untouched. A running counter reports how many snapshots were removed, which is useful for log auditing. Be aware that snapshots locked by a SnapMirror relationship or a clone dependency will cause <code style={{ color: ACCENT }}>Remove-NcSnapshot</code> to throw — add error handling if that is a concern in your environment.</p>
        </div>
        <ol className="step-list">
          <li>Calculate the cutoff date by subtracting 30 days from the current timestamp using <code style={{ color: ACCENT }}>AddDays(-30)</code>.</li>
          <li>Initialise a counter variable <code style={{ color: ACCENT }}>$deleted</code> to track how many snapshots are removed.</li>
          <li>Retrieve all snapshots for the target volume and pipe them through <code style={{ color: ACCENT }}>Where-Object</code> to filter only those whose <code style={{ color: ACCENT }}>Created</code> date is earlier than the cutoff.</li>
          <li>For each matching snapshot, call <code style={{ color: ACCENT }}>Remove-NcSnapshot</code> with <code style={{ color: ACCENT }}>-Confirm:$false</code> to suppress interactive prompts.</li>
          <li>Increment the counter and write the deleted snapshot name to the console for audit purposes.</li>
          <li>After the loop completes, print the total number of snapshots removed.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$cutoff  = (Get-Date).AddDays(-30)
$deleted = 0

Get-NcSnapshot -VolumeName "vol_data_01" -Vserver "svm0" |
    Where-Object { $_.Created -lt $cutoff } |
    ForEach-Object {
        Remove-NcSnapshot \`
            -VolumeName   "vol_data_01" \`
            -SnapshotName $_.Name \`
            -Vserver      "svm0" \`
            -Confirm:$false
        $deleted++
        Write-Host "Deleted: $($_.Name)"
    }

Write-Host "Total deleted: $deleted"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Deleted: snap_20240810_0000
Deleted: snap_20240815_0800
Deleted: snap_20240820_1200
Deleted: snap_20240825_0000
Total deleted: 4`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Restore from Snapshot</h2>
        <div className="prose">
          <p><code style={{ color: ACCENT }}>Restore-NcSnapshotVolume</code> performs a full volume revert — it rolls the entire volume back to the exact state it was in when the named snapshot was taken. This operation is irreversible and discards all data written to the volume after the snapshot was created. It is typically used for rapid recovery after a bad software deployment or data corruption event. The volume must be online but it does not need to be unmounted; however, you should ensure no application is actively writing to it during the revert to avoid confusion. The operation completes in seconds regardless of volume size because it simply updates block pointers.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`Restore-NcSnapshotVolume \`
    -VolumeName   "vol_data_01" \`
    -SnapshotName "snap_20240901_0800" \`
    -Vserver      "svm0" \`
    -Confirm:$false

Write-Host "Volume restored to snapshot" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`VolumeName   : vol_data_01
SnapshotName : snap_20240901_0800
Vserver      : svm0
Status       : completed

Volume restored to snapshot`}</CopyBlock>
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
          <p>Storage Virtual Machines (SVMs, also called Vservers) are the logical containers that isolate data, protocols, and networking within a cluster. Listing them shows you what tenants or workloads exist and which data protocols — NFS, CIFS, iSCSI, FCP — each SVM is configured to serve. The <code style={{ color: ACCENT }}>VserverType</code> column distinguishes data SVMs from the cluster admin SVM and node management SVMs, which should not be confused with storage-serving entities.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`Get-NcVserver |
    Select-Object VserverName, VserverType, State, AllowedProtocols |
    Format-Table -AutoSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`VserverName   VserverType  State    AllowedProtocols
-----------   -----------  -----    ----------------
cluster1      admin        running
node01        node         running
node02        node         running
svm0          data         running  {nfs, cifs}
svm_prod_01   data         running  {nfs}
svm_iscsi     data         running  {iscsi}`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create SVM</h2>
        <div className="prose">
          <p>Creating a new SVM provisions the administrative namespace and root volume that anchors it. The root volume is a small, automatically managed volume that holds SVM-level metadata such as CIFS shares and NFS exports; it should never be used for user data. Specifying <code style={{ color: ACCENT }}>-AllowedProtocols</code> does not start the protocol services — it merely lists what may be enabled later. The <code style={{ color: ACCENT }}>-NameServerSwitch</code> parameter controls how the SVM resolves users and groups: <code style={{ color: ACCENT }}>file</code> means local /etc/passwd-style files, and <code style={{ color: ACCENT }}>ldap</code> delegates to a configured LDAP/Active Directory server.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`New-NcVserver \`
    -Name                "svm_prod_01" \`
    -RootVolumeName      "svm_prod_01_root" \`
    -RootVolumeAggregate "aggr1" \`
    -AllowedProtocols    nfs, cifs \`
    -Language            "en_us.utf_8" \`
    -NameServerSwitch    file, ldap

Write-Host "SVM created: svm_prod_01" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`VserverName         : svm_prod_01
RootVolume          : svm_prod_01_root
RootVolumeAggregate : aggr1
AllowedProtocols    : {nfs, cifs}
Language            : en_us.utf_8
State               : running

SVM created: svm_prod_01`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Configure NFS & Export Policy</h2>
        <div className="prose">
          <p>NFS access on ONTAP is gated by two independent controls: the NFS service must be running on the SVM, and each volume must be covered by an export policy that grants access to specific client networks. Export policies are reusable — multiple volumes can share the same policy. The rule created here grants read-write access to the entire <code style={{ color: ACCENT }}>192.168.10.0/24</code> subnet using AUTH_SYS (Unix UID/GID) security. For Kerberos environments replace <code style={{ color: ACCENT }}>sys</code> with <code style={{ color: ACCENT }}>krb5</code> or <code style={{ color: ACCENT }}>krb5p</code> in the <code style={{ color: ACCENT }}>-SuperUserSecurity</code> and <code style={{ color: ACCENT }}>-RoRule</code>/<code style={{ color: ACCENT }}>-RwRule</code> parameters.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# Enable NFS service
Enable-NcNfs -VserverContext "svm_prod_01"

# Create export policy and rule
New-NcExportPolicy -Name "default" -VserverContext "svm_prod_01"

New-NcExportRule \`
    -Policy         "default" \`
    -ClientMatch    "192.168.10.0/24" \`
    -RoRule         any \`
    -RwRule         any \`
    -SuperUserSecurity sys \`
    -VserverContext "svm_prod_01"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`NFS enabled on svm_prod_01

PolicyName  : default
Vserver     : svm_prod_01
RuleIndex   : 1
ClientMatch : 192.168.10.0/24
RoRule      : any
RwRule      : any
SuperUser   : sys`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Create LIF</h2>
        <div className="prose">
          <p>A Logical Interface (LIF) is the IP address through which clients connect to the SVM. LIFs are bound to a home node and port but can fail over to other ports if the home port goes down, ensuring availability. The <code style={{ color: ACCENT }}>-DataProtocols nfs</code> parameter tells ONTAP that this LIF will carry NFS traffic, which affects failover group assignment and firewall policy selection. Use a dedicated port or VLAN for storage traffic rather than sharing with management interfaces — this ensures storage bandwidth is not competing with administrative access.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`New-NcNetInterface \`
    -InterfaceName "lif_nfs_01" \`
    -Vserver       "svm_prod_01" \`
    -Role          "data" \`
    -DataProtocols nfs \`
    -HomeNodeName  "node01" \`
    -HomePortName  "e0c" \`
    -Address       "192.168.10.50" \`
    -Netmask       "255.255.255.0"

Write-Host "LIF created: lif_nfs_01" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`InterfaceName  : lif_nfs_01
Vserver        : svm_prod_01
Role           : data
DataProtocols  : {nfs}
HomeNode       : node01
HomePort       : e0c
Address        : 192.168.10.50
Netmask        : 255.255.255.0
OperationalStatus : up

LIF created: lif_nfs_01`}</CopyBlock>
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
          <p>SnapMirror relationships replicate volumes asynchronously or synchronously between SVMs, clusters, or cloud targets. The listing shows the current mirror state and lag time — the gap between the last successful transfer and the current time. A <code style={{ color: ACCENT }}>MirrorState</code> of <code style={{ color: ACCENT }}>Snapmirrored</code> combined with a <code style={{ color: ACCENT }}>Status</code> of <code style={{ color: ACCENT }}>Idle</code> indicates a healthy, up-to-date relationship. Growing lag time without a transfer in progress usually points to a network or authentication issue between the source and destination clusters.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`Get-NcSnapmirror |
    Select-Object SourceLocation, DestinationLocation, Status, MirrorState, LagTime |
    Format-Table -AutoSize`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`SourceLocation          DestinationLocation          Status       MirrorState    LagTime
--------------          -------------------          ------       -----------    -------
svm_src:vol_data_01     svm_dst:vol_data_01_dr       Idle         Snapmirrored   00:04:12
svm_src:vol_logs_01     svm_dst:vol_logs_01_dr       Transferring Snapmirrored   01:15:33
svm_src:vol_app_01      svm_dst:vol_app_01_dr        Idle         Snapmirrored   00:03:58`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Create & Initialize</h2>
        <div className="prose">
          <p>Creating a SnapMirror relationship registers the replication intent but does not transfer any data until you initialize it. Initialization triggers a baseline transfer that copies all active data from the source to the destination — for large volumes this can take hours or days over a WAN link, so plan accordingly and consider scheduling it during off-peak hours. The <code style={{ color: ACCENT }}>MirrorAllSnapshots</code> policy replicates every snapshot created on the source, which is appropriate for DR workloads. For backup-style replication where you want to retain more snapshots on the destination than the source, use a custom policy with a higher retention count.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`New-NcSnapmirror \`
    -SourceLocation      "svm_src:vol_data_01" \`
    -DestinationLocation "svm_dst:vol_data_01_dr" \`
    -Policy              "MirrorAllSnapshots" \`
    -Schedule            "hourly"

Invoke-NcSnapmirrorInitialize -DestinationLocation "svm_dst:vol_data_01_dr"
Write-Host "SnapMirror initialized — baseline transfer started"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`SourceLocation      : svm_src:vol_data_01
DestinationLocation : svm_dst:vol_data_01_dr
Policy              : MirrorAllSnapshots
Schedule            : hourly
MirrorState         : Uninitialized
Status              : Idle

Transfer started for svm_dst:vol_data_01_dr
SnapMirror initialized — baseline transfer started`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Update, Break & Resync</h2>
        <div className="prose">
          <p>These three operations cover the full DR lifecycle. A manual update forces an immediate incremental transfer outside the scheduled window — useful immediately before a planned failover to minimise data loss. Breaking the relationship makes the destination volume writable so applications can be brought up at the DR site; the source and destination are now independent and will diverge. Resyncing re-establishes replication after a break or failover: ONTAP compares the two volumes, finds the most recent common snapshot, and resynchronises from that point rather than performing another full baseline transfer, which is significantly faster.</p>
        </div>
        <CopyBlock lang="powershell · Manual Update" langColor={ACCENT}>{`Invoke-NcSnapmirrorUpdate -DestinationLocation "svm_dst:vol_data_01_dr"
Write-Host "SnapMirror update triggered"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Transfer initiated for svm_dst:vol_data_01_dr
SnapMirror update triggered`}</CopyBlock>

        <CopyBlock lang="powershell · Break (failover)" langColor={ACCENT}>{`Invoke-NcSnapmirrorBreak -DestinationLocation "svm_dst:vol_data_01_dr" -Confirm:$false
Write-Host "Relationship broken — destination is now read/write"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`DestinationLocation : svm_dst:vol_data_01_dr
MirrorState         : Broken-off
Status              : Idle

Relationship broken — destination is now read/write`}</CopyBlock>

        <CopyBlock lang="powershell · Resync" langColor={ACCENT}>{`Invoke-NcSnapmirrorResync -DestinationLocation "svm_dst:vol_data_01_dr" -Confirm:$false
Write-Host "Resync initiated"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Resync transfer started for svm_dst:vol_data_01_dr
MirrorState : Snapmirrored
Status      : Transferring

Resync initiated`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Health Report</h2>
        <div className="prose">
          <p>This health check script is designed to be embedded in a monitoring pipeline or scheduled task. It queries all SnapMirror relationships and filters for any that are not in the expected healthy state — <code style={{ color: ACCENT }}>Snapmirrored</code> with a status of <code style={{ color: ACCENT }}>Idle</code>. The output is colour-coded: red if issues are found, green if everything is clean. Relationships in a <code style={{ color: ACCENT }}>Transferring</code> status are technically not idle but are not broken; you may want to add that as an excluded state in the <code style={{ color: ACCENT }}>Where-Object</code> filter to avoid false positives during scheduled transfer windows.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$unhealthy = Get-NcSnapmirror |
    Where-Object { $_.MirrorState -ne "Snapmirrored" -or $_.Status -ne "Idle" }

if ($unhealthy) {
    Write-Host "Unhealthy relationships:" -ForegroundColor Red
    $unhealthy | Format-Table SourceLocation, DestinationLocation, MirrorState, Status, LagTime
} else {
    Write-Host "All SnapMirror relationships are healthy" -ForegroundColor Green
}`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Unhealthy relationships:

SourceLocation       DestinationLocation       MirrorState  Status       LagTime
--------------       -------------------       -----------  ------       -------
svm_src:vol_logs_01  svm_dst:vol_logs_01_dr    Snapmirrored Transferring 01:18:04`}</CopyBlock>
      </section>
    </>
  )
}

function RestTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Auth & Base Setup</h2>
        <div className="prose">
          <p>Use <code style={{ color: ACCENT }}>Invoke-RestMethod</code> for endpoints not covered by PSTK, or in environments where installing modules is not possible. The ONTAP REST API requires HTTP Basic authentication encoded as a Base64 string in the <code style={{ color: ACCENT }}>Authorization</code> header. The inline C# type that bypasses SSL certificate validation is for lab or development environments only — in production, import a valid certificate authority into the Windows trust store instead. The final call to <code style={{ color: ACCENT }}>/api/cluster</code> validates that authentication and network connectivity are working before you proceed to more complex operations.</p>
        </div>
        <ol className="step-list">
          <li>Set the cluster IP and encode the <code style={{ color: ACCENT }}>admin:password</code> credential pair as a Base64 string for use in the Authorization header.</li>
          <li>Build a headers hashtable that sets the Authorization, Content-Type, and Accept headers required by the ONTAP REST API.</li>
          <li>Construct the base URL variable that all subsequent REST calls will prepend.</li>
          <li>Compile and register an inline C# class that disables SSL certificate validation — strictly for non-production use.</li>
          <li>Call <code style={{ color: ACCENT }}>/api/cluster</code> to retrieve the cluster name and ONTAP version, confirming a working authenticated connection.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$ClusterIP = "192.168.1.100"
$Creds     = [Convert]::ToBase64String(
                 [Text.Encoding]::ASCII.GetBytes("admin:Password123"))
$Headers   = @{
    Authorization  = "Basic $Creds"
    "Content-Type" = "application/json"
    Accept         = "application/json"
}
$Base = "https://$ClusterIP/api"

# Bypass SSL for dev only — use proper cert in production
Add-Type @"
using System.Net; using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
public class TrustAll {
    public static void Enable() {
        ServicePointManager.ServerCertificateValidationCallback =
            (s, c, ch, e) => true;
    }
}
"@
[TrustAll]::Enable()

$cluster = Invoke-RestMethod "$Base/cluster?fields=name,version" -Headers $Headers
Write-Host "Connected: $($cluster.name)  ONTAP: $($cluster.version.full)"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Connected: cluster1  ONTAP: NetApp Release 9.13.1: Fri Sep 08 18:05:17 UTC 2023`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> GET with Pagination</h2>
        <div className="prose">
          <p>The ONTAP REST API returns results in pages of up to 1000 records. For clusters with many volumes, aggregates, or LUNs you must follow the <code style={{ color: ACCENT }}>_links.next.href</code> link in each response to retrieve the next page until no link is returned. The <code style={{ color: ACCENT }}>Get-OntapAll</code> helper function encapsulates this loop so callers can treat it as a single collection. The query hash is cleared after the first request because pagination tokens are encoded in the next href URL and must not be mixed with the original query parameters. The 100-record page size is a safe default that keeps individual responses small.</p>
        </div>
        <ol className="step-list">
          <li>Define the function accepting a relative API path and an optional query hashtable.</li>
          <li>Set <code style={{ color: ACCENT }}>max_records</code> to 100 in the query so each page is manageable in size.</li>
          <li>Initialise an empty array to accumulate records across all pages.</li>
          <li>Enter a <code style={{ color: ACCENT }}>do...while</code> loop that calls the current URL, appends returned records to the array, reads the next-page link from <code style={{ color: ACCENT }}>_links.next.href</code>, and clears the query hash so it is not re-sent on subsequent pages.</li>
          <li>Exit the loop when no next-page link is present and return the complete record array.</li>
          <li>Call the function for <code style={{ color: ACCENT }}>/storage/volumes</code> requesting specific fields to reduce response payload size.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`function Get-OntapAll {
    param([string]$Path, [hashtable]$Query = @{})
    $Query["max_records"] = 100
    $records = @()
    $url = "$Base$Path"
    do {
        $r       = Invoke-RestMethod $url -Headers $Headers -Body $Query -Method Get
        $records += $r.records
        $next    = $r._links.next.href
        $url     = if ($next) { "https://$ClusterIP$next" } else { $null }
        $Query   = @{}
    } while ($url)
    return $records
}

$vols = Get-OntapAll "/storage/volumes" @{fields="name,svm,size,state"}
Write-Host "Total volumes: $($vols.Count)"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Total volumes: 47`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> POST & Job Tracking</h2>
        <div className="prose">
          <p>Long-running ONTAP REST operations such as volume creation return an HTTP 202 Accepted response with a job reference rather than waiting for the operation to complete. The <code style={{ color: ACCENT }}>Wait-OntapJob</code> helper polls the job endpoint every three seconds until the state transitions to <code style={{ color: ACCENT }}>success</code> or <code style={{ color: ACCENT }}>failure</code>, or until the timeout expires. This pattern is essential for scripted provisioning pipelines where you need to confirm an operation completed before proceeding to the next step — for example, creating a volume before creating a LIF or export policy on top of it.</p>
        </div>
        <ol className="step-list">
          <li>Define <code style={{ color: ACCENT }}>Wait-OntapJob</code> accepting the job href and a timeout in seconds, computing a deadline timestamp.</li>
          <li>Enter a poll loop that sleeps 3 seconds between each GET to the job URL.</li>
          <li>On each poll, check if the job state is <code style={{ color: ACCENT }}>failure</code> and throw a descriptive exception if so.</li>
          <li>Continue looping while the state is not <code style={{ color: ACCENT }}>success</code> and the deadline has not passed.</li>
          <li>Build the volume creation JSON body including the SVM reference, aggregate list, and 10 GB size.</li>
          <li>POST to <code style={{ color: ACCENT }}>/storage/volumes</code> and, if a job reference is returned, call <code style={{ color: ACCENT }}>Wait-OntapJob</code> with the job href to block until the volume is fully provisioned.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`function Wait-OntapJob {
    param([string]$JobHref, [int]$TimeoutSec = 300)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $url = "https://$ClusterIP$JobHref"
    do {
        Start-Sleep -Seconds 3
        $job = Invoke-RestMethod $url -Headers $Headers
        if ($job.state -eq "failure") { throw "Job failed: $($job.message)" }
    } while ($job.state -ne "success" -and (Get-Date) -lt $deadline)
    return $job
}

$body = @{
    name       = "vol_rest_01"
    svm        = @{ name = "svm0" }
    aggregates = @(@{ name = "aggr1" })
    size       = 10GB
} | ConvertTo-Json -Depth 5

$resp = Invoke-RestMethod "$Base/storage/volumes" -Method Post -Headers $Headers -Body $body

if ($resp.job) {
    $job = Wait-OntapJob $resp.job._links.self.href
    Write-Host "Done: $($job.message)" -ForegroundColor Green
}`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Done: Volume creation completed successfully.`}</CopyBlock>
      </section>
    </>
  )
}

function AdvancedTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Scheduled Capacity Report</h2>
        <div className="prose">
          <p>This script is designed to be saved as a <code style={{ color: ACCENT }}>.ps1</code> file and executed on a schedule via Windows Task Scheduler, Jenkins, or any CI/CD platform. It accepts parameters so the same script can target different clusters and output directories without modification. The report is written as a CSV with a date-stamped filename, making it suitable for long-term capacity trend analysis when ingested into a spreadsheet or monitoring tool. The alert threshold section at the end prints only the volumes that exceed the threshold, giving on-call engineers a quick actionable view without having to scan the entire CSV.</p>
        </div>
        <ol className="step-list">
          <li>Declare script parameters for the cluster address, output directory, and warning threshold percentage with sensible defaults.</li>
          <li>Import the PSTK module and connect to the target cluster using stored credentials.</li>
          <li>Capture the current timestamp for use in the output filename.</li>
          <li>Iterate over every volume with <code style={{ color: ACCENT }}>Get-NcVol</code>, calculating usage percentage and guarding against divide-by-zero on empty volumes.</li>
          <li>Construct a <code style={{ color: ACCENT }}>PSCustomObject</code> per volume and set the <code style={{ color: ACCENT }}>Alert</code> field to <code style={{ color: ACCENT }}>&quot;YES&quot;</code> if usage meets or exceeds the threshold.</li>
          <li>Export the full collection to a date-stamped CSV in the specified output directory.</li>
          <li>Filter the report for alerted volumes, emit a warning count, and display the flagged rows as a table.</li>
          <li>Disconnect cleanly from the controller to release the session.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`# Save as Report-OntapCapacity.ps1
# Schedule via Windows Task Scheduler or Jenkins
param(
    [string]$Cluster   = "192.168.1.100",
    [string]$OutDir    = "C:\\OntapReports",
    [int]   $Threshold = 80
)

Import-Module NetApp.ONTAP
Connect-NcController -Name $Cluster -Credential (Get-Credential)

$date   = Get-Date -Format "yyyyMMdd_HHmm"
$report = Get-NcVol | ForEach-Object {
    $pct = if ($_.TotalSize -gt 0) {
               [math]::Round($_.Used / $_.TotalSize * 100, 1)
           } else { 0 }
    [PSCustomObject]@{
        Volume    = $_.Name
        SVM       = $_.Vserver
        "Size GB" = [math]::Round($_.TotalSize / 1GB, 1)
        "Used %"  = $pct
        Alert     = if ($pct -ge $Threshold) { "YES" } else { "" }
    }
}

$outFile = Join-Path $OutDir "capacity_$date.csv"
$report | Export-Csv $outFile -NoTypeInformation
Write-Host "Report saved: $outFile"

$alerts = $report | Where-Object { $_.Alert -eq "YES" }
if ($alerts) {
    Write-Warning "$($alerts.Count) volume(s) above \${Threshold}%"
    $alerts | Format-Table -AutoSize
}

Disconnect-NcController`}</CopyBlock>
        {/* eslint-disable-next-line no-useless-escape */}
        <CopyBlock lang="output" langColor={ACCENT}>{`Report saved: C:\OntapReports\capacity_20240916_0600.csv
WARNING: 2 volume(s) above 80%

Volume       SVM    Size GB  Used %  Alert
------       ---    -------  ------  -----
vol_data_02  svm0   200.0    87.3    YES
vol_logs_01  svm0   50.0     91.5    YES`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Error Handling Pattern</h2>
        <div className="prose">
          <p>Unhandled exceptions in storage automation scripts can leave resources in a partially-configured state and make post-mortem investigation difficult. The <code style={{ color: ACCENT }}>Invoke-OntapOperation</code> wrapper function addresses this by capturing the result of every operation — success or failure — into a timestamped log file. The <code style={{ color: ACCENT }}>-ErrorAction Stop</code> on the inner cmdlet is critical: without it, many PSTK cmdlets emit non-terminating errors that PowerShell's <code style={{ color: ACCENT }}>try/catch</code> block does not intercept. This pattern is composable — you can call it for any ONTAP operation and the logging behaviour is consistent throughout the script.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`function Invoke-OntapOperation {
    param(
        [string]      $Description,
        [scriptblock] $Operation,
        [string]      $LogFile = "ontap_ops.log"
    )
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        & $Operation
        "$ts  [OK]  $Description" | Add-Content $LogFile
        Write-Host "[OK] $Description" -ForegroundColor Green
    }
    catch {
        "$ts [ERR] $Description -- $($_.Exception.Message)" | Add-Content $LogFile
        Write-Host "[ERR] $Description" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)"
    }
}

# Usage
Invoke-OntapOperation "Create vol_app_01" {
    New-NcVol -Name "vol_app_01" -Vserver "svm0" \`
              -Aggregate "aggr1" -Size "50g" -ErrorAction Stop
}`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`[OK] Create vol_app_01

# ontap_ops.log
2024-09-16 07:14:32  [OK]  Create vol_app_01`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> RBAC — Custom Read-Only Role</h2>
        <div className="prose">
          <p>Principle of least privilege is especially important in storage environments where a misconfigured or compromised credential could delete terabytes of data. This script creates a custom ONTAP role named <code style={{ color: ACCENT }}>monitoring_ro</code> that grants read-only access to only the four commands needed by a monitoring service, then creates a dedicated service account bound to that role. The account uses ontapi authentication (PSTK/ZAPI) with a password; for REST-based monitoring tools, substitute <code style={{ color: ACCENT }}>http</code> for the <code style={{ color: ACCENT }}>-Application</code> parameter. Never use the <code style={{ color: ACCENT }}>admin</code> account for automated monitoring — it has unrestricted access and its credentials appearing in scripts poses an unacceptable security risk.</p>
        </div>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$commands = @("volume show", "snapmirror show", "aggregate show", "vserver show")

foreach ($cmd in $commands) {
    New-NcRole \`
        -Role    "monitoring_ro" \`
        -Vserver "cluster1" \`
        -Command $cmd \`
        -Access  readonly
}

New-NcUser \`
    -UserName    "monitor_svc" \`
    -Vserver     "cluster1" \`
    -Application ontapi \`
    -AuthMethod  password \`
    -Role        "monitoring_ro"

Write-Host "Read-only monitoring user created" -ForegroundColor Green`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Role           : monitoring_ro
Vserver        : cluster1
Command        : volume show
Access         : readonly

Role           : monitoring_ro
Vserver        : cluster1
Command        : snapmirror show
Access         : readonly

Role           : monitoring_ro
Vserver        : cluster1
Command        : aggregate show
Access         : readonly

Role           : monitoring_ro
Vserver        : cluster1
Command        : vserver show
Access         : readonly

UserName       : monitor_svc
Vserver        : cluster1
Application    : ontapi
AuthMethod     : password
Role           : monitoring_ro

Read-only monitoring user created`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Inventory Export to CSV</h2>
        <div className="prose">
          <p>A unified inventory export collects volumes and aggregates into a single CSV file using a consistent schema. This is useful for asset management systems, capacity planning spreadsheets, and compliance audits that need a complete picture of what is provisioned on the cluster at a point in time. Both object types share the same five columns — <code style={{ color: ACCENT }}>Type</code>, <code style={{ color: ACCENT }}>Name</code>, <code style={{ color: ACCENT }}>SVM</code>, <code style={{ color: ACCENT }}>Size GB</code>, <code style={{ color: ACCENT }}>State</code> — making it straightforward to import into a database table or pivot table. The date stamp in the filename allows historical snapshots to accumulate without overwriting each other.</p>
        </div>
        <ol className="step-list">
          <li>Generate the output filename with an embedded date stamp to distinguish daily exports.</li>
          <li>Initialise an empty array that will hold rows from multiple object types.</li>
          <li>Query all volumes with <code style={{ color: ACCENT }}>Get-NcVol</code>, map each to a <code style={{ color: ACCENT }}>PSCustomObject</code> with the shared schema, and append to the rows array.</li>
          <li>Query all aggregates with <code style={{ color: ACCENT }}>Get-NcAggr</code>, extract the size from the nested <code style={{ color: ACCENT }}>AggregateSpaceAttributes</code> object, and append to the same rows array.</li>
          <li>Export the combined array to CSV without PowerShell type metadata using <code style={{ color: ACCENT }}>-NoTypeInformation</code>.</li>
          <li>Print a summary line showing the total record count and file path.</li>
        </ol>
        <CopyBlock lang="powershell" langColor={ACCENT}>{`$file = "ontap_inventory_$(Get-Date -Format yyyyMMdd).csv"

$rows = @()
$rows += Get-NcVol | ForEach-Object {
    [PSCustomObject]@{
        Type      = "Volume"
        Name      = $_.Name
        SVM       = $_.Vserver
        "Size GB" = [math]::Round($_.TotalSize / 1GB, 1)
        State     = $_.State
    }
}
$rows += Get-NcAggr | ForEach-Object {
    [PSCustomObject]@{
        Type      = "Aggregate"
        Name      = $_.Name
        SVM       = $_.OwningVserverName
        "Size GB" = [math]::Round($_.AggregateSpaceAttributes.SizeTotal / 1GB, 1)
        State     = $_.AggregateStateAttributes.State
    }
}

$rows | Export-Csv $file -NoTypeInformation
Write-Host "Exported $($rows.Count) records to $file"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Type        Name           SVM    Size GB  State
----        ----           ---    -------  -----
Volume      vol_data_01    svm0   100.0    online
Volume      vol_data_02    svm0   200.0    online
Volume      vol_logs_01    svm0   50.0     online
Volume      svm0_root      svm0   1.0      online
Aggregate   aggr1          node01 12288.0  online
Aggregate   aggr2          node02 8192.0   online
Aggregate   aggr3          node01 4096.0   online

Exported 7 records to ontap_inventory_20240916.csv`}</CopyBlock>
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

export default function PowerShell() {
  const [active, setActive] = useState('setup')

  return (
    <main className="main-content">
      <SEO
        title="NetApp PowerShell Automation Scripts | DevOps & Storage | NetApp Hub"
        description="PowerShell automation scripts for NetApp ONTAP — volumes, snapshots, SVM, SnapMirror, REST API and advanced patterns."
        keywords="NetApp PowerShell, Automation Scripts, ONTAP, DevOps, Storage Automation"
        canonical="/powershell"
        ogTitle="NetApp PowerShell Automation Scripts"
        ogDescription="Automation scripts for NetApp storage using PowerShell."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: ACCENT, background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)' }}>PowerShell</div>
        <h1 className="page-title">PowerShell Automation</h1>
        <p className="page-subtitle">Scripts using the NetApp PowerShell Toolkit (PSTK) and direct REST via Invoke-RestMethod. Covers volumes, snapshots, SVM, SnapMirror, and advanced patterns.</p>
      </header>

      <SubNav tabs={TABS} active={active} onChange={setActive} accent={ACCENT} />

      {TAB_CONTENT[active]}
    </main>
  )
}
