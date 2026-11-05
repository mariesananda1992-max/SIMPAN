import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PerjalananDinas, StatusPerjalanan } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Users, 
  FileCheck, 
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';

interface PerjalananListViewProps {
  onOpenAjukan: () => void;
  onSelectPerjalanan: (perjalanan: PerjalananDinas) => void;
}

export const PerjalananListView: React.FC<PerjalananListViewProps> = ({
  onOpenAjukan,
  onSelectPerjalanan,
}) => {
  const { currentUser, perjalananList } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'terbaru' | 'nominal'>('terbaru');

  // AC-08: Pegawai hanya melihat perjalanan miliknya, sedangkan Admin/Bendahara/Operator/Atasan melihat semua sesuai wewenang
  const baseList = perjalananList.filter(p => {
    if (currentUser.role === 'pegawai') {
      return p.pegawaiPengajuId === currentUser.id || p.peserta.some(pst => pst.nip === currentUser.nip);
    }
    return true; // Admin, atasan, operator, bendahara can see all
  });

  // Filter by search and status
  const filteredList = baseList.filter(p => {
    const matchesSearch = 
      p.maksudPerjalanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nomorSPT && p.nomorSPT.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.kotaTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pegawaiPengajuNama.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredList.sort((a, b) => {
    if (sortBy === 'nominal') {
      return (b.totalRealisasi || b.totalEstimasi) - (a.totalRealisasi || a.totalEstimasi);
    }
    return new Date(b.tanggalBerangkat).getTime() - new Date(a.tanggalBerangkat).getTime();
  });

  // Render status badge cleanly without generic pill clutter (Section 1A of frontend-design)
  const renderStatusBadge = (status: StatusPerjalanan) => {
    switch (status) {
      case 'draft':
        return <span className="text-slate-600 font-medium">Draft Pengajuan</span>;
      case 'diajukan':
        return <span className="text-amber-800 font-semibold">Menunggu Persetujuan Atasan</span>;
      case 'disetujui_atasan':
        return <span className="text-blue-800 font-semibold">Disetujui · SPT Terbit</span>;
      case 'ditolak_atasan':
        return <span className="text-rose-800 font-semibold">Ditolak Atasan</span>;
      case 'dalam_perjalanan':
        return <span className="text-indigo-800 font-semibold">Sedang Dilaksanakan</span>;
      case 'menunggu_verifikasi_operator':
        return <span className="text-purple-800 font-semibold">Menunggu Verifikasi Operator</span>;
      case 'dikembalikan_operator':
        return <span className="text-rose-700 font-semibold">Dikembalikan Operator</span>;
      case 'menunggu_verifikasi_bendahara':
        return <span className="text-cyan-800 font-semibold">Menunggu Verifikasi Bendahara (SPJ)</span>;
      case 'terverifikasi_bendahara':
        return <span className="text-teal-800 font-semibold">SPJ Terverifikasi</span>;
      case 'selesai':
        return <span className="text-emerald-800 font-semibold">Selesai & Diarsipkan</span>;
      case 'dibatalkan':
        return <span className="text-slate-500 line-through">Dibatalkan</span>;
      default:
        return <span className="text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Daftar Perjalanan Dinas (e-Perjadin)
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'pegawai' 
              ? 'Menampilkan daftar pengajuan perjalanan dinas milik Anda (Aturan AC-08)' 
              : 'Menampilkan seluruh berkas perjalanan dinas Bagian Pemerintahan Setda Kendal'}
          </p>
        </div>

        {(currentUser.role === 'pegawai' || currentUser.role === 'admin' || currentUser.role === 'operator') && (
          <button
            onClick={onOpenAjukan}
            className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Pengajuan Baru</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari maksud, nomor SPT, kota..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="diajukan">Menunggu Atasan</option>
              <option value="disetujui_atasan">Disetujui / SPT Terbit</option>
              <option value="menunggu_verifikasi_operator">Verifikasi Operator</option>
              <option value="menunggu_verifikasi_bendahara">Verifikasi Bendahara</option>
              <option value="terverifikasi_bendahara">SPJ Terverifikasi</option>
              <option value="selesai">Selesai & Diarsipkan</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
          >
            <option value="terbaru">Tanggal Terbaru</option>
            <option value="nominal">Nominal Tertinggi</option>
          </select>
        </div>

      </div>

      {/* Travels Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Tidak Ada Perjalanan Dinas Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Belum ada riwayat pengajuan perjalanan dinas sesuai filter yang dipilih.
            </p>
            {(currentUser.role === 'pegawai' || currentUser.role === 'admin') && (
              <button
                onClick={onOpenAjukan}
                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Pengajuan Perjalanan</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map(item => {
              const nominalTampil = item.status === 'selesai' || item.status === 'terverifikasi_bendahara' 
                ? item.totalRealisasi 
                : item.totalEstimasi;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectPerjalanan(item)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 font-mono">
                        {item.nomorSPT || 'Draft Pengajuan'}
                      </span>
                      <span className="text-slate-400">·</span>
                      {renderStatusBadge(item.status)}
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">
                        {item.berkas.length} Berkas Pendukung
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.maksudPerjalanan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.kotaTujuan}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTanggalIndo(item.tanggalBerangkat)} ({item.lamaHari} hari)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.peserta.length} Peserta ({item.pegawaiPengajuNama.split(',')[0]})</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                        {formatRupiah(nominalTampil)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.status === 'selesai' || item.status === 'terverifikasi_bendahara' ? 'Realisasi Sah' : 'Estimasi Pagu'}
                      </div>
                    </div>

                    <button 
                      className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Buka Rincian & Aksi"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
