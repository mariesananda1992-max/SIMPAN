import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatTanggalIndo, NAMA_BULAN, exportToCSV } from '../../utils/formatters';
import { 
  BookOpen, 
  Plus, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { BukuKasEntri } from '../../types';

export const BukuKasView: React.FC = () => {
  const { 
    currentUser, 
    bukuKasList, 
    bulanBukuList, 
    tambahEntriBukuKasManual, 
    koreksiEntriBukuKas, 
    tutupBulanKas, 
    bukaBulanKas 
  } = useApp();

  const [selectedBulan, setSelectedBulan] = useState<number>(2); // Default Februari
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);

  // Modal states
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [isKoreksiModalOpen, setIsKoreksiModalOpen] = useState(false);
  const [isBukaBulanModalOpen, setIsBukaBulanModalOpen] = useState(false);
  const [selectedEntriForKoreksi, setSelectedEntriForKoreksi] = useState<BukuKasEntri | null>(null);

  // Form states for manual receipt
  const [tglInput, setTglInput] = useState(new Date().toISOString().split('T')[0]);
  const [noBuktiInput, setNoBuktiInput] = useState('');
  const [uraianInput, setUraianInput] = useState('');
  const [kodeRekeningInput, setKodeRekeningInput] = useState('4.01.02.2.01.0002');
  const [jenisInput, setJenisInput] = useState<'penerimaan' | 'pengeluaran'>('penerimaan');
  const [nominalInput, setNominalInput] = useState<number>(10000000);

  // Reason inputs
  const [alasanKoreksi, setAlasanKoreksi] = useState('');
  const [alasanBukaBulan, setAlasanBukaBulan] = useState('');
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageKas = currentUser.role === 'bendahara' || currentUser.role === 'admin';

  // Check if current month is closed (BR-08)
  const currentBulanInfo = bulanBukuList.find(b => b.bulan === selectedBulan && b.tahun === selectedTahun);
  const isMonthClosed = currentBulanInfo?.isTutup || false;

  // Entries for selected month
  const monthEntries = bukuKasList.filter(k => k.bulan === selectedBulan && k.tahun === selectedTahun);

  // Previous month entries to calculate Sisa Lalu (BR-05)
  const previousEntries = bukuKasList.filter(k => {
    if (k.tahun < selectedTahun) return true;
    if (k.tahun === selectedTahun && k.bulan < selectedBulan) return true;
    return false;
  });

  const totalPenerimaanLalu = previousEntries.reduce((sum, e) => sum + e.debet, 0);
  const totalPengeluaranLalu = previousEntries.reduce((sum, e) => sum + e.kredit, 0);
  const sisaLalu = totalPenerimaanLalu - totalPengeluaranLalu; // BR-05

  // Current month totals
  const totalPenerimaanBulanIni = monthEntries.reduce((sum, e) => sum + e.debet, 0);
  const totalPengeluaranBulanIni = monthEntries.reduce((sum, e) => sum + e.kredit, 0);
  const sisaSekarang = sisaLalu + totalPenerimaanBulanIni - totalPengeluaranBulanIni; // BR-06

  // Submit manual cash receipt
  const handleSubmitManualKas = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = tambahEntriBukuKasManual({
      tanggal: tglInput,
      nomorBukti: noBuktiInput,
      uraian: uraianInput,
      kodeRekening: kodeRekeningInput,
      jenis: jenisInput,
      nominal: nominalInput,
      bulan: selectedBulan,
      tahun: selectedTahun,
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setIsTambahModalOpen(false);
      setNoBuktiInput('');
      setUraianInput('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Submit reversal (storno) correction (BR-07)
  const handleSubmitKoreksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntriForKoreksi) return;
    setStatusMessage(null);

    const res = koreksiEntriBukuKas(selectedEntriForKoreksi.id, alasanKoreksi);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setIsKoreksiModalOpen(false);
      setSelectedEntriForKoreksi(null);
      setAlasanKoreksi('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Toggle close / open month (BR-08)
  const handleToggleMonthLock = () => {
    setStatusMessage(null);
    if (isMonthClosed) {
      setIsBukaBulanModalOpen(true);
    } else {
      const res = tutupBulanKas(selectedBulan, selectedTahun);
      setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
    }
  };

  const handleSubmitBukaBulan = (e: React.FormEvent) => {
    e.preventDefault();
    const res = bukaBulanKas(selectedBulan, selectedTahun, alasanBukaBulan);
    setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setIsBukaBulanModalOpen(false);
      setAlasanBukaBulan('');
    }
  };

  // Export to Excel / CSV (LAP-07)
  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal', 'Nomor Bukti', 'Uraian Transaksi', 'Kode Rekening', 'Penerimaan (Debet)', 'Pengeluaran (Kredit)', 'Saldo Berjalan'];
    const rows = monthEntries.map((e, idx) => [
      idx + 1,
      formatTanggalIndo(e.tanggal),
      e.nomorBukti,
      e.uraian,
      e.kodeRekening,
      e.debet,
      e.kredit,
      e.saldoBerjalan
    ]);
    exportToCSV(`Buku_Kas_Umum_${NAMA_BULAN[selectedBulan - 1]}_${selectedTahun}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Month Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Buku Kas Umum (BKU)
            </h1>
            {isMonthClosed ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <Lock className="w-3 h-3" />
                <span>Bulan Terkunci (BR-08)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Unlock className="w-3 h-3" />
                <span>Bulan Terbuka</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kas otomatis dari verifikasi SPJ perjalanan dinas dan penerimaan droping kas
          </p>
        </div>

        {/* Month Picker & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 p-1 focus:outline-none"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx} value={idx + 1}>
                  Bulan {nama}
                </option>
              ))}
            </select>
            <span className="text-slate-400">/</span>
            <select
              value={selectedTahun}
              onChange={e => setSelectedTahun(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 p-1 focus:outline-none"
            >
              <option value={2026}>2026</option>
            </select>
          </div>

          {canManageKas && (
            <>
              <button
                onClick={() => setIsTambahModalOpen(true)}
                disabled={isMonthClosed}
                className={`py-2 px-3 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isMonthClosed ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-800 shadow-xs'
                }`}
                title={isMonthClosed ? 'Bulan telah ditutup' : 'Tambah Penerimaan / Droping UP'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Droping / Penerimaan</span>
              </button>

              <button
                onClick={handleToggleMonthLock}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isMonthClosed
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
              >
                {isMonthClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isMonthClosed ? 'Buka Kembali Bulan' : 'Tutup Bulan Kas'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor Buku Kas ke Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold">
            Tutup
          </button>
        </div>
      )}

      {/* Financial Summary Strip for Selected Month (BR-05 & BR-06) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block font-medium">Sisa Kas Lalu (BR-05)</span>
          <div className="text-base font-bold font-mono text-slate-800 mt-1 tabular-nums">
            {formatRupiah(sisaLalu)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Saldo per akhir bulan sebelumnya</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block font-medium">Penerimaan Bulan Ini</span>
          <div className="text-base font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {formatRupiah(totalPenerimaanBulanIni)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total debet masuk kas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block font-medium">Pengeluaran SPJ Bulan Ini</span>
          <div className="text-base font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {formatRupiah(totalPengeluaranBulanIni)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total kredit keluar kas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block font-medium">Sisa Kas Sekarang (BR-06)</span>
          <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatRupiah(sisaSekarang)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Sisa Lalu + Terima - Keluar</span>
        </div>
      </div>

      {/* Cash Ledger Table (KEU-04) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Register Transaksi Buku Kas Umum · {NAMA_BULAN[selectedBulan - 1]} {selectedTahun}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {monthEntries.length} Baris Entri
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-28">Tanggal</th>
                <th className="py-2.5 px-3 w-36">No. Bukti</th>
                <th className="py-2.5 px-3">Uraian Transaksi</th>
                <th className="py-2.5 px-3 w-32">Kode Rekening</th>
                <th className="py-2.5 px-3 text-right w-32">Penerimaan (Rp)</th>
                <th className="py-2.5 px-3 text-right w-32">Pengeluaran (Rp)</th>
                <th className="py-2.5 px-3 text-right w-32">Saldo Kas (Rp)</th>
                {canManageKas && !isMonthClosed && <th className="py-2.5 px-3 text-center w-20">Koreksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {/* Row for Saldo Lalu (BR-05) */}
              <tr className="bg-slate-50/70 italic text-slate-600">
                <td className="py-2 px-3 text-center font-sans">-</td>
                <td className="py-2 px-3 font-sans">01/{String(selectedBulan).padStart(2, '0')}/{selectedTahun}</td>
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3 font-sans font-semibold">Sisa Kas Bulan Lalu (BR-05)</td>
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3 text-right tabular-nums">{formatRupiah(sisaLalu)}</td>
                <td className="py-2 px-3 text-right tabular-nums">-</td>
                <td className="py-2 px-3 text-right font-bold text-slate-800 tabular-nums">{formatRupiah(sisaLalu)}</td>
                {canManageKas && !isMonthClosed && <td className="py-2 px-3 text-center">-</td>}
              </tr>

              {monthEntries.map((entri, idx) => (
                <tr 
                  key={entri.id} 
                  className={`hover:bg-slate-50/60 transition-colors ${entri.isKoreksi ? 'bg-amber-50/40 text-amber-900' : ''}`}
                >
                  <td className="py-2.5 px-3 text-center font-sans text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{formatTanggalIndo(entri.tanggal)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{entri.nomorBukti}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-900 max-w-sm">
                    {entri.uraian}
                    {entri.isKoreksi && (
                      <span className="ml-2 text-[10px] text-amber-700 font-semibold uppercase px-1 bg-amber-100 rounded">
                        Storno Pembalik
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{entri.kodeRekening}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-800 tabular-nums">
                    {entri.debet > 0 ? formatRupiah(entri.debet) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-800 tabular-nums">
                    {entri.kredit > 0 ? formatRupiah(entri.kredit) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatRupiah(entri.saldoBerjalan)}
                  </td>
                  {canManageKas && !isMonthClosed && (
                    <td className="py-2.5 px-3 text-center font-sans">
                      {!entri.isKoreksi && (
                        <button
                          onClick={() => {
                            setSelectedEntriForKoreksi(entri);
                            setIsKoreksiModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors cursor-pointer"
                          title="Koreksi via Entri Pembalik (BR-07)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 font-mono">
                <td colSpan={5} className="py-3 px-4 font-sans text-right">
                  TOTAL BULAN INI & SALDO AKHIR (BR-06):
                </td>
                <td className="py-3 px-3 text-right text-emerald-800 tabular-nums">
                  {formatRupiah(totalPenerimaanBulanIni)}
                </td>
                <td className="py-3 px-3 text-right text-rose-800 tabular-nums">
                  {formatRupiah(totalPengeluaranBulanIni)}
                </td>
                <td className="py-3 px-3 text-right font-bold tabular-nums">
                  {formatRupiah(sisaSekarang)}
                </td>
                {canManageKas && !isMonthClosed && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Penerimaan / Droping Kas */}
      {isTambahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Input Droping / Penerimaan Kas (KEU-04)</h3>
              <button onClick={() => setIsTambahModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualKas} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={tglInput}
                  onChange={e => setTglInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Bukti Kas (SP2D / Kuitansi)</label>
                <input
                  type="text"
                  value={noBuktiInput}
                  onChange={e => setNoBuktiInput(e.target.value)}
                  placeholder="Contoh: SP2D/045/GU/2026"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Transaksi</label>
                <input
                  type="text"
                  value={uraianInput}
                  onChange={e => setUraianInput(e.target.value)}
                  placeholder="Contoh: Penerimaan Kas Tambahan GU Tahap II"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Penerimaan (Rp)</label>
                <input
                  type="number"
                  value={nominalInput}
                  onChange={e => setNominalInput(Number(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTambahModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Koreksi Entri Pembalik (BR-07) */}
      {isKoreksiModalOpen && selectedEntriForKoreksi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Koreksi Entri Pembalik / Storno (BR-07)</h3>
              <button onClick={() => setIsKoreksiModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitKoreksi} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <strong className="block mb-1">Aturan BR-07:</strong>
                Entri buku kas tidak boleh dihapus. Koreksi dilakukan dengan menerbitkan entri pembalik otomatis bernilai sama pada sisi berlawanan.
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-mono text-[11px]">{selectedEntriForKoreksi.nomorBukti}</div>
                <div className="font-semibold text-slate-900">{selectedEntriForKoreksi.uraian}</div>
                <div className="font-mono text-emerald-800 pt-1">
                  Nominal: {formatRupiah(selectedEntriForKoreksi.debet || selectedEntriForKoreksi.kredit)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Koreksi (Wajib Diisi) *
                </label>
                <textarea
                  rows={3}
                  value={alasanKoreksi}
                  onChange={e => setAlasanKoreksi(e.target.value)}
                  placeholder="Contoh: Salah pembukuan nomor rekening / nilai kuitansi ganda..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKoreksiModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Bukukan Entri Pembalik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Buka Kembali Bulan Kas (BR-08) */}
      {isBukaBulanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Buka Kembali Bulan Buku Kas (BR-08)</h3>
              <button onClick={() => setIsBukaBulanModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBukaBulan} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                Bulan <strong className="text-slate-900">{NAMA_BULAN[selectedBulan - 1]} {selectedTahun}</strong> saat ini terkunci. Berdasarkan aturan BR-08, pembukaan kembali hanya dapat dilakukan bendahara dengan alasan tercatat di log audit.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Pembukaan Kembali Bulan Kas *
                </label>
                <textarea
                  rows={3}
                  value={alasanBukaBulan}
                  onChange={e => setAlasanBukaBulan(e.target.value)}
                  placeholder="Contoh: Perbaikan SPJ susulan sesuai petunjuk Inspektorat Daerah..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBukaBulanModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Buka Kunci Bulan Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
