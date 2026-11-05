import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, NAMA_BULAN } from '../../utils/formatters';
import { 
  Coins, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  PlusCircle, 
  MapPin, 
  Users,
  Calendar,
  AlertCircle,
  Briefcase,
  FileCheck2,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { PerjalananDinas } from '../../types';

interface DashboardViewProps {
  onOpenAjukan: () => void;
  onSelectPerjalanan: (perjalanan: PerjalananDinas) => void;
  onNavigateTab: (tab: string) => void;
  onOpenUbahNama?: () => void;
  onOpenLogin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenAjukan, 
  onSelectPerjalanan, 
  onNavigateTab,
  onOpenUbahNama,
  onOpenLogin,
}) => {
  const { currentUser, akunBelanjaList, perjalananList } = useApp();

  const now = new Date();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentYearNum = now.getFullYear();

  // Selected statistical month filter
  const [selectedStatMonth, setSelectedStatMonth] = useState<number>(currentMonthNum);

  // Aggregate financial metrics across all active accounts
  const totalPagu = akunBelanjaList.reduce((acc, a) => acc + a.pagu, 0);
  const totalRealisasi = akunBelanjaList.reduce((acc, a) => acc + a.realisasi, 0);
  const totalKomitmen = akunBelanjaList.reduce((acc, a) => acc + a.komitmen, 0);
  const totalSisa = totalPagu - totalRealisasi - totalKomitmen; // BR-01

  const persentaseRealisasi = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
  const persentaseKomitmen = totalPagu > 0 ? (totalKomitmen / totalPagu) * 100 : 0;
  const persentaseTotalTerikat = totalPagu > 0 ? ((totalRealisasi + totalKomitmen) / totalPagu) * 100 : 0;

  // Filter perjalanan dinas bulan ini (atau bulan yang dipilih)
  const perjalananBulanIni = perjalananList.filter(p => {
    if (!p.tanggalBerangkat) return false;
    const [y, m] = p.tanggalBerangkat.split('-').map(Number);
    return y === currentYearNum && m === selectedStatMonth;
  });

  const totalPesertaBulanIni = perjalananBulanIni.reduce((acc, p) => acc + (p.peserta?.length || 0), 0);

  // Filter jumlah pengajuan SPJ yang sedang dalam proses persetujuan / verifikasi
  const spjDalamProses = perjalananList.filter(p => 
    p.status === 'diajukan' ||
    p.status === 'menunggu_verifikasi_operator' ||
    p.status === 'menunggu_verifikasi_bendahara' ||
    p.status === 'dikembalikan_operator'
  );

  // Serapan indicator color logic (ANG-05)
  const getSerapanColorClass = (percent: number) => {
    if (percent >= 100) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (percent >= 80) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  // Filter tasks awaiting action (DSB-01 & DSB-02)
  const waitingApproval = perjalananList.filter(p => p.status === 'diajukan');
  const waitingOperator = perjalananList.filter(p => p.status === 'menunggu_verifikasi_operator');
  const waitingBendahara = perjalananList.filter(p => p.status === 'menunggu_verifikasi_bendahara');
  const waitingReceipts = perjalananList.filter(p => 
    (p.status === 'disetujui_atasan' || p.status === 'dikembalikan_operator') && 
    (currentUser.role === 'pegawai' ? p.pegawaiPengajuId === currentUser.id : true)
  );

  // Status badge config
  const getStatusBadge = (status: PerjalananDinas['status']) => {
    switch (status) {
      case 'diajukan':
        return <span className="text-amber-800 font-medium">Menunggu Persetujuan Atasan</span>;
      case 'disetujui_atasan':
        return <span className="text-blue-800 font-medium">SPT Terbit · Perjalanan Berlangsung</span>;
      case 'menunggu_verifikasi_operator':
        return <span className="text-purple-800 font-medium">Verifikasi Berkas Operator</span>;
      case 'menunggu_verifikasi_bendahara':
        return <span className="text-indigo-800 font-medium">Verifikasi Bendahara (SPJ)</span>;
      case 'terverifikasi_bendahara':
        return <span className="text-teal-800 font-medium">Terverifikasi Bendahara</span>;
      case 'selesai':
        return <span className="text-emerald-800 font-medium">Selesai & Diarsipkan</span>;
      case 'dikembalikan_operator':
        return <span className="text-rose-800 font-medium">Dikembalikan Operator (Perlu Perbaikan)</span>;
      case 'ditolak_atasan':
        return <span className="text-slate-600 font-medium">Ditolak Atasan</span>;
      case 'dibatalkan':
        return <span className="text-slate-500 font-medium">Dibatalkan</span>;
      default:
        return <span className="text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            <span>Sistem Informasi Perjalanan Dinas & Anggaran</span>
            <span>·</span>
            <span>Tahun Anggaran 2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Selamat Datang, {currentUser.nama}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Peran Aktif: <strong className="text-slate-800 capitalize">{currentUser.role}</strong> · Unit Kerja: {currentUser.unitKerjaNama}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenUbahNama && (
            <button
              onClick={onOpenUbahNama}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Ubah Nama Lengkap & Profil Akun Aktif"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ubah Nama</span>
            </button>
          )}

          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Lihat Data Kredensial & Ganti Akun"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Login</span>
            </button>
          )}

          {(currentUser.role === 'pegawai' || currentUser.role === 'admin' || currentUser.role === 'operator') && (
            <button
              onClick={onOpenAjukan}
              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pengajuan Perjalanan</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('anggaran')}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            Lihat Pagu
          </button>
        </div>
      </div>

      {/* Komponen Statistik Ringkasan Utama (Permintaan Pengguna) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Statistik Ringkasan Kinerja & SPJ</span>
            </h2>
            <p className="text-xs text-slate-500">
              Indikator operasional perjalanan dinas, realisasi serapan anggaran, dan antrean persetujuan SPJ
            </p>
          </div>

          {/* Filter Bulan Statistik */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Bulan Analisis:</span>
            <select
              value={selectedStatMonth}
              onChange={e => setSelectedStatMonth(Number(e.target.value))}
              className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx} value={idx + 1}>
                  {nama} {currentYearNum}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Kartu Statistik Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Kartu 1: Total Perjalanan Dinas Bulan Ini */}
          <div 
            onClick={() => onNavigateTab('perjalanan')}
            className="p-4 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Perjalanan Dinas Bulan Ini</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {perjalananBulanIni.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Perjalanan</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span>{totalPesertaBulanIni} Peserta Terjadwal</span>
              <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                Buka Riwayat <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Kartu 2: Total Realisasi Anggaran */}
          <div 
            onClick={() => onNavigateTab('anggaran')}
            className="p-4 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Realisasi Anggaran</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold font-mono text-emerald-800 tabular-nums">
                  {formatRupiah(totalRealisasi)}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span>Serapan: <strong className="text-slate-800 font-mono">{persentaseRealisasi.toFixed(1)}%</strong> dari Total Pagu</span>
              <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                Rincian Pagu <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Kartu 3: Jumlah Pengajuan SPJ dalam Proses Persetujuan */}
          <div 
            onClick={() => onNavigateTab('perjalanan')}
            className="p-4 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">SPJ Dalam Proses Persetujuan</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-amber-900 tabular-nums">
                  {spjDalamProses.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Berkas Sedang Berjalan</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span>{waitingApproval.length} Menunggu Atasan · {waitingOperator.length + waitingBendahara.length} Verifikasi</span>
              <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                Lihat Berkas <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Financial Overview Cards (ANG-03 & BR-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pagu */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Pagu Anggaran Total</div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {formatRupiah(totalPagu)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Sub Kegiatan 4.01.02.2.01.0002</span>
            <span>{akunBelanjaList.length} Akun</span>
          </div>
        </div>

        {/* Realisasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Realisasi SPJ Sah</span>
            <span className="text-[11px] font-semibold text-emerald-700 font-mono">
              {persentaseRealisasi.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1.5 font-mono tabular-nums">
            {formatRupiah(totalRealisasi)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Telah diverifikasi bendahara & masuk BKU
          </div>
        </div>

        {/* Komitmen */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Komitmen Perjalanan</span>
            <span className="text-[11px] font-semibold text-blue-700 font-mono">
              {persentaseKomitmen.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-bold text-blue-800 mt-1.5 font-mono tabular-nums">
            {formatRupiah(totalKomitmen)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            SPT disetujui, belum verifikasi SPJ
          </div>
        </div>

        {/* Sisa Pagu (BR-01) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Sisa Pagu Tersedia</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSerapanColorClass(persentaseTotalTerikat)}`}>
              {persentaseTotalTerikat >= 100 ? 'Kritis' : persentaseTotalTerikat >= 80 ? 'Peringatan' : 'Aman'}
            </span>
          </div>
          <div className={`text-xl font-bold mt-1.5 font-mono tabular-nums ${totalSisa < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatRupiah(totalSisa)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Pagu - Realisasi - Komitmen (BR-01)
          </div>
        </div>
      </div>

      {/* Progress Bar Serapan (ANG-05) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Indikator Tingkat Serapan Anggaran</h3>
            <p className="text-xs text-slate-500">
              Total terikat: Realisasi ({persentaseRealisasi.toFixed(1)}%) + Komitmen ({persentaseKomitmen.toFixed(1)}%) = <strong className="text-slate-800 font-mono">{persentaseTotalTerikat.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Realisasi SPJ</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Komitmen SPT</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span>
              <span>Sisa Bebas</span>
            </span>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3.5 flex overflow-hidden">
          <div 
            className="bg-emerald-600 h-full transition-all duration-300" 
            style={{ width: `${Math.min(100, persentaseRealisasi)}%` }}
            title={`Realisasi: ${persentaseRealisasi.toFixed(1)}%`}
          />
          <div 
            className="bg-blue-500 h-full transition-all duration-300" 
            style={{ width: `${Math.min(100 - persentaseRealisasi, persentaseKomitmen)}%` }}
            title={`Komitmen: ${persentaseKomitmen.toFixed(1)}%`}
          />
        </div>

        {/* Account by account mini bar breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {akunBelanjaList.filter(a => a.kelompokBelanja === 'perjalanan').map(akun => {
            const accTerikat = akun.realisasi + akun.komitmen;
            const accPct = akun.pagu > 0 ? (accTerikat / akun.pagu) * 100 : 0;
            const accSisa = akun.pagu - accTerikat;
            return (
              <div key={akun.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span className="truncate pr-2">{akun.uraian}</span>
                  <span className="font-mono tabular-nums shrink-0">{accPct.toFixed(1)}%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{akun.kodeRekening}</div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${accPct >= 100 ? 'bg-rose-500' : accPct >= 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                    style={{ width: `${Math.min(100, accPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 font-mono">
                  <span>Pagu: {formatRupiah(akun.pagu)}</span>
                  <span>Sisa: <strong className="text-slate-900">{formatRupiah(accSisa)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Queue Section (DSB-01 & DSB-02) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom 1: Antrean Tugas Menurut Peran Aktif */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Antrean Tindakan yang Menunggu</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen dan perjalanan yang memerlukan tindak lanjut Anda
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('perjalanan')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Perjalanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Show tasks relevant to current user */}
            {currentUser.role === 'atasan' && waitingApproval.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-700" />
                    <span>{waitingApproval.length} Pengajuan Menunggu Persetujuan Anda (KPA)</span>
                  </span>
                </div>
                {waitingApproval.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectPerjalanan(p)}
                    className="p-2.5 bg-white rounded-md border border-purple-100 hover:border-purple-300 transition-colors cursor-pointer mb-2 last:mb-0"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">{p.maksudPerjalanan}</strong>
                      <span className="font-mono font-semibold text-purple-800 shrink-0 ml-2">
                        {formatRupiah(p.totalEstimasi)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>Oleh: {p.pegawaiPengajuNama}</span>
                      <span>·</span>
                      <span>Tujuan: {p.kotaTujuan}</span>
                      <span>·</span>
                      <span>{p.lamaHari} Hari</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentUser.role === 'operator' && waitingOperator.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>{waitingOperator.length} Berkas Menunggu Verifikasi Operator</span>
                  </span>
                </div>
                {waitingOperator.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectPerjalanan(p)}
                    className="p-2.5 bg-white rounded-md border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer mb-2 last:mb-0"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">SPT: {p.nomorSPT}</strong>
                      <span className="text-xs text-amber-800 font-semibold">{p.berkas.length} Berkas Terunggah</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{p.maksudPerjalanan}</div>
                  </div>
                ))}
              </div>
            )}

            {currentUser.role === 'bendahara' && waitingBendahara.length > 0 && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{waitingBendahara.length} SPJ Menunggu Verifikasi Bendahara & Entri Buku Kas</span>
                  </span>
                </div>
                {waitingBendahara.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectPerjalanan(p)}
                    className="p-2.5 bg-white rounded-md border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer mb-2 last:mb-0"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">SPT: {p.nomorSPT} ({p.kotaTujuan})</strong>
                      <span className="font-mono font-semibold text-indigo-800">
                        {formatRupiah(p.totalEstimasi)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Pelaksana: {p.peserta.map(pst => pst.nama.split(',')[0]).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent travels list */}
            <div className="divide-y divide-slate-100">
              {perjalananList.slice(0, 4).map(p => (
                <div 
                  key={p.id}
                  onClick={() => onSelectPerjalanan(p)}
                  className="py-3 flex items-start justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {p.nomorSPT ? p.nomorSPT : 'Draft Pengajuan'}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-xs">{getStatusBadge(p.status)}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{p.maksudPerjalanan}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.kotaTujuan}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{p.tanggalBerangkat}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{p.peserta.length} Orang</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                      {formatRupiah(p.status === 'selesai' || p.status === 'terverifikasi_bendahara' ? p.totalRealisasi : p.totalEstimasi)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.status === 'selesai' || p.status === 'terverifikasi_bendahara' ? 'Realisasi' : 'Estimasi'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom 2: Petunjuk Cepat & Ketentuan Aturan Bisnis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ringkasan Alur & Aturan Bisnis</h3>
            <p className="text-xs text-slate-500">Ketentuan fungsional e-Perjadin Kendal</p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-800 block mb-1">1. Sisa Anggaran (BR-01)</strong>
              Sisa = Pagu dikurangi Realisasi dikurangi Komitmen. Pengajuan melebihi sisa pagu ditolak otomatis.
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-800 block mb-1">2. Penurunan Pagu (BR-03 & AC-01)</strong>
              Pagu akun tidak dapat diturunkan di bawah total Realisasi ditambah Komitmen yang sedang berjalan.
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-800 block mb-1">3. Penerbitan SPT (BR-09 & AC-03)</strong>
              Nomor SPT terbit otomatis setelah Atasan menyetujui, dan membentuk komitmen pada akun belanja terkait.
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-800 block mb-1">4. Verifikasi & BKU (BR-07 & AC-04)</strong>
              Verifikasi bendahara mengubah komitmen menjadi realisasi dan mencatat pengeluaran di Buku Kas. Entri tidak dihapus, koreksi lewat entri pembalik.
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-800 block mb-1">5. Status Selesai (BR-10 & AC-10)</strong>
              Status Selesai hanya dapat dipilih jika scan dokumen bertanda tangan telah diunggah.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
