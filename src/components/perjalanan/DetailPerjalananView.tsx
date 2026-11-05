import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PerjalananDinas, BerkasLampiran, StatusPerjalanan } from '../../types';
import { formatRupiah, formatTanggalIndo, formatTanggalWaktu } from '../../utils/formatters';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  FileCode, 
  ShieldCheck,
  Send,
  Eye,
  RotateCcw,
  Receipt,
  FileCheck2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { uploadFileToDrive } from '../../services/googleDriveService';
import { getGoogleAccessToken } from '../../services/googleAuth';

interface DetailPerjalananViewProps {
  perjalanan: PerjalananDinas;
  onBack: () => void;
  onOpenPrintModal: (docType: 'spt' | 'laporan' | 'rincian_biaya', p: PerjalananDinas) => void;
}

export const DetailPerjalananView: React.FC<DetailPerjalananViewProps> = ({
  perjalanan,
  onBack,
  onOpenPrintModal,
}) => {
  const { 
    currentUser, 
    setujuiAtasan, 
    tolakAtasan, 
    batalkanPerjalanan, 
    verifikasiOperator, 
    verifikasiBendahara, 
    selesaikanPerjalanan,
    updateLaporanKegiatan,
    tambahBerkasPerjalanan,
    hapusBerkasPerjalanan,
    revisiPerjalanan,
    pengaturan
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'peserta' | 'berkas' | 'laporan' | 'verifikasi' | 'riwayat'>('info');

  // Input states for actions
  const [catatanAction, setCatatanAction] = useState('');
  const [alasanBatal, setAlasanBatal] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Bendahara verification inputs
  const [realisasiInputs, setRealisasiInputs] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    perjalanan.peserta.forEach(pst => {
      pst.komponenBiaya.forEach(k => {
        initialMap[k.id] = k.nominalRealisasi || k.nominalEstimasi;
      });
    });
    return initialMap;
  });

  // Report fields
  const [laporanForm, setLaporanForm] = useState(perjalanan.laporanKegiatan);

  // File upload state (BRK-01 to BRK-04)
  const [uploadJenis, setUploadJenis] = useState<BerkasLampiran['jenis']>('bukti_transaksi');
  const [uploadNamaFile, setUploadNamaFile] = useState('');
  const [uploadKeterangan, setUploadKeterangan] = useState('');
  const [uploadKomponenId, setUploadKomponenId] = useState('');
  const [uploadMockSizeKB, setUploadMockSizeKB] = useState(450);

  // Timeline steps
  const steps: Array<{ statusKey: StatusPerjalanan; label: string; desc: string }> = [
    { statusKey: 'diajukan', label: 'Pengajuan', desc: 'Diajukan ke Atasan' },
    { statusKey: 'disetujui_atasan', label: 'SPT Terbit', desc: 'Komitmen Pagu Aktif' },
    { statusKey: 'menunggu_verifikasi_operator', label: 'Verifikasi Berkas', desc: 'Operator memeriksa' },
    { statusKey: 'menunggu_verifikasi_bendahara', label: 'Verifikasi SPJ', desc: 'Bendahara verifikasi' },
    { statusKey: 'selesai', label: 'Selesai & Arsip', desc: 'Dokumen lengkap' },
  ];

  const getStepState = (stepKey: StatusPerjalanan) => {
    const statusOrder: StatusPerjalanan[] = [
      'diajukan',
      'disetujui_atasan',
      'menunggu_verifikasi_operator',
      'menunggu_verifikasi_bendahara',
      'terverifikasi_bendahara',
      'selesai'
    ];
    
    if (perjalanan.status === 'dibatalkan' || perjalanan.status === 'ditolak_atasan') {
      return 'cancelled';
    }

    const currentIndex = statusOrder.indexOf(perjalanan.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex + 1 === stepIndex) return 'current';
    return 'pending';
  };

  // Handler for Atasan approval (PRJ-04, PRJ-05, AC-03)
  const handleApproveAtasan = () => {
    setActionError('');
    setActionSuccess('');
    const res = setujuiAtasan(perjalanan.id, catatanAction);
    if (res.success) {
      setActionSuccess(res.message);
      setCatatanAction('');
    } else {
      setActionError(res.message);
    }
  };

  const handleRejectAtasan = () => {
    if (!catatanAction.trim()) {
      setActionError('Catatan penolakan wajib diisi untuk memberi tahu pengaju.');
      return;
    }
    const res = tolakAtasan(perjalanan.id, catatanAction);
    if (res.success) {
      setActionSuccess(res.message);
      setCatatanAction('');
    } else {
      setActionError(res.message);
    }
  };

  // Handler for Cancel travel (PRJ-06, BR-12)
  const handleCancelPerjalanan = () => {
    if (!alasanBatal.trim()) {
      setActionError('Alasan pembatalan wajib diisi.');
      return;
    }
    const res = batalkanPerjalanan(perjalanan.id, alasanBatal);
    if (res.success) {
      setActionSuccess(res.message);
      setAlasanBatal('');
    } else {
      setActionError(res.message);
    }
  };

  // Handler for Operator verification (KEU-01)
  const handleOperatorVerify = (isApproved: boolean) => {
    setActionError('');
    setActionSuccess('');
    if (!isApproved && !catatanAction.trim()) {
      setActionError('Catatan pengembalian berkas wajib diisi agar pegawai tahu apa yang harus diperbaiki.');
      return;
    }
    const res = verifikasiOperator(perjalanan.id, isApproved ? 'setuju' : 'kembalikan', catatanAction);
    if (res.success) {
      setActionSuccess(res.message);
      setCatatanAction('');
    } else {
      setActionError(res.message);
    }
  };

  // Handler for Bendahara verification (KEU-02, KEU-03, KEU-04, AC-04)
  const handleBendaharaVerify = () => {
    setActionError('');
    setActionSuccess('');

    const mapForContext: Record<string, { pesertaId: string; komponenId: string; nominal: number }> = {};
    perjalanan.peserta.forEach(pst => {
      pst.komponenBiaya.forEach(k => {
        mapForContext[k.id] = {
          pesertaId: pst.id,
          komponenId: k.id,
          nominal: realisasiInputs[k.id] !== undefined ? realisasiInputs[k.id] : k.nominalEstimasi,
        };
      });
    });

    const res = verifikasiBendahara(perjalanan.id, mapForContext, catatanAction);
    if (res.success) {
      setActionSuccess(res.message);
      setCatatanAction('');
    } else {
      setActionError(res.message);
    }
  };

  // Handler for Selesaikan Perjalanan (BR-10 & AC-10)
  const handleFinishPerjalanan = () => {
    setActionError('');
    setActionSuccess('');
    const res = selesaikanPerjalanan(perjalanan.id);
    if (res.success) {
      setActionSuccess(res.message);
    } else {
      setActionError(res.message);
    }
  };

  // Handler for File Upload (BRK-01 to BRK-04)
  const handleUploadFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadNamaFile.trim()) {
      setActionError('Nama file lampiran wajib diisi.');
      return;
    }

    const ext = uploadNamaFile.split('.').pop()?.toLowerCase();
    const tipeFile: 'pdf' | 'jpg' | 'png' = (ext === 'png' || ext === 'jpg') ? ext : 'pdf';

    const res = tambahBerkasPerjalanan(perjalanan.id, {
      jenis: uploadJenis,
      namaFile: uploadNamaFile,
      tipeFile,
      ukuranKB: uploadMockSizeKB,
      keterangan: uploadKeterangan || 'Lampiran pendukung perjalanan dinas',
      komponenBiayaId: uploadKomponenId || undefined,
    });

    if (res.success) {
      setActionSuccess(res.message);
      setUploadNamaFile('');
      setUploadKeterangan('');
      setUploadKomponenId('');
    } else {
      setActionError(res.message);
    }
  };

  // Handler for Save Report (DOK-02)
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    updateLaporanKegiatan(perjalanan.id, laporanForm);
    setActionSuccess('Laporan hasil kegiatan berhasil diperbarui dan siap dicetak.');
  };

  // Check if current user has permission to approve/verify
  const canAtasanAction = currentUser.role === 'atasan' || currentUser.role === 'admin';
  const canOperatorAction = currentUser.role === 'operator' || currentUser.role === 'admin';
  const canBendaharaAction = currentUser.role === 'bendahara' || currentUser.role === 'admin';
  const canPegawaiUpload = (currentUser.role === 'pegawai' && perjalanan.pegawaiPengajuId === currentUser.id) || 
                           currentUser.role === 'operator' || 
                           currentUser.role === 'admin';

  const handleSaveAttachmentToDrive = async (b: BerkasLampiran) => {
    const token = await getGoogleAccessToken();
    if (!token) {
      setActionError('Akun Google belum terhubung. Silakan buka menu "Google Drive & Sheets" di sidebar untuk menghubungkan akun Google Anda.');
      return;
    }
    try {
      const summaryText = `Dokumen Perjalanan Dinas e-Perjadin Kendal\nNomor SPT: ${perjalanan.nomorSPT || '-'}\nMaksud: ${perjalanan.maksudPerjalanan}\nKota Tujuan: ${perjalanan.kotaTujuan}\nBerkas: ${b.namaFile} (${b.ukuranKB} KB)\nKeterangan: ${b.keterangan}\nDiunggah oleh: ${b.diunggahOleh}\nTanggal: ${b.diunggahPada}`;
      await uploadFileToDrive(b.namaFile, summaryText, 'text/plain');
      setActionSuccess(`Berkas "${b.namaFile}" berhasil dicadangkan ke Google Drive!`);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan berkas ke Google Drive.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Action Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 font-mono text-sm">
                {perjalanan.nomorSPT || 'Pengajuan Belum Diterbitkan SPT'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[11px]">
                {perjalanan.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kode QR Verifikasi: <strong className="font-mono text-slate-800">{perjalanan.kodeVerifikasiQR}</strong> · Versi Dokumen: {perjalanan.versiTemplateDipakai}
            </p>
          </div>
        </div>

        {/* Print Buttons (DOK-01, DOK-02, DOK-03) */}
        <div className="flex flex-wrap items-center gap-2">
          {perjalanan.nomorSPT && (
            <button
              onClick={() => onOpenPrintModal('spt', perjalanan)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak SPT</span>
            </button>
          )}

          <button
            onClick={() => onOpenPrintModal('laporan', perjalanan)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>

          <button
            onClick={() => onOpenPrintModal('rincian_biaya', perjalanan)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kuitansi & Rincian</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Tutup
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-700 hover:text-rose-900 text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* PRJ-07: Status Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Lini Masa Alur Berkas Perjalanan Dinas (PRJ-07)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((s, idx) => {
            const state = getStepState(s.statusKey);
            return (
              <div 
                key={s.statusKey}
                className={`p-3 rounded-lg border text-xs relative ${
                  state === 'completed'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : state === 'current'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono">Tahap {idx + 1}</span>
                  {state === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="font-bold">{s.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-Tabs Navigation (Segmented Controls) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit text-xs">
        <button
          onClick={() => setActiveSubTab('info')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSubTab === 'info' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Informasi & SPT
        </button>
        <button
          onClick={() => setActiveSubTab('peserta')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSubTab === 'peserta' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Peserta & Biaya ({perjalanan.peserta.length})
        </button>
        <button
          onClick={() => setActiveSubTab('berkas')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            activeSubTab === 'berkas' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Berkas & Foto</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full">
            {perjalanan.berkas.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('laporan')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSubTab === 'laporan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Laporan Kegiatan
        </button>
        <button
          onClick={() => setActiveSubTab('verifikasi')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            activeSubTab === 'verifikasi' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Aksi & Verifikasi</span>
          {perjalanan.status.includes('menunggu') && (
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSubTab === 'riwayat' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Riwayat ({perjalanan.riwayatStatus.length})
        </button>
      </div>

      {/* Tab 1: Informasi & SPT */}
      {activeSubTab === 'info' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Maksud Perjalanan Dinas</span>
                <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
                  {perjalanan.maksudPerjalanan}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Kota / Wilayah Tujuan</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{perjalanan.kotaTujuan}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400 block">Moda Transportasi</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {perjalanan.alatTransportasi}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-medium text-slate-400 block">Lokasi Spesifik Tujuan</span>
                <p className="text-xs text-slate-700 mt-1">
                  {perjalanan.tempatTujuanDetail}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Tanggal Berangkat - Kembali</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTanggalIndo(perjalanan.tanggalBerangkat)} s.d. {formatTanggalIndo(perjalanan.tanggalKembali)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400 block">Lama Pelaksanaan</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {perjalanan.lamaHari} Hari Kerja ({perjalanan.lamaMalam} Malam)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Nomor & Tanggal SPT</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-1">
                  {perjalanan.nomorSPT || 'Menunggu Persetujuan Atasan'}
                </p>
                {perjalanan.tanggalSPT && (
                  <span className="text-xs text-slate-500">
                    Diterbitkan pada: {formatTanggalIndo(perjalanan.tanggalSPT)}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block">Pegawai Pengaju</span>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {perjalanan.pegawaiPengajuNama}
                </p>
                <span className="text-[11px] text-slate-500 font-mono">
                  NIP. {perjalanan.pegawaiPengajuNip}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Estimasi (Komitmen):</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(perjalanan.totalEstimasi)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Realisasi SPJ:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatRupiah(perjalanan.totalRealisasi)}</span>
                </div>
                {perjalanan.totalUangMuka > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Uang Muka Diterima:</span>
                    <span className="font-mono font-semibold text-slate-800">{formatRupiah(perjalanan.totalUangMuka)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Peserta & Biaya (PRJ-03, DOK-03) */}
      {activeSubTab === 'peserta' && (
        <div className="space-y-4">
          {perjalanan.peserta.map((pst, idx) => (
            <div key={pst.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{idx + 1}. {pst.nama}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600">{pst.golongan}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    NIP. {pst.nip} · {pst.jabatan}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Biaya Peserta</div>
                  <div className="text-sm font-bold font-mono text-emerald-800 tabular-nums">
                    {formatRupiah(perjalanan.status === 'selesai' || perjalanan.status === 'terverifikasi_bendahara' ? pst.totalRealisasi : pst.totalEstimasi)}
                  </div>
                </div>
              </div>

              {/* Komponen Biaya Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold text-left">
                      <th className="py-2 pr-3">No</th>
                      <th className="py-2 pr-3">Uraian Komponen</th>
                      <th className="py-2 pr-3">Kategori</th>
                      <th className="py-2 pr-3 text-right">Estimasi (SBU)</th>
                      <th className="py-2 pl-3 text-right">Realisasi Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pst.komponenBiaya.map((k, kIdx) => (
                      <tr key={k.id}>
                        <td className="py-2.5 pr-3 text-slate-400">{kIdx + 1}</td>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">{k.uraian}</td>
                        <td className="py-2.5 pr-3 text-slate-500 capitalize">{k.jenis.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 pr-3 text-right font-mono text-slate-700 tabular-nums">
                          {formatRupiah(k.nominalEstimasi)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                          {formatRupiah(k.nominalRealisasi || k.nominalEstimasi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Berkas & Lampiran (BRK-01 to BRK-06) */}
      {activeSubTab === 'berkas' && (
        <div className="space-y-6">
          
          {/* Upload Form */}
          {canPegawaiUpload && perjalanan.status !== 'selesai' && perjalanan.status !== 'dibatalkan' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Unggah Berkas Bukti & Dokumentasi (BRK-01)</span>
              </h3>

              <form onSubmit={handleUploadFileSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jenis Berkas *
                  </label>
                  <select
                    value={uploadJenis}
                    onChange={e => setUploadJenis(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="spt_bertandatangan">Scan SPT Bertanda Tangan</option>
                    <option value="bukti_transaksi">Bukti Transaksi (Kuitansi/Tiket/Bill)</option>
                    <option value="foto_kegiatan">Foto Dokumentasi Kegiatan</option>
                    <option value="laporan_bertandatangan">Scan Laporan Bertanda Tangan</option>
                    <option value="arsip_final">Arsip Final SPJ Lengkap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama File (PDF / JPG / PNG) *
                  </label>
                  <input
                    type="text"
                    value={uploadNamaFile}
                    onChange={e => setUploadNamaFile(e.target.value)}
                    placeholder="Contoh: Tiket_Kereta_Kendal_Semarang.pdf"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Keterangan Bukti *
                  </label>
                  <input
                    type="text"
                    value={uploadKeterangan}
                    onChange={e => setUploadKeterangan(e.target.value)}
                    placeholder="Contoh: Kuitansi Hotel Grasia 2 Malam"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Berkas</span>
                  </button>
                </div>
              </form>
              <div className="text-[11px] text-slate-500">
                Format didukung: PDF, JPG, PNG. Batas ukuran: {pengaturan.maxUploadMB} MB (BRK-02).
              </div>
            </div>
          )}

          {/* List of uploaded files */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Berkas Terunggah ({perjalanan.berkas.length})
              </h3>
              <span className="text-xs text-slate-500">
                Wajib untuk verifikasi Operator & Penyelesaian SPJ (BR-10 & AC-10)
              </span>
            </div>

            {perjalanan.berkas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada berkas yang diunggah. Silakan unggah scan SPT, kuitansi, atau foto dokumentasi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {perjalanan.berkas.map(b => (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900">{b.namaFile}</strong>
                          <span className="text-[10px] text-slate-500 uppercase font-mono px-1 bg-slate-100 rounded">
                            {b.tipeFile} · {b.ukuranKB} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{b.keterangan}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Diunggah oleh: {b.diunggahOleh} pada {formatTanggalWaktu(b.diunggahPada)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveAttachmentToDrive(b)}
                        className="px-2.5 py-1.5 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Cadangkan Berkas ke Google Drive"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Ke Drive</span>
                      </button>

                      <button
                        onClick={() => setActionSuccess(`Pratinjau Berkas: ${b.namaFile} (${b.ukuranKB} KB) · Keterangan: ${b.keterangan}`)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Pratinjau Berkas"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>

                      {canPegawaiUpload && perjalanan.status !== 'selesai' && (
                        <button
                          onClick={() => {
                            hapusBerkasPerjalanan(perjalanan.id, b.id);
                            setActionSuccess(`Berkas ${b.namaFile} berhasil dihapus.`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 4: Laporan Kegiatan (DOK-02) */}
      {activeSubTab === 'laporan' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Penyusunan Laporan Hasil Pelaksanaan Tugas (DOK-02)
              </h3>
              <p className="text-xs text-slate-500">
                Format baku laporan perjalanan dinas Pemerintah Kabupaten Kendal
              </p>
            </div>
            <button
              onClick={() => onOpenPrintModal('laporan', perjalanan)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau & Cetak Laporan</span>
            </button>
          </div>

          <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                I. Dasar Pelaksanaan Tugas
              </label>
              <input
                type="text"
                value={laporanForm.dasarPelaksanaan}
                onChange={e => setLaporanForm({ ...laporanForm, dasarPelaksanaan: e.target.value })}
                placeholder="Nomor SPT dan Dasar DPA..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                II. Maksud dan Tujuan Perjalanan
              </label>
              <textarea
                rows={2}
                value={laporanForm.maksudTujuan}
                onChange={e => setLaporanForm({ ...laporanForm, maksudTujuan: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                III. Waktu dan Tempat Pelaksanaan
              </label>
              <input
                type="text"
                value={laporanForm.waktuDanTempat}
                onChange={e => setLaporanForm({ ...laporanForm, waktuDanTempat: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IV. Uraian Jalannya Kegiatan *
              </label>
              <textarea
                rows={4}
                value={laporanForm.uraianKegiatan}
                onChange={e => setLaporanForm({ ...laporanForm, uraianKegiatan: e.target.value })}
                placeholder="Uraikan jalannya koordinasi, pihak yang ditemui, agenda diskusi..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                V. Hasil yang Dicapai *
              </label>
              <textarea
                rows={3}
                value={laporanForm.hasilKegiatan}
                onChange={e => setLaporanForm({ ...laporanForm, hasilKegiatan: e.target.value })}
                placeholder="Rangkuman hasil, kesepakatan, dokumen yang diserahkan/diterima..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                VI. Kesimpulan dan Tindak Lanjut
              </label>
              <textarea
                rows={2}
                value={laporanForm.kesimpulanTindakLanjut}
                onChange={e => setLaporanForm({ ...laporanForm, kesimpulanTindakLanjut: e.target.value })}
                placeholder="Langkah berikutnya yang perlu dilakukan oleh tim..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                VII. Penutup
              </label>
              <input
                type="text"
                value={laporanForm.penutup || 'Demikian laporan hasil pelaksanaan tugas perjalanan dinas ini disampaikan sebagai bahan pertanggungjawaban.'}
                onChange={e => setLaporanForm({ ...laporanForm, penutup: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Simpan Laporan Hasil Kegiatan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Aksi & Verifikasi (PRJ-04, KEU-01, KEU-02, KEU-03, BR-10, AC-10) */}
      {activeSubTab === 'verifikasi' && (
        <div className="space-y-6">
          
          {/* Action 1: Persetujuan Atasan (KPA) */}
          {perjalanan.status === 'diajukan' && (
            <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Persetujuan Atasan / KPA (Penerbitan Nomor SPT)</span>
              </div>
              <p className="text-xs text-slate-600">
                Jika disetujui, nomor SPT resmi akan terbit otomatis dan membentuk komitmen anggaran pada akun terkait (Aturan PRJ-05 & AC-03).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Atasan (Opsional / Wajib jika menolak):
                </label>
                <input
                  type="text"
                  value={catatanAction}
                  onChange={e => setCatatanAction(e.target.value)}
                  placeholder="Contoh: Disetujui. Laksanakan koordinasi teknis dengan tertib."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              {canAtasanAction ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApproveAtasan}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Setujui Pengajuan & Terbitkan SPT</span>
                  </button>
                  <button
                    onClick={handleRejectAtasan}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Pengajuan</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200">
                  Peran aktif Anda ({currentUser.role}) bukan Atasan/KPA. Silakan gunakan menu simulasi peran di pojok kanan atas untuk beralih ke peran <strong>Atasan / KPA</strong>.
                </div>
              )}
            </div>
          )}

          {/* Action 2: Pengajuan ke Operator setelah berkas diunggah */}
          {perjalanan.status === 'disetujui_atasan' && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Pengajuan Berkas SPJ ke Operator
              </h4>
              <p className="text-xs text-slate-600">
                SPT telah terbit ({perjalanan.nomorSPT}). Setelah perjalanan selesai dilaksanakan dan bukti diunggah ({perjalanan.berkas.length} berkas), klik tombol di bawah untuk mengajukan verifikasi ke Operator Unit.
              </p>
              <button
                onClick={() => {
                  verifikasiOperator(perjalanan.id, 'setuju', 'Diajukan oleh pelaksana tugas');
                  setActionSuccess('Berkas berhasil diteruskan ke antrean Operator.');
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Berkas ke Operator untuk Diverifikasi</span>
              </button>
            </div>
          )}

          {/* Action 3: Verifikasi Operator (KEU-01) */}
          {perjalanan.status === 'menunggu_verifikasi_operator' && (
            <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <FileCheck2 className="w-4 h-4 text-amber-700" />
                <span>Pemeriksaan Kelengkapan Berkas oleh Operator (KEU-01)</span>
              </div>
              <p className="text-xs text-slate-600">
                Periksa kelengkapan tiket, kuitansi hotel, scan SPT, foto kegiatan, dan laporan. Jika belum lengkap, kembalikan dengan catatan perbaikan.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pemeriksaan Operator:
                </label>
                <input
                  type="text"
                  value={catatanAction}
                  onChange={e => setCatatanAction(e.target.value)}
                  placeholder="Contoh: Berkas lengkap dan sesuai standar SPJ."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              {canOperatorAction ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOperatorVerify(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Berkas Lengkap & Teruskan ke Bendahara</span>
                  </button>
                  <button
                    onClick={() => handleOperatorVerify(false)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Kembalikan ke Pegawai (Perlu Perbaikan)</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200">
                  Ganti peran ke <strong>Operator</strong> melalui menu di pojok kanan atas untuk memproses verifikasi berkas.
                </div>
              )}
            </div>
          )}

          {/* Action 4: Verifikasi Bendahara & Entri Kas (KEU-02, KEU-03, KEU-04, AC-04) */}
          {perjalanan.status === 'menunggu_verifikasi_bendahara' && (
            <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-indigo-700" />
                <span>Verifikasi Bukti Keuangan oleh Bendahara (KEU-02, KEU-03, AC-04)</span>
              </div>
              <p className="text-xs text-slate-600">
                Cocokkan nominal bukti kuitansi riil dengan input estimasi. Saat diverifikasi, sistem akan:
                <br />1. Mengubah komitmen menjadi realisasi pada akun belanja terkait.
                <br />2. Otomatis mencatat pengeluaran sah pada Buku Kas Umum (BKU).
              </p>

              {/* Editable realisasi inputs per participant */}
              <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <h5 className="text-xs font-bold text-slate-900">Konfirmasi Nominal Realisasi Komponen:</h5>
                {perjalanan.peserta.map(pst => (
                  <div key={pst.id} className="space-y-2">
                    <span className="text-xs font-semibold text-slate-800">{pst.nama} ({pst.golongan}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {pst.komponenBiaya.map(k => (
                        <div key={k.id} className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                          <label className="block text-[11px] text-slate-500 truncate mb-1">
                            {k.uraian}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400">Rp</span>
                            <input
                              type="number"
                              value={realisasiInputs[k.id] ?? k.nominalEstimasi}
                              onChange={e => setRealisasiInputs({
                                ...realisasiInputs,
                                [k.id]: Number(e.target.value) || 0,
                              })}
                              className="w-full text-xs pl-8 pr-2 py-1 rounded border border-slate-300 font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Verifikasi Bendahara:
                </label>
                <input
                  type="text"
                  value={catatanAction}
                  onChange={e => setCatatanAction(e.target.value)}
                  placeholder="Contoh: Bukti transaksi hotel dan transport sah dan terverifikasi."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              {canBendaharaAction ? (
                <button
                  onClick={handleBendaharaVerify}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verifikasi SPJ & Bukukan ke Buku Kas (AC-04)</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200">
                  Ganti peran ke <strong>Bendahara</strong> melalui menu di pojok kanan atas untuk memproses verifikasi keuangan.
                </div>
              )}
            </div>
          )}

          {/* Action 5: Selesaikan Perjalanan (BR-10 & AC-10) */}
          {perjalanan.status === 'terverifikasi_bendahara' && (
            <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Penyelesaian & Pengarsipan Akhir (BR-10 & AC-10)</span>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Ketentuan Sistem (BR-10 & AC-10):</strong> Perjalanan hanya dapat diselesaikan jika scan dokumen bertanda tangan (scan SPT / Laporan / Arsip Final) telah diunggah ke berkas.
              </p>
              <button
                onClick={handleFinishPerjalanan}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Tandai Perjalanan Selesai & Diarsipkan Permanen</span>
              </button>
            </div>
          )}

          {/* Action 6: Pembatalan Perjalanan (PRJ-06 & BR-12) */}
          {perjalanan.status !== 'selesai' && perjalanan.status !== 'dibatalkan' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pembatalan Perjalanan Dinas (BR-12)
              </h4>
              <p className="text-xs text-slate-500">
                Pembatalan akan melepas komitmen anggaran yang telah terikat dan mengembalikannya ke sisa pagu bebas.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alasanBatal}
                  onChange={e => setAlasanBatal(e.target.value)}
                  placeholder="Alasan pembatalan (misal: penundaan jadwal rapat dari kementerian)..."
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-300"
                />
                <button
                  onClick={handleCancelPerjalanan}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batalkan Perjalanan
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 6: Riwayat Status & Revisi (AUD-01 & PRJ-08) */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Riwayat Transisi Status Dokumen (PRJ-07)
            </h3>
            <div className="space-y-3">
              {perjalanan.riwayatStatus.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 capitalize">{h.status.replace(/_/g, ' ')}</strong>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">{formatTanggalWaktu(h.waktu)}</span>
                    </div>
                    <div className="text-slate-600">Oleh: {h.oleh}</div>
                    {h.catatan && <div className="text-slate-500 italic mt-0.5">"{h.catatan}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {perjalanan.riwayatRevisi.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Riwayat Revisi Jadwal & Peserta (PRJ-08)
              </h3>
              <div className="space-y-2 text-xs">
                {perjalanan.riwayatRevisi.map((r, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">{formatTanggalWaktu(r.waktu)} oleh {r.oleh}</div>
                    <div className="text-slate-800 font-medium mt-0.5">{r.deskripsi}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
