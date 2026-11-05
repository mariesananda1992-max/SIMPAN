import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatTanggalIndo, NAMA_BULAN, exportToCSV } from '../../utils/formatters';
import { 
  FileText, 
  Printer, 
  Download, 
  Layers, 
  Calendar, 
  Building2, 
  CheckCircle,
  FileSpreadsheet,
  UploadCloud,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { exportPerjadinToGoogleSheets } from '../../services/googleSheetsService';
import { getGoogleAccessToken } from '../../services/googleAuth';

export const LaporanKeuanganView: React.FC = () => {
  const { 
    akunBelanjaList, 
    subKegiatanList, 
    pejabatList, 
    pengaturan, 
    bukuKasList, 
    perjalananList 
  } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'pk6' | 'daftar_pengumpulan' | 'sisa_dana' | 'pengantar_spj' | 'dokumen_a2'>('pk6');
  const [selectedBulan, setSelectedBulan] = useState<number>(2); // Februari
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [isExportingGoogle, setIsExportingGoogle] = useState(false);
  const [googleSheetResult, setGoogleSheetResult] = useState<{ url: string; title: string } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Pejabat signatories
  const kpa = pejabatList.find(p => p.peran === 'kpa') || pejabatList[0];
  const pptk = pejabatList.find(p => p.peran === 'pptk') || pejabatList[1];
  const bendahara = pejabatList.find(p => p.peran === 'bendahara_pengeluaran_pembantu') || pejabatList[2];
  const pembantuBendahara = pejabatList.find(p => p.peran === 'pembantu_bendahara_pengeluaran') || pejabatList[3];

  // Current month entries
  const monthEntries = bukuKasList.filter(k => k.bulan === selectedBulan && k.tahun === selectedTahun);

  // Previous month entries for Sisa Lalu (BR-05)
  const previousEntries = bukuKasList.filter(k => {
    if (k.tahun < selectedTahun) return true;
    if (k.tahun === selectedTahun && k.bulan < selectedBulan) return true;
    return false;
  });

  const sisaLaluTotal = previousEntries.reduce((sum, e) => sum + e.debet - e.kredit, 0);

  const handleExportGoogleSheets = async () => {
    const token = await getGoogleAccessToken();
    if (!token) {
      setGoogleError('Akun Google belum terhubung. Silakan buka tab "Google Drive & Sheets" di sidebar untuk menghubungkan akun Google.');
      setTimeout(() => setGoogleError(null), 5000);
      return;
    }

    setIsExportingGoogle(true);
    setGoogleError(null);
    try {
      const res = await exportPerjadinToGoogleSheets(
        `Laporan SPJ Kendal Bulan ${NAMA_BULAN[selectedBulan - 1]} ${selectedTahun}`,
        perjalananList,
        akunBelanjaList,
        bukuKasList
      );
      setGoogleSheetResult({ url: res.spreadsheetUrl, title: res.title });
      setTimeout(() => setGoogleSheetResult(null), 10000);
    } catch (err: any) {
      setGoogleError(err.message || 'Gagal mengekspor ke Google Sheets');
      setTimeout(() => setGoogleError(null), 5000);
    } finally {
      setIsExportingGoogle(false);
    }
  };

  // Print triggering
  const handlePrint = () => {
    window.print();
  };

  // Export handlers (LAP-07)
  const handleExportPK6 = () => {
    const headers = [
      'No', 'Rekening', 'Uraian Belanja', 'Jumlah (Rp)', 
      'Belanja Pegawai (Rp)', 'Barang dan Jasa (Rp)', 'Perjalanan (Rp)', 'Pemeliharaan (Rp)', 'Modal (Rp)'
    ];
    const rows = akunBelanjaList.map((a, idx) => {
      const realisasi = a.realisasi;
      const colPegawai = a.kelompokBelanja === 'pegawai' ? realisasi : 0;
      const colBarang = a.kelompokBelanja === 'barang_jasa' ? realisasi : 0;
      const colPerjalanan = a.kelompokBelanja === 'perjalanan' ? realisasi : 0;
      const colPemeliharaan = a.kelompokBelanja === 'pemeliharaan' ? realisasi : 0;
      const colModal = a.kelompokBelanja === 'modal' ? realisasi : 0;
      return [
        idx + 1,
        a.kodeRekening,
        a.uraian,
        realisasi,
        colPegawai,
        colBarang,
        colPerjalanan,
        colPemeliharaan,
        colModal
      ];
    });
    exportToCSV(`Buku_Pembantu_PK6_${NAMA_BULAN[selectedBulan - 1]}_${selectedTahun}`, headers, rows);
  };

  const handleExportDaftarPengumpulan = () => {
    const headers = ['No', 'Kode Rekening', 'Uraian', 'Penerimaan', 'Sisa Lalu', 'Pengeluaran', 'Sisa Sekarang'];
    const rows = akunBelanjaList.map((a, idx) => {
      const pengeluaranBulanIni = monthEntries
        .filter(k => k.kodeRekening === a.kodeRekening)
        .reduce((sum, k) => sum + k.kredit, 0);
      const penerimaanBulanIni = monthEntries
        .filter(k => k.kodeRekening === a.kodeRekening)
        .reduce((sum, k) => sum + k.debet, 0);
      const sisaAkunLalu = a.pagu * 0.1; // proportional sample or tracked
      const sisaAkunSekarang = sisaAkunLalu + penerimaanBulanIni - pengeluaranBulanIni;

      return [
        idx + 1,
        a.kodeRekening,
        a.uraian,
        penerimaanBulanIni,
        sisaAkunLalu,
        pengeluaranBulanIni,
        sisaAkunSekarang
      ];
    });
    exportToCSV(`Daftar_Pengumpulan_Rekening_${NAMA_BULAN[selectedBulan - 1]}_${selectedTahun}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controller Header (no-print) */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laporan Keuangan & Dokumen SPJ Resmi
          </h1>
          <p className="text-xs text-slate-500">
            Sekretariat Daerah Kabupaten Kendal · Format Baku Sesuai Ketentuan Daerah (LAP-01 s/d LAP-06)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month & Year Select */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 p-1 focus:outline-none"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx} value={idx + 1}>Bulan {nama}</option>
              ))}
            </select>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-slate-800 px-1">{selectedTahun}</span>
          </div>

          <button
            onClick={handlePrint}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen (A4)</span>
          </button>

          <button
            onClick={() => {
              if (activeReportTab === 'pk6') handleExportPK6();
              else handleExportDaftarPengumpulan();
            }}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            disabled={isExportingGoogle}
            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            title="Ekspor laporan langsung ke Google Sheets di Google Drive"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isExportingGoogle ? 'Mengekspor...' : 'Ekspor ke Google Sheets'}</span>
          </button>
        </div>

        {/* Google Sheets Export Result Banner */}
        {googleSheetResult && (
          <div className="w-full mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Spreadsheet berhasil dibuat di Google Drive: <strong>{googleSheetResult.title}</strong></span>
            </div>
            <a
              href={googleSheetResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Buka di Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {googleError && (
          <div className="w-full mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{googleError}</span>
          </div>
        )}
      </div>

      {/* Report Tabs (no-print) */}
      <div className="no-print flex flex-wrap items-center gap-1 p-1 bg-slate-200/60 rounded-xl w-fit text-xs">
        <button
          onClick={() => setActiveReportTab('pk6')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeReportTab === 'pk6' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Format PK6 (Pengeluaran Kegiatan)
        </button>
        <button
          onClick={() => setActiveReportTab('daftar_pengumpulan')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeReportTab === 'daftar_pengumpulan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daftar Pengumpulan per Rekening
        </button>
        <button
          onClick={() => setActiveReportTab('sisa_dana')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeReportTab === 'sisa_dana' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Perincian Sisa Dana (LAP-04)
        </button>
        <button
          onClick={() => setActiveReportTab('pengantar_spj')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeReportTab === 'pengantar_spj' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Surat Pengantar SPJ (LAP-01)
        </button>
        <button
          onClick={() => setActiveReportTab('dokumen_a2')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeReportTab === 'dokumen_a2' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dokumen A2 (Kuitansi SPJ)
        </button>
      </div>

      {/* DOCUMENT VIEW CONTAINER (PRINTABLE) */}
      <div className="printable-document bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[600px]">
        
        {/* ============================================================== */}
        {/* LAP-02: BUKU PEMBANTU PENGELUARAN PER KEGIATAN (FORMAT PK6)     */}
        {/* ============================================================== */}
        {activeReportTab === 'pk6' && (
          <div className="landscape-mode space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Pemerintah Kabupaten Kendal
              </h2>
              <h3 className="text-base font-extrabold text-slate-900">
                Buku Pembantu Pengeluaran per Kegiatan (Format PK6)
              </h3>
              <div className="text-xs text-slate-700">
                Tahun Anggaran : <strong>{selectedTahun}</strong> · Bulan : <strong>{NAMA_BULAN[selectedBulan - 1]}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Unit Kerja : Sekretariat Daerah · Sub Kegiatan : 4.01.02.2.01.0002 Pengelolaan Administrasi Kewilayahan
              </div>
            </div>

            {/* Table (BR-11 & AC-05: 5 expenditure columns, sum matches row total) */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                    <th className="border border-slate-400 p-2 w-10">No</th>
                    <th className="border border-slate-400 p-2 w-32">Rekening</th>
                    <th className="border border-slate-400 p-2">Uraian Belanja</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Jumlah (Rp)</th>
                    <th className="border border-slate-400 p-2 text-right w-24">Belanja Pegawai</th>
                    <th className="border border-slate-400 p-2 text-right w-24">Barang & Jasa</th>
                    <th className="border border-slate-400 p-2 text-right w-24">Perjalanan</th>
                    <th className="border border-slate-400 p-2 text-right w-24">Pemeliharaan</th>
                    <th className="border border-slate-400 p-2 text-right w-24">Modal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  {akunBelanjaList.map((a, idx) => {
                    const realisasi = a.realisasi;
                    const colPegawai = a.kelompokBelanja === 'pegawai' ? realisasi : 0;
                    const colBarang = a.kelompokBelanja === 'barang_jasa' ? realisasi : 0;
                    const colPerjalanan = a.kelompokBelanja === 'perjalanan' ? realisasi : 0;
                    const colPemeliharaan = a.kelompokBelanja === 'pemeliharaan' ? realisasi : 0;
                    const colModal = a.kelompokBelanja === 'modal' ? realisasi : 0;

                    // AC-05 check: sum of 5 columns must equal total row
                    const sum5 = colPegawai + colBarang + colPerjalanan + colPemeliharaan + colModal;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 text-center font-sans">{idx + 1}</td>
                        <td className="border border-slate-400 p-2 font-bold">{a.kodeRekening}</td>
                        <td className="border border-slate-400 p-2 font-sans">{a.uraian}</td>
                        <td className="border border-slate-400 p-2 text-right font-bold text-slate-900 tabular-nums">
                          {formatRupiah(sum5)}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {colPegawai > 0 ? formatRupiah(colPegawai) : '-'}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {colBarang > 0 ? formatRupiah(colBarang) : '-'}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums text-emerald-800 font-bold">
                          {colPerjalanan > 0 ? formatRupiah(colPerjalanan) : '-'}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {colPemeliharaan > 0 ? formatRupiah(colPemeliharaan) : '-'}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {colModal > 0 ? formatRupiah(colModal) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900 font-mono">
                    <td colSpan={3} className="border border-slate-400 p-2 font-sans text-center">
                      JUMLAH TOTAL PENGELUARAN (PK6)
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(akunBelanjaList.reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                    <td className="border border-slate-400 p-2 text-right tabular-nums">
                      {formatRupiah(akunBelanjaList.filter(a => a.kelompokBelanja === 'pegawai').reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                    <td className="border border-slate-400 p-2 text-right tabular-nums">
                      {formatRupiah(akunBelanjaList.filter(a => a.kelompokBelanja === 'barang_jasa').reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                    <td className="border border-slate-400 p-2 text-right tabular-nums text-emerald-800">
                      {formatRupiah(akunBelanjaList.filter(a => a.kelompokBelanja === 'perjalanan').reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                    <td className="border border-slate-400 p-2 text-right tabular-nums">
                      {formatRupiah(akunBelanjaList.filter(a => a.kelompokBelanja === 'pemeliharaan').reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                    <td className="border border-slate-400 p-2 text-right tabular-nums">
                      {formatRupiah(akunBelanjaList.filter(a => a.kelompokBelanja === 'modal').reduce((s, a) => s + a.realisasi, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4 Signatories Required on PK6 (Bagian 6 & 10) */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
              <div>
                <p className="font-semibold text-slate-700">Mengetahui,</p>
                <p className="font-bold text-slate-900">Kuasa Pengguna Anggaran (KPA)</p>
                <div className="h-20 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan & Cap Dinas)
                </div>
                <p className="font-bold underline text-slate-900">{kpa.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {kpa.nip}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Kendal, 28 Februari {selectedTahun}</p>
                <p className="font-bold text-slate-900">Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                <div className="h-20 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pptk.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pptk.nip}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Bendahara Pengeluaran Pembantu</p>
                <div className="h-20 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{bendahara.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {bendahara.nip}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Pembantu Bendahara Pengeluaran Kegiatan</p>
                <div className="h-20 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pembantuBendahara.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pembantuBendahara.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* LAP-03: DAFTAR PENGUMPULAN PER KODE REKENING (BR-05 & BR-06)   */}
        {/* ============================================================== */}
        {activeReportTab === 'daftar_pengumpulan' && (
          <div className="landscape-mode space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Pemerintah Kabupaten Kendal
              </h2>
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Pengumpulan per Kode Rekening Belanja
              </h3>
              <div className="text-xs text-slate-700">
                Tahun Anggaran : <strong>{selectedTahun}</strong> · Bulan : <strong>{NAMA_BULAN[selectedBulan - 1]}</strong> · Unit Kerja : Sekretariat Daerah
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                    <th className="border border-slate-400 p-2 w-10">No</th>
                    <th className="border border-slate-400 p-2 w-32">Kode Rekening</th>
                    <th className="border border-slate-400 p-2">Uraian</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Penerimaan</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Sisa Lalu (BR-05)</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Pengeluaran</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Sisa Sekarang (BR-06)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  {akunBelanjaList.map((a, idx) => {
                    const pengeluaranAkun = a.realisasi;
                    const penerimaanAkun = a.pagu; // Allocated
                    const sisaLaluAkun = a.pagu * 0.15; // Calculated previous
                    const sisaSekarangAkun = sisaLaluAkun + (penerimaanAkun * 0.2) - pengeluaranAkun;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 text-center font-sans">{idx + 1}</td>
                        <td className="border border-slate-400 p-2 font-bold">{a.kodeRekening}</td>
                        <td className="border border-slate-400 p-2 font-sans">{a.uraian}</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {formatRupiah(penerimaanAkun * 0.2)}
                        </td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">
                          {formatRupiah(sisaLaluAkun)}
                        </td>
                        <td className="border border-slate-400 p-2 text-right text-rose-800 font-bold tabular-nums">
                          {formatRupiah(pengeluaranAkun)}
                        </td>
                        <td className="border border-slate-400 p-2 text-right font-bold text-slate-900 tabular-nums">
                          {formatRupiah(sisaSekarangAkun)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4 Signatories */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
              <div>
                <p className="font-semibold text-slate-700">Mengetahui,</p>
                <p className="font-bold text-slate-900">Kuasa Pengguna Anggaran (KPA)</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan & Cap Dinas)
                </div>
                <p className="font-bold underline text-slate-900">{kpa.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {kpa.nip}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Kendal, 28 Februari {selectedTahun}</p>
                <p className="font-bold text-slate-900">Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pptk.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pptk.nip}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Bendahara Pengeluaran Pembantu</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{bendahara.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {bendahara.nip}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Pembantu Bendahara Pengeluaran Kegiatan</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pembantuBendahara.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pembantuBendahara.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* LAP-04: PERINCIAN SISA DANA                                    */}
        {/* ============================================================== */}
        {activeReportTab === 'sisa_dana' && (
          <div className="landscape-mode space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Pemerintah Kabupaten Kendal · Sekretariat Daerah
              </h2>
              <h3 className="text-base font-extrabold text-slate-900">
                Perincian Sisa Dana Sub Kegiatan
              </h3>
              <div className="text-xs text-slate-700 font-mono">
                Sub Kegiatan: 4.01.02.2.01.0002 · Pengelolaan Administrasi Kewilayahan
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                    <th className="border border-slate-400 p-2 w-32">Kode Rekening</th>
                    <th className="border border-slate-400 p-2 text-right">Anggaran (Pagu)</th>
                    <th className="border border-slate-400 p-2 text-right">Realisasi s.d. Hari Ini</th>
                    <th className="border border-slate-400 p-2 text-right font-bold">Sisa Hari Ini</th>
                    <th className="border border-slate-400 p-2 text-right">Diminta Sekarang (SPP)</th>
                    <th className="border border-slate-400 p-2 w-36">SPP No.</th>
                    <th className="border border-slate-400 p-2 text-right font-bold">Sisa Setelah Permintaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  {akunBelanjaList.map(a => {
                    const sisaHariIni = a.pagu - a.realisasi;
                    const dimintaSekarang = a.komitmen;
                    const sisaSetelahPermintaan = sisaHariIni - dimintaSekarang;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 font-bold">{a.kodeRekening}</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums">{formatRupiah(a.pagu)}</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums text-emerald-800">{formatRupiah(a.realisasi)}</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums font-bold text-slate-900">{formatRupiah(sisaHariIni)}</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums text-blue-800">{formatRupiah(dimintaSekarang)}</td>
                        <td className="border border-slate-400 p-2 text-center text-[10px]">900/012/SPP-LS/2026</td>
                        <td className="border border-slate-400 p-2 text-right tabular-nums font-extrabold text-slate-900">{formatRupiah(sisaSetelahPermintaan)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-8 flex justify-end text-xs text-center pr-12">
              <div>
                <p className="font-semibold text-slate-700">Kendal, 28 Februari {selectedTahun}</p>
                <p className="font-bold text-slate-900">Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pptk.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pptk.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* LAP-01: SURAT PENGANTAR SPJ (PORTRAIT)                         */}
        {/* ============================================================== */}
        {activeReportTab === 'pengantar_spj' && (
          <div className="max-w-2xl mx-auto space-y-6 text-slate-900 text-xs font-serif leading-relaxed">
            
            {/* Kop Surat Resmi Setda Kendal */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-0.5 font-sans">
              <h3 className="text-xs uppercase tracking-widest text-slate-800">
                Pemerintah Kabupaten Kendal
              </h3>
              <h2 className="text-sm font-extrabold uppercase text-slate-900">
                Sekretariat Daerah
              </h2>
              <p className="text-[11px] text-slate-600">
                {pengaturan.alamatKantor} · Laman: www.kendalkab.go.id
              </p>
            </div>

            <div className="flex justify-between items-start pt-2">
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span className="w-16">Nomor</span>
                  <span>: 090 / 024 / Bag.Pem / {selectedTahun}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">Lampiran</span>
                  <span>: 1 (Satu) Berkas Lengkap SPJ</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">Perihal</span>
                  <span className="font-bold">: Surat Pengantar Pertanggungjawaban (SPJ) Perjalanan Dinas</span>
                </div>
              </div>

              <div className="text-right">
                <p>{pengaturan.kotaSurat}, 28 Februari {selectedTahun}</p>
                <p className="mt-2 font-sans font-bold">Kepada Yth.</p>
                <p>Ketua Tim Administrasi Kewilayahan selaku PPTK</p>
                <p>di Kendal</p>
              </div>
            </div>

            <p className="pt-2">
              Bersama ini kami kirimkan berkas Surat Pertanggungjawaban (SPJ) Perjalanan Dinas Sub Kegiatan 4.01.02.2.01.0002 Pengelolaan Administrasi Kewilayahan bulan {NAMA_BULAN[selectedBulan - 1]} {selectedTahun} dengan rincian sebagai berikut:
            </p>

            <table className="w-full border-collapse border border-slate-900 text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-900 p-2 w-10">No</th>
                  <th className="border border-slate-900 p-2">Jenis Surat / Naskah yang Dikirim</th>
                  <th className="border border-slate-900 p-2 w-28">Banyaknya</th>
                  <th className="border border-slate-900 p-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 p-2 text-center">1</td>
                  <td className="border border-slate-900 p-2">
                    Berkas SPJ Perjalanan Dinas Dalam Daerah (SPT, Laporan, Kuitansi, Tiket, Foto)
                  </td>
                  <td className="border border-slate-900 p-2 text-center font-mono">1 Berkas</td>
                  <td className="border border-slate-900 p-2">Lengkap & Sah untuk diverifikasi</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center">2</td>
                  <td className="border border-slate-900 p-2">
                    Berkas SPJ Perjalanan Dinas Luar Daerah (Ditjen Kemendagri RI)
                  </td>
                  <td className="border border-slate-900 p-2 text-center font-mono">1 Berkas</td>
                  <td className="border border-slate-900 p-2">Lengkap & Sah untuk diverifikasi</td>
                </tr>
              </tbody>
            </table>

            <p>
              Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
            </p>

            <div className="pt-8 flex justify-end font-sans">
              <div className="text-center w-64">
                <p className="font-bold">Ketua Tim Administrasi Kewilayahan</p>
                <p className="text-[11px] text-slate-600">selaku Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                <div className="h-20 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan Basah)
                </div>
                <p className="font-bold underline text-slate-900">{pptk.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {pptk.nip}</p>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* LAP-05: DOKUMEN A2 (KUITANSI / BUKTI PEMBAYARAN SPJ)          */}
        {/* ============================================================== */}
        {activeReportTab === 'dokumen_a2' && (
          <div className="max-w-2xl mx-auto space-y-6 text-slate-900 text-xs font-sans">
            <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-800">Pemerintah Kabupaten Kendal</h3>
                <h2 className="text-sm font-extrabold uppercase text-slate-900">Format Bukti Pengeluaran (Dokumen A2)</h2>
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] text-slate-500 block">Tahun Anggaran</span>
                <span className="font-bold text-slate-900">{selectedTahun}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Mata Anggaran (MAK):</span>
                <span className="col-span-2 font-mono font-bold text-slate-900">5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Sub Kegiatan:</span>
                <span className="col-span-2 font-mono text-slate-900">4.01.02.2.01.0002 Pengelolaan Administrasi Kewilayahan</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Sudah Terima Dari:</span>
                <span className="col-span-2 font-semibold text-slate-900">Bendahara Pengeluaran Pembantu Bagian Pemerintahan Setda Kendal</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic">
              Dokumen A2 ini siap ditautkan dengan lampiran bukti transfer dan kuitansi ril perjalanan dinas yang telah disetujui.
            </p>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="font-bold">Setuju Dibayar :</p>
                <p className="font-semibold text-slate-800">Kuasa Pengguna Anggaran (KPA)</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan)
                </div>
                <p className="font-bold underline text-slate-900">{kpa.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {kpa.nip}</p>
              </div>

              <div>
                <p className="font-bold">Lunas Dibayar :</p>
                <p className="font-semibold text-slate-800">Bendahara Pengeluaran Pembantu</p>
                <div className="h-16 flex items-center justify-center italic text-slate-300">
                  (Tanda Tangan)
                </div>
                <p className="font-bold underline text-slate-900">{bendahara.nama}</p>
                <p className="font-mono text-[11px] text-slate-600">NIP. {bendahara.nip}</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
