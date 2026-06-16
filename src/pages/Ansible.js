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
  { id: 'usecases',   label: 'Use Cases' },
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

const USE_CASES = [
  {
    id: 'dr-failover',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'DR Failover Playbook',
    desc: 'Automate a full site failover by breaking SnapMirror relationships, bringing volumes online, and updating export policies for the DR subnet.',
    tags: ['DR', 'SnapMirror', 'Failover'],
    fullDesc: 'Break all SnapMirror relationships on the DR cluster, verify volumes come online, and update export policy rules to allow DR-subnet clients — all in one idempotent run.',
    content: (
      <>
        <CopyBlock lang="bash · dr_failover.yml" langColor={ACCENT}>{`- name: DR Failover
  hosts: cluster_dr
  gather_facts: false
  collections: [netapp.ontap]

  vars:
    dr_svm:        svm_dr
    dr_subnet:     10.20.0.0/24
    sm_volumes:
      - vol_data_01
      - vol_data_02
      - vol_logs_01

  tasks:
    - name: Break SnapMirror relationships on DR volumes
      na_ontap_snapmirror:
        state:              present
        relationship_state: broken-off
        destination_path:   "{{ dr_svm }}:{{ item }}_dr"
        hostname:           "{{ ansible_host }}"
        username:           "{{ ontap_username }}"
        password:           "{{ ontap_password }}"
        https:              true
        validate_certs:     false
      loop: "{{ sm_volumes }}"
      loop_control:
        label: "{{ item }}"

    - name: Bring DR volumes online
      na_ontap_volume:
        state:          present
        name:           "{{ item }}_dr"
        vserver:        "{{ dr_svm }}"
        is_online:      true
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      loop: "{{ sm_volumes }}"
      loop_control:
        label: "{{ item }}_dr"

    - name: Update export policy for DR subnet
      na_ontap_export_policy_rule:
        state:               present
        name:                default
        vserver:             "{{ dr_svm }}"
        client_match:        "{{ dr_subnet }}"
        ro_rule:             sys
        rw_rule:             sys
        super_user_security: sys
        hostname:            "{{ ansible_host }}"
        username:            "{{ ontap_username }}"
        password:            "{{ ontap_password }}"
        https:               true
        validate_certs:      false

    - name: Confirm volumes are online
      na_ontap_rest_info:
        gather_subset: [volume_info]
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: vol_state

    - name: Assert DR volumes are online
      assert:
        that:
          - item ~ '_dr' in (vol_state.ontap_info.volume_info
              | selectattr('state', 'equalto', 'online')
              | map(attribute='name') | list)
        fail_msg: "{{ item }}_dr is NOT online after failover"
        success_msg: "{{ item }}_dr is online"
      loop: "{{ sm_volumes }}"
      loop_control:
        label: "{{ item }}_dr"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [DR Failover] ************************************************************

TASK [Break SnapMirror relationships on DR volumes] ***************************
changed: [cluster_dr] => (item=vol_data_01)
changed: [cluster_dr] => (item=vol_data_02)
changed: [cluster_dr] => (item=vol_logs_01)

TASK [Bring DR volumes online] ************************************************
changed: [cluster_dr] => (item=vol_data_01_dr)
changed: [cluster_dr] => (item=vol_data_02_dr)
changed: [cluster_dr] => (item=vol_logs_01_dr)

TASK [Update export policy for DR subnet] *************************************
changed: [cluster_dr]

TASK [Confirm volumes are online] *********************************************
ok: [cluster_dr]

TASK [Assert DR volumes are online] *******************************************
ok: [cluster_dr] => (item=vol_data_01_dr) => {"msg": "vol_data_01_dr is online"}
ok: [cluster_dr] => (item=vol_data_02_dr) => {"msg": "vol_data_02_dr is online"}
ok: [cluster_dr] => (item=vol_logs_01_dr) => {"msg": "vol_logs_01_dr is online"}

PLAY RECAP ********************************************************************
cluster_dr : ok=5  changed=4  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'cluster-provisioning',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'New Cluster Provisioning',
    desc: 'Full day-1 automation: DNS, NTP, SNMP, aggregates, SVM with NFS, data LIF, and volumes from a vars file in a single playbook run.',
    tags: ['Setup', 'Cluster', 'Roles'],
    fullDesc: 'Configure DNS, NTP, and SNMP; create aggregates; stand up an NFS SVM with a data LIF; then provision all declared volumes — everything a new cluster needs before handing off to application teams.',
    content: (
      <>
        <CopyBlock lang="bash · cluster_provision.yml" langColor={ACCENT}>{`- name: Day-1 Cluster Provisioning
  hosts: cluster_new
  gather_facts: false
  collections: [netapp.ontap]

  vars_files:
    - vars/cluster_vars.yml     # DNS, NTP, aggregate, volume lists

  tasks:
    # ── DNS ─────────────────────────────────────────────────────────────
    - name: Configure DNS
      na_ontap_dns:
        state:          present
        vserver:        "{{ cluster_name }}"
        domains:        "{{ dns_domains }}"
        nameservers:    "{{ dns_servers }}"
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false

    # ── NTP ─────────────────────────────────────────────────────────────
    - name: Configure NTP servers
      na_ontap_ntp:
        state:          present
        server_name:    "{{ item }}"
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      loop: "{{ ntp_servers }}"

    # ── SNMP ────────────────────────────────────────────────────────────
    - name: Configure SNMP community
      na_ontap_snmp:
        state:          present
        community_name: "{{ snmp_community }}"
        access_control: ro
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false

    # ── Aggregate ───────────────────────────────────────────────────────
    - name: Create data aggregate
      na_ontap_aggregate:
        state:          present
        name:           "{{ aggr_name }}"
        nodes:          "{{ aggr_node }}"
        disk_count:     "{{ aggr_disk_count }}"
        raid_type:      raid_dp
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false

    # ── SVM ─────────────────────────────────────────────────────────────
    - name: Create NFS SVM
      na_ontap_svm:
        state:                      present
        name:                       "{{ svm_name }}"
        root_volume_aggregate:      "{{ aggr_name }}"
        root_volume_security_style: unix
        allowed_protocols:          [nfs]
        hostname:                   "{{ ansible_host }}"
        username:                   "{{ ontap_username }}"
        password:                   "{{ ontap_password }}"
        https:                      true
        validate_certs:             false

    - name: Enable NFS
      na_ontap_nfs:
        state:          present
        vserver:        "{{ svm_name }}"
        service_state:  started
        nfsv3:          enabled
        nfsv4:          enabled
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false

    # ── Data LIF ────────────────────────────────────────────────────────
    - name: Create data LIF
      na_ontap_interface:
        state:           present
        interface_name:  "{{ lif_name }}"
        vserver:         "{{ svm_name }}"
        role:            data
        protocols:       [nfs]
        home_node:       "{{ lif_home_node }}"
        home_port:       "{{ lif_home_port }}"
        address:         "{{ lif_ip }}"
        netmask:         "{{ lif_netmask }}"
        is_auto_revert:  true
        hostname:        "{{ ansible_host }}"
        username:        "{{ ontap_username }}"
        password:        "{{ ontap_password }}"
        https:           true
        validate_certs:  false

    # ── Volumes ─────────────────────────────────────────────────────────
    - name: Create volumes from vars file
      na_ontap_volume:
        state:           present
        name:            "{{ item.name }}"
        vserver:         "{{ svm_name }}"
        aggregate_name:  "{{ aggr_name }}"
        size:            "{{ item.size_gb }}"
        size_unit:       gb
        junction_path:   "/{{ item.name }}"
        space_guarantee: none
        snapshot_policy: daily_weekly_policy
        hostname:        "{{ ansible_host }}"
        username:        "{{ ontap_username }}"
        password:        "{{ ontap_password }}"
        https:           true
        validate_certs:  false
      loop: "{{ volumes }}"
      loop_control:
        label: "{{ item.name }}"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Day-1 Cluster Provisioning] *********************************************

TASK [Configure DNS] **********************************************************
changed: [cluster_new]

TASK [Configure NTP servers] **************************************************
changed: [cluster_new] => (item=ntp1.corp.example.com)
changed: [cluster_new] => (item=ntp2.corp.example.com)

TASK [Configure SNMP community] ***********************************************
changed: [cluster_new]

TASK [Create data aggregate] **************************************************
changed: [cluster_new]

TASK [Create NFS SVM] *********************************************************
changed: [cluster_new]

TASK [Enable NFS] *************************************************************
changed: [cluster_new]

TASK [Create data LIF] ********************************************************
changed: [cluster_new]

TASK [Create volumes from vars file] ******************************************
changed: [cluster_new] => (item=vol_app_01)
changed: [cluster_new] => (item=vol_app_02)
changed: [cluster_new] => (item=vol_db_01)

PLAY RECAP ********************************************************************
cluster_new : ok=9  changed=9  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'health-check',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Cluster Health Check',
    desc: 'Gather cluster identity, node status, aggregate space, volume states, and SnapMirror lag — assert thresholds and save a report to disk.',
    tags: ['Monitoring', 'Health', 'Report'],
    fullDesc: 'Pull cluster identity, node health, aggregate utilisation, volume states, and SnapMirror lag in one pass. Use assert to fail immediately on critical threshold breaches and write a timestamped report file.',
    content: (
      <>
        <CopyBlock lang="bash · health_check.yml" langColor={ACCENT}>{`- name: Cluster Health Check
  hosts: ontap_clusters
  gather_facts: false
  collections: [netapp.ontap]

  vars:
    aggr_warn_pct:  80          # aggregate % used warning threshold
    sm_lag_warn_s:  7200        # SnapMirror lag warning (seconds)
    report_dir:     /tmp/ontap_reports

  tasks:
    - name: Gather cluster identity
      na_ontap_rest_info:
        gather_subset:
          - cluster_identity_info
          - node_info
          - aggregate_info
          - volume_info
          - snapmirror_info
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: cluster_info

    - name: Assert all nodes are healthy
      assert:
        that:
          - item.health == true
        fail_msg: "CRITICAL: Node {{ item.name }} is not healthy"
        success_msg: "OK: Node {{ item.name }} is healthy"
      loop: "{{ cluster_info.ontap_info.node_info }}"
      loop_control:
        label: "{{ item.name }}"

    - name: Assert aggregate space within threshold
      assert:
        that:
          - (item.space.block_storage.used | int) * 100
              / (item.space.block_storage.size | int) < aggr_warn_pct
        fail_msg: >
          CRITICAL: Aggregate {{ item.name }} is over
          {{ aggr_warn_pct }}% full
        success_msg: "OK: {{ item.name }} space within threshold"
      loop: "{{ cluster_info.ontap_info.aggregate_info }}"
      loop_control:
        label: "{{ item.name }}"
      when: item.space is defined

    - name: Assert no volumes are offline
      assert:
        that:
          - item.state == 'online'
        fail_msg: "CRITICAL: Volume {{ item.name }} is {{ item.state }}"
        success_msg: "OK: {{ item.name }} is online"
      loop: "{{ cluster_info.ontap_info.volume_info }}"
      loop_control:
        label: "{{ item.name }}"
      when:
        - item.name != cluster_info.ontap_info.cluster_identity_info.name ~ '_root'

    - name: Assert SnapMirror lag within threshold
      assert:
        that:
          - item.lag_time | default(0) | int < sm_lag_warn_s
        fail_msg: >
          WARNING: SnapMirror {{ item.destination.path }}
          lag {{ item.lag_time }}s exceeds {{ sm_lag_warn_s }}s
        success_msg: "OK: {{ item.destination.path }} lag is acceptable"
      loop: "{{ cluster_info.ontap_info.snapmirror_info }}"
      loop_control:
        label: "{{ item.destination.path }}"
      when: cluster_info.ontap_info.snapmirror_info | length > 0

    - name: Save health report to file
      copy:
        content: |
          ONTAP Health Report
          Cluster : {{ cluster_info.ontap_info.cluster_identity_info.name }}
          Date    : {{ lookup('pipe', 'date +%Y-%m-%dT%H:%M:%S') }}
          Nodes   : {{ cluster_info.ontap_info.node_info | length }}
          Volumes : {{ cluster_info.ontap_info.volume_info | length }}
          SM Rels : {{ cluster_info.ontap_info.snapmirror_info | length }}
        dest: "{{ report_dir }}/health_{{ inventory_hostname }}.txt"
      delegate_to: localhost`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Cluster Health Check] ***************************************************

TASK [Gather cluster identity] ************************************************
ok: [cluster_prod]

TASK [Assert all nodes are healthy] *******************************************
ok: [cluster_prod] => (item=node01) => {"msg": "OK: Node node01 is healthy"}
ok: [cluster_prod] => (item=node02) => {"msg": "OK: Node node02 is healthy"}

TASK [Assert aggregate space within threshold] ********************************
ok: [cluster_prod] => (item=aggr1) => {"msg": "OK: aggr1 space within threshold"}
ok: [cluster_prod] => (item=aggr2) => {"msg": "OK: aggr2 space within threshold"}

TASK [Assert no volumes are offline] ******************************************
ok: [cluster_prod] => (item=vol_app_01) => {"msg": "OK: vol_app_01 is online"}
ok: [cluster_prod] => (item=vol_db_01)  => {"msg": "OK: vol_db_01 is online"}

TASK [Assert SnapMirror lag within threshold] *********************************
ok: [cluster_prod] => (item=svm_dst:vol_data_01_dr) => {"msg": "OK: lag is acceptable"}

TASK [Save health report to file] *********************************************
changed: [cluster_prod -> localhost]

PLAY RECAP ********************************************************************
cluster_prod : ok=6  changed=1  unreachable=0  failed=0  skipped=0`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'capacity-report',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
        <line x1="2"  y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'Capacity Reporting',
    desc: 'Use na_ontap_rest_info to gather volume data, process it through a Jinja2 template, write a CSV report, and optionally email it.',
    tags: ['Capacity', 'CSV', 'Report'],
    fullDesc: 'Pull volume capacity data via REST, render it into a CSV with a Jinja2 template, write the file locally, and optionally dispatch it by email for distribution to storage owners.',
    content: (
      <>
        <CopyBlock lang="bash · capacity_report.yml" langColor={ACCENT}>{`- name: ONTAP Capacity Report
  hosts: ontap_clusters
  gather_facts: false
  collections: [netapp.ontap]

  vars:
    report_dir:    /tmp/ontap_reports
    email_to:      storage-team@example.com
    email_from:    ansible@example.com
    email_subject: "ONTAP Capacity Report - {{ inventory_hostname }}"
    send_email:    false

  tasks:
    - name: Gather volume capacity via REST
      na_ontap_rest_info:
        gather_subset: [volume_info]
        fields:
          - name
          - svm.name
          - space.size
          - space.used
          - space.available
          - state
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: vol_data

    - name: Ensure report directory exists
      file:
        path:  "{{ report_dir }}"
        state: directory
      delegate_to: localhost

    - name: Write CSV capacity report
      copy:
        content: |
          cluster,svm,volume,size_gb,used_gb,available_gb,used_pct,state
          {% for v in vol_data.ontap_info.volume_info %}
          {{ inventory_hostname }},{{ v.svm.name }},{{ v.name }},
          {{- (v.space.size | int / 1073741824) | round(1) }},
          {{- (v.space.used | int / 1073741824) | round(1) }},
          {{- (v.space.available | int / 1073741824) | round(1) }},
          {{- ((v.space.used | int) * 100 / (v.space.size | int)) | round(1) }},
          {{- v.state }}
          {% endfor %}
        dest: "{{ report_dir }}/capacity_{{ inventory_hostname }}_\
          {{ lookup('pipe', 'date +%Y%m%d') }}.csv"
      delegate_to: localhost
      register: report_file

    - name: Email report
      mail:
        host:    smtp.example.com
        port:    25
        to:      "{{ email_to }}"
        from:    "{{ email_from }}"
        subject: "{{ email_subject }}"
        body:    "ONTAP capacity report attached."
        attach:  "{{ report_file.dest }}"
      delegate_to: localhost
      when: send_email | bool`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [ONTAP Capacity Report] **************************************************

TASK [Gather volume capacity via REST] ****************************************
ok: [cluster_prod]

TASK [Ensure report directory exists] *****************************************
ok: [cluster_prod -> localhost]

TASK [Write CSV capacity report] **********************************************
changed: [cluster_prod -> localhost]

TASK [Email report] ***********************************************************
skipping: [cluster_prod]

PLAY RECAP ********************************************************************
cluster_prod : ok=3  changed=1  unreachable=0  failed=0  skipped=1

# Report written to /tmp/ontap_reports/capacity_cluster_prod_20260616.csv
# cluster,svm,volume,size_gb,used_gb,available_gb,used_pct,state
# cluster_prod,svm0,vol_app_01,200.0,45.3,154.7,22.7,online
# cluster_prod,svm0,vol_db_01,500.0,312.8,187.2,62.6,online
# cluster_prod,svm_db,vol_log_01,100.0,88.1,11.9,88.1,online`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'drift-detection',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9"  x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Configuration Drift Detection',
    desc: 'Compare live ONTAP state against a declared YAML inventory, assert every volume, SVM, and LIF exists with correct parameters, and fail with descriptive messages on drift.',
    tags: ['Compliance', 'Drift', 'IaC'],
    fullDesc: 'Pull live cluster state via REST and compare it against your declared inventory YAML. Assert volumes, SVMs, and LIFs exist with the correct parameters — any discrepancy fails with a clear DRIFT message for alerting or CI integration.',
    content: (
      <>
        <CopyBlock lang="bash · drift_detection.yml" langColor={ACCENT}>{`- name: Configuration Drift Detection
  hosts: ontap_clusters
  gather_facts: false
  collections: [netapp.ontap]

  vars_files:
    - vars/declared_state.yml   # desired SVMs, volumes, LIFs

  tasks:
    - name: Gather live cluster state
      na_ontap_rest_info:
        gather_subset:
          - svm_info
          - volume_info
          - network_interfaces_info
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: live_state

    # ── SVM drift ───────────────────────────────────────────────────────
    - name: Assert declared SVMs exist
      assert:
        that:
          - item.name in (live_state.ontap_info.svm_info
              | map(attribute='name') | list)
        fail_msg: "DRIFT: SVM {{ item.name }} not found on cluster"
        success_msg: "OK: SVM {{ item.name }} exists"
      loop: "{{ declared_svms }}"
      loop_control:
        label: "{{ item.name }}"

    # ── Volume drift ────────────────────────────────────────────────────
    - name: Build live volume map (name -> record)
      set_fact:
        live_volumes: >-
          {{ live_state.ontap_info.volume_info
              | items2dict(key_name='name', value_name='space') }}

    - name: Assert declared volumes exist with correct size
      assert:
        that:
          - item.name in live_volumes
          - (live_volumes[item.name].size | int)
              >= (item.size_gb | int * 1073741824 * 0.99 | int)
        fail_msg: >
          DRIFT: Volume {{ item.name }} missing or undersized
          (declared {{ item.size_gb }}GB)
        success_msg: "OK: {{ item.name }} exists and meets size requirement"
      loop: "{{ declared_volumes }}"
      loop_control:
        label: "{{ item.name }}"

    # ── LIF drift ───────────────────────────────────────────────────────
    - name: Assert declared LIFs exist
      assert:
        that:
          - item.name in (live_state.ontap_info.network_interfaces_info
              | map(attribute='name') | list)
        fail_msg: "DRIFT: LIF {{ item.name }} not found"
        success_msg: "OK: LIF {{ item.name }} exists"
      loop: "{{ declared_lifs }}"
      loop_control:
        label: "{{ item.name }}"`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`PLAY [Configuration Drift Detection] ******************************************

TASK [Gather live cluster state] **********************************************
ok: [cluster_prod]

TASK [Assert declared SVMs exist] *********************************************
ok: [cluster_prod] => (item=svm0)       => {"msg": "OK: SVM svm0 exists"}
ok: [cluster_prod] => (item=svm_db)     => {"msg": "OK: SVM svm_db exists"}
failed: [cluster_prod] => (item=svm_qa) => {
    "msg": "DRIFT: SVM svm_qa not found on cluster"
}

TASK [Build live volume map (name -> record)] *********************************
ok: [cluster_prod]

TASK [Assert declared volumes exist with correct size] ************************
ok: [cluster_prod] => (item=vol_app_01) => {"msg": "OK: vol_app_01 exists and meets size requirement"}
ok: [cluster_prod] => (item=vol_db_01)  => {"msg": "OK: vol_db_01 exists and meets size requirement"}

TASK [Assert declared LIFs exist] *********************************************
ok: [cluster_prod] => (item=lif_nfs_01) => {"msg": "OK: LIF lif_nfs_01 exists"}

PLAY RECAP ********************************************************************
cluster_prod : ok=4  changed=0  unreachable=0  failed=1  skipped=0`}</CopyBlock>
      </>
    ),
  },
  {
    id: 'decommission',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/>
        <path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    title: 'Decommission Storage Resources',
    desc: 'Safely remove an SVM and all its resources: offline volumes, remove SnapMirror, delete LIFs, then delete the SVM. Includes a dry_run mode.',
    tags: ['Cleanup', 'SVM', 'Safety'],
    fullDesc: 'Accept an SVM name as an extra-var, list all resources, pause for operator confirmation (unless automated), offline and delete volumes, release SnapMirror relationships, remove LIFs, and finally delete the SVM. A dry_run variable prevents any destructive changes.',
    content: (
      <>
        <CopyBlock lang="bash · decommission_svm.yml" langColor={ACCENT}>{`# Usage:
#   ansible-playbook decommission_svm.yml -e "target_svm=svm_qa"
#   ansible-playbook decommission_svm.yml -e "target_svm=svm_qa dry_run=false"

- name: Decommission SVM
  hosts: cluster_prod
  gather_facts: false
  collections: [netapp.ontap]

  vars:
    target_svm: ""          # required: pass via -e
    dry_run:    true        # set false to allow destructive steps

  pre_tasks:
    - name: Require target_svm variable
      assert:
        that: target_svm | length > 0
        fail_msg: "You must pass -e 'target_svm=<name>'"

    - name: Gather SVM resources
      na_ontap_rest_info:
        gather_subset:
          - volume_info
          - network_interfaces_info
          - snapmirror_info
        params:
          svm.name: "{{ target_svm }}"
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      register: svm_resources

    - name: Display resources to be removed
      debug:
        msg:
          - "SVM       : {{ target_svm }}"
          - "Volumes   : {{ svm_resources.ontap_info.volume_info
                            | map(attribute='name') | list }}"
          - "LIFs      : {{ svm_resources.ontap_info.network_interfaces_info
                            | map(attribute='name') | list }}"
          - "SM rels   : {{ svm_resources.ontap_info.snapmirror_info
                            | map(attribute='destination.path') | list }}"
          - "dry_run   : {{ dry_run }}"

    - name: Pause for operator confirmation
      pause:
        prompt: "Type YES to proceed with decommission of {{ target_svm }}"
      when: not dry_run | bool
      register: confirm

    - name: Abort if not confirmed
      fail:
        msg: "Decommission aborted by operator."
      when:
        - not dry_run | bool
        - confirm.user_input | upper != 'YES'

  tasks:
    # ── SnapMirror ──────────────────────────────────────────────────────
    - name: Release SnapMirror relationships
      na_ontap_snapmirror:
        state:            absent
        destination_path: "{{ item.destination.path }}"
        hostname:         "{{ ansible_host }}"
        username:         "{{ ontap_username }}"
        password:         "{{ ontap_password }}"
        https:            true
        validate_certs:   false
      loop: "{{ svm_resources.ontap_info.snapmirror_info }}"
      loop_control:
        label: "{{ item.destination.path }}"
      when: not dry_run | bool

    # ── Volumes ─────────────────────────────────────────────────────────
    - name: Offline volumes
      na_ontap_volume:
        state:          present
        name:           "{{ item.name }}"
        vserver:        "{{ target_svm }}"
        is_online:      false
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      loop: "{{ svm_resources.ontap_info.volume_info }}"
      loop_control:
        label: "{{ item.name }}"
      when:
        - not dry_run | bool
        - not item.name.endswith('_root')

    - name: Delete volumes
      na_ontap_volume:
        state:          absent
        name:           "{{ item.name }}"
        vserver:        "{{ target_svm }}"
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      loop: "{{ svm_resources.ontap_info.volume_info }}"
      loop_control:
        label: "{{ item.name }}"
      when:
        - not dry_run | bool
        - not item.name.endswith('_root')

    # ── LIFs ────────────────────────────────────────────────────────────
    - name: Delete data LIFs
      na_ontap_interface:
        state:           absent
        interface_name:  "{{ item.name }}"
        vserver:         "{{ target_svm }}"
        hostname:        "{{ ansible_host }}"
        username:        "{{ ontap_username }}"
        password:        "{{ ontap_password }}"
        https:           true
        validate_certs:  false
      loop: "{{ svm_resources.ontap_info.network_interfaces_info }}"
      loop_control:
        label: "{{ item.name }}"
      when: not dry_run | bool

    # ── SVM ─────────────────────────────────────────────────────────────
    - name: Delete SVM
      na_ontap_svm:
        state:          absent
        name:           "{{ target_svm }}"
        hostname:       "{{ ansible_host }}"
        username:       "{{ ontap_username }}"
        password:       "{{ ontap_password }}"
        https:          true
        validate_certs: false
      when: not dry_run | bool

    - name: Dry-run summary
      debug:
        msg: "DRY RUN complete — no changes made. Set dry_run=false to execute."
      when: dry_run | bool`}</CopyBlock>
        <CopyBlock lang="output" langColor={ACCENT}>{`# Dry run (default)
PLAY [Decommission SVM] *******************************************************

TASK [Gather SVM resources] ***************************************************
ok: [cluster_prod]

TASK [Display resources to be removed] ****************************************
ok: [cluster_prod] => {
    "msg": [
        "SVM       : svm_qa",
        "Volumes   : ['vol_qa_01', 'vol_qa_02']",
        "LIFs      : ['lif_qa_nfs_01']",
        "SM rels   : []",
        "dry_run   : True"
    ]
}

TASK [Pause for operator confirmation] ****************************************
skipping: [cluster_prod]

TASK [Release SnapMirror relationships] ***************************************
skipping: [cluster_prod]

TASK [Offline volumes] ********************************************************
skipping: [cluster_prod]

TASK [Delete volumes] *********************************************************
skipping: [cluster_prod]

TASK [Delete data LIFs] *******************************************************
skipping: [cluster_prod]

TASK [Delete SVM] *************************************************************
skipping: [cluster_prod]

TASK [Dry-run summary] ********************************************************
ok: [cluster_prod] => {
    "msg": "DRY RUN complete — no changes made. Set dry_run=false to execute."
}

PLAY RECAP ********************************************************************
cluster_prod : ok=3  changed=0  unreachable=0  failed=0  skipped=6`}</CopyBlock>
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
  cicd:       <CicdTab />,
  usecases:   <UseCasesTab />,
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
