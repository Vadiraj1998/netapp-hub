// NetApp ONTAP disk models — rawGB is decimal GB as marketed (e.g. 4 TB = 4000 GB).
// The calculator converts to GiB: rawGB × (10^9 / 2^30) ≈ rawGB × 0.9313

export const DISK_TYPE_LABELS = {
  NVMe:   'NVMe SSD',
  SSD:    'SSD',
  SAS15K: 'SAS 15K',
  SAS10K: 'SAS 10K',
  NLSAS:  'NL-SAS',
}

// defaultRGSize: ONTAP default max RAID group size for this disk type
// maxRGSize: absolute max ONTAP allows
export const DISK_MODELS = [
  // ── NVMe SSD ─────────────────────────────────────────────────
  { id: 'nvme-1p9',  model: 'X4011A', type: 'NVMe',   rawGB: 1920,  label: '1.92 TB NVMe SSD', defaultRGSize: 20, maxRGSize: 28 },
  { id: 'nvme-3p8',  model: 'X4012A', type: 'NVMe',   rawGB: 3840,  label: '3.84 TB NVMe SSD', defaultRGSize: 20, maxRGSize: 28 },
  { id: 'nvme-7p6',  model: 'X4013A', type: 'NVMe',   rawGB: 7680,  label: '7.68 TB NVMe SSD', defaultRGSize: 20, maxRGSize: 28 },
  { id: 'nvme-15p3', model: 'X4014A', type: 'NVMe',   rawGB: 15360, label: '15.3 TB NVMe SSD', defaultRGSize: 20, maxRGSize: 28 },

  // ── SSD ──────────────────────────────────────────────────────
  { id: 'ssd-960',   model: 'X371A',  type: 'SSD',    rawGB: 960,   label: '960 GB SSD',   defaultRGSize: 20, maxRGSize: 28 },
  { id: 'ssd-1p9',   model: 'X372A',  type: 'SSD',    rawGB: 1920,  label: '1.92 TB SSD',  defaultRGSize: 20, maxRGSize: 28 },
  { id: 'ssd-3p8',   model: 'X373A',  type: 'SSD',    rawGB: 3840,  label: '3.84 TB SSD',  defaultRGSize: 20, maxRGSize: 28 },
  { id: 'ssd-7p6',   model: 'X374A',  type: 'SSD',    rawGB: 7680,  label: '7.68 TB SSD',  defaultRGSize: 20, maxRGSize: 28 },

  // ── SAS 15K ──────────────────────────────────────────────────
  { id: 'sas15-300', model: 'X290A',  type: 'SAS15K', rawGB: 300,   label: '300 GB SAS 15K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas15-600', model: 'X291A',  type: 'SAS15K', rawGB: 600,   label: '600 GB SAS 15K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas15-900', model: 'X297A',  type: 'SAS15K', rawGB: 900,   label: '900 GB SAS 15K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas15-1p2', model: 'X298A',  type: 'SAS15K', rawGB: 1200,  label: '1.2 TB SAS 15K',  defaultRGSize: 14, maxRGSize: 20 },

  // ── SAS 10K ──────────────────────────────────────────────────
  { id: 'sas10-600', model: 'X341A',  type: 'SAS10K', rawGB: 600,   label: '600 GB SAS 10K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas10-1p2', model: 'X342A',  type: 'SAS10K', rawGB: 1200,  label: '1.2 TB SAS 10K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas10-1p8', model: 'X343A',  type: 'SAS10K', rawGB: 1800,  label: '1.8 TB SAS 10K',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'sas10-2p4', model: 'X344A',  type: 'SAS10K', rawGB: 2400,  label: '2.4 TB SAS 10K',  defaultRGSize: 14, maxRGSize: 20 },

  // ── NL-SAS ───────────────────────────────────────────────────
  { id: 'nlsas-2',   model: 'X306A',  type: 'NLSAS',  rawGB: 2000,  label: '2 TB NL-SAS',   defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-4',   model: 'X308A',  type: 'NLSAS',  rawGB: 4000,  label: '4 TB NL-SAS',   defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-6',   model: 'X309A',  type: 'NLSAS',  rawGB: 6000,  label: '6 TB NL-SAS',   defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-8',   model: 'X310A',  type: 'NLSAS',  rawGB: 8000,  label: '8 TB NL-SAS',   defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-10',  model: 'X313A',  type: 'NLSAS',  rawGB: 10000, label: '10 TB NL-SAS',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-12',  model: 'X315A',  type: 'NLSAS',  rawGB: 12000, label: '12 TB NL-SAS',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-16',  model: 'X316A',  type: 'NLSAS',  rawGB: 16000, label: '16 TB NL-SAS',  defaultRGSize: 14, maxRGSize: 20 },
  { id: 'nlsas-18',  model: 'X318A',  type: 'NLSAS',  rawGB: 18000, label: '18 TB NL-SAS',  defaultRGSize: 14, maxRGSize: 20 },
]
