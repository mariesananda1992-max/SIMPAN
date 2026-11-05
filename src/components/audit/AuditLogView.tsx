import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatTanggalWaktu } from '../../utils/formatters';
import { 
  ShieldAlert, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle2, 
  Database,
  Lock,
  RotateCcw
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, exportDatabaseJSON, importDatabaseJSON, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModul, setSelectedModul] = useState<string>('all');
  const [importNotification, setImportNotification] = useState<string>('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actorNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.aksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModul = selectedModul === 'all' || log.modul === selectedModul;
    return matchesSearch && matchesModul;
  });

  // Handle Export Backup (AUD-03)
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_eperjadin_kendal_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Import Backup (AUD-03)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportNotification('Basis data berhasil dipulihkan dari file cadangan.');
      } else {
        setImportNotification('Format file cadangan tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Log Audit & Cadangan Basis Data (AUD)
          </h1>
          <p className="text-xs text-slate-500">
            Jejak rekam seluruh transaksi keuangan, persetujuan, dan perubahan data (AUD-01 s/d AUD-03)
          </p>
        </div>

        {/* Backup Actions (AUD-03) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Cadangan JSON (AUD-03)</span>
          </button>

          <label className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pulihkan Data</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {importNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importNotification}</span>
          </div>
          <button onClick={() => setImportNotification('')} className="text-xs font-semibold">Tutup</button>
        </div>
      )}

      {/* Security Banner (AUD-02) */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-600 shrink-0" />
          <span>
            <strong>Integritas Log Terlindungi (AUD-02):</strong> Seluruh catatan audit disimpan permanen dan tidak dapat diubah atau dihapus oleh pengguna biasa.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">{auditLogs.length} Total Catatan</span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari aktor, aksi, atau detail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedModul}
            onChange={e => setSelectedModul(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Modul</option>
            <option value="AUTENTIKASI">Autentikasi</option>
            <option value="ANGGARAN">Anggaran & Pagu</option>
            <option value="PERJALANAN">Perjalanan Dinas</option>
            <option value="VERIFIKASI">Verifikasi SPJ</option>
            <option value="BUKU_KAS">Buku Kas</option>
            <option value="BERKAS">Berkas Lampiran</option>
            <option value="DATA_MASTER">Data Master</option>
            <option value="TEMPLATE">Template Dokumen</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                <th className="py-2.5 px-3 w-40">Waktu</th>
                <th className="py-2.5 px-3 w-48">Aktor / Pengguna</th>
                <th className="py-2.5 px-3 w-28">Modul</th>
                <th className="py-2.5 px-3 w-40">Aksi</th>
                <th className="py-2.5 px-3">Uraian Detail</th>
                <th className="py-2.5 px-3 w-44">Perubahan Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {formatTanggalWaktu(log.timestamp)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <p className="font-semibold text-slate-900">{log.actorNama}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. {log.actorNip} ({log.actorRole})</p>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.modul}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                    {log.aksi}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 max-w-sm">
                    {log.detail}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {log.nilaiSebelum && log.nilaiSesudah ? (
                      <div className="space-y-0.5">
                        <span className="text-slate-400 line-through block">{log.nilaiSebelum}</span>
                        <strong className="text-emerald-800 block">→ {log.nilaiSesudah}</strong>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
