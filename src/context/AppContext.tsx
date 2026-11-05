import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  UnitKerja,
  SubKegiatan,
  AkunBelanja,
  PaguHistory,
  TarifMaster,
  PejabatPenandatangan,
  PengaturanInstansi,
  PerjalananDinas,
  BukuKasEntri,
  BulanBukuKas,
  SPPEntri,
  AuditLog,
  TemplateDokumen,
  StatusPerjalanan,
  BerkasLampiran,
} from '../types';
import { hitungHari } from '../utils/formatters';

interface AppContextType {
  // Current user & authentication
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  loginUser: (nipOrEmail: string, kataSandi: string) => { success: boolean; message: string; user?: User };
  logoutUser: () => void;
  ubahNamaDanProfil: (data: { nama: string; nip?: string; email?: string; jabatan?: string; password?: string }) => { success: boolean; message: string };
  users: User[];
  tambahUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;

  // Master Data
  unitKerjaList: UnitKerja[];
  subKegiatanList: SubKegiatan[];
  akunBelanjaList: AkunBelanja[];
  tarifMasterList: TarifMaster[];
  pejabatList: PejabatPenandatangan[];
  pengaturan: PengaturanInstansi;
  updatePengaturan: (pengaturan: Partial<PengaturanInstansi>) => void;
  tambahTarif: (tarif: Omit<TarifMaster, 'id'>) => void;
  updateTarif: (id: string, tarif: Partial<TarifMaster>) => void;
  hapusTarif: (id: string) => void;
  updatePejabat: (id: string, data: Partial<PejabatPenandatangan>) => void;

  // Anggaran & Pagu
  paguHistories: PaguHistory[];
  ubahPagu: (akunBelanjaId: string, nilaiBaru: number, alasan: string) => { success: boolean; message: string };

  // Perjalanan Dinas
  perjalananList: PerjalananDinas[];
  ajukanPerjalanan: (data: Partial<PerjalananDinas>) => { success: boolean; message: string; id?: string };
  revisiPerjalanan: (id: string, data: Partial<PerjalananDinas>, catatanRevisi: string) => { success: boolean; message: string };
  setujuiAtasan: (id: string, catatan: string) => { success: boolean; message: string };
  tolakAtasan: (id: string, catatan: string) => { success: boolean; message: string };
  batalkanPerjalanan: (id: string, alasan: string) => { success: boolean; message: string };
  verifikasiOperator: (id: string, statusVerifikasi: 'setuju' | 'kembalikan', catatan: string) => { success: boolean; message: string };
  verifikasiBendahara: (
    id: string,
    komponenRealisasiMap: Record<string, { pesertaId: string; komponenId: string; nominal: number }>,
    catatan: string
  ) => { success: boolean; message: string };
  selesaikanPerjalanan: (id: string) => { success: boolean; message: string };
  updateLaporanKegiatan: (id: string, data: Partial<PerjalananDinas['laporanKegiatan']>) => void;
  tambahBerkasPerjalanan: (perjalananId: string, berkas: Omit<BerkasLampiran, 'id' | 'perjalananId' | 'diunggahOleh' | 'diunggahPada'>) => { success: boolean; message: string };
  hapusBerkasPerjalanan: (perjalananId: string, berkasId: string) => void;

  // Keuangan & Buku Kas
  bukuKasList: BukuKasEntri[];
  bulanBukuList: BulanBukuKas[];
  tambahEntriBukuKasManual: (entri: {
    tanggal: string;
    nomorBukti: string;
    uraian: string;
    kodeRekening: string;
    jenis: 'penerimaan' | 'pengeluaran';
    nominal: number;
    bulan: number;
    tahun: number;
  }) => { success: boolean; message: string };
  koreksiEntriBukuKas: (entriId: string, alasan: string) => { success: boolean; message: string };
  tutupBulanKas: (bulan: number, tahun: number) => { success: boolean; message: string };
  bukaBulanKas: (bulan: number, tahun: number, alasan: string) => { success: boolean; message: string };

  // SPP
  sppList: SPPEntri[];
  tambahSPP: (data: {
    nomorSPP: string;
    tanggalSPP: string;
    subKegiatanId: string;
    akunBelanjaId: string;
    jumlahDiminta: number;
    keterangan: string;
  }) => { success: boolean; message: string };

  // Templates
  templateList: TemplateDokumen[];
  simpanTemplate: (template: Omit<TemplateDokumen, 'id' | 'versi' | 'terakhirDiperbarui' | 'diperbaruiOleh'>, templateId?: string) => {
    success: boolean;
    message: string;
    unknownPlaceholders: string[];
  };

  // Audit Logs
  auditLogs: AuditLog[];
  catatAudit: (modul: AuditLog['modul'], aksi: string, detail: string, nilaiSebelum?: string, nilaiSesudah?: string) => void;

  // Utility
  hitungEstimasiPerjalanan: (kotaTujuan: string, pesertaList: Array<{ nip: string; nama: string; jabatan: string; golongan: string }>, lamaHari: number, lamaMalam: number) => {
    peserta: PerjalananDinas['peserta'];
    total: number;
  };
  resetAllData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const STORAGE_KEY = 'eperjadin_kendal_data_v3';

// Initial Seeds
const SEED_USERS: User[] = [
  {
    id: 'usr-1',
    nip: '19820315 200112 1 002',
    nama: 'Marie Sananda, S.STP, M.Si',
    email: 'mariesananda1992@gmail.com',
    password: 'password123',
    role: 'admin',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Ketua Tim Administrasi Kewilayahan / PPTK',
    golongan: 'Pembina (IV/a)',
    statusAktif: true,
  },
  {
    id: 'usr-2',
    nip: '19740512 199803 2 004',
    nama: 'Dra. Nurhasanah, M.M.',
    email: 'nurhasanah.kpa@kendalkab.go.id',
    password: 'password123',
    role: 'atasan',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Kepala Bagian Pemerintahan / KPA',
    golongan: 'Pembina Utama Muda (IV/c)',
    statusAktif: true,
  },
  {
    id: 'usr-3',
    nip: '19850920 200801 2 007',
    nama: 'Sri Wahyuni, S.E.',
    email: 'sri.bendahara@kendalkab.go.id',
    password: 'password123',
    role: 'bendahara',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Bendahara Pengeluaran Pembantu',
    golongan: 'Penata Tk. I (III/d)',
    statusAktif: true,
  },
  {
    id: 'usr-4',
    nip: '19951103 201903 2 008',
    nama: 'Anisa Rahmawati, S.Tr.IP',
    email: 'anisa.operator@kendalkab.go.id',
    password: 'password123',
    role: 'operator',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Operator Pengelola Perjalanan Dinas',
    golongan: 'Penata Muda (III/a)',
    statusAktif: true,
  },
  {
    id: 'usr-5',
    nip: '19890714 201101 1 005',
    nama: 'Ahmad Fauzi, S.Kom',
    email: 'ahmad.fauzi@kendalkab.go.id',
    password: 'password123',
    role: 'pegawai',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Pranata Komputer Ahli Pertama',
    golongan: 'Penata (III/c)',
    statusAktif: true,
  },
  {
    id: 'usr-6',
    nip: '19920822 201502 2 006',
    nama: 'Dewi Lestari, S.AP',
    email: 'dewi.lestari@kendalkab.go.id',
    password: 'password123',
    role: 'pegawai',
    unitKerjaId: 'unit-1',
    unitKerjaNama: 'Bagian Pemerintahan Setda Kendal',
    jabatan: 'Analis Kebijakan Pertama',
    golongan: 'Penata Muda Tk. I (III/b)',
    statusAktif: true,
  },
];

const SEED_UNIT_KERJA: UnitKerja[] = [
  { id: 'unit-1', kode: '4.01.0.00.0.00.01.0000', nama: 'Bagian Pemerintahan', singkatan: 'Bag. Pem' },
  { id: 'unit-2', kode: '4.01.0.00.0.00.02.0000', nama: 'Bagian Hukum', singkatan: 'Bag. Hukum' },
  { id: 'unit-3', kode: '4.01.0.00.0.00.03.0000', nama: 'Bagian Organisasi', singkatan: 'Bag. Org' },
  { id: 'unit-4', kode: '4.01.0.00.0.00.04.0000', nama: 'Bagian Umum', singkatan: 'Bag. Umum' },
];

const SEED_SUB_KEGIATAN: SubKegiatan[] = [
  {
    id: 'sub-1',
    kode: '4.01.02.2.01.0002',
    nama: 'Pengelolaan Administrasi Kewilayahan',
    unitKerjaId: 'unit-1',
  },
  {
    id: 'sub-2',
    kode: '4.01.02.2.01.0001',
    nama: 'Pengoordinasian Kebijakan Bidang Pemerintahan',
    unitKerjaId: 'unit-1',
  },
];

const SEED_AKUN_BELANJA: AkunBelanja[] = [
  {
    id: 'acc-1',
    subKegiatanId: 'sub-1',
    kodeRekening: '5.1.02.04.01.0001',
    uraian: 'Belanja Perjalanan Dinas Biasa Dalam Daerah',
    kelompokBelanja: 'perjalanan',
    pagu: 120000000,
    komitmen: 0,
    realisasi: 0,
  },
  {
    id: 'acc-2',
    subKegiatanId: 'sub-1',
    kodeRekening: '5.1.02.04.01.0003',
    uraian: 'Belanja Perjalanan Dinas Biasa Luar Daerah',
    kelompokBelanja: 'perjalanan',
    pagu: 180000000,
    komitmen: 0,
    realisasi: 0,
  },
  {
    id: 'acc-3',
    subKegiatanId: 'sub-1',
    kodeRekening: '5.1.02.01.01.0024',
    uraian: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor',
    kelompokBelanja: 'barang_jasa',
    pagu: 35000000,
    komitmen: 0,
    realisasi: 4500000,
  },
  {
    id: 'acc-4',
    subKegiatanId: 'sub-1',
    kodeRekening: '5.1.02.02.01.0014',
    uraian: 'Belanja Makanan dan Minuman Rapat Evaluasi Kewilayahan',
    kelompokBelanja: 'barang_jasa',
    pagu: 45000000,
    komitmen: 0,
    realisasi: 12000000,
  },
  {
    id: 'acc-5',
    subKegiatanId: 'sub-1',
    kodeRekening: '5.1.02.03.02.0035',
    uraian: 'Belanja Pemeliharaan Peralatan Komputer dan Jaringan',
    kelompokBelanja: 'pemeliharaan',
    pagu: 20000000,
    komitmen: 0,
    realisasi: 3200000,
  },
];

const SEED_TARIF: TarifMaster[] = [
  {
    id: 'trf-1',
    kotaTujuan: 'Kota Semarang',
    provinsi: 'Jawa Tengah',
    golongan: 'Golongan IV',
    uangHarianPerHari: 430000,
    penginapanPerMalam: 680000,
    transportDefault: 200000,
    representasiPerHari: 150000,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
  {
    id: 'trf-2',
    kotaTujuan: 'Kota Semarang',
    provinsi: 'Jawa Tengah',
    golongan: 'Golongan III',
    uangHarianPerHari: 380000,
    penginapanPerMalam: 550000,
    transportDefault: 180000,
    representasiPerHari: 0,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
  {
    id: 'trf-3',
    kotaTujuan: 'DKI Jakarta',
    provinsi: 'DKI Jakarta',
    golongan: 'Golongan IV',
    uangHarianPerHari: 580000,
    penginapanPerMalam: 950000,
    transportDefault: 850000,
    representasiPerHari: 200000,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
  {
    id: 'trf-4',
    kotaTujuan: 'DKI Jakarta',
    provinsi: 'DKI Jakarta',
    golongan: 'Golongan III',
    uangHarianPerHari: 530000,
    penginapanPerMalam: 730000,
    transportDefault: 750000,
    representasiPerHari: 0,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
  {
    id: 'trf-5',
    kotaTujuan: 'Kota Surakarta (Solo)',
    provinsi: 'Jawa Tengah',
    golongan: 'Golongan III',
    uangHarianPerHari: 380000,
    penginapanPerMalam: 550000,
    transportDefault: 250000,
    representasiPerHari: 0,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
  {
    id: 'trf-6',
    kotaTujuan: 'Kabupaten Kendal (Wilayah Kecamatan)',
    provinsi: 'Jawa Tengah',
    golongan: 'Golongan III',
    uangHarianPerHari: 190000,
    penginapanPerMalam: 0,
    transportDefault: 950000 / 10, // 95.000
    representasiPerHari: 0,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
  },
];

const SEED_PEJABAT: PejabatPenandatangan[] = [
  {
    id: 'pjb-1',
    peran: 'kpa',
    nama: 'Dra. Nurhasanah, M.M.',
    nip: '19740512 199803 2 004',
    jabatanDinas: 'Kepala Bagian Pemerintahan Setda Kabupaten Kendal',
    keteranganPeran: 'Kuasa Pengguna Anggaran (KPA)',
    nomorSK: 'SK.800/12/2026',
    masaBerlaku: 'Tahun Anggaran 2026',
  },
  {
    id: 'pjb-2',
    peran: 'pptk',
    nama: 'Marie Sananda, S.STP, M.Si',
    nip: '19820315 200112 1 002',
    jabatanDinas: 'Ketua Tim Kerja Administrasi Kewilayahan',
    keteranganPeran: 'Pejabat Pelaksana Teknis Kegiatan (PPTK)',
    nomorSK: 'SK.800/14/2026',
    masaBerlaku: 'Tahun Anggaran 2026',
  },
  {
    id: 'pjb-3',
    peran: 'bendahara_pengeluaran_pembantu',
    nama: 'Sri Wahyuni, S.E.',
    nip: '19850920 200801 2 007',
    jabatanDinas: 'Pengelola Keuangan',
    keteranganPeran: 'Bendahara Pengeluaran Pembantu',
    nomorSK: 'SK.900/03/2026',
    masaBerlaku: 'Tahun Anggaran 2026',
  },
  {
    id: 'pjb-4',
    peran: 'pembantu_bendahara_pengeluaran',
    nama: 'Eko Prasetyo, A.Md.',
    nip: '19910418 201402 1 003',
    jabatanDinas: 'Penyusun Laporan Keuangan',
    keteranganPeran: 'Pembantu Bendahara Pengeluaran Kegiatan',
    nomorSK: 'SK.900/04/2026',
    masaBerlaku: 'Tahun Anggaran 2026',
  },
];

const SEED_PENGATURAN: PengaturanInstansi = {
  namaPemerintah: 'Pemerintah Kabupaten Kendal',
  namaUnitKerja: 'Sekretariat Daerah',
  alamatKantor: 'Jl. Soekarno - Hatta No. 193 Kendal, Jawa Tengah (51311)',
  kotaSurat: 'Kendal',
  formatNomorSPT: '090/{no}/Bag.Pem/{tahun}',
  nomorSPTSequence: 104,
  formatNomorSPP: '900/{no}/SPP-LS/Bag.Pem/{tahun}',
  nomorSPPSequence: 12,
  formatNomorKuitansi: 'KWT/{no}/PERJADIN/{tahun}',
  nomorKuitansiSequence: 45,
  maxUploadMB: 10,
};

const SEED_TEMPLATES: TemplateDokumen[] = [
  {
    id: 'tpl-1',
    nama: 'Format SPT Resmi Sekretariat Daerah',
    jenis: 'spt',
    versi: 1,
    content: 'SURAT PERINTAH TUGAS\nNomor: {nomor_spt}\nDasar: DPA-SKPD No. 4.01.02.2.01.0002 Tahun 2026\nMenugaskan: {nama_pegawai} ({nip})\nTujuan: {tujuan}\nTanggal: {tanggal_berangkat} s.d. {tanggal_kembali}',
    placeholders: ['{nomor_spt}', '{nama_pegawai}', '{nip}', '{tujuan}', '{tanggal_berangkat}', '{tanggal_kembali}', '{maksud_perjalanan}', '{penandatangan}'],
    terakhirDiperbarui: '2026-01-10T08:00:00Z',
    diperbaruiOleh: 'Admin Sistem',
  },
  {
    id: 'tpl-2',
    nama: 'Format Laporan Kegiatan Perjalanan Dinas',
    jenis: 'laporan',
    versi: 1,
    content: 'LAPORAN HASIL PERJALANAN DINAS\nI. Dasar: {dasar}\nII. Maksud dan Tujuan: {maksud_tujuan}\nIII. Waktu dan Tempat: {waktu_tempat}\nIV. Uraian Kegiatan: {uraian}\nV. Hasil: {hasil}\nVI. Kesimpulan dan Tindak Lanjut: {kesimpulan}\nVII. Penutup: {penutup}',
    placeholders: ['{dasar}', '{maksud_tujuan}', '{waktu_tempat}', '{uraian}', '{hasil}', '{kesimpulan}', '{penutup}', '{pelapor}'],
    terakhirDiperbarui: '2026-01-10T08:00:00Z',
    diperbaruiOleh: 'Admin Sistem',
  },
  {
    id: 'tpl-3',
    nama: 'Buku Pembantu Pengeluaran per Kegiatan (Format PK6)',
    jenis: 'pk6',
    versi: 1,
    content: 'Buku Pembantu PK6 Format Perbup Kendal',
    placeholders: ['{bulan}', '{tahun_anggaran}', '{unit_kerja}', '{sub_kegiatan}', '{empat_penandatangan}'],
    terakhirDiperbarui: '2026-01-10T08:00:00Z',
    diperbaruiOleh: 'Admin Sistem',
  },
];

const SEED_BULAN_BUKU: BulanBukuKas[] = [
  { bulan: 1, tahun: 2026, isTutup: true, ditutupOleh: 'Sri Wahyuni, S.E.', tanggalTutup: '2026-01-31' },
  { bulan: 2, tahun: 2026, isTutup: true, ditutupOleh: 'Sri Wahyuni, S.E.', tanggalTutup: '2026-02-28' },
  { bulan: 3, tahun: 2026, isTutup: false },
  { bulan: 4, tahun: 2026, isTutup: false },
  { bulan: 5, tahun: 2026, isTutup: false },
  { bulan: 6, tahun: 2026, isTutup: false },
  { bulan: 7, tahun: 2026, isTutup: false },
  { bulan: 8, tahun: 2026, isTutup: false },
  { bulan: 9, tahun: 2026, isTutup: false },
  { bulan: 10, tahun: 2026, isTutup: false },
  { bulan: 11, tahun: 2026, isTutup: false },
  { bulan: 12, tahun: 2026, isTutup: false },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with seed data
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currentUser`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return SEED_USERS[0]; // Admin by default: Marie Sananda, S.STP, M.Si
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [unitKerjaList] = useState<UnitKerja[]>(SEED_UNIT_KERJA);
  const [subKegiatanList] = useState<SubKegiatan[]>(SEED_SUB_KEGIATAN);
  const [akunBelanjaList, setAkunBelanjaList] = useState<AkunBelanja[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_akun`);
    return saved ? JSON.parse(saved) : SEED_AKUN_BELANJA;
  });

  const [paguHistories, setPaguHistories] = useState<PaguHistory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pagu_hist`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tarifMasterList, setTarifMasterList] = useState<TarifMaster[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tarif`);
    return saved ? JSON.parse(saved) : SEED_TARIF;
  });

  const [pejabatList, setPejabatList] = useState<PejabatPenandatangan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pejabat`);
    return saved ? JSON.parse(saved) : SEED_PEJABAT;
  });

  const [pengaturan, setPengaturan] = useState<PengaturanInstansi>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pengaturan`);
    return saved ? JSON.parse(saved) : SEED_PENGATURAN;
  });

  const [perjalananList, setPerjalananList] = useState<PerjalananDinas[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_perjalanan`);
    if (saved) return JSON.parse(saved);

    // Initial realistic seeded travels
    return [
      {
        id: 'prj-101',
        nomorSPT: '090/088/Bag.Pem/2026',
        tanggalSPT: '2026-02-12',
        maksudPerjalanan: 'Koordinasi Penataan Batas Wilayah dan Administrasi Kewilayahan ke Biro Tata Pemerintahan Setda Provinsi Jawa Tengah',
        kotaTujuan: 'Kota Semarang',
        tempatTujuanDetail: 'Biro Tata Pemerintahan Setda Provinsi Jawa Tengah, Jl. Pahlawan No. 9 Semarang',
        tanggalBerangkat: '2026-02-15',
        tanggalKembali: '2026-02-16',
        lamaHari: 2,
        lamaMalam: 1,
        alatTransportasi: 'Kendaraan Dinas Operasional',
        unitKerjaId: 'unit-1',
        subKegiatanId: 'sub-1',
        akunBelanjaId: 'acc-1',
        pegawaiPengajuId: 'usr-5',
        pegawaiPengajuNama: 'Ahmad Fauzi, S.Kom',
        pegawaiPengajuNip: '19890714 201101 1 005',
        peserta: [
          {
            id: 'pst-1',
            pegawaiId: 'usr-5',
            nip: '19890714 201101 1 005',
            nama: 'Ahmad Fauzi, S.Kom',
            jabatan: 'Pranata Komputer Ahli Pertama',
            golongan: 'Penata (III/c)',
            uangMuka: 1490000,
            totalEstimasi: 1490000,
            totalRealisasi: 1490000,
            komponenBiaya: [
              { id: 'c-1', jenis: 'uang_harian', uraian: 'Uang Harian (2 hari x Rp 380.000)', nominalEstimasi: 760000, nominalRealisasi: 760000 },
              { id: 'c-2', jenis: 'penginapan', uraian: 'Penginapan Hotel Semarang (1 malam)', nominalEstimasi: 550000, nominalRealisasi: 550000 },
              { id: 'c-3', jenis: 'transport', uraian: 'Transport Tol dan BBM Lokal', nominalEstimasi: 180000, nominalRealisasi: 180000 },
            ],
          },
          {
            id: 'pst-2',
            pegawaiId: 'usr-6',
            nip: '19920822 201502 2 006',
            nama: 'Dewi Lestari, S.AP',
            jabatan: 'Analis Kebijakan Pertama',
            golongan: 'Penata Muda Tk. I (III/b)',
            uangMuka: 1490000,
            totalEstimasi: 1490000,
            totalRealisasi: 1490000,
            komponenBiaya: [
              { id: 'c-4', jenis: 'uang_harian', uraian: 'Uang Harian (2 hari x Rp 380.000)', nominalEstimasi: 760000, nominalRealisasi: 760000 },
              { id: 'c-5', jenis: 'penginapan', uraian: 'Penginapan Hotel Semarang (1 malam)', nominalEstimasi: 550000, nominalRealisasi: 550000 },
              { id: 'c-6', jenis: 'transport', uraian: 'Transport Tol dan BBM Lokal', nominalEstimasi: 180000, nominalRealisasi: 180000 },
            ],
          },
        ],
        totalEstimasi: 2980000,
        totalRealisasi: 2980000,
        totalUangMuka: 2980000,
        statusUangMuka: 'nihil',
        nominalSelisihUangMuka: 0,
        status: 'selesai',
        catatanAtasan: 'Disetujui. Pastikan data pemetaan batas wilayah terkoordinasi dengan baik.',
        catatanOperator: 'Berkas lengkap dan sesuai standar kelengkapan.',
        catatanBendahara: 'Bukti transaksi hotel dan BBM sah telah diverifikasi.',
        laporanKegiatan: {
          dasarPelaksanaan: 'Surat Perintah Tugas Nomor: 090/088/Bag.Pem/2026',
          maksudTujuan: 'Melakukan koordinasi dan konsultasi teknis sinkronisasi batas wilayah administratif Kabupaten Kendal dengan wilayah perbatasan.',
          waktuDanTempat: '15 s.d. 16 Februari 2026 di Biro Tata Pemerintahan Setda Provinsi Jawa Tengah, Semarang.',
          uraianKegiatan: 'Diterima oleh Kabag Kewilayahan Pemprov Jateng. Membahas tindak lanjut penetapan tapal batas daerah segmen Kendal - Temanggung serta penyerahan data dukung peta geospasial.',
          hasilKegiatan: 'Disepakati draft berita acara penegasan batas wilayah antar kabupaten yang akan ditandatangani pada rapat koordinasi triwulan II.',
          kesimpulanTindakLanjut: 'Perlu penyiapan data spasial skala 1:5000 bersama tim teknis Badan Informasi Geospasial.',
          penutup: 'Demikian laporan hasil perjalanan dinas ini disusun sebagai bahan pertanggungjawaban kegiatan.',
          terakhirDiperbarui: '2026-02-18T10:00:00Z',
          diperbaruiOleh: 'Ahmad Fauzi, S.Kom',
        },
        berkas: [
          {
            id: 'b-1',
            perjalananId: 'prj-101',
            jenis: 'spt_bertandatangan',
            namaFile: 'Scan_SPT_090_088_Bertandatangan.pdf',
            tipeFile: 'pdf',
            ukuranKB: 450,
            keterangan: 'SPT telah ditandatangani basah oleh KPA/Sekda',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-02-17T09:30:00Z',
          },
          {
            id: 'b-2',
            perjalananId: 'prj-101',
            jenis: 'laporan_bertandatangan',
            namaFile: 'Laporan_Kegiatan_Semarang_Signed.pdf',
            tipeFile: 'pdf',
            ukuranKB: 720,
            keterangan: 'Laporan kegiatan telah diparaf peserta dan disahkan',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-02-18T11:00:00Z',
          },
          {
            id: 'b-3',
            perjalananId: 'prj-101',
            jenis: 'bukti_transaksi',
            namaFile: 'Kuitansi_Hotel_Grasia_Semarang.pdf',
            tipeFile: 'pdf',
            ukuranKB: 310,
            keterangan: 'Kuitansi hotel resmi + bill rincian kamar 2 orang',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-02-17T14:15:00Z',
          },
          {
            id: 'b-4',
            perjalananId: 'prj-101',
            jenis: 'foto_kegiatan',
            namaFile: 'Dokumentasi_Rakor_Pemprov.jpg',
            tipeFile: 'jpg',
            ukuranKB: 580,
            keterangan: 'Foto rapat koordinasi bersama Kabag Kewilayahan Setda Jateng',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-02-17T15:00:00Z',
          },
        ],
        versiTemplateDipakai: 1,
        kodeVerifikasiQR: 'VERIF-KND-2026-088-A4F7',
        riwayatStatus: [
          { status: 'draft', waktu: '2026-02-11T08:00:00Z', oleh: 'Ahmad Fauzi, S.Kom' },
          { status: 'diajukan', waktu: '2026-02-11T10:00:00Z', oleh: 'Ahmad Fauzi, S.Kom' },
          { status: 'disetujui_atasan', waktu: '2026-02-12T09:15:00Z', oleh: 'Dra. Nurhasanah, M.M.', catatan: 'Disetujui. SPT Terbit.' },
          { status: 'menunggu_verifikasi_operator', waktu: '2026-02-18T11:30:00Z', oleh: 'Ahmad Fauzi, S.Kom', catatan: 'Bukti & laporan diunggah.' },
          { status: 'menunggu_verifikasi_bendahara', waktu: '2026-02-19T08:45:00Z', oleh: 'Anisa Rahmawati, S.Tr.IP', catatan: 'Berkas lengkap dan diverifikasi operator.' },
          { status: 'terverifikasi_bendahara', waktu: '2026-02-19T14:00:00Z', oleh: 'Sri Wahyuni, S.E.', catatan: 'SPJ diverifikasi, masuk buku kas.' },
          { status: 'selesai', waktu: '2026-02-20T10:00:00Z', oleh: 'Marie Sananda, S.STP, M.Si', catatan: 'Arsip final lengkap.' },
        ],
        riwayatRevisi: [],
      },
      {
        id: 'prj-102',
        nomorSPT: '090/095/Bag.Pem/2026',
        tanggalSPT: '2026-02-24',
        maksudPerjalanan: 'Konsultasi Peraturan Daerah tentang Pembentukan Desa dan Kelurahan ke Ditjen Bina Pemerintahan Desa Kementerian Dalam Negeri RI',
        kotaTujuan: 'DKI Jakarta',
        tempatTujuanDetail: 'Kementerian Dalam Negeri RI, Jl. Medan Merdeka Utara No. 7 Jakarta Pusat',
        tanggalBerangkat: '2026-03-02',
        tanggalKembali: '2026-03-04',
        lamaHari: 3,
        lamaMalam: 2,
        alatTransportasi: 'Kereta Api Eksekutif & Transportasi Darat',
        unitKerjaId: 'unit-1',
        subKegiatanId: 'sub-1',
        akunBelanjaId: 'acc-2',
        pegawaiPengajuId: 'usr-1',
        pegawaiPengajuNama: 'Marie Sananda, S.STP, M.Si',
        pegawaiPengajuNip: '19820315 200112 1 002',
        peserta: [
          {
            id: 'pst-3',
            pegawaiId: 'usr-1',
            nip: '19820315 200112 1 002',
            nama: 'Marie Sananda, S.STP, M.Si',
            jabatan: 'Ketua Tim Administrasi Kewilayahan',
            golongan: 'Pembina (IV/a)',
            uangMuka: 4890000,
            totalEstimasi: 4890000,
            totalRealisasi: 4890000,
            komponenBiaya: [
              { id: 'c-7', jenis: 'uang_harian', uraian: 'Uang Harian (3 hari x Rp 580.000)', nominalEstimasi: 1740000, nominalRealisasi: 1740000 },
              { id: 'c-8', jenis: 'penginapan', uraian: 'Penginapan Jakarta (2 malam x Rp 950.000)', nominalEstimasi: 1900000, nominalRealisasi: 1900000 },
              { id: 'c-9', jenis: 'transport', uraian: 'Tiket KA Tawang Jaya Premium & Transport Lokal', nominalEstimasi: 850000, nominalRealisasi: 850000 },
              { id: 'c-10', jenis: 'representasi', uraian: 'Uang Representasi Pejabat Eselon III (2 hari x Rp 200.000)', nominalEstimasi: 400000, nominalRealisasi: 400000 },
            ],
          },
          {
            id: 'pst-4',
            pegawaiId: 'usr-5',
            nip: '19890714 201101 1 005',
            nama: 'Ahmad Fauzi, S.Kom',
            jabatan: 'Pranata Komputer Ahli Pertama',
            golongan: 'Penata (III/c)',
            uangMuka: 3800000,
            totalEstimasi: 3800000,
            totalRealisasi: 3800000,
            komponenBiaya: [
              { id: 'c-11', jenis: 'uang_harian', uraian: 'Uang Harian (3 hari x Rp 530.000)', nominalEstimasi: 1590000, nominalRealisasi: 1590000 },
              { id: 'c-12', jenis: 'penginapan', uraian: 'Penginapan Jakarta (2 malam x Rp 730.000)', nominalEstimasi: 1460000, nominalRealisasi: 1460000 },
              { id: 'c-13', jenis: 'transport', uraian: 'Tiket KA & Transport Lokal', nominalEstimasi: 750000, nominalRealisasi: 750000 },
            ],
          },
        ],
        totalEstimasi: 8690000,
        totalRealisasi: 8690000,
        totalUangMuka: 8690000,
        statusUangMuka: 'nihil',
        nominalSelisihUangMuka: 0,
        status: 'menunggu_verifikasi_bendahara',
        catatanAtasan: 'Penting untuk fasilitasi Raperda Pemdes. Laksanakan dengan tertib.',
        catatanOperator: 'Seluruh bukti tiket KAI, boarding pass, bill hotel, dan laporan kegiatan telah lengkap terunggah.',
        laporanKegiatan: {
          dasarPelaksanaan: 'Surat Perintah Tugas Nomor: 090/095/Bag.Pem/2026',
          maksudTujuan: 'Mengkonsultasikan harmonisasi regulasi penataan desa dan penetapan batas kelurahan sesuai Permendagri terbaru.',
          waktuDanTempat: '2 s.d. 4 Maret 2026 di Kemendagri, Jakarta.',
          uraianKegiatan: 'Melakukan diskusi teknis dengan Subdit Fasilitasi Penataan Wilayah Desa Kemendagri terkait syarat administrasi pemekaran dusun dan penegasan tapal batas.',
          hasilKegiatan: 'Kemendagri memberikan telaah persetujuan draft naskah akademik dan rekomendasi lampiran peta kewilayahan.',
          kesimpulanTindakLanjut: 'Melanjutkan proses uji publik bersama Bagian Hukum Setda dan DPRD Kabupaten Kendal.',
          penutup: 'Laporan ini disusun dengan sebenar-benarnya.',
          terakhirDiperbarui: '2026-03-05T14:20:00Z',
          diperbaruiOleh: 'Marie Sananda, S.STP, M.Si',
        },
        berkas: [
          {
            id: 'b-5',
            perjalananId: 'prj-102',
            jenis: 'spt_bertandatangan',
            namaFile: 'Scan_SPT_090_095_Jakarta.pdf',
            tipeFile: 'pdf',
            ukuranKB: 512,
            keterangan: 'SPT bertandatangan KPA',
            diunggahOleh: 'Marie Sananda, S.STP, M.Si',
            diunggahPada: '2026-03-01T08:00:00Z',
          },
          {
            id: 'b-6',
            perjalananId: 'prj-102',
            jenis: 'bukti_transaksi',
            namaFile: 'Tiket_KA_KAI_Access_PP.pdf',
            tipeFile: 'pdf',
            ukuranKB: 420,
            keterangan: 'Tiket Kereta Api Eksekutif PP Kendal-Jakarta',
            diunggahOleh: 'Marie Sananda, S.STP, M.Si',
            diunggahPada: '2026-03-04T16:00:00Z',
          },
          {
            id: 'b-7',
            perjalananId: 'prj-102',
            jenis: 'foto_kegiatan',
            namaFile: 'Dokumentasi_Konsultasi_Kemendagri.jpg',
            tipeFile: 'jpg',
            ukuranKB: 640,
            keterangan: 'Pertemuan di Gedung B Kemendagri RI',
            diunggahOleh: 'Marie Sananda, S.STP, M.Si',
            diunggahPada: '2026-03-04T17:00:00Z',
          },
        ],
        versiTemplateDipakai: 1,
        kodeVerifikasiQR: 'VERIF-KND-2026-095-B7D2',
        riwayatStatus: [
          { status: 'draft', waktu: '2026-02-23T10:00:00Z', oleh: 'Marie Sananda, S.STP, M.Si' },
          { status: 'diajukan', waktu: '2026-02-23T13:00:00Z', oleh: 'Marie Sananda, S.STP, M.Si' },
          { status: 'disetujui_atasan', waktu: '2026-02-24T08:30:00Z', oleh: 'Dra. Nurhasanah, M.M.' },
          { status: 'menunggu_verifikasi_operator', waktu: '2026-03-04T18:00:00Z', oleh: 'Marie Sananda, S.STP, M.Si' },
          { status: 'menunggu_verifikasi_bendahara', waktu: '2026-03-05T09:00:00Z', oleh: 'Anisa Rahmawati, S.Tr.IP' },
        ],
        riwayatRevisi: [],
      },
      {
        id: 'prj-103',
        nomorSPT: '',
        maksudPerjalanan: 'Monitoring dan Pembinaan Administrasi Penyelenggaraan Pemerintahan di Kecamatan Sukorejo dan Patean',
        kotaTujuan: 'Kabupaten Kendal (Wilayah Kecamatan)',
        tempatTujuanDetail: 'Kantor Kecamatan Sukorejo dan Kantor Kecamatan Patean',
        tanggalBerangkat: '2026-03-20',
        tanggalKembali: '2026-03-20',
        lamaHari: 1,
        lamaMalam: 0,
        alatTransportasi: 'Mobil Dinas Pick-Up / MPV',
        unitKerjaId: 'unit-1',
        subKegiatanId: 'sub-1',
        akunBelanjaId: 'acc-1',
        pegawaiPengajuId: 'usr-6',
        pegawaiPengajuNama: 'Dewi Lestari, S.AP',
        pegawaiPengajuNip: '19920822 201502 2 006',
        peserta: [
          {
            id: 'pst-5',
            pegawaiId: 'usr-6',
            nip: '19920822 201502 2 006',
            nama: 'Dewi Lestari, S.AP',
            jabatan: 'Analis Kebijakan Pertama',
            golongan: 'Penata Muda Tk. I (III/b)',
            uangMuka: 0,
            totalEstimasi: 285000,
            totalRealisasi: 0,
            komponenBiaya: [
              { id: 'c-14', jenis: 'uang_harian', uraian: 'Uang Harian Perjalanan Dinas Dalam Daerah (1 hari)', nominalEstimasi: 190000, nominalRealisasi: 0 },
              { id: 'c-15', jenis: 'transport', uraian: 'Transport Lokal Bensin Kendal Wilayah Atas', nominalEstimasi: 95000, nominalRealisasi: 0 },
            ],
          },
        ],
        totalEstimasi: 285000,
        totalRealisasi: 0,
        totalUangMuka: 0,
        statusUangMuka: 'nihil',
        nominalSelisihUangMuka: 0,
        status: 'diajukan',
        laporanKegiatan: {
          dasarPelaksanaan: '',
          maksudTujuan: '',
          waktuDanTempat: '',
          uraianKegiatan: '',
          hasilKegiatan: '',
          kesimpulanTindakLanjut: '',
          penutup: '',
          terakhirDiperbarui: '',
          diperbaruiOleh: '',
        },
        berkas: [],
        versiTemplateDipakai: 1,
        kodeVerifikasiQR: 'VERIF-KND-2026-DRAFT-918C',
        riwayatStatus: [
          { status: 'draft', waktu: '2026-03-10T08:00:00Z', oleh: 'Dewi Lestari, S.AP' },
          { status: 'diajukan', waktu: '2026-03-10T09:30:00Z', oleh: 'Dewi Lestari, S.AP', catatan: 'Mohon persetujuan atasan' },
        ],
        riwayatRevisi: [],
      },
      {
        id: 'prj-104',
        nomorSPT: '090/104/Bag.Pem/2026',
        tanggalSPT: '2026-11-02',
        maksudPerjalanan: 'Sinkronisasi dan Validasi Data Batas Administrasi Kewilayahan Desa dan Kelurahan Kabupaten Kendal ke Pemprov Jateng',
        kotaTujuan: 'Kota Semarang',
        tempatTujuanDetail: 'Biro Tata Pemerintahan Setda Provinsi Jawa Tengah',
        tanggalBerangkat: '2026-11-03',
        tanggalKembali: '2026-11-04',
        lamaHari: 2,
        lamaMalam: 1,
        alatTransportasi: 'Kendaraan Dinas Operasional',
        unitKerjaId: 'unit-1',
        subKegiatanId: 'sub-1',
        akunBelanjaId: 'acc-1',
        pegawaiPengajuId: 'usr-5',
        pegawaiPengajuNama: 'Ahmad Fauzi, S.Kom',
        pegawaiPengajuNip: '19890714 201101 1 005',
        peserta: [
          {
            id: 'pst-6',
            pegawaiId: 'usr-5',
            nip: '19890714 201101 1 005',
            nama: 'Ahmad Fauzi, S.Kom',
            jabatan: 'Pranata Komputer Ahli Pertama',
            golongan: 'Penata (III/c)',
            uangMuka: 1490000,
            totalEstimasi: 1490000,
            totalRealisasi: 1490000,
            komponenBiaya: [
              { id: 'c-16', jenis: 'uang_harian', uraian: 'Uang Harian (2 hari x Rp 380.000)', nominalEstimasi: 760000, nominalRealisasi: 760000 },
              { id: 'c-17', jenis: 'penginapan', uraian: 'Penginapan Hotel Semarang (1 malam)', nominalEstimasi: 550000, nominalRealisasi: 550000 },
              { id: 'c-18', jenis: 'transport', uraian: 'Transport Tol dan BBM Lokal', nominalEstimasi: 180000, nominalRealisasi: 180000 },
            ],
          },
        ],
        totalEstimasi: 1490000,
        totalRealisasi: 1490000,
        totalUangMuka: 1490000,
        statusUangMuka: 'nihil',
        nominalSelisihUangMuka: 0,
        status: 'menunggu_verifikasi_operator',
        catatanAtasan: 'Disetujui. Pastikan kelengkapan berkas koordinasi selesai.',
        laporanKegiatan: {
          dasarPelaksanaan: 'Surat Perintah Tugas Nomor: 090/104/Bag.Pem/2026',
          maksudTujuan: 'Sinkronisasi dan validasi peta batas wilayah desa dan kelurahan dengan Pemprov Jawa Tengah.',
          waktuDanTempat: '3 s.d. 4 November 2026 di Semarang.',
          uraianKegiatan: 'Melakukan pemadanan data spasial dan toponimi batas desa se-Kabupaten Kendal.',
          hasilKegiatan: 'Berita acara verifikasi batas wilayah telah diparaf oleh tim teknis provinsi.',
          kesimpulanTindakLanjut: 'Penyampaian salinan berita acara ke Bupati Kendal.',
          penutup: 'Demikian laporan hasil pelaksanaan tugas disusun.',
          terakhirDiperbarui: '2026-11-04T16:00:00Z',
          diperbaruiOleh: 'Ahmad Fauzi, S.Kom',
        },
        berkas: [
          {
            id: 'b-8',
            perjalananId: 'prj-104',
            jenis: 'spt_bertandatangan',
            namaFile: 'Scan_SPT_090_104_Signed.pdf',
            tipeFile: 'pdf',
            ukuranKB: 460,
            keterangan: 'SPT telah ditandatangani KPA',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-11-04T09:00:00Z',
          },
          {
            id: 'b-9',
            perjalananId: 'prj-104',
            jenis: 'bukti_transaksi',
            namaFile: 'Kuitansi_Hotel_Semarang_Nov2026.pdf',
            tipeFile: 'pdf',
            ukuranKB: 320,
            keterangan: 'Kuitansi hotel dan bill kamar 1 malam',
            diunggahOleh: 'Ahmad Fauzi, S.Kom',
            diunggahPada: '2026-11-04T14:30:00Z',
          },
        ],
        versiTemplateDipakai: 1,
        kodeVerifikasiQR: 'VERIF-KND-2026-104-C8E1',
        riwayatStatus: [
          { status: 'draft', waktu: '2026-11-01T08:00:00Z', oleh: 'Ahmad Fauzi, S.Kom' },
          { status: 'diajukan', waktu: '2026-11-01T09:00:00Z', oleh: 'Ahmad Fauzi, S.Kom' },
          { status: 'disetujui_atasan', waktu: '2026-11-02T10:00:00Z', oleh: 'Dra. Nurhasanah, M.M.' },
          { status: 'menunggu_verifikasi_operator', waktu: '2026-11-04T17:00:00Z', oleh: 'Ahmad Fauzi, S.Kom' },
        ],
        riwayatRevisi: [],
      },
    ];
  });

  const [bukuKasList, setBukuKasList] = useState<BukuKasEntri[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bukukas`);
    if (saved) return JSON.parse(saved);

    // Initial cash book with receipt and the verified travel expenditure
    return [
      {
        id: 'kas-1',
        tanggal: '2026-01-05',
        nomorBukti: 'SP2D/001/UP/2026',
        uraian: 'Penerimaan Uang Persediaan (UP) Awal Tahun Anggaran 2026 Bagian Pemerintahan',
        kodeRekening: '4.01.02.2.01.0002',
        jenis: 'penerimaan',
        debet: 50000000,
        kredit: 0,
        saldoBerjalan: 50000000,
        bulan: 1,
        tahun: 2026,
      },
      {
        id: 'kas-2',
        tanggal: '2026-01-20',
        nomorBukti: 'BKP-001/01/2026',
        uraian: 'Belanja Alat Tulis Kantor Kegiatan Penataan Wilayah (Kuitansi Toko Agung Jaya)',
        kodeRekening: '5.1.02.01.01.0024',
        jenis: 'pengeluaran',
        debet: 0,
        kredit: 4500000,
        saldoBerjalan: 45500000,
        bulan: 1,
        tahun: 2026,
      },
      {
        id: 'kas-3',
        tanggal: '2026-02-10',
        nomorBukti: 'SP2D/023/GU/2026',
        uraian: 'Penerimaan Tambahan Kas Ganti Uang (GU) Tahap I',
        kodeRekening: '4.01.02.2.01.0002',
        jenis: 'penerimaan',
        debet: 30000000,
        kredit: 0,
        saldoBerjalan: 75500000,
        bulan: 2,
        tahun: 2026,
      },
      {
        id: 'kas-4',
        tanggal: '2026-02-19',
        nomorBukti: 'BKP-018/02/2026',
        uraian: 'Pembayaran Belanja Perjalanan Dinas Dalam Daerah ke Kota Semarang (SPT No: 090/088/Bag.Pem/2026)',
        kodeRekening: '5.1.02.04.01.0001',
        jenis: 'pengeluaran',
        debet: 0,
        kredit: 2980000,
        saldoBerjalan: 72520000,
        perjalananId: 'prj-101',
        bulan: 2,
        tahun: 2026,
      },
    ];
  });

  const [bulanBukuList, setBulanBukuList] = useState<BulanBukuKas[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bulan_buku`);
    return saved ? JSON.parse(saved) : SEED_BULAN_BUKU;
  });

  const [sppList, setSppList] = useState<SPPEntri[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_spp`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'spp-1',
        nomorSPP: '900/001/SPP-UP/Bag.Pem/2026',
        tanggalSPP: '2026-01-03',
        subKegiatanId: 'sub-1',
        akunBelanjaId: 'acc-1',
        kodeRekening: '5.1.02.04.01.0001',
        uraianAkun: 'Belanja Perjalanan Dinas Biasa Dalam Daerah',
        jumlahDiminta: 15000000,
        sisaPaguSebelumnya: 120000000,
        sisaPaguSetelahnya: 105000000,
        keterangan: 'Pengajuan SPP Uang Persediaan Perjalanan Dinas Awal Tahun',
        dibuatOleh: 'Sri Wahyuni, S.E.',
      },
    ];
  });

  const [templateList, setTemplateList] = useState<TemplateDokumen[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_templates`);
    return saved ? JSON.parse(saved) : SEED_TEMPLATES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud-1',
        timestamp: '2026-01-02T08:00:00Z',
        actorNama: 'Sistem e-Perjadin',
        actorNip: '19820315 200112 1 002',
        actorRole: 'admin',
        modul: 'SISTEM',
        aksi: 'Inisialisasi',
        detail: 'Sistem e-Perjadin Kabupaten Kendal berhasil diinisialisasi untuk Tahun Anggaran 2026',
      },
    ];
  });

  // Calculate realisasi and komitmen on mount and on changes to ensure total synchronization
  useEffect(() => {
    setAkunBelanjaList(prevAkun => {
      return prevAkun.map(akun => {
        // Calculate commitments: sum of totalEstimasi of travels in 'disetujui_atasan' or 'dalam_perjalanan' or 'menunggu_verifikasi_operator'
        const travelKomitmen = perjalananList
          .filter(p => p.akunBelanjaId === akun.id && (
            p.status === 'disetujui_atasan' ||
            p.status === 'dalam_perjalanan' ||
            p.status === 'menunggu_verifikasi_operator' ||
            p.status === 'dikembalikan_operator' ||
            p.status === 'menunggu_verifikasi_bendahara'
          ))
          .reduce((sum, p) => sum + (p.totalEstimasi || 0), 0);

        // Calculate realisasi from verified/completed travels
        const travelRealisasi = perjalananList
          .filter(p => p.akunBelanjaId === akun.id && (
            p.status === 'terverifikasi_bendahara' ||
            p.status === 'selesai'
          ))
          .reduce((sum, p) => sum + (p.totalRealisasi || p.totalEstimasi || 0), 0);

        // If it's an account with non-travel expense, retain its initial realisasi base
        const baseRealisasi = (akun.id === 'acc-3' ? 4500000 : akun.id === 'acc-4' ? 12000000 : akun.id === 'acc-5' ? 3200000 : 0);

        return {
          ...akun,
          komitmen: travelKomitmen,
          realisasi: travelRealisasi + baseRealisasi,
        };
      });
    });
  }, [perjalananList]);

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_akun`, JSON.stringify(akunBelanjaList));
  }, [akunBelanjaList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pagu_hist`, JSON.stringify(paguHistories));
  }, [paguHistories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tarif`, JSON.stringify(tarifMasterList));
  }, [tarifMasterList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pejabat`, JSON.stringify(pejabatList));
  }, [pejabatList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pengaturan`, JSON.stringify(pengaturan));
  }, [pengaturan]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_perjalanan`, JSON.stringify(perjalananList));
  }, [perjalananList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_bukukas`, JSON.stringify(bukuKasList));
  }, [bukuKasList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_bulan_buku`, JSON.stringify(bulanBukuList));
  }, [bulanBukuList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_spp`, JSON.stringify(sppList));
  }, [sppList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_templates`, JSON.stringify(templateList));
  }, [templateList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Audit logger function
  const catatAudit = (
    modul: AuditLog['modul'],
    aksi: string,
    detail: string,
    nilaiSebelum?: string,
    nilaiSesudah?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actorNama: currentUser.nama,
      actorNip: currentUser.nip,
      actorRole: currentUser.role,
      modul,
      aksi,
      detail,
      nilaiSebelum,
      nilaiSesudah,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Switch role helper
  const switchRole = (newRole: UserRole) => {
    const found = users.find(u => u.role === newRole && u.statusAktif);
    if (found) {
      setCurrentUser(found);
      catatAudit('AUTENTIKASI', 'Ganti Peran Aktif', `Beralih ke peran ${newRole} (${found.nama})`);
    } else {
      // Create user fallback
      setCurrentUser({
        ...currentUser,
        role: newRole,
      });
    }
  };

  // Login user authentication
  const loginUser = (nipOrEmail: string, kataSandi: string) => {
    const cleanInput = nipOrEmail.trim().toLowerCase();
    const user = users.find(
      u => (u.email && u.email.toLowerCase() === cleanInput) ||
           (u.nip && u.nip.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
    );

    if (!user) {
      return { success: false, message: 'NIP atau Email tidak ditemukan dalam basis data sistem.' };
    }

    if (!user.statusAktif) {
      return { success: false, message: 'Akun ini sedang dinonaktifkan oleh Administrator.' };
    }

    const expectedPassword = user.password || 'password123';
    if (kataSandi && kataSandi !== expectedPassword) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    setCurrentUser(user);
    catatAudit('AUTENTIKASI', 'Login Pengguna', `Pengguna ${user.nama} (${user.role.toUpperCase()}) berhasil masuk.`);
    return { success: true, message: `Berhasil masuk. Selamat datang, ${user.nama}!`, user };
  };

  // Logout user
  const logoutUser = () => {
    catatAudit('AUTENTIKASI', 'Logout Pengguna', `Pengguna ${currentUser.nama} keluar dari sistem.`);
  };

  // Ubah Nama & Profil Pengguna
  const ubahNamaDanProfil = (data: { nama: string; nip?: string; email?: string; jabatan?: string; password?: string }) => {
    if (!data.nama || data.nama.trim().length < 3) {
      return { success: false, message: 'Nama lengkap harus diisi minimal 3 karakter.' };
    }

    const namaLama = currentUser.nama;
    const nipLama = currentUser.nip;
    const updatedUser: User = {
      ...currentUser,
      nama: data.nama.trim(),
      nip: data.nip !== undefined && data.nip.trim() !== '' ? data.nip.trim() : currentUser.nip,
      email: data.email !== undefined && data.email.trim() !== '' ? data.email.trim() : currentUser.email,
      jabatan: data.jabatan !== undefined && data.jabatan.trim() !== '' ? data.jabatan.trim() : currentUser.jabatan,
      password: data.password && data.password.trim() !== '' ? data.password : (currentUser.password || 'password123'),
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Also update in pejabat list if this user is a signatory (PPTK / KPA / Bendahara)
    setPejabatList(prev => prev.map(pjb => {
      if (pjb.nip === nipLama || pjb.nama === namaLama) {
        return {
          ...pjb,
          nama: updatedUser.nama,
          nip: updatedUser.nip,
          jabatanDinas: updatedUser.jabatan || pjb.jabatanDinas,
        };
      }
      return pjb;
    }));

    catatAudit(
      'AUTENTIKASI',
      'Ubah Profil & Nama',
      `Data pengguna diperbarui: "${namaLama}" menjadi "${updatedUser.nama}" (${updatedUser.email})`,
      namaLama,
      updatedUser.nama
    );

    return { success: true, message: 'Nama dan profil pengguna berhasil diperbarui!' };
  };

  // User management
  const tambahUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
    catatAudit('AUTENTIKASI', 'Tambah Pengguna', `Menambahkan pengguna baru: ${newUser.nama} (NIP: ${newUser.nip}, Peran: ${newUser.role})`);
  };

  const updateUser = (id: string, updateData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updateData } : u));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updateData }));
    }
    catatAudit('AUTENTIKASI', 'Perbarui Pengguna', `Memperbarui data pengguna ID: ${id}`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = !u.statusAktif;
        catatAudit('AUTENTIKASI', 'Ubah Status Pengguna', `Mengubah status pengguna ${u.nama} menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`);
        return { ...u, statusAktif: nextStatus };
      }
      return u;
    }));
  };

  // Settings
  const updatePengaturan = (newSettings: Partial<PengaturanInstansi>) => {
    setPengaturan(prev => {
      const updated = { ...prev, ...newSettings };
      catatAudit('DATA_MASTER', 'Perbarui Pengaturan', 'Memperbarui pengaturan format penomoran dan parameter instansi');
      return updated;
    });
  };

  const updatePejabat = (id: string, data: Partial<PejabatPenandatangan>) => {
    setPejabatList(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...data };
        catatAudit('DATA_MASTER', 'Perbarui Pejabat', `Memperbarui pejabat ${p.keteranganPeran}: ${updated.nama}`);
        return updated;
      }
      return p;
    }));
  };

  const tambahTarif = (tarifData: Omit<TarifMaster, 'id'>) => {
    const newTarif: TarifMaster = {
      ...tarifData,
      id: `trf-${Date.now()}`,
    };
    setTarifMasterList(prev => [...prev, newTarif]);
    catatAudit('DATA_MASTER', 'Tambah Master Tarif', `Menambah tarif tujuan ${newTarif.kotaTujuan} (${newTarif.golongan})`);
  };

  const updateTarif = (id: string, tarifData: Partial<TarifMaster>) => {
    setTarifMasterList(prev => prev.map(t => t.id === id ? { ...t, ...tarifData } : t));
    catatAudit('DATA_MASTER', 'Perbarui Master Tarif', `Memperbarui tarif ID: ${id}`);
  };

  const hapusTarif = (id: string) => {
    setTarifMasterList(prev => prev.filter(t => t.id !== id));
    catatAudit('DATA_MASTER', 'Hapus Master Tarif', `Menghapus tarif ID: ${id}`);
  };

  // ANG-01, ANG-02, ANG-04, BR-03, AC-01: Pagu management
  const ubahPagu = (akunBelanjaId: string, nilaiBaru: number, alasan: string): { success: boolean; message: string } => {
    const akun = akunBelanjaList.find(a => a.id === akunBelanjaId);
    if (!akun) {
      return { success: false, message: 'Akun belanja tidak ditemukan.' };
    }

    if (!alasan || alasan.trim().length < 5) {
      return { success: false, message: 'Alasan perubahan pagu wajib diisi dengan jelas (minimal 5 karakter).' };
    }

    // BR-03 & ANG-04 & AC-01: Tolak penurunan pagu di bawah realisasi + komitmen
    const minimumPagu = akun.realisasi + akun.komitmen;
    if (nilaiBaru < minimumPagu) {
      const pesanError = `Penurunan pagu ditolak! Nilai baru (Rp ${nilaiBaru.toLocaleString('id-ID')}) lebih rendah dari jumlah Realisasi (Rp ${akun.realisasi.toLocaleString('id-ID')}) ditambah Komitmen (Rp ${akun.komitmen.toLocaleString('id-ID')}) yaitu minimal Rp ${minimumPagu.toLocaleString('id-ID')}.`;
      return { success: false, message: pesanError };
    }

    const nilaiLama = akun.pagu;

    // Update akun belanja
    setAkunBelanjaList(prev => prev.map(a => a.id === akunBelanjaId ? { ...a, pagu: nilaiBaru } : a));

    // Record Pagu History (ANG-02)
    const newHistory: PaguHistory = {
      id: `pgh-${Date.now()}`,
      akunBelanjaId: akun.id,
      kodeRekening: akun.kodeRekening,
      uraian: akun.uraian,
      nilaiLama,
      nilaiBaru,
      alasan,
      diubahOleh: currentUser.nama,
      nipPengubah: currentUser.nip,
      waktu: new Date().toISOString(),
    };
    setPaguHistories(prev => [newHistory, ...prev]);

    // Audit log (AUD-01)
    catatAudit(
      'ANGGARAN',
      'Ubah Pagu Akun Belanja',
      `Perubahan pagu rekening ${akun.kodeRekening} (${akun.uraian}). Alasan: ${alasan}`,
      `Rp ${nilaiLama.toLocaleString('id-ID')}`,
      `Rp ${nilaiBaru.toLocaleString('id-ID')}`
    );

    return {
      success: true,
      message: `Pagu rekening ${akun.kodeRekening} berhasil diubah menjadi Rp ${nilaiBaru.toLocaleString('id-ID')}.`,
    };
  };

  // Hitung estimasi biaya perjalanan dari master tarif
  const hitungEstimasiPerjalanan = (
    kotaTujuan: string,
    pesertaRaw: Array<{ nip: string; nama: string; jabatan: string; golongan: string }>,
    lamaHari: number,
    lamaMalam: number
  ) => {
    const listPeserta: PerjalananDinas['peserta'] = pesertaRaw.map((p, idx) => {
      // Find matching tarif by city and golongan
      let matchedTarif = tarifMasterList.find(t => 
        t.kotaTujuan.toLowerCase().includes(kotaTujuan.toLowerCase()) &&
        (p.golongan.includes('IV') ? t.golongan.includes('IV') : t.golongan.includes('III'))
      );

      if (!matchedTarif) {
        matchedTarif = tarifMasterList[0];
      }

      const uangHarian = (matchedTarif?.uangHarianPerHari || 380000) * lamaHari;
      const penginapan = (matchedTarif?.penginapanPerMalam || 550000) * lamaMalam;
      const transport = matchedTarif?.transportDefault || 200000;
      const representasi = (matchedTarif?.representasiPerHari || 0) * lamaHari;

      const komponenBiaya: PerjalananDinas['peserta'][0]['komponenBiaya'] = [
        {
          id: `c-uh-${idx}-${Date.now()}`,
          jenis: 'uang_harian',
          uraian: `Uang Harian (${lamaHari} hari @ Rp ${(matchedTarif?.uangHarianPerHari || 380000).toLocaleString('id-ID')})`,
          nominalEstimasi: uangHarian,
          nominalRealisasi: uangHarian,
        },
        {
          id: `c-pg-${idx}-${Date.now()}`,
          jenis: 'penginapan',
          uraian: lamaMalam > 0 ? `Biaya Penginapan (${lamaMalam} malam @ Rp ${(matchedTarif?.penginapanPerMalam || 550000).toLocaleString('id-ID')})` : 'Tanpa Menginap',
          nominalEstimasi: penginapan,
          nominalRealisasi: penginapan,
        },
        {
          id: `c-tr-${idx}-${Date.now()}`,
          jenis: 'transport',
          uraian: `Biaya Transportasi ${kotaTujuan}`,
          nominalEstimasi: transport,
          nominalRealisasi: transport,
        },
      ];

      if (representasi > 0) {
        komponenBiaya.push({
          id: `c-rp-${idx}-${Date.now()}`,
          jenis: 'representasi',
          uraian: `Uang Representasi Pejabat (${lamaHari} hari)`,
          nominalEstimasi: representasi,
          nominalRealisasi: representasi,
        });
      }

      const totalPeserta = uangHarian + penginapan + transport + representasi;

      return {
        id: `pst-${idx}-${Date.now()}`,
        pegawaiId: p.nip,
        nip: p.nip,
        nama: p.nama,
        jabatan: p.jabatan,
        golongan: p.golongan,
        komponenBiaya,
        totalEstimasi: totalPeserta,
        totalRealisasi: totalPeserta,
        uangMuka: totalPeserta,
      };
    });

    const total = listPeserta.reduce((acc, p) => acc + p.totalEstimasi, 0);

    return {
      peserta: listPeserta,
      total,
    };
  };

  // PRJ-01, PRJ-02, ANG-06, BR-02, AC-02: Pegawai mengajukan perjalanan
  const ajukanPerjalanan = (data: Partial<PerjalananDinas>): { success: boolean; message: string; id?: string } => {
    const akun = akunBelanjaList.find(a => a.id === data.akunBelanjaId);
    if (!akun) {
      return { success: false, message: 'Akun belanja yang dibebani wajib dipilih.' };
    }

    const totalBiaya = data.totalEstimasi || 0;
    const sisaPaguSaatIni = akun.pagu - akun.realisasi - akun.komitmen;

    // BR-02 & ANG-06 & AC-02: Pengajuan yang melebihi sisa pagu ditolak otomatis
    if (totalBiaya > sisaPaguSaatIni) {
      return {
        success: false,
        message: `Pengajuan ditolak! Estimasi biaya perjalanan (Rp ${totalBiaya.toLocaleString('id-ID')}) melebihi sisa pagu akun yang dibebani (Sisa Pagu: Rp ${sisaPaguSaatIni.toLocaleString('id-ID')}). Silakan sesuaikan jumlah hari, peserta, atau gunakan akun lain.`,
      };
    }

    const idBaru = `prj-${Date.now()}`;
    const lamaHari = hitungHari(data.tanggalBerangkat || '', data.tanggalKembali || '');
    const lamaMalam = Math.max(0, lamaHari - 1);

    const newPerjalanan: PerjalananDinas = {
      id: idBaru,
      nomorSPT: '', // Will be generated on approval
      maksudPerjalanan: data.maksudPerjalanan || '',
      kotaTujuan: data.kotaTujuan || '',
      tempatTujuanDetail: data.tempatTujuanDetail || '',
      tanggalBerangkat: data.tanggalBerangkat || '',
      tanggalKembali: data.tanggalKembali || '',
      lamaHari,
      lamaMalam,
      alatTransportasi: data.alatTransportasi || 'Kendaraan Dinas / Umum',
      unitKerjaId: data.unitKerjaId || currentUser.unitKerjaId,
      subKegiatanId: data.subKegiatanId || 'sub-1',
      akunBelanjaId: data.akunBelanjaId || 'acc-1',
      pegawaiPengajuId: currentUser.id,
      pegawaiPengajuNama: currentUser.nama,
      pegawaiPengajuNip: currentUser.nip,
      peserta: data.peserta || [],
      totalEstimasi: totalBiaya,
      totalRealisasi: 0,
      totalUangMuka: data.totalUangMuka || 0,
      statusUangMuka: 'nihil',
      nominalSelisihUangMuka: 0,
      status: 'diajukan',
      laporanKegiatan: {
        dasarPelaksanaan: '',
        maksudTujuan: data.maksudPerjalanan || '',
        waktuDanTempat: `${lamaHari} hari di ${data.kotaTujuan}`,
        uraianKegiatan: '',
        hasilKegiatan: '',
        kesimpulanTindakLanjut: '',
        penutup: '',
        terakhirDiperbarui: new Date().toISOString(),
        diperbaruiOleh: currentUser.nama,
      },
      berkas: [],
      versiTemplateDipakai: 1,
      kodeVerifikasiQR: `VERIF-KND-${Date.now().toString().slice(-6)}`,
      riwayatStatus: [
        {
          status: 'diajukan',
          waktu: new Date().toISOString(),
          oleh: currentUser.nama,
          catatan: 'Pengajuan perjalanan dinas baru diajukan ke atasan',
        },
      ],
      riwayatRevisi: [],
    };

    setPerjalananList(prev => [newPerjalanan, ...prev]);

    catatAudit(
      'PERJALANAN',
      'Pengajuan Perjalanan Dinas',
      `Pengajuan perjalanan ke ${newPerjalanan.kotaTujuan} oleh ${currentUser.nama}. Estimasi: Rp ${totalBiaya.toLocaleString('id-ID')}`
    );

    return {
      success: true,
      message: `Pengajuan perjalanan dinas berhasil dikirimkan ke Atasan untuk persetujuan.`,
      id: idBaru,
    };
  };

  // PRJ-08: Revisi setelah disetujui
  const revisiPerjalanan = (
    id: string,
    data: Partial<PerjalananDinas>,
    catatanRevisi: string
  ): { success: boolean; message: string } => {
    const existing = perjalananList.find(p => p.id === id);
    if (!existing) return { success: false, message: 'Data perjalanan tidak ditemukan.' };

    const revisedList = perjalananList.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...data,
          riwayatRevisi: [
            ...p.riwayatRevisi,
            {
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              deskripsi: catatanRevisi || 'Perubahan rincian perjalanan dinas',
            },
          ],
        };
      }
      return p;
    });

    setPerjalananList(revisedList);
    catatAudit('PERJALANAN', 'Revisi Perjalanan', `Revisi perjalanan ${existing.nomorSPT || existing.id}: ${catatanRevisi}`);
    return { success: true, message: 'Perubahan perjalanan berhasil disimpan dan tercatat dalam riwayat revisi.' };
  };

  // PRJ-04, PRJ-05, BR-09, AC-03: Persetujuan Atasan, Terbit Nomor SPT & Pembentukan Komitmen
  const setujuiAtasan = (id: string, catatan: string): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    // Generate Nomor SPT unik berurutan (BR-09)
    const nextSeq = pengaturan.nomorSPTSequence + 1;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const tahunSekarang = new Date().getFullYear();
    const nomorSPTBaru = pengaturan.formatNomorSPT
      .replace('{no}', formattedSeq)
      .replace('{tahun}', String(tahunSekarang));

    // Update settings sequence
    setPengaturan(prev => ({ ...prev, nomorSPTSequence: nextSeq }));

    const updatedPerjalanan = perjalananList.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'disetujui_atasan' as StatusPerjalanan,
          nomorSPT: nomorSPTBaru,
          tanggalSPT: new Date().toISOString().split('T')[0],
          catatanAtasan: catatan,
          laporanKegiatan: {
            ...p.laporanKegiatan,
            dasarPelaksanaan: `Surat Perintah Tugas Nomor: ${nomorSPTBaru}`,
          },
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: 'disetujui_atasan' as StatusPerjalanan,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: catatan ? `Disetujui atasan: ${catatan}` : 'Disetujui atasan. Nomor SPT diterbitkan dan komitmen pagu terbentuk.',
            },
          ],
        };
      }
      return p;
    });

    setPerjalananList(updatedPerjalanan);

    catatAudit(
      'PERJALANAN',
      'Persetujuan Atasan (Terbit SPT)',
      `Perjalanan ID ${travel.id} disetujui oleh ${currentUser.nama}. Nomor SPT: ${nomorSPTBaru}. Komitmen bertambah Rp ${travel.totalEstimasi.toLocaleString('id-ID')}`
    );

    return {
      success: true,
      message: `Pengajuan disetujui! Nomor SPT resmi terbit: ${nomorSPTBaru}. Komitmen pagu telah otomatis terbentuk sebesar Rp ${travel.totalEstimasi.toLocaleString('id-ID')}.`,
    };
  };

  // Tolak atasan
  const tolakAtasan = (id: string, catatan: string): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'ditolak_atasan' as StatusPerjalanan,
          catatanAtasan: catatan,
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: 'ditolak_atasan' as StatusPerjalanan,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: `Pengajuan ditolak oleh atasan: ${catatan}`,
            },
          ],
        };
      }
      return p;
    }));

    catatAudit('PERJALANAN', 'Tolak Pengajuan', `Perjalanan ${travel.id} ditolak oleh ${currentUser.nama}: ${catatan}`);
    return { success: true, message: 'Pengajuan perjalanan dinas telah ditolak.' };
  };

  // PRJ-06, BR-12: Pembatalan perjalanan melepas komitmen
  const batalkanPerjalanan = (id: string, alasan: string): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'dibatalkan' as StatusPerjalanan,
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: 'dibatalkan' as StatusPerjalanan,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: `Perjalanan dibatalkan: ${alasan}. Komitmen pagu dilepas kembali ke sisa pagu.`,
            },
          ],
        };
      }
      return p;
    }));

    catatAudit(
      'PERJALANAN',
      'Pembatalan Perjalanan',
      `Perjalanan ${travel.nomorSPT || travel.id} dibatalkan: ${alasan}. Komitmen sebesar Rp ${travel.totalEstimasi.toLocaleString('id-ID')} dilepas.`
    );

    return {
      success: true,
      message: `Perjalanan dinas berhasil dibatalkan. Komitmen pagu otomatis dilepas kembali ke sisa anggaran.`,
    };
  };

  // KEU-01: Verifikasi Operator
  const verifikasiOperator = (
    id: string,
    statusVerifikasi: 'setuju' | 'kembalikan',
    catatan: string
  ): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    const newStatus: StatusPerjalanan = statusVerifikasi === 'setuju' ? 'menunggu_verifikasi_bendahara' : 'dikembalikan_operator';

    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          catatanOperator: catatan,
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: newStatus,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: statusVerifikasi === 'setuju'
                ? `Berkas diverifikasi operator: ${catatan || 'Berkas lengkap dan sesuai.'}`
                : `Berkas dikembalikan operator untuk perbaikan: ${catatan}`,
            },
          ],
        };
      }
      return p;
    }));

    catatAudit(
      'VERIFIKASI',
      statusVerifikasi === 'setuju' ? 'Verifikasi Berkas Operator' : 'Pengembalian Berkas Operator',
      `Operator ${currentUser.nama} ${statusVerifikasi === 'setuju' ? 'menyetujui' : 'mengembalikan'} berkas SPT ${travel.nomorSPT}: ${catatan}`
    );

    return {
      success: true,
      message: statusVerifikasi === 'setuju'
        ? 'Berkas telah diverifikasi oleh Operator dan diteruskan ke Bendahara Pengeluaran.'
        : 'Berkas dikembalikan kepada pegawai untuk diperbaiki sesuai catatan.',
    };
  };

  // KEU-02, KEU-03, KEU-04, AC-04: Verifikasi Bendahara
  // Mengubah komitmen menjadi realisasi dan memasukkan entri pengeluaran ke buku kas!
  const verifikasiBendahara = (
    id: string,
    komponenRealisasiMap: Record<string, { pesertaId: string; komponenId: string; nominal: number }>,
    catatan: string
  ): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    const akun = akunBelanjaList.find(a => a.id === travel.akunBelanjaId);
    if (!akun) return { success: false, message: 'Akun belanja tidak ditemukan.' };

    // Update participants with verified amounts
    let totalRealisasiBaru = 0;
    const updatedPeserta = travel.peserta.map(pst => {
      let subtotal = 0;
      const updatedKomponen = pst.komponenBiaya.map(k => {
        const item = komponenRealisasiMap[k.id];
        const nominalBaru = item ? item.nominal : k.nominalEstimasi;
        subtotal += nominalBaru;
        return {
          ...k,
          nominalRealisasi: nominalBaru,
        };
      });

      totalRealisasiBaru += subtotal;

      return {
        ...pst,
        komponenBiaya: updatedKomponen,
        totalRealisasi: subtotal,
      };
    });

    // Check uang muka vs realisasi (KEU-06)
    const selisihUangMuka = travel.totalUangMuka - totalRealisasiBaru;
    let statusSelisih: 'nihil' | 'kurang' | 'lebih' = 'nihil';
    if (selisihUangMuka > 0) statusSelisih = 'lebih'; // Uang kembali ke kas
    else if (selisihUangMuka < 0) statusSelisih = 'kurang'; // Perlu dibayarkan kekurangan

    // Update travel status
    const tglSekarang = new Date().toISOString().split('T')[0];
    const bulanSekarang = new Date().getMonth() + 1;
    const tahunSekarang = new Date().getFullYear();

    // Check if month is closed (BR-08)
    const bulanKas = bulanBukuList.find(b => b.bulan === bulanSekarang && b.tahun === tahunSekarang);
    if (bulanKas?.isTutup) {
      return {
        success: false,
        message: `Buku kas untuk bulan ${bulanSekarang}/${tahunSekarang} telah ditutup! Buka kembali buku kas terlebih dahulu untuk memverifikasi transaksi.`,
      };
    }

    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'terverifikasi_bendahara' as StatusPerjalanan,
          totalRealisasi: totalRealisasiBaru,
          statusUangMuka: statusSelisih,
          nominalSelisihUangMuka: Math.abs(selisihUangMuka),
          catatanBendahara: catatan,
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: 'terverifikasi_bendahara' as StatusPerjalanan,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: `SPJ diverifikasi bendahara dengan nominal realisasi Rp ${totalRealisasiBaru.toLocaleString('id-ID')}. Komitmen diubah menjadi Realisasi dan dicatat pada Buku Kas.`,
            },
          ],
        };
      }
      return p;
    }));

    // Otomatis masukkan baris pengeluaran ke Buku Kas (KEU-04, AC-04)!
    const nextKasNo = bukuKasList.length + 1;
    const nomorBKP = `BKP-${String(nextKasNo).padStart(3, '0')}/${String(bulanSekarang).padStart(2, '0')}/${tahunSekarang}`;
    const saldoTerakhir = bukuKasList.length > 0 ? bukuKasList[bukuKasList.length - 1].saldoBerjalan : 0;
    const saldoBaru = saldoTerakhir - totalRealisasiBaru;

    const entriKasBaru: BukuKasEntri = {
      id: `kas-${Date.now()}`,
      tanggal: tglSekarang,
      nomorBukti: nomorBKP,
      uraian: `Pembayaran Belanja Perjalanan Dinas: ${travel.maksudPerjalanan} (SPT No: ${travel.nomorSPT})`,
      kodeRekening: akun.kodeRekening,
      jenis: 'pengeluaran',
      debet: 0,
      kredit: totalRealisasiBaru,
      saldoBerjalan: saldoBaru,
      perjalananId: travel.id,
      bulan: bulanSekarang,
      tahun: tahunSekarang,
    };

    setBukuKasList(prev => [...prev, entriKasBaru]);

    catatAudit(
      'VERIFIKASI',
      'Verifikasi Bendahara & Entri Kas',
      `Bendahara ${currentUser.nama} memverifikasi SPJ SPT ${travel.nomorSPT}. Komitmen berkurang Rp ${travel.totalEstimasi.toLocaleString('id-ID')}, Realisasi naik Rp ${totalRealisasiBaru.toLocaleString('id-ID')}. Entri BKP ${nomorBKP} terbentuk.`
    );

    return {
      success: true,
      message: `SPJ Perjalanan Dinas berhasil diverifikasi! Komitmen telah berubah menjadi Realisasi (Rp ${totalRealisasiBaru.toLocaleString('id-ID')}) dan otomatis dibukukan di Buku Kas (${nomorBKP}).`,
    };
  };

  // BR-10, AC-10: Selesaikan Perjalanan
  // Perjalanan berstatus Selesai HANYA JIKA dokumen bertanda tangan sudah diunggah dan selisih uang muka (bila ada) sudah diselesaikan!
  const selesaikanPerjalanan = (id: string): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === id);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    // Check if signed document is uploaded (BR-10, AC-10)
    const hasSignedDoc = travel.berkas.some(b => 
      b.jenis === 'spt_bertandatangan' || 
      b.jenis === 'laporan_bertandatangan' || 
      b.jenis === 'arsip_final'
    );

    if (!hasSignedDoc) {
      return {
        success: false,
        message: 'Status Selesai ditolak! Berdasarkan aturan sistem (BR-10 & AC-10), perjalanan hanya dapat diselesaikan jika dokumen bertanda tangan (scan SPT / Laporan / Arsip Final) telah diunggah ke berkas pendukung.',
      };
    }

    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'selesai' as StatusPerjalanan,
          riwayatStatus: [
            ...p.riwayatStatus,
            {
              status: 'selesai' as StatusPerjalanan,
              waktu: new Date().toISOString(),
              oleh: currentUser.nama,
              catatan: 'Seluruh tahapan perjalanan dinas, verifikasi berkas keuangan, dan dokumen bertanda tangan telah lengkap. Status Selesai.',
            },
          ],
        };
      }
      return p;
    }));

    catatAudit('PERJALANAN', 'Penyelesaian Perjalanan', `Perjalanan SPT ${travel.nomorSPT} ditandai Selesai oleh ${currentUser.nama}`);

    return {
      success: true,
      message: 'Perjalanan dinas berhasil diselesaikan dan diarsipkan secara permanen.',
    };
  };

  // Update laporan kegiatan
  const updateLaporanKegiatan = (id: string, data: Partial<PerjalananDinas['laporanKegiatan']>) => {
    setPerjalananList(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          laporanKegiatan: {
            ...p.laporanKegiatan,
            ...data,
            terakhirDiperbarui: new Date().toISOString(),
            diperbaruiOleh: currentUser.nama,
          },
        };
      }
      return p;
    }));

    catatAudit('PERJALANAN', 'Perbarui Laporan Kegiatan', `Memperbarui rincian laporan hasil perjalanan dinas ID: ${id}`);
  };

  // BRK-01 to BRK-06: File management
  const tambahBerkasPerjalanan = (
    perjalananId: string,
    berkas: Omit<BerkasLampiran, 'id' | 'perjalananId' | 'diunggahOleh' | 'diunggahPada'>
  ): { success: boolean; message: string } => {
    const travel = perjalananList.find(p => p.id === perjalananId);
    if (!travel) return { success: false, message: 'Perjalanan tidak ditemukan.' };

    // Validasi ukuran berkas (BRK-02)
    const maxKB = pengaturan.maxUploadMB * 1024;
    if (berkas.ukuranKB > maxKB) {
      return {
        success: false,
        message: `Ukuran berkas (${Math.round(berkas.ukuranKB / 1024)} MB) melebihi batas maksimum ${pengaturan.maxUploadMB} MB.`,
      };
    }

    const newBerkas: BerkasLampiran = {
      ...berkas,
      id: `brk-${Date.now()}`,
      perjalananId,
      diunggahOleh: currentUser.nama,
      diunggahPada: new Date().toISOString(),
    };

    setPerjalananList(prev => prev.map(p => {
      if (p.id === perjalananId) {
        return {
          ...p,
          berkas: [...p.berkas, newBerkas],
        };
      }
      return p;
    }));

    catatAudit('BERKAS', 'Unggah Berkas', `Mengunggah berkas ${berkas.namaFile} (${berkas.jenis}) pada perjalanan SPT ${travel.nomorSPT || travel.id}`);

    return { success: true, message: `Berkas ${berkas.namaFile} berhasil diunggah.` };
  };

  const hapusBerkasPerjalanan = (perjalananId: string, berkasId: string) => {
    setPerjalananList(prev => prev.map(p => {
      if (p.id === perjalananId) {
        return {
          ...p,
          berkas: p.berkas.filter(b => b.id !== berkasId),
        };
      }
      return p;
    }));
    catatAudit('BERKAS', 'Hapus Berkas', `Menghapus berkas lampiran ID: ${berkasId}`);
  };

  // KEU-04, BR-07, BR-08: Buku Kas
  const tambahEntriBukuKasManual = (entri: {
    tanggal: string;
    nomorBukti: string;
    uraian: string;
    kodeRekening: string;
    jenis: 'penerimaan' | 'pengeluaran';
    nominal: number;
    bulan: number;
    tahun: number;
  }): { success: boolean; message: string } => {
    // Check if month is closed (BR-08)
    const bulanKas = bulanBukuList.find(b => b.bulan === entri.bulan && b.tahun === entri.tahun);
    if (bulanKas?.isTutup) {
      return {
        success: false,
        message: `Buku kas bulan ${entri.bulan}/${entri.tahun} telah ditutup! Buka kembali oleh bendahara dengan alasan tercatat untuk menambah transaksi.`,
      };
    }

    const saldoTerakhir = bukuKasList.length > 0 ? bukuKasList[bukuKasList.length - 1].saldoBerjalan : 0;
    const debet = entri.jenis === 'penerimaan' ? entri.nominal : 0;
    const kredit = entri.jenis === 'pengeluaran' ? entri.nominal : 0;
    const saldoBaru = saldoTerakhir + debet - kredit;

    const newEntri: BukuKasEntri = {
      id: `kas-${Date.now()}`,
      tanggal: entri.tanggal,
      nomorBukti: entri.nomorBukti,
      uraian: entri.uraian,
      kodeRekening: entri.kodeRekening,
      jenis: entri.jenis,
      debet,
      kredit,
      saldoBerjalan: saldoBaru,
      bulan: entri.bulan,
      tahun: entri.tahun,
    };

    setBukuKasList(prev => [...prev, newEntri]);

    catatAudit('BUKU_KAS', 'Input Transaksi Kas', `Input ${entri.jenis} kas: ${entri.nomorBukti} sebesar Rp ${entri.nominal.toLocaleString('id-ID')}`);

    return { success: true, message: 'Transaksi kas berhasil dibukukan.' };
  };

  // BR-07: Entri buku kas tidak dihapus, koreksi lewat entri pembalik (storno)
  const koreksiEntriBukuKas = (entriId: string, alasan: string): { success: boolean; message: string } => {
    const target = bukuKasList.find(k => k.id === entriId);
    if (!target) return { success: false, message: 'Entri kas tidak ditemukan.' };

    const bulanKas = bulanBukuList.find(b => b.bulan === target.bulan && b.tahun === target.tahun);
    if (bulanKas?.isTutup) {
      return { success: false, message: `Bulan buku kas ini telah ditutup! Tidak dapat membuat koreksi.` };
    }

    const saldoTerakhir = bukuKasList.length > 0 ? bukuKasList[bukuKasList.length - 1].saldoBerjalan : 0;
    
    // Pembalik: jika sebelumnya pengeluaran (kredit), maka dibalik dengan penerimaan/debet, dan sebaliknya
    const pembalikDebet = target.kredit;
    const pembalikKredit = target.debet;
    const saldoBaru = saldoTerakhir + pembalikDebet - pembalikKredit;

    const entriPembalik: BukuKasEntri = {
      id: `kas-rev-${Date.now()}`,
      tanggal: new Date().toISOString().split('T')[0],
      nomorBukti: `KOR/${target.nomorBukti}`,
      uraian: `Koreksi Entri Pembalik (Storno) atas ${target.nomorBukti}: ${alasan}`,
      kodeRekening: target.kodeRekening,
      jenis: 'pembalik',
      debet: pembalikDebet,
      kredit: pembalikKredit,
      saldoBerjalan: saldoBaru,
      bulan: target.bulan,
      tahun: target.tahun,
      isKoreksi: true,
      refEntriId: target.id,
    };

    setBukuKasList(prev => [...prev, entriPembalik]);

    catatAudit('BUKU_KAS', 'Entri Pembalik (Koreksi Kas)', `Koreksi pembalik atas bukti ${target.nomorBukti}. Alasan: ${alasan}`);

    return { success: true, message: `Entri pembalik berhasil dibukukan dengan nomor KOR/${target.nomorBukti}.` };
  };

  // BR-08: Penutupan dan pembukaan bulan buku kas
  const tutupBulanKas = (bulan: number, tahun: number): { success: boolean; message: string } => {
    setBulanBukuList(prev => prev.map(b => {
      if (b.bulan === bulan && b.tahun === tahun) {
        return {
          ...b,
          isTutup: true,
          ditutupOleh: currentUser.nama,
          tanggalTutup: new Date().toISOString().split('T')[0],
        };
      }
      return b;
    }));

    catatAudit('BUKU_KAS', 'Penutupan Bulan Kas', `Bendahara ${currentUser.nama} menutup buku kas bulan ${bulan}/${tahun}`);
    return { success: true, message: `Buku kas bulan ${bulan}/${tahun} berhasil ditutup.` };
  };

  const bukaBulanKas = (bulan: number, tahun: number, alasan: string): { success: boolean; message: string } => {
    if (!alasan || alasan.trim().length < 5) {
      return { success: false, message: 'Alasan pembukaan kembali buku kas wajib diisi.' };
    }

    setBulanBukuList(prev => prev.map(b => {
      if (b.bulan === bulan && b.tahun === tahun) {
        return {
          ...b,
          isTutup: false,
          alasanBuka: alasan,
        };
      }
      return b;
    }));

    catatAudit('BUKU_KAS', 'Buka Kembali Bulan Kas', `Bendahara ${currentUser.nama} membuka kembali buku kas bulan ${bulan}/${tahun}. Alasan: ${alasan}`);
    return { success: true, message: `Buku kas bulan ${bulan}/${tahun} berhasil dibuka kembali.` };
  };

  // KEU-05: Input SPP
  const tambahSPP = (data: {
    nomorSPP: string;
    tanggalSPP: string;
    subKegiatanId: string;
    akunBelanjaId: string;
    jumlahDiminta: number;
    keterangan: string;
  }): { success: boolean; message: string } => {
    const akun = akunBelanjaList.find(a => a.id === data.akunBelanjaId);
    if (!akun) return { success: false, message: 'Akun belanja tidak ditemukan.' };

    const sisaPaguSebelumnya = akun.pagu - akun.realisasi - akun.komitmen;
    const sisaPaguSetelahnya = sisaPaguSebelumnya - data.jumlahDiminta;

    const newSPP: SPPEntri = {
      id: `spp-${Date.now()}`,
      nomorSPP: data.nomorSPP,
      tanggalSPP: data.tanggalSPP,
      subKegiatanId: data.subKegiatanId,
      akunBelanjaId: data.akunBelanjaId,
      kodeRekening: akun.kodeRekening,
      uraianAkun: akun.uraian,
      jumlahDiminta: data.jumlahDiminta,
      sisaPaguSebelumnya,
      sisaPaguSetelahnya,
      keterangan: data.keterangan,
      dibuatOleh: currentUser.nama,
    };

    setSppList(prev => [newSPP, ...prev]);

    catatAudit('SPP', 'Input SPP Baru', `Menerbitkan SPP No ${data.nomorSPP} untuk rekening ${akun.kodeRekening} sebesar Rp ${data.jumlahDiminta.toLocaleString('id-ID')}`);

    return { success: true, message: `SPP Nomor ${data.nomorSPP} berhasil dicatat.` };
  };

  // TPL-01 to TPL-05, AC-07: Template manager with unknown placeholder validation
  const simpanTemplate = (
    templateData: Omit<TemplateDokumen, 'id' | 'versi' | 'terakhirDiperbarui' | 'diperbaruiOleh'>,
    templateId?: string
  ): { success: boolean; message: string; unknownPlaceholders: string[] } => {
    // Known valid placeholders
    const KNOWN_PLACEHOLDERS = [
      '{nomor_spt}', '{nama_pegawai}', '{nip}', '{jabatan}', '{golongan}',
      '{tujuan}', '{kota_tujuan}', '{tanggal_berangkat}', '{tanggal_kembali}',
      '{lama_hari}', '{maksud_perjalanan}', '{alat_transportasi}',
      '{dasar}', '{maksud_tujuan}', '{waktu_tempat}', '{uraian}', '{hasil}',
      '{kesimpulan}', '{penutup}', '{pelapor}', '{penandatangan}',
      '{total_biaya}', '{terbilang}', '{bulan}', '{tahun_anggaran}',
      '{unit_kerja}', '{sub_kegiatan}', '{empat_penandatangan}'
    ];

    // Detect all {tag} in content
    const foundTags = templateData.content.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    const uniqueFound = Array.from(new Set(foundTags));
    const unknown = uniqueFound.filter(t => !KNOWN_PLACEHOLDERS.includes(t));

    // If there are unknown placeholders, report them (TPL-02, AC-07)
    if (unknown.length > 0) {
      return {
        success: false,
        message: `Sistem mendeteksi penanda data yang tidak dikenal: ${unknown.join(', ')}. Harap perbaiki sebelum menyimpan template.`,
        unknownPlaceholders: unknown,
      };
    }

    if (templateId) {
      // Update existing template: increment version (TPL-04, AC-09)
      setTemplateList(prev => prev.map(t => {
        if (t.id === templateId) {
          return {
            ...t,
            ...templateData,
            versi: t.versi + 1,
            placeholders: uniqueFound,
            terakhirDiperbarui: new Date().toISOString(),
            diperbaruiOleh: currentUser.nama,
          };
        }
        return t;
      }));
      catatAudit('TEMPLATE', 'Perbarui Versi Template', `Memperbarui template ${templateData.nama} ke versi baru`);
    } else {
      const newTpl: TemplateDokumen = {
        ...templateData,
        id: `tpl-${Date.now()}`,
        versi: 1,
        placeholders: uniqueFound,
        terakhirDiperbarui: new Date().toISOString(),
        diperbaruiOleh: currentUser.nama,
      };
      setTemplateList(prev => [...prev, newTpl]);
      catatAudit('TEMPLATE', 'Tambah Template Baru', `Menambahkan template dokumen baru: ${newTpl.nama}`);
    }

    return {
      success: true,
      message: 'Template dokumen berhasil disimpan dengan sukses.',
      unknownPlaceholders: [],
    };
  };

  // Reset data to seed defaults
  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_akun`);
    localStorage.removeItem(`${STORAGE_KEY}_pagu_hist`);
    localStorage.removeItem(`${STORAGE_KEY}_tarif`);
    localStorage.removeItem(`${STORAGE_KEY}_pejabat`);
    localStorage.removeItem(`${STORAGE_KEY}_pengaturan`);
    localStorage.removeItem(`${STORAGE_KEY}_perjalanan`);
    localStorage.removeItem(`${STORAGE_KEY}_bukukas`);
    localStorage.removeItem(`${STORAGE_KEY}_bulan_buku`);
    localStorage.removeItem(`${STORAGE_KEY}_spp`);
    localStorage.removeItem(`${STORAGE_KEY}_templates`);
    localStorage.removeItem(`${STORAGE_KEY}_audit`);
    window.location.reload();
  };

  // Export & Import Database JSON (AUD-03)
  const exportDatabaseJSON = () => {
    const backupObj = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.nama,
      users,
      unitKerjaList,
      subKegiatanList,
      akunBelanjaList,
      paguHistories,
      tarifMasterList,
      pejabatList,
      pengaturan,
      perjalananList,
      bukuKasList,
      bulanBukuList,
      sppList,
      templateList,
      auditLogs,
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users && data.akunBelanjaList && data.perjalananList) {
        setUsers(data.users);
        setAkunBelanjaList(data.akunBelanjaList);
        setPerjalananList(data.perjalananList);
        if (data.paguHistories) setPaguHistories(data.paguHistories);
        if (data.tarifMasterList) setTarifMasterList(data.tarifMasterList);
        if (data.pejabatList) setPejabatList(data.pejabatList);
        if (data.pengaturan) setPengaturan(data.pengaturan);
        if (data.bukuKasList) setBukuKasList(data.bukuKasList);
        if (data.bulanBukuList) setBulanBukuList(data.bulanBukuList);
        if (data.sppList) setSppList(data.sppList);
        if (data.templateList) setTemplateList(data.templateList);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        catatAudit('SISTEM', 'Pemulihan Basis Data', 'Memulihkan basis data dari file backup JSON cadangan');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        loginUser,
        logoutUser,
        ubahNamaDanProfil,
        users,
        tambahUser,
        updateUser,
        toggleUserStatus,
        unitKerjaList,
        subKegiatanList,
        akunBelanjaList,
        tarifMasterList,
        pejabatList,
        pengaturan,
        updatePengaturan,
        tambahTarif,
        updateTarif,
        hapusTarif,
        updatePejabat,
        paguHistories,
        ubahPagu,
        perjalananList,
        ajukanPerjalanan,
        revisiPerjalanan,
        setujuiAtasan,
        tolakAtasan,
        batalkanPerjalanan,
        verifikasiOperator,
        verifikasiBendahara,
        selesaikanPerjalanan,
        updateLaporanKegiatan,
        tambahBerkasPerjalanan,
        hapusBerkasPerjalanan,
        bukuKasList,
        bulanBukuList,
        tambahEntriBukuKasManual,
        koreksiEntriBukuKas,
        tutupBulanKas,
        bukaBulanKas,
        sppList,
        tambahSPP,
        templateList,
        simpanTemplate,
        auditLogs,
        catatAudit,
        hitungEstimasiPerjalanan,
        resetAllData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
