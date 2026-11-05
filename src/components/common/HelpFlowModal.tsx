import React from 'react';
import { X, CheckCircle, ArrowRight, ShieldAlert, BookOpen, Layers } from 'lucide-react';

interface HelpFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpFlowModal: React.FC<HelpFlowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Panduan Alur Sistem & Aturan FRD e-Perjadin Kendal</h2>
            <p className="text-xs text-slate-300">Sekretariat Daerah Kabupaten Kendal · Dokumen Kebutuhan Fungsional</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* 8-Step High Level Flow */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              8 Langkah Alur Kerja Tingkat Tinggi (Bagian 3 FRD)
            </h3>
            <ol className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div><strong>Admin / Bendahara</strong> menginput pagu per akun belanja pada DPA sub kegiatan.</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div><strong>Pegawai</strong> mengajukan perjalanan dinas, sistem mengecek sisa pagu secara real-time. Jika melebihi sisa, sistem otomatis menolak (ANG-06).</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div><strong>Atasan (KPA)</strong> menyetujui, sistem otomatis menerbitkan nomor SPT unik berurutan dan membentuk komitmen anggaran (PRJ-05).</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <div>SPT dicetak dan ditandatangani, perjalanan dinas dilaksanakan oleh pegawai/peserta.</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">5</span>
                <div>Pegawai mengunggah bukti transaksi (kuitansi, hotel, tiket, bbm), dokumentasi foto, dan melengkapi laporan hasil kegiatan.</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">6</span>
                <div><strong>Operator</strong> memeriksa kelengkapan berkas, dilanjutkan <strong>Bendahara</strong> memverifikasi nominal bukti sah. Komitmen otomatis berubah menjadi realisasi dan masuk sebagai baris pengeluaran di Buku Kas Umum (KEU-04).</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">7</span>
                <div>Sistem menghasilkan laporan kegiatan, rincian biaya & tanda terima, surat pengantar SPJ, Format PK6, dan Daftar Pengumpulan per Rekening.</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">8</span>
                <div>Dokumen dicetak, ditandatangani basah, dipindai, dan diunggah ulang sebagai arsip final untuk menandai status perjalanan <strong>Selesai</strong> (BR-10 & AC-10).</div>
              </li>
            </ol>
          </div>

          {/* Business Rules Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Aturan Bisnis Kritis (Business Rules BR-01 s/d BR-12)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-01:</strong> Sisa = Pagu - Realisasi - Komitmen.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-02 & AC-02:</strong> Pengajuan tidak boleh melebihi sisa pagu akun yang dibebani.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-03 & AC-01:</strong> Pagu tidak boleh diturunkan di bawah realisasi ditambah komitmen.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-07:</strong> Entri buku kas tidak dihapus, koreksi lewat entri pembalik (storno).
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-08:</strong> Bulan buku kas yang ditutup terkunci kecuali dibuka kembali dengan alasan tercatat.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <strong>BR-10 & AC-10:</strong> Status Selesai hanya jika dokumen bertanda tangan sudah diunggah.
              </div>
            </div>
          </div>

          {/* Quick Simulation Tip */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
            <strong>Tips Pengujian Cepat:</strong> Gunakan menu <strong>Simulasi Peran</strong> di pojok kanan atas untuk beralih secara instan antara peran Pegawai (mengajukan), Atasan (menyetujui & terbit SPT), Operator (cek berkas), Bendahara (verifikasi keuangan & buku kas), dan Admin.
          </div>

        </div>

        <div className="px-6 py-3 bg-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
