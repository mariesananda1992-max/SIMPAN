import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { Receipt, Plus, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const SPPView: React.FC = () => {
  const { currentUser, akunBelanjaList, subKegiatanList, sppList, tambahSPP, pengaturan } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomorSPP, setNomorSPP] = useState(() => {
    const nextSeq = String(pengaturan.nomorSPPSequence + 1).padStart(3, '0');
    return pengaturan.formatNomorSPP.replace('{no}', nextSeq).replace('{tahun}', '2026');
  });
  const [tanggalSPP, setTanggalSPP] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAkunId, setSelectedAkunId] = useState(akunBelanjaList[0]?.id || '');
  const [jumlahDiminta, setJumlahDiminta] = useState<number>(10000000);
  const [keterangan, setKeterangan] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canCreateSPP = currentUser.role === 'bendahara' || currentUser.role === 'admin';

  const selectedAkun = akunBelanjaList.find(a => a.id === selectedAkunId);
  const sisaPagu = selectedAkun ? (selectedAkun.pagu - selectedAkun.realisasi - selectedAkun.komitmen) : 0;

  const handleSubmitSPP = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (jumlahDiminta > sisaPagu) {
      setMessage({
        type: 'error',
        text: `Jumlah SPP yang diminta (${formatRupiah(jumlahDiminta)}) melebihi sisa pagu (${formatRupiah(sisaPagu)})!`,
      });
      return;
    }

    const res = tambahSPP({
      nomorSPP,
      tanggalSPP,
      subKegiatanId: 'sub-1',
      akunBelanjaId: selectedAkunId,
      jumlahDiminta,
      keterangan,
    });

    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setIsModalOpen(false);
      setKeterangan('');
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Surat Permintaan Pembayaran (SPP)
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan pengajuan penerbitan SPP per akun belanja sesuai DPA (KEU-05)
          </p>
        </div>

        {canCreateSPP && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat SPP Baru</span>
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-semibold">Tutup</button>
        </div>
      )}

      {/* SPP Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Register Surat Permintaan Pembayaran (SPP)
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {sppList.length} Berkas SPP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                <th className="py-3 px-4">Nomor SPP</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kode Rekening</th>
                <th className="py-3 px-4">Uraian Akun Belanja</th>
                <th className="py-3 px-4 text-right">Jumlah Diminta (Rp)</th>
                <th className="py-3 px-4 text-right">Sisa Pagu Setelahnya</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sppList.map(spp => (
                <tr key={spp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{spp.nomorSPP}</td>
                  <td className="py-3 px-4 font-sans text-slate-600">{formatTanggalIndo(spp.tanggalSPP)}</td>
                  <td className="py-3 px-4 text-slate-600">{spp.kodeRekening}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-800">{spp.uraianAkun}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800 tabular-nums">
                    {formatRupiah(spp.jumlahDiminta)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                    {formatRupiah(spp.sisaPaguSetelahnya)}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">{spp.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input SPP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Input SPP Baru (KEU-05)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSPP} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor SPP</label>
                <input
                  type="text"
                  value={nomorSPP}
                  onChange={e => setNomorSPP(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal SPP</label>
                <input
                  type="date"
                  value={tanggalSPP}
                  onChange={e => setTanggalSPP(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rekening Belanja yang Diminta</label>
                <select
                  value={selectedAkunId}
                  onChange={e => setSelectedAkunId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                >
                  {akunBelanjaList.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.kodeRekening} - {a.uraian}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Sisa Pagu Tersedia: <strong className="font-mono text-slate-900">{formatRupiah(sisaPagu)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah yang Diminta (Rp)</label>
                <input
                  type="number"
                  value={jumlahDiminta}
                  onChange={e => setJumlahDiminta(Number(e.target.value) || 0)}
                  max={sisaPagu}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan SPP</label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Contoh: Pengajuan SPP-LS Perjalanan Dinas..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Terbitkan SPP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
