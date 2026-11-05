export type UserRole = 'pegawai' | 'atasan' | 'operator' | 'bendahara' | 'admin';

export interface User {
  id: string;
  nip: string;
  nama: string;
  email: string;
  password?: string;
  role: UserRole;
  unitKerjaId: string;
  unitKerjaNama: string;
  jabatan: string;
  golongan: string;
  statusAktif: boolean;
}

export interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  singkatan: string;
}

export type KelompokBelanja = 'pegawai' | 'barang_jasa' | 'perjalanan' | 'pemeliharaan' | 'modal';

export interface SubKegiatan {
  id: string;
  kode: string; // e.g. "4.01.02.2.01.0002"
  nama: string; // "Pengelolaan Administrasi Kewilayahan"
  unitKerjaId: string;
}

export interface AkunBelanja {
  id: string;
  subKegiatanId: string;
  kodeRekening: string; // e.g. "5.1.02.04.01.0001"
  uraian: string; // "Belanja Perjalanan Dinas Dalam Daerah"
  kelompokBelanja: KelompokBelanja;
  pagu: number; // Nilai pagu saat ini
  komitmen: number; // Estimasi perjalanan disetujui tapi belum diverifikasi bendahara
  realisasi: number; // Biaya perjalanan sudah diverifikasi bendahara
  // Sisa dihitung: pagu - realisasi - komitmen
}

export interface PaguHistory {
  id: string;
  akunBelanjaId: string;
  kodeRekening: string;
  uraian: string;
  nilaiLama: number;
  nilaiBaru: number;
  alasan: string;
  diubahOleh: string;
  nipPengubah: string;
  waktu: string;
}

export interface TarifMaster {
  id: string;
  kotaTujuan: string;
  provinsi: string;
  golongan: string; // "Golongan IV", "Golongan III", "Golongan II/I"
  uangHarianPerHari: number;
  penginapanPerMalam: number;
  transportDefault: number;
  representasiPerHari: number;
  masaBerlakuMulai: string;
  masaBerlakuSelesai: string;
}

export type PejabatPeran = 
  | 'bendahara_pengeluaran_pembantu' 
  | 'pembantu_bendahara_pengeluaran' 
  | 'kpa' 
  | 'pptk';

export interface PejabatPenandatangan {
  id: string;
  peran: PejabatPeran;
  nama: string;
  nip: string;
  jabatanDinas: string;
  keteranganPeran: string; // e.g. "Kuasa Pengguna Anggaran (KPA)"
  nomorSK: string;
  masaBerlaku: string;
}

export interface PengaturanInstansi {
  namaPemerintah: string; // "Pemerintah Kabupaten Kendal"
  namaUnitKerja: string; // "Sekretariat Daerah"
  alamatKantor: string; // "Jl. Soekarno - Hatta No. 193 Kendal"
  kotaSurat: string; // "Kendal"
  formatNomorSPT: string; // "090/{no}/Bag.Pem/{tahun}"
  nomorSPTSequence: number;
  formatNomorSPP: string; // "900/{no}/SPP-LS/Bag.Pem/{tahun}"
  nomorSPPSequence: number;
  formatNomorKuitansi: string; // "KWT/{no}/PERJADIN/{tahun}"
  nomorKuitansiSequence: number;
  maxUploadMB: number;
}

export interface KomponenBiaya {
  id: string;
  jenis: 'uang_harian' | 'penginapan' | 'transport' | 'representasi' | 'lainnya';
  uraian: string;
  nominalEstimasi: number;
  nominalRealisasi: number;
  buktiBerkasId?: string;
  catatan?: string;
}

export interface PesertaPerjalanan {
  id: string;
  pegawaiId: string;
  nip: string;
  nama: string;
  jabatan: string;
  golongan: string;
  komponenBiaya: KomponenBiaya[];
  totalEstimasi: number;
  totalRealisasi: number;
  uangMuka: number;
}

export interface BerkasLampiran {
  id: string;
  perjalananId: string;
  jenis: 'spt_bertandatangan' | 'laporan_bertandatangan' | 'foto_kegiatan' | 'bukti_transaksi' | 'arsip_final';
  namaFile: string;
  tipeFile: 'pdf' | 'jpg' | 'png';
  ukuranKB: number;
  urlData?: string; // Data URL or mock path
  keterangan: string;
  komponenBiayaId?: string;
  diunggahOleh: string;
  diunggahPada: string;
}

export type StatusPerjalanan = 
  | 'draft'
  | 'diajukan'
  | 'disetujui_atasan'
  | 'ditolak_atasan'
  | 'dalam_perjalanan'
  | 'menunggu_verifikasi_operator'
  | 'dikembalikan_operator'
  | 'menunggu_verifikasi_bendahara'
  | 'terverifikasi_bendahara'
  | 'selesai'
  | 'dibatalkan';

export interface LaporanKegiatanData {
  dasarPelaksanaan: string;
  maksudTujuan: string;
  waktuDanTempat: string;
  uraianKegiatan: string;
  hasilKegiatan: string;
  kesimpulanTindakLanjut: string;
  penutup: string;
  terakhirDiperbarui: string;
  diperbaruiOleh: string;
}

export interface PerjalananDinas {
  id: string;
  nomorSPT: string; // Generated once approved
  tanggalSPT?: string;
  maksudPerjalanan: string;
  kotaTujuan: string;
  tempatTujuanDetail: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  lamaMalam: number;
  alatTransportasi: string;
  
  unitKerjaId: string;
  subKegiatanId: string;
  akunBelanjaId: string;
  
  pegawaiPengajuId: string;
  pegawaiPengajuNama: string;
  pegawaiPengajuNip: string;
  
  peserta: PesertaPerjalanan[];
  
  totalEstimasi: number;
  totalRealisasi: number;
  totalUangMuka: number;
  statusUangMuka: 'nihil' | 'kurang' | 'lebih';
  nominalSelisihUangMuka: number;
  
  status: StatusPerjalanan;
  
  catatanAtasan?: string;
  catatanOperator?: string;
  catatanBendahara?: string;
  
  laporanKegiatan: LaporanKegiatanData;
  berkas: BerkasLampiran[];
  
  versiTemplateDipakai: number;
  kodeVerifikasiQR: string;
  
  riwayatStatus: Array<{
    status: StatusPerjalanan;
    waktu: string;
    oleh: string;
    catatan?: string;
  }>;
  
  riwayatRevisi: Array<{
    waktu: string;
    oleh: string;
    deskripsi: string;
  }>;
}

export interface BukuKasEntri {
  id: string;
  tanggal: string;
  nomorBukti: string;
  uraian: string;
  kodeRekening: string;
  jenis: 'penerimaan' | 'pengeluaran' | 'pembalik';
  debet: number; // Penerimaan kas
  kredit: number; // Pengeluaran kas
  saldoBerjalan: number;
  perjalananId?: string;
  sppId?: string;
  bulan: number; // 1-12
  tahun: number; // 2026
  isKoreksi?: boolean;
  refEntriId?: string;
}

export interface BulanBukuKas {
  bulan: number;
  tahun: number;
  isTutup: boolean;
  ditutupOleh?: string;
  tanggalTutup?: string;
  alasanBuka?: string;
}

export interface SPPEntri {
  id: string;
  nomorSPP: string;
  tanggalSPP: string;
  subKegiatanId: string;
  akunBelanjaId: string;
  kodeRekening: string;
  uraianAkun: string;
  jumlahDiminta: number;
  sisaPaguSebelumnya: number;
  sisaPaguSetelahnya: number;
  keterangan: string;
  dibuatOleh: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorNama: string;
  actorNip: string;
  actorRole: UserRole;
  modul: 'AUTENTIKASI' | 'DATA_MASTER' | 'ANGGARAN' | 'PERJALANAN' | 'BERKAS' | 'VERIFIKASI' | 'BUKU_KAS' | 'SPP' | 'TEMPLATE' | 'SISTEM';
  aksi: string;
  detail: string;
  nilaiSebelum?: string;
  nilaiSesudah?: string;
}

export interface TemplateDokumen {
  id: string;
  nama: string;
  jenis: 'spt' | 'laporan' | 'rincian_biaya' | 'surat_pengantar_spj' | 'pk6' | 'daftar_pengumpulan' | 'dokumen_a2';
  versi: number;
  content: string;
  placeholders: string[];
  terakhirDiperbarui: string;
  diperbaruiOleh: string;
}
