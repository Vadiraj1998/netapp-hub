import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyBlock from '../components/CopyBlock'
import SEO from '../components/SEO'

function SNum({ num }) {
  return (
    <span className="section-num" style={{ color: 'var(--accent-ps)', background: 'rgba(123,97,255,0.08)', borderColor: 'rgba(123,97,255,0.2)' }}>
      {num}
    </span>
  )
}

export default function PowerShell() {
  return (
    <main className="main-content">
      <SEO
        title="NetApp PowerShell Automation Scripts | DevOps & Storage | NetApp Hub"
        description="PowerShell automation scripts for NetApp storage, ONTAP operations, and DevOps workflows."
        keywords="NetApp PowerShell, Automation Scripts, ONTAP, DevOps, Storage Automation"
        canonical="/powershell"
        ogTitle="NetApp PowerShell Automation Scripts"
        ogDescription="Automation scripts for NetApp storage using PowerShell."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: 'var(--accent-ps)', background: 'rgba(123,97,255,0.08)', borderColor: 'rgba(123,97,255,0.25)' }}>PowerShell</div>
        <h1 className="page-title">PowerShell Automation</h1>
        <p className="page-subtitle">Scripts using the NetApp PowerShell Toolkit (PSTK) and direct REST API calls via Invoke-RestMethod for ONTAP management.</p>
      </header>

      {/* 01 Install PSTK */}
      <section className="content-section">
        <h2 className="section-title" id="install-netapp-powershell-toolkit"><SNum num="01" /> Install NetApp PowerShell Toolkit</h2>
        <div className="prose">
          <p>The NetApp PowerShell Toolkit (PSTK) is available on the PowerShell Gallery. It provides ONTAP-specific cmdlets wrapping both REST and ZAPI endpoints.</p>
        </div>
        <CopyBlock lang="powershell" langColor="var(--accent-py)">{`# Install from PowerShell Gallery
Install-Module -Name NetApp.ONTAP -Scope CurrentUser

# Import the module
Import-Module NetApp.ONTAP

# Verify installation
Get-Command -Module NetApp.ONTAP | Select-Object -First 10`}</CopyBlock>
      </section>

      {/* 02 Connect */}
      <section className="content-section">
        <h2 className="section-title" id="connect-to-ontap-cluster"><SNum num="02" /> Connect to ONTAP Cluster</h2>
        <CopyBlock lang="powershell" langColor="var(--accent-py)">{`$ClusterIP   = "192.168.1.100"
$Credentials = Get-Credential  # Prompts securely

# Connect — skipping cert check (use -Https with valid cert in prod)
Connect-NcController -Name $ClusterIP -Credential $Credentials

# Verify connection
Get-NcController`}</CopyBlock>
      </section>

      {/* 03 Volume Operations */}
      <section className="content-section">
        <h2 className="section-title" id="volume-operations"><SNum num="03" /> Volume Operations</h2>
        <CopyBlock lang="powershell · List Volumes" langColor="var(--accent-py)">{`# All volumes
Get-NcVol

# Filtered by SVM with selected properties
Get-NcVol -Vserver "svm0" |
    Select-Object Name, TotalSize, Used, State |
    Format-Table -AutoSize

# Export to CSV for reporting
Get-NcVol |
    Select-Object Name, TotalSize, Used, Vserver, State |
    Export-Csv -Path "volumes_$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation`}</CopyBlock>

        <CopyBlock lang="powershell · Create Volume" langColor="var(--accent-py)">{`New-NcVol \`
    -Name      "my_new_vol" \`
    -Vserver   "svm0" \`
    -Aggregate "aggr1" \`
    -Size      "10g" \`
    -JunctionPath "/my_new_vol" \`
    -SpaceReserve "none"

Write-Host "Volume created successfully" -ForegroundColor Green`}</CopyBlock>

        <CopyBlock lang="powershell · Resize Volume" langColor="var(--accent-py)">{`# Resize to 20 GB
Set-NcVolSize -Name "my_new_vol" -Vserver "svm0" -NewSize "20g"

# Verify
Get-NcVol -Name "my_new_vol" | Select-Object Name, TotalSize`}</CopyBlock>
      </section>

      {/* 04 Snapshots */}
      <section className="content-section">
        <h2 className="section-title" id="snapshot-management"><SNum num="04" /> Snapshot Management</h2>
        <CopyBlock lang="powershell" langColor="var(--accent-py)">{`# Create a snapshot
New-NcSnapshot -VolumeName "my_vol" -SnapshotName "snap_20240801"

# List snapshots for a volume
Get-NcSnapshot -VolumeName "my_vol" |
    Select-Object Name, Created |
    Format-Table -AutoSize

# Delete a snapshot
Remove-NcSnapshot -VolumeName "my_vol" -SnapshotName "snap_old"

# Bulk cleanup: delete snapshots older than 30 days
$cutoff = (Get-Date).AddDays(-30)
Get-NcSnapshot -VolumeName "my_vol" |
    Where-Object { $_.Created -lt $cutoff } |
    ForEach-Object { Remove-NcSnapshot -VolumeName "my_vol" -SnapshotName $_.Name }`}</CopyBlock>
      </section>

      {/* 05 Direct REST */}
      <section className="content-section">
        <h2 className="section-title" id="invoke-restmethod-direct-api"><SNum num="05" /> Invoke-RestMethod (Direct API)</h2>
        <div className="prose">
          <p>Use <code style={{ color: 'var(--accent-ps)' }}>Invoke-RestMethod</code> to call ONTAP REST endpoints without PSTK — great for newer endpoints or CI/CD pipelines where installing PSTK isn't ideal.</p>
        </div>
        <CopyBlock lang="powershell" langColor="var(--accent-py)">{`$base    = "https://192.168.1.100/api"
$creds   = [Convert]::ToBase64String(
              [Text.Encoding]::ASCII.GetBytes("admin:Password123"))
$headers = @{
    Authorization  = "Basic $creds"
    "Content-Type" = "application/json"
}

# Skip SSL verify (dev only)
if (-not ([System.Management.Automation.PSTypeName]'TrustAll').Type) {
    Add-Type @"
using System.Net; using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
public class TrustAll {
    public static void SetCallback() {
        ServicePointManager.ServerCertificateValidationCallback =
            (s,c,ch,e) => true;
    }
}
"@
    [TrustAll]::SetCallback()
}

# Get cluster info
$result = Invoke-RestMethod "$base/cluster?fields=name,version" -Headers $headers
Write-Host "Cluster: $($result.name) | ONTAP: $($result.version.full)"

# List volumes via REST
$vols = Invoke-RestMethod "$base/storage/volumes?fields=name,state,size" -Headers $headers
$vols.records | Format-Table name, state, size`}</CopyBlock>
      </section>

      {/* 06 Error Handling */}
      <section className="content-section">
        <h2 className="section-title" id="error-handling"><SNum num="06" /> Error Handling</h2>
        <CopyBlock lang="powershell" langColor="var(--accent-py)">{`try {
    New-NcVol -Name "test_vol" -Vserver "svm0" \`
              -Aggregate "aggr1" -Size "5g" -ErrorAction Stop

    Write-Host "[OK] Volume created" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    # Log to file
    $_ | Out-File -FilePath "errors.log" -Append
}
finally {
    Disconnect-NcController
}`}</CopyBlock>
      </section>
    </main>
  )
}