import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AkunBelanja, KelompokBelanja } from '../../types';
import { formatRupiah, formatTanggalWaktu } from '../../utils/formatters';
import { 
  Coins, 
  TrendingUp, 
  Edit3, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';

export const AnggaranView: React.FC = () => {
  const { 
    currentUser, 
    akunBelanjaList, 
    subKegiatanList, 
    paguHistories, 
    ubahPagu 
  } = useApp();

  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<string>('all');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Ubah Pagu
  const [modalAkun, setModalAkun] = useState<AkunBelanja | null>(null);
  const [inputPaguBaru, setInputPaguBaru] = useState<number>(0);
  const [alasanUbah, setAlasanUbah] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const canEditPagu = currentUser.role === 'bendahara' || currentUser.role === 'admin';

  // Filter accounts (ANG-07)
  const filteredAkun = akunBelanjaList.filter(a => {
    const matchesSub = selectedSubKegiatan === 'all' || a.subKegiatanId === selectedSubKegiatan;
    const matchesKel = selectedKelompok === 'all' || a.kelompokBelanja === selectedKelompok;
    const matchesSearch = 
      a.kodeRekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.uraian.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSub && matchesKel && matchesSearch;
  });

  // Calculate overall totals
  const totalPagu = akunBelanjaList.reduce((acc, a) => acc + a.pagu, 0);
  const totalRealisasi = akunBelanjaList.reduce((acc, a) => acc + a.realisasi, 0);
  const totalKomitmen = akunBelanjaList.reduce((acc, a) => acc + a.komitmen, 0);
  const totalSisa = totalPagu - totalRealisasi - totalKomitmen;

  // Open modal
  const handleOpenEditModal = (akun: AkunBelanja) => {
    setModalAkun(akun);
    setInputPaguBaru(akun.pagu);
    setAlasanUbah('');
    setModalError('');
    setModalSuccess('');
  };

  // Submit modal (ANG-02, ANG-04, BR-03, AC-01)
  const handleSubmitUbahPagu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAkun) return;

    setModalError('');
    setModalSuccess('');

    const res = ubahPagu(modalAkun.id, inputPaguBaru, alasanUbah);
    if (res.success) {
      setModalSuccess(res.message);
      setTimeout(() => {
        setModalAkun(null);
      }, 1500);
    } else {
      setModalError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Role Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengelolaan Pagu, Realisasi & Komitmen Anggaran
          </h1>
          <p className="text-xs text-slate-500">
            DPA Sub Kegiatan 4.01.02.2.01.0002 · Pengelolaan Administrasi Kewilayahan Setda Kendal
          </p>
        </div>

        {canEditPagu ? (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hak Akses: Pengubahan Pagu Aktif ({currentUser.role})</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Mode Pratinjau (Hanya Bendahara & Admin yang berhak mengubah pagu)
          </div>
        )}
      </div>

      {/* Aggregate Financial Metrics (ANG-03) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Pagu Anggaran Total</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatRupiah(totalPagu)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">DPA Perubahan TA 2026</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Realisasi SPJ</div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
            {formatRupiah(totalRealisasi)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Serapan: {totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Komitmen SPT</div>
          <div className="text-xl font-bold font-mono text-blue-800 mt-1 tabular-nums">
            {formatRupiah(totalKomitmen)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Terikat: {totalPagu > 0 ? ((totalKomitmen / totalPagu) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Sisa Pagu Bebas</div>
          <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${totalSisa < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatRupiah(totalSisa)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sisa = Pagu - Realisasi - Komitmen (BR-01)
          </div>
        </div>
      </div>

      {/* Filter Bar (ANG-07) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari rekening atau uraian belanja..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Kelompok Belanja Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedKelompok}
              onChange={e => setSelectedKelompok(e.target.value)}
              className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Kelompok Belanja</option>
              <option value="perjalanan">Perjalanan Dinas</option>
              <option value="barang_jasa">Barang & Jasa</option>
              <option value="pemeliharaan">Pemeliharaan</option>
              <option value="pegawai">Belanja Pegawai</option>
              <option value="modal">Belanja Modal</option>
            </select>
          </div>
        </div>

      </div>

      {/* High-Density Budget Table (ANG-03 & ANG-05) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daftar Akun Belanja & Serapan Anggaran (ANG-03)
          </span>
          <span className="text-xs text-slate-500">
            Menampilkan {filteredAkun.length} Akun Belanja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                <th className="py-3 px-4">Kode Rekening</th>
                <th className="py-3 px-4">Uraian Akun Belanja</th>
                <th className="py-3 px-4">Kelompok</th>
                <th className="py-3 px-4 text-right">Pagu (Rp)</th>
                <th className="py-3 px-4 text-right">Realisasi (Rp)</th>
                <th className="py-3 px-4 text-right">Komitmen (Rp)</th>
                <th className="py-3 px-4 text-right">Sisa Pagu (Rp)</th>
                <th className="py-3 px-4 text-center">Serapan (ANG-05)</th>
                {canEditPagu && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAkun.map(akun => {
                const sisa = akun.pagu - akun.realisasi - akun.komitmen;
                const totalTerikat = akun.realisasi + akun.komitmen;
                const pct = akun.pagu > 0 ? (totalTerikat / akun.pagu) * 100 : 0;

                // ANG-05 Color indicators: hijau (<80%), kuning (>=80%), merah (>=100% atau defisit)
                const indicatorColor = 
                  pct >= 100 ? 'text-rose-700 bg-rose-50 border-rose-200' :
                  pct >= 80 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-emerald-700 bg-emerald-50 border-emerald-200';

                return (
                  <tr key={akun.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {akun.kodeRekening}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                      {akun.uraian}
                    </td>
                    <td className="py-3 px-4 text-slate-500 capitalize">
                      {akun.kelompokBelanja.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(akun.pagu)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800 tabular-nums">
                      {formatRupiah(akun.realisasi)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-800 tabular-nums">
                      {formatRupiah(akun.komitmen)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold tabular-nums ${sisa < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatRupiah(sisa)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border inline-block ${indicatorColor}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    {canEditPagu && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(akun)}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-md font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ubah Nilai Pagu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ubah Pagu</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of Pagu Alterations (ANG-02) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Riwayat Perubahan Pagu Anggaran (ANG-02 & AUD-01)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {paguHistories.length} Catatan Perubahan
          </span>
        </div>

        {paguHistories.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Belum ada riwayat perubahan pagu anggaran pada sistem.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paguHistories.map(h => (
              <div key={h.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{h.kodeRekening}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-800">{h.uraian}</span>
                  </div>
                  <div className="text-slate-600">
                    Alasan: <strong className="text-slate-800">"{h.alasan}"</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Diubah oleh: {h.diubahOleh} (NIP. {h.nipPengubah}) · {formatTanggalWaktu(h.waktu)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400 line-through">{formatRupiah(h.nilaiLama)}</span>
                    <span className="text-slate-400">→</span>
                    <strong className="text-emerald-700">{formatRupiah(h.nilaiBaru)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Selisih: {h.nilaiBaru >= h.nilaiLama ? '+' : ''}{formatRupiah(h.nilaiBaru - h.nilaiLama)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Ubah Pagu Akun Belanja (ANG-02 & ANG-04 & BR-03 & AC-01) */}
      {modalAkun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Ubah Pagu Akun Belanja (ANG-02)</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{modalAkun.kodeRekening}</p>
              </div>
              <button 
                onClick={() => setModalAkun(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUbahPagu} className="p-6 space-y-4 text-xs">
              
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Validasi Aturan (BR-03 & AC-01):</strong>
                    <span>{modalError}</span>
                  </div>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-slate-800 font-semibold">{modalAkun.uraian}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Pagu Saat Ini:</span>
                    <div className="font-mono font-bold text-slate-900">{formatRupiah(modalAkun.pagu)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Batas Minimal Pagu (BR-03):</span>
                    <div className="font-mono font-bold text-rose-700">
                      {formatRupiah(modalAkun.realisasi + modalAkun.komitmen)}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  * Aturan BR-03: Pagu tidak boleh diturunkan di bawah Realisasi ({formatRupiah(modalAkun.realisasi)}) + Komitmen ({formatRupiah(modalAkun.komitmen)}).
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nilai Pagu Baru (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={inputPaguBaru}
                    onChange={e => setInputPaguBaru(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Perubahan Pagu (Wajib Diisi - Aturan ANG-02) *
                </label>
                <textarea
                  rows={3}
                  value={alasanUbah}
                  onChange={e => setAlasanUbah(e.target.value)}
                  placeholder="Contoh: Pergeseran anggaran DPA Perubahan Triwulan I sesuai SK Kepala BPKAD..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAkun(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Pagu</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
