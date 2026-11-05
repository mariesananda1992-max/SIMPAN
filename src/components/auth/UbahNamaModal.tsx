import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Building2,
  Mail,
  ShieldAlert,
  Info
} from 'lucide-react';

interface UbahNamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

export const UbahNamaModal: React.FC<UbahNamaModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const { currentUser, ubahNamaDanProfil } = useApp();

  const [nama, setNama] = useState(currentUser.nama);
  const [nip, setNip] = useState(currentUser.nip);
  const [email, setEmail] = useState(currentUser.email);
  const [jabatan, setJabatan] = useState(currentUser.jabatan);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setNama(currentUser.nama);
      setNip(currentUser.nip);
      setEmail(currentUser.email);
      setJabatan(currentUser.jabatan);
      setPasswordBaru('');
      setKonfirmasiPassword('');
      setStatusMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || nama.trim().length < 3) {
      setStatusMsg({ type: 'error', text: 'Nama lengkap harus diisi minimal 3 karakter.' });
      return;
    }

    if (passwordBaru && passwordBaru !== konfirmasiPassword) {
      setStatusMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok dengan kata sandi baru.' });
      return;
    }

    if (passwordBaru && passwordBaru.length < 6) {
      setStatusMsg({ type: 'error', text: 'Kata sandi baru minimal harus 6 karakter.' });
      return;
    }

    const res = ubahNamaDanProfil({
      nama: nama.trim(),
      nip: nip.trim(),
      email: email.trim(),
      jabatan: jabatan.trim(),
      password: passwordBaru ? passwordBaru : undefined,
    });

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Data nama dan profil pengguna berhasil diperbarui!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ubah Nama & Profil Pengguna</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Perbarui identitas pejabat/pegawai pada dokumen resmi e-Perjadin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 shrink-0 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Note Info */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Nama lengkap dan gelar yang Anda masukkan di sini akan secara otomatis tercetak pada seluruh dokumen resmi (<strong>Surat Tugas / SPT</strong>, <strong>Laporan Hasil</strong>, dan <strong>Kuitansi Rincian Biaya</strong>).
            </p>
          </div>

          {/* Nama Lengkap & Gelar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap & Gelar Kedinasan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Marie Sananda, S.STP, M.Si"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium text-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Gunakan ejaan resmi beserta gelar depan dan belakang.
            </p>
          </div>

          {/* Grid: NIP & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Pegawai (NIP)
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19820315 200112 1 002"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mariesananda1992@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Jabatan Kedinasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Jabatan Kedinasan / Tugas</span>
            </label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Contoh: Ketua Tim Administrasi Kewilayahan / PPTK"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800"
            />
          </div>

          {/* Unit Kerja & Peran (Read Only summary) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">{currentUser.unitKerjaNama}</span>
              <p className="text-[11px] text-slate-500">Golongan: {currentUser.golongan}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-800 tracking-wider">
              {currentUser.role}
            </span>
          </div>

          {/* Section: Ubah Kata Sandi (Opsional) */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ubah Kata Sandi (Opsional)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kosongkan jika tidak ingin mengubah kata sandi masuk saat ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  placeholder="Ulangi kata sandi..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3">
            {onOpenLogin ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-xs text-slate-600 hover:text-emerald-700 underline cursor-pointer"
              >
                Lihat Semua Data Login
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
