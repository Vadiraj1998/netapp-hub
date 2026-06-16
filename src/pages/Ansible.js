import { useState } from 'react'
import CopyBlock from '../components/CopyBlock'
import SubNav from '../components/SubNav'
import SEO from '../components/SEO'

const ACCENT = 'var(--accent-cmd)'
const TABS = [
  { id: 'setup',      label: 'Setup' },
  { id: 'volumes',    label: 'Volumes' },
  { id: 'snapshots',  label: 'Snapshots' },
  { id: 'svm',        label: 'SVM' },
  { id: 'snapmirror', label: 'SnapMirror' },
  { id: 'cicd',       label: 'CI/CD' },
]

function SNum({ num }) {
  return (
    <span className="section-num" style={{ color: ACCENT, background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
      {num}
    </span>
  )
}

function SetupTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Install the Collection</h2>
        <div className="prose">
          <p>The <code style={{ color: ACCENT }}>netapp.ontap</code> Ansible collection is published on Ansible Galaxy. It provides over 100 modules covering all major ONTAP operations. Install it once per control node; pin the version in a <code style={{ color: ACCENT }}>requirements.yml</code> file so every team member and CI runner uses the same release. The <code style={{ color: ACCENT }}>netapp-lib</code> Python package is also required at runtime because the modules use it to communicate with the ONTAP REST API or ZAPI layer.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`# Install the NetApp ONTAP collection
ansible-galaxy collection install netapp.ontap

# Or pin to a specific version
ansible-galaxy collection install netapp.ontap:==22.8.0

# Verify
ansible-galaxy collection list | grep netapp`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`# ansible-galaxy collection list | grep netapp
Collection      Version
--------------- -------
netapp.ontap    22.8.0`}</CopyBlock>

        <CopyBlock lang="bash · requirements.yml" langColor={ACCENT}>{`# requirements.yml — commit this to your repo
collections:
  - name: netapp.ontap
    version: ">=22.0.0"

# Install from file
ansible-galaxy collection install -r requirements.yml`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Starting galaxy collection install process
Process install dependency map
Starting collection install process
Downloading https://galaxy.ansible.com/download/netapp-ontap-22.8.0.tar.gz
Installing 'netapp.ontap:22.8.0' to '/root/.ansible/collections/ansible_collections/netapp/ontap'
netapp.ontap:22.8.0 was installed successfully`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Inventory & Variables</h2>
        <div className="prose">
          <p>ONTAP modules run on the Ansible control node and talk to the cluster management LIF over HTTPS — they do not SSH into the storage node. That is why <code style={{ color: ACCENT }}>ansible_connection: local</code> is set for the group. Keep sensitive values (passwords) out of the inventory file itself; reference them through Ansible Vault variables such as <code style={{ color: ACCENT }}>vault_ontap_password</code> instead.</p>
        </div>
        <CopyBlock lang="bash · inventory.yml" langColor={ACCENT}>{`all:
  children:
    ontap_clusters:
      hosts:
        cluster_prod:
          ansible_host: 192.168.1.100
        cluster_dr:
          ansible_host: 192.168.2.100
      vars:
        ansible_connection:        local
        ontap_username:            admin
        ontap_password:            "{{ vault_ontap_password }}"
        ontap_https:               true
        ontap_validate_certs:      false`}</CopyBlock>

        <CopyBlock lang="bash · group_vars/ontap_clusters.yml" langColor={ACCENT}>{`# Common connection vars (non-secret)
ontap_https:          true
ontap_validate_certs: false
ontap_use_rest:       always      # force REST — no ZAPI fallback

# Defaults
default_svm:       svm0
default_aggregate: aggr1`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Vault for Credentials</h2>
        <div className="prose">
          <p>Never store plaintext passwords in your repository. Ansible Vault AES-256 encrypts secret files so they can be safely committed alongside your playbooks. A vault password file on disk (outside the repo, mode 0600) is convenient for automation pipelines; in CI/CD environments the vault password is typically injected via a secret environment variable or a secrets manager. Rotate vault passwords periodically and re-encrypt with <code style={{ color: ACCENT }}>ansible-vault rekey</code>.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`# Encrypt the password file
ansible-vault create group_vars/all/vault.yml

# Contents of vault.yml (after decrypt)
# vault_ontap_password: "YourSecurePassword"

# Run a playbook with vault
ansible-playbook site.yml --ask-vault-pass

# Or use a vault password file
ansible-playbook site.yml --vault-password-file ~/.vault_pass`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`Vault password:
PLAY [ONTAP Infrastructure State] *********************************************

TASK [Verify cluster reachable] ***********************************************
ok: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=0  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> ansible.cfg</h2>
        <div className="prose">
          <p>Place <code style={{ color: ACCENT }}>ansible.cfg</code> in the root of your project directory. Ansible reads the closest configuration file relative to the playbook being run. Setting <code style={{ color: ACCENT }}>stdout_callback = yaml</code> produces human-readable task output. Disabling <code style={{ color: ACCENT }}>retry_files_enabled</code> prevents cluttering the working directory with <code style={{ color: ACCENT }}>.retry</code> files after failures. The <code style={{ color: ACCENT }}>become = false</code> setting is correct here because ONTAP modules authenticate through the API, not through OS privilege escalation.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`[defaults]
inventory          = inventory.yml
collections_paths  = ~/.ansible/collections
host_key_checking  = False
retry_files_enabled = False
stdout_callback    = yaml

[privilege_escalation]
become = false`}</CopyBlock>
      </section>
    </>
  )
}

function VolumesTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Create Volume</h2>
        <div className="prose">
          <p>The <code style={{ color: ACCENT }}>na_ontap_volume</code> module is idempotent: if the volume already exists with the correct parameters, the task reports <code style={{ color: ACCENT }}>ok</code> with no change. Setting <code style={{ color: ACCENT }}>space_guarantee: none</code> creates a thin-provisioned volume, which is the recommended default for most workloads on modern all-flash arrays. The <code style={{ color: ACCENT }}>junction_path</code> immediately mounts the volume in the SVM namespace so NFS clients can reach it without a separate mount task. Keep the volume name, SVM, and aggregate in variables so the same playbook can be re-used across environments by overriding them at run time.</p>
        </div>
        <CopyBlock lang="bash · create_volume.yml" langColor={ACCENT}>{`- name: Create ONTAP volume
  hosts: cluster_prod
  gather_facts: false
  collections:
    - netapp.ontap

  vars:
    vol_name:      vol_app_01
    vol_svm:       svm0
    vol_aggregate: aggr1
    vol_size:      100
    vol_size_unit: gb

  tasks:
    - name: Create FlexVol
      na_ontap_volume:
        state:          present
        name:           "{{ vol_name }}"
        vserver:        "{{ vol_svm }}"
        aggregate_name: "{{ vol_aggregate }}"
        size:           "{{ vol_size }}"
        size_unit:      "{{ vol_size_unit }}"
        junction_path:  "/{{ vol_name }}"
        space_guarantee: none
        percent_snapshot_space: 5
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          "{{ ontap_https }}"
        validate_certs: "{{ ontap_validate_certs }}"
      register: vol_result

    - name: Print result
      debug:
        msg: "Volume {{ vol_name }} created successfully"`}</CopyBlock>
        <ol className="step-list">
          <li>The play targets <code style={{ color: ACCENT }}>cluster_prod</code> from the inventory. <code style={{ color: ACCENT }}>gather_facts: false</code> skips the default system fact collection because ONTAP modules do not need OS facts.</li>
          <li>Variables define the volume name, owning SVM, aggregate, and size. Overriding these at the command line with <code style={{ color: ACCENT }}>-e</code> is the primary way to reuse the playbook without editing the file.</li>
          <li><code style={{ color: ACCENT }}>na_ontap_volume</code> contacts the cluster management LIF over HTTPS and creates the FlexVol. The result object is captured with <code style={{ color: ACCENT }}>register: vol_result</code> for downstream tasks or notification steps.</li>
          <li>The debug task prints a confirmation message. In production pipelines replace this with a notification module (Teams, Slack, ServiceNow) to create a change record.</li>
        </ol>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create ONTAP volume] *****************************************************

TASK [Create FlexVol] *********************************************************
changed: [cluster_prod]

TASK [Print result] ***********************************************************
ok: [cluster_prod] => {
    "msg": "Volume vol_app_01 created successfully"
}

PLAY RECAP ********************************************************************
cluster_prod : ok=2  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Modify Volume</h2>
        <div className="prose">
          <p>Use the same <code style={{ color: ACCENT }}>na_ontap_volume</code> module with <code style={{ color: ACCENT }}>state: present</code> to resize or change volume settings. ONTAP will only apply the parameters that differ from the current state, so it is safe to run this task repeatedly. Enabling the <code style={{ color: ACCENT }}>efficiency_policy: default</code> activates inline deduplication and compression, which can significantly reduce capacity consumption on all-flash systems without impacting throughput. The <code style={{ color: ACCENT }}>tiering_policy: auto</code> setting moves cold data to a capacity tier (FabricPool) automatically.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Resize and tune volume
  na_ontap_volume:
    state:          present
    name:           vol_app_01
    vserver:        svm0
    size:           200
    size_unit:      gb
    efficiency_policy: default      # enables dedup + compression
    tiering_policy: auto
    hostname:       "{{ ansible_host }}"
    username:       "{{ ontap_username }}"
    password:       "{{ ontap_password }}"
    https:          true
    validate_certs: false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Resize and tune volume] *************************************************

TASK [Resize and tune volume] *************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Delete Volume</h2>
        <div className="prose">
          <p>Setting <code style={{ color: ACCENT }}>state: absent</code> removes the volume. ONTAP will first unmount the volume from the namespace, then offline it, and finally delete it. Snapshots inside the volume are also removed unless a SnapMirror relationship or a clone depends on them, in which case the module will return an error. Add a pre-task that checks for active relationships before running this in production to avoid accidental data loss. This operation is not reversible once complete.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Remove volume
  na_ontap_volume:
    state:          absent
    name:           vol_app_01
    vserver:        svm0
    hostname:       "{{ ansible_host }}"
    username:       "{{ ontap_username }}"
    password:       "{{ ontap_password }}"
    https:          true
    validate_certs: false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Remove volume] **********************************************************

TASK [Remove volume] **********************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Provision Multiple Volumes from a List</h2>
        <div className="prose">
          <p>Ansible's <code style={{ color: ACCENT }}>loop</code> directive iterates over a list and calls the module once per item. This pattern is ideal for bulk provisioning — for example, deploying all volumes for a new application stack in a single playbook run. The <code style={{ color: ACCENT }}>loop_control.label</code> setting replaces the default (and verbose) loop variable dump in the output with just the volume name, making the run log much easier to read. Because ONTAP's REST API is stateless, each loop iteration is independent; a failure on one volume does not roll back volumes already created.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Provision volume list
  hosts: cluster_prod
  gather_facts: false
  collections: [netapp.ontap]

  vars:
    volumes:
      - { name: vol_db_01,  size: 500, svm: svm_db }
      - { name: vol_db_02,  size: 500, svm: svm_db }
      - { name: vol_log_01, size: 100, svm: svm_db }
      - { name: vol_app_01, size: 200, svm: svm_app }

  tasks:
    - name: Create volumes
      na_ontap_volume:
        state:          present
        name:           "{{ item.name }}"
        vserver:        "{{ item.svm }}"
        aggregate_name: aggr1
        size:           "{{ item.size }}"
        size_unit:      gb
        junction_path:  "/{{ item.name }}"
        space_guarantee: none
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      loop: "{{ volumes }}"
      loop_control:
        label: "{{ item.name }}"`}</CopyBlock>
        <ol className="step-list">
          <li>The <code style={{ color: ACCENT }}>volumes</code> variable holds a list of dictionaries. Each dictionary carries the volume name, size, and target SVM, making the list the single source of truth for this provisioning run.</li>
          <li>The <code style={{ color: ACCENT }}>loop</code> directive feeds each dictionary into the module as <code style={{ color: ACCENT }}>item</code>. Ansible executes the module call sequentially for each entry by default; add <code style={{ color: ACCENT }}>async</code> and <code style={{ color: ACCENT }}>poll</code> parameters to parallelise large lists.</li>
          <li><code style={{ color: ACCENT }}>loop_control.label</code> keeps log output concise — only the volume name is printed per iteration instead of the full variable dictionary.</li>
          <li>Because the module is idempotent, re-running the playbook after a partial failure only creates the volumes that are still missing; already-created volumes report <code style={{ color: ACCENT }}>ok</code> with no change.</li>
        </ol>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Provision volume list] **************************************************

TASK [Create volumes] *********************************************************
changed: [cluster_prod] => (item=vol_db_01)
changed: [cluster_prod] => (item=vol_db_02)
changed: [cluster_prod] => (item=vol_log_01)
changed: [cluster_prod] => (item=vol_app_01)

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
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
          <p>The <code style={{ color: ACCENT }}>na_ontap_snapshot</code> module creates a point-in-time, read-only image of a volume. ONTAP snapshots are space-efficient — they consume capacity only for blocks that change after the snapshot is taken. The example below uses the Ansible date/time fact to generate a datestamp name automatically; the <code style={{ color: ACCENT }}>replace('-','') </code> filter strips dashes so the name matches ONTAP's naming constraints. Use this pattern in a scheduled job (cron or CI/CD) to replace manual snapshot workflows. Note that <code style={{ color: ACCENT }}>gather_facts: false</code> is set at the play level, so you must explicitly call <code style={{ color: ACCENT }}>setup</code> or use the <code style={{ color: ACCENT }}>ansible_date_time</code> magic variable sourced from the control node if needed.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Create snapshot
  hosts: cluster_prod
  gather_facts: false
  collections: [netapp.ontap]

  tasks:
    - name: Take snapshot
      na_ontap_snapshot:
        state:       present
        snapshot:    "snap_{{ ansible_date_time.date | replace('-','') }}"
        volume:      vol_app_01
        vserver:     svm0
        comment:     "Daily automated snapshot via Ansible"
        hostname:    "{{ ansible_host }}"
        username:    "{{ ontap_username }}"
        password:    "{{ ontap_password }}"
        https:       true
        validate_certs: false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create snapshot] ********************************************************

TASK [Take snapshot] **********************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Snapshot Policy</h2>
        <div className="prose">
          <p>A snapshot policy defines multiple schedules and retention counts in a single object that can be attached to any number of volumes. Managing the policy through Ansible rather than through the ONTAP CLI or System Manager ensures that every SVM gets the same protection profile and that changes are tracked in version control. The <code style={{ color: ACCENT }}>schedules</code> list maps named ONTAP schedules (daily, weekly, monthly) to a maximum snapshot count; older snapshots beyond the count are automatically deleted by ONTAP to free space. Attach the policy to a volume by setting <code style={{ color: ACCENT }}>snapshot_policy</code> inside <code style={{ color: ACCENT }}>na_ontap_volume</code>.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Create snapshot policy
  na_ontap_snapshot_policy:
    state:   present
    name:    daily_weekly_policy
    enabled: true
    schedules:
      - schedule_name: daily
        count: 7
      - schedule_name: weekly
        count: 4
      - schedule_name: monthly
        count: 3
    vserver:        cluster1
    hostname:       "{{ ansible_host }}"
    username:       "{{ ontap_username }}"
    password:       "{{ ontap_password }}"
    https:          true
    validate_certs: false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create snapshot policy] *************************************************

TASK [Create snapshot policy] *************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Delete Snapshot</h2>
        <div className="prose">
          <p>Removing a snapshot with <code style={{ color: ACCENT }}>state: absent</code> frees the blocks that are unique to that snapshot and not referenced by any later snapshot or the active file system. This is useful for cleaning up snapshots that were created outside of the policy schedule — for example, pre-upgrade snapshots that are no longer needed. Attempting to delete a snapshot that is a SnapMirror baseline or that is referenced by a FlexClone will fail; resolve those dependencies first. If the snapshot does not exist the task reports <code style={{ color: ACCENT }}>ok</code> (already absent) rather than failing, maintaining idempotency.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Remove old snapshot
  na_ontap_snapshot:
    state:       absent
    snapshot:    snap_20240101
    volume:      vol_app_01
    vserver:     svm0
    hostname:    "{{ ansible_host }}"
    username:    "{{ ontap_username }}"
    password:    "{{ ontap_password }}"
    https:       true
    validate_certs: false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Remove old snapshot] ****************************************************

TASK [Remove old snapshot] ****************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>
    </>
  )
}

function SvmTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Create SVM</h2>
        <div className="prose">
          <p>An SVM (Storage Virtual Machine) is the logical tenant boundary in ONTAP — it has its own namespace, protocols, network interfaces, and security policies. The <code style={{ color: ACCENT }}>na_ontap_svm</code> module creates the SVM shell; subsequent tasks layer on protocol configuration, LIFs, and volumes. The <code style={{ color: ACCENT }}>root_volume_security_style</code> should match the primary client OS: <code style={{ color: ACCENT }}>unix</code> for Linux/NFS environments and <code style={{ color: ACCENT }}>ntfs</code> for Windows/SMB. Restrict <code style={{ color: ACCENT }}>allowed_protocols</code> to only the protocols you intend to use — enabling unused protocols increases the attack surface.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Create SVM
  na_ontap_svm:
    state:              present
    name:               svm_prod_01
    root_volume:        svm_prod_01_root
    root_volume_aggregate: aggr1
    root_volume_security_style: unix
    allowed_protocols:  [nfs, iscsi]
    language:           en_us.utf_8
    hostname:           "{{ ansible_host }}"
    username:           "{{ ontap_username }}"
    password:           "{{ ontap_password }}"
    https:              true
    validate_certs:     false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create SVM] *************************************************************

TASK [Create SVM] *************************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Configure NFS</h2>
        <div className="prose">
          <p>After creating the SVM, NFS must be explicitly enabled and at least one export policy rule must allow clients to mount volumes. The example below enables NFSv3, NFSv4, and NFSv4.1 (pNFS) in a single task and then creates a permissive export rule for a trusted subnet. In production, tighten the <code style={{ color: ACCENT }}>client_match</code> CIDR to the smallest necessary range and restrict <code style={{ color: ACCENT }}>rw_rule</code> to <code style={{ color: ACCENT }}>krb5</code> or <code style={{ color: ACCENT }}>sys</code> based on your security requirements. Run both tasks together so the SVM is fully ready for client traffic in a single playbook execution.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Enable NFS on SVM
  na_ontap_nfs:
    state:           present
    vserver:         svm_prod_01
    service_state:   started
    nfsv3:           enabled
    nfsv4:           enabled
    nfsv41:          enabled
    hostname:        "{{ ansible_host }}"
    username:        "{{ ontap_username }}"
    password:        "{{ ontap_password }}"
    https:           true
    validate_certs:  false

- name: Create export policy rule
  na_ontap_export_policy_rule:
    state:           present
    name:            default
    vserver:         svm_prod_01
    client_match:    192.168.10.0/24
    ro_rule:         any
    rw_rule:         any
    super_user_security: sys
    hostname:        "{{ ansible_host }}"
    username:        "{{ ontap_username }}"
    password:        "{{ ontap_password }}"
    https:           true
    validate_certs:  false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Configure NFS] **********************************************************

TASK [Enable NFS on SVM] ******************************************************
changed: [cluster_prod]

TASK [Create export policy rule] **********************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=2  changed=2  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Create LIF</h2>
        <div className="prose">
          <p>A Logical Interface (LIF) is the IP endpoint that clients connect to for data access. Each LIF belongs to a specific SVM and binds to a home node and port. Setting <code style={{ color: ACCENT }}>is_auto_revert: true</code> ensures that after a failover event the LIF migrates back to its home port automatically once the node is healthy again, keeping the network topology consistent with your design. Create one data LIF per node in the SVM to allow client connections even if a node goes offline; ONTAP will migrate the LIF to a surviving port on another node automatically during an outage.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Create data LIF
  na_ontap_interface:
    state:                present
    interface_name:       lif_nfs_01
    vserver:              svm_prod_01
    role:                 data
    protocols:            [nfs]
    home_node:            node01
    home_port:            e0c
    address:              192.168.10.50
    netmask:              255.255.255.0
    is_auto_revert:       true
    hostname:             "{{ ansible_host }}"
    username:             "{{ ontap_username }}"
    password:             "{{ ontap_password }}"
    https:                true
    validate_certs:       false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create data LIF] ********************************************************

TASK [Create data LIF] ********************************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>
    </>
  )
}

function SnapMirrorTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> Create Relationship</h2>
        <div className="prose">
          <p>SnapMirror replicates volume data from a source to a destination, typically on a separate cluster or SVM, to provide disaster recovery or data distribution. The <code style={{ color: ACCENT }}>na_ontap_snapmirror</code> module creates the relationship object and, when <code style={{ color: ACCENT }}>initialize: true</code> is set, immediately triggers the baseline transfer which copies all existing data to the destination. The baseline can take minutes to hours depending on volume size and network bandwidth — monitor progress in ONTAP System Manager or with the <code style={{ color: ACCENT }}>snapmirror show</code> CLI command. The <code style={{ color: ACCENT }}>MirrorAllSnapshots</code> policy replicates every snapshot created on the source, not just the ones defined in the SnapMirror schedule.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Create SnapMirror relationship
  na_ontap_snapmirror:
    state:                  present
    source_path:            svm_src:vol_data_01
    destination_path:       svm_dst:vol_data_01_dr
    policy:                 MirrorAllSnapshots
    schedule:               hourly
    initialize:             true          # triggers baseline transfer
    hostname:               "{{ ansible_host }}"
    username:               "{{ ontap_username }}"
    password:               "{{ ontap_password }}"
    https:                  true
    validate_certs:         false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Create SnapMirror relationship] *****************************************

TASK [Create SnapMirror relationship] *****************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Update Relationship</h2>
        <div className="prose">
          <p>An on-demand SnapMirror update transfers only the blocks that changed since the last successful transfer — this incremental approach is very fast for regularly updated relationships. Triggering an update before a planned maintenance window or before a failover test ensures the destination is as current as possible, minimising the recovery point objective (RPO). The <code style={{ color: ACCENT }}>update: true</code> flag tells the module to initiate a transfer even if the schedule has not yet fired. This task is safe to run at any time; if a transfer is already in progress ONTAP queues the request.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Trigger SnapMirror update
  na_ontap_snapmirror:
    state:            present
    destination_path: svm_dst:vol_data_01_dr
    update:           true
    hostname:         "{{ ansible_host }}"
    username:         "{{ ontap_username }}"
    password:         "{{ ontap_password }}"
    https:            true
    validate_certs:   false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Trigger SnapMirror update] **********************************************

TASK [Trigger SnapMirror update] **********************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Break & Resync</h2>
        <div className="prose">
          <p>Breaking a SnapMirror relationship transitions the destination volume from read-only (DP) to read-write, allowing clients to mount it during a failover. The break operation does not delete any data; it simply stops replication and unlocks the destination. After the failover incident is resolved and the source is healthy again, a resync reverses the relationship direction to replicate any writes made to the former destination back to the source — this is how you fail back without losing data written during the outage. Always coordinate these steps with application teams to avoid split-brain scenarios.</p>
        </div>
        <CopyBlock lang="bash · Break (failover)" langColor={ACCENT}>{`- name: Break SnapMirror for failover
  na_ontap_snapmirror:
    state:            present
    relationship_state: broken-off
    destination_path: svm_dst:vol_data_01_dr
    hostname:         "{{ ansible_host }}"
    username:         "{{ ontap_username }}"
    password:         "{{ ontap_password }}"
    https:            true
    validate_certs:   false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Break SnapMirror for failover] ******************************************

TASK [Break SnapMirror for failover] ******************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>

        <CopyBlock lang="bash · Resync" langColor={ACCENT}>{`- name: Resync SnapMirror after failback
  na_ontap_snapmirror:
    state:            present
    relationship_state: active
    destination_path: svm_dst:vol_data_01_dr
    hostname:         "{{ ansible_host }}"
    username:         "{{ ontap_username }}"
    password:         "{{ ontap_password }}"
    https:            true
    validate_certs:   false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Resync SnapMirror after failback] ***************************************

TASK [Resync SnapMirror after failback] ***************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Delete Relationship</h2>
        <div className="prose">
          <p>Removing a SnapMirror relationship with <code style={{ color: ACCENT }}>state: absent</code> releases the replication lock on the destination volume and removes the relationship object. The destination volume is left in place as a standalone read-write volume; delete it separately if it is no longer needed. This is typically performed when decommissioning a DR site, migrating to a new replication target, or converting a data protection volume to a primary workload volume. Break the relationship first if the destination volume still contains data you want to preserve, as some ONTAP versions require the relationship to be broken before it can be deleted.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`- name: Remove SnapMirror relationship
  na_ontap_snapmirror:
    state:            absent
    destination_path: svm_dst:vol_data_01_dr
    hostname:         "{{ ansible_host }}"
    username:         "{{ ontap_username }}"
    password:         "{{ ontap_password }}"
    https:            true
    validate_certs:   false`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Remove SnapMirror relationship] *****************************************

TASK [Remove SnapMirror relationship] *****************************************
changed: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=1  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>
    </>
  )
}

function CicdTab() {
  return (
    <>
      <section className="content-section">
        <h2 className="section-title"><SNum num="01" /> GitHub Actions Workflow</h2>
        <div className="prose">
          <p>Run Ansible playbooks automatically on push or on a schedule. Store ONTAP credentials as GitHub Secrets. The workflow below installs Ansible and the ONTAP collection fresh on each run to ensure a clean, reproducible environment. It triggers only when playbook or inventory files change, avoiding unnecessary runs on documentation-only commits. The vault password is written to a temporary file and cleaned up in an <code style={{ color: ACCENT }}>always()</code> step so it is removed even if the playbook run fails. Never print secrets in the run log — the <code style={{ color: ACCENT }}>env</code> block passes them as environment variables rather than inline arguments to prevent them appearing in the process list.</p>
        </div>
        <CopyBlock lang="bash · .github/workflows/ontap-provision.yml" langColor={ACCENT}>{`name: ONTAP Provisioning

on:
  push:
    branches: [main]
    paths:
      - 'playbooks/**'
      - 'inventory/**'
  workflow_dispatch:          # allow manual trigger

jobs:
  provision:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Ansible & collection
        run: |
          pip install ansible netapp-lib
          ansible-galaxy collection install netapp.ontap

      - name: Write vault password
        run: echo "\${{ secrets.VAULT_PASS }}" > /tmp/.vault_pass

      - name: Run playbook
        env:
          ONTAP_HOST: \${{ secrets.ONTAP_HOST }}
          ONTAP_USER: \${{ secrets.ONTAP_USER }}
          ONTAP_PASS: \${{ secrets.ONTAP_PASS }}
        run: |
          ansible-playbook playbooks/site.yml \`
            --vault-password-file /tmp/.vault_pass \`
            -e "ontap_host=$ONTAP_HOST ontap_username=$ONTAP_USER ontap_password=$ONTAP_PASS"

      - name: Cleanup vault file
        if: always()
        run: rm -f /tmp/.vault_pass`}</CopyBlock>
        <ol className="step-list">
          <li>The <code style={{ color: ACCENT }}>on.push.paths</code> filter means the workflow only fires when playbook or inventory files are actually modified, saving runner minutes on unrelated commits.</li>
          <li><code style={{ color: ACCENT }}>workflow_dispatch</code> adds a manual trigger button in the GitHub Actions UI, useful for running a playbook on demand without pushing a commit.</li>
          <li>Python 3.11 is pinned explicitly. Ansible and <code style={{ color: ACCENT }}>netapp-lib</code> are installed fresh each run; cache the pip install step with <code style={{ color: ACCENT }}>actions/cache</code> to speed up subsequent runs.</li>
          <li>The vault password is written to <code style={{ color: ACCENT }}>/tmp/.vault_pass</code> from a GitHub Secret. It is never echoed to the log because <code style={{ color: ACCENT }}>secrets.*</code> values are automatically masked in GitHub Actions output.</li>
          <li>ONTAP credentials are injected as environment variables inside the <code style={{ color: ACCENT }}>env</code> block and referenced as shell variables in the run command, keeping them out of the process argument list visible via <code style={{ color: ACCENT }}>ps</code>.</li>
          <li>The cleanup step uses <code style={{ color: ACCENT }}>if: always()</code> to ensure the vault password file is removed from the runner even when the playbook fails, preventing credential leakage between jobs.</li>
        </ol>
        <CopyBlock lang="output" langColor={ACCENT}>{`Run ansible-playbook playbooks/site.yml --vault-password-file /tmp/.vault_pass ...

PLAY [ONTAP Infrastructure State] *********************************************

TASK [Verify cluster reachable] ***********************************************
ok: [cluster_prod]

TASK [ontap_svm : Create SVM] *************************************************
ok: [cluster_prod]

TASK [ontap_volume : Create volumes] ******************************************
changed: [cluster_prod] => (item=vol_db_01)
changed: [cluster_prod] => (item=vol_db_02)
ok: [cluster_prod] => (item=vol_app_01)

PLAY RECAP ********************************************************************
cluster_prod : ok=4  changed=2  unreachable=0  failed=0  skipped=1`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="02" /> Role Structure</h2>
        <div className="prose">
          <p>Organise playbooks into reusable roles — one role per ONTAP resource type. The Ansible role directory layout enforces a consistent structure that any team member can navigate without reading documentation: <code style={{ color: ACCENT }}>tasks/main.yml</code> is always the entry point, <code style={{ color: ACCENT }}>defaults/main.yml</code> holds overridable defaults, and <code style={{ color: ACCENT }}>meta/main.yml</code> declares role dependencies. Splitting create, modify, and delete logic into separate task files keeps each file short and focused. Import the correct sub-task using a <code style={{ color: ACCENT }}>when</code> condition on <code style={{ color: ACCENT }}>volume_state</code> so the same role handles both provisioning and decommissioning without duplicating connection parameters.</p>
        </div>
        <CopyBlock lang="bash" langColor={ACCENT}>{`roles/
  ontap_volume/
    tasks/
      main.yml        # entry point — imports sub-tasks
      create.yml
      modify.yml
      delete.yml
    defaults/
      main.yml        # default variable values
    vars/
      main.yml        # role-level vars (rarely needed)
    meta/
      main.yml        # role metadata, dependencies

  ontap_svm/
    tasks/
      main.yml
      ...

  ontap_snapmirror/
    tasks/
      main.yml
      ...`}</CopyBlock>

        <CopyBlock lang="bash · roles/ontap_volume/tasks/main.yml" langColor={ACCENT}>{`- name: Create volume
  import_tasks: create.yml
  when: volume_state == "present"

- name: Delete volume
  import_tasks: delete.yml
  when: volume_state == "absent"`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="03" /> Idempotent Site Playbook</h2>
        <div className="prose">
          <p>The site playbook is the top-level entry point that ties roles together and can be run repeatedly without side effects. A <code style={{ color: ACCENT }}>pre_tasks</code> block verifies that the cluster is reachable before any changes are attempted — this prevents a network blip from causing a partial run that leaves resources in an intermediate state. Each role receives the relevant variable list for that resource type, keeping the site playbook readable and delegating implementation details to the roles. The <code style={{ color: ACCENT }}>when: enable_replication | default(false)</code> condition makes SnapMirror opt-in, so environments without a DR site do not fail on undefined variables.</p>
        </div>
        <CopyBlock lang="bash · playbooks/site.yml" langColor={ACCENT}>{`- name: ONTAP Infrastructure State
  hosts: ontap_clusters
  gather_facts: false
  collections: [netapp.ontap]

  pre_tasks:
    - name: Verify cluster reachable
      na_ontap_rest_info:
        gather_subset: [cluster_identity_info]
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: "{{ ontap_validate_certs }}"

  roles:
    - role: ontap_svm
      vars:
        svm_list: "{{ svms }}"

    - role: ontap_volume
      vars:
        volume_list: "{{ volumes }}"

    - role: ontap_snapmirror
      vars:
        sm_list: "{{ snapmirror_relationships }}"
      when: enable_replication | default(false)`}</CopyBlock>
        <ol className="step-list">
          <li>The play targets all hosts in the <code style={{ color: ACCENT }}>ontap_clusters</code> inventory group, so a single run covers both production and DR clusters if both are defined.</li>
          <li>The <code style={{ color: ACCENT }}>pre_tasks</code> connectivity check uses <code style={{ color: ACCENT }}>na_ontap_rest_info</code> with a lightweight subset. If this task fails the play aborts immediately, preventing partial configuration changes.</li>
          <li>The <code style={{ color: ACCENT }}>ontap_svm</code> role runs first because volumes and LIFs depend on the SVM existing. Role ordering enforces the correct dependency chain without explicit <code style={{ color: ACCENT }}>meta/main.yml</code> dependencies.</li>
          <li>The <code style={{ color: ACCENT }}>ontap_volume</code> role iterates over the <code style={{ color: ACCENT }}>volumes</code> variable list defined in group or host vars, creating all declared volumes in one pass.</li>
          <li>The <code style={{ color: ACCENT }}>ontap_snapmirror</code> role is guarded by <code style={{ color: ACCENT }}>enable_replication</code>. Set this to <code style={{ color: ACCENT }}>true</code> in the DR cluster's host vars and omit it (or set <code style={{ color: ACCENT }}>false</code>) for standalone clusters.</li>
        </ol>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [ONTAP Infrastructure State] *********************************************

TASK [Verify cluster reachable] ***********************************************
ok: [cluster_prod]
ok: [cluster_dr]

TASK [ontap_svm : Create SVM] *************************************************
ok: [cluster_prod]
changed: [cluster_dr]

TASK [ontap_volume : Create volumes] ******************************************
ok: [cluster_prod] => (item=vol_db_01)
changed: [cluster_dr] => (item=vol_db_01)

TASK [ontap_snapmirror : Create SnapMirror relationship] **********************
skipping: [cluster_prod]
changed: [cluster_dr]

PLAY RECAP ********************************************************************
cluster_prod : ok=3  changed=0  unreachable=0  failed=0  skipped=1
cluster_dr   : ok=4  changed=3  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </section>

      <section className="content-section">
        <h2 className="section-title"><SNum num="04" /> Drift Detection</h2>
        <div className="prose">
          <p>Use <code style={{ color: ACCENT }}>na_ontap_rest_info</code> to pull live state and compare against your declared inventory — flag any configuration drift. Drift occurs when someone makes a manual change to a cluster outside the Ansible workflow (via CLI or System Manager). Running this playbook on a schedule — for example, nightly via GitHub Actions or Jenkins — catches unauthorised changes before they cause incidents. The <code style={{ color: ACCENT }}>assert</code> module fails the task with a descriptive message for each missing volume, making drift reports easy to parse in CI logs. Integrate with alerting by adding a notification task in the <code style={{ color: ACCENT }}>rescue</code> block of a surrounding <code style={{ color: ACCENT }}>block</code> statement.</p>
        </div>
        <CopyBlock lang="bash · drift_check.yml" langColor={ACCENT}>{`- name: Detect configuration drift
  hosts: ontap_clusters
  gather_facts: false
  collections: [netapp.ontap]

  tasks:
    - name: Gather volume info
      na_ontap_rest_info:
        gather_subset: [volume_info]
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: ontap_info

    - name: Check volumes match declared state
      assert:
        that:
          - item.name in (ontap_info.ontap_info.volume_info | map(attribute='name') | list)
        fail_msg: "DRIFT: Volume {{ item.name }} not found on cluster"
        success_msg: "OK: {{ item.name }} present"
      loop: "{{ volumes }}"
      loop_control:
        label: "{{ item.name }}"`}</CopyBlock>
        <ol className="step-list">
          <li><code style={{ color: ACCENT }}>na_ontap_rest_info</code> with <code style={{ color: ACCENT }}>gather_subset: [volume_info]</code> returns only volume metadata, keeping the API response small and the task fast even on large clusters.</li>
          <li>The result is stored in <code style={{ color: ACCENT }}>ontap_info</code>. The nested key path <code style={{ color: ACCENT }}>ontap_info.ontap_info.volume_info</code> reflects the module's response structure — the outer key is the registered variable name, the inner keys are module-specific.</li>
          <li>The <code style={{ color: ACCENT }}>assert</code> task uses a Jinja2 filter chain to extract just the volume names from the response and checks whether each declared volume is present in that list.</li>
          <li>A <code style={{ color: ACCENT }}>fail_msg</code> clearly identifies the drifted resource, making it easy to grep CI logs for <code style={{ color: ACCENT }}>DRIFT:</code> prefixed lines and route them to an alerting system.</li>
        </ol>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Detect configuration drift] *********************************************

TASK [Gather volume info] *****************************************************
ok: [cluster_prod]

TASK [Check volumes match declared state] *************************************
ok: [cluster_prod] => (item=vol_db_01) => {
    "msg": "OK: vol_db_01 present"
}
ok: [cluster_prod] => (item=vol_db_02) => {
    "msg": "OK: vol_db_02 present"
}
failed: [cluster_prod] => (item=vol_log_01) => {
    "msg": "DRIFT: Volume vol_log_01 not found on cluster"
}

PLAY RECAP ********************************************************************
cluster_prod : ok=2  changed=0  unreachable=0  failed=1  skipped=0`}</CopyBlock>
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
  cicd:       <CicdTab />,
}

export default function Ansible() {
  const [active, setActive] = useState('setup')

  return (
    <main className="main-content">
      <SEO
        title="NetApp Ansible Automation | ONTAP Playbooks & CI/CD | NetApp Hub"
        description="Ansible playbooks for NetApp ONTAP — volumes, snapshots, SVM, SnapMirror, and CI/CD pipeline integration using the netapp.ontap collection."
        keywords="NetApp Ansible, ONTAP Playbooks, Automation, CI/CD, Storage Automation"
        canonical="/ansible"
        ogTitle="NetApp Ansible Automation"
        ogDescription="Ansible playbooks and roles for NetApp ONTAP automation."
      />
      <header className="page-header">
        <div className="header-badge" style={{ color: ACCENT, background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>Ansible</div>
        <h1 className="page-title">Ansible Automation</h1>
        <p className="page-subtitle">Declarative infrastructure-as-code for ONTAP using the <code style={{ color: ACCENT }}>netapp.ontap</code> Ansible collection. Covers volumes, SVM, SnapMirror, and CI/CD pipeline integration.</p>
      </header>

      <SubNav tabs={TABS} active={active} onChange={setActive} accent={ACCENT} />

      {TAB_CONTENT[active]}
    </main>
  )
}
