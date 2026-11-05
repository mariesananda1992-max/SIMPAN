import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  LogIn,
  UserCheck,
  Shield,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUbahNama?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenUbahNama,
}) => {
  const { users, currentUser, loginUser } = useApp();

  const [activeTab, setActiveTab] = useState<'kredensial' | 'form'>('kredensial');
  const [identifier, setIdentifier] = useState('');
  const [kataSandi, setKataSandi] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleBadges: Record<UserRole, { label: string; badge: string }> = {
    admin: { label: 'Administrator & PPTK', badge: 'bg-slate-900 text-white' },
    atasan: { label: 'Atasan Langsung / KPA', badge: 'bg-purple-100 text-purple-800' },
    bendahara: { label: 'Bendahara Pengeluaran', badge: 'bg-emerald-100 text-emerald-800' },
    operator: { label: 'Operator Verifikator', badge: 'bg-amber-100 text-amber-800' },
    pegawai: { label: 'Pegawai Pelaksana', badge: 'bg-blue-100 text-blue-800' },
  };

  const handleLoginForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setStatusMsg({ type: 'error', text: 'Silakan masukkan NIP atau Email akun Anda.' });
      return;
    }

    const res = loginUser(identifier, kataSandi);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 900);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleQuickLogin = (user: User) => {
    const res = loginUser(user.email, user.password || 'password123');
    if (res.success) {
      setStatusMsg({ type: 'success', text: `Berhasil masuk sebagai ${user.nama} (${roleBadges[user.role].label})` });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Data Login & Kredensial e-Perjadin</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Sekretariat Daerah Kabupaten Kendal &bull; Tahun Anggaran 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => {
              setActiveTab('kredensial');
              setStatusMsg(null);
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'kredensial'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Daftar Akun & 1-Klik Masuk</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {users.length} Akun
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('form');
              setStatusMsg(null);
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'form'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 text-slate-600" />
            <span>Form Masuk Manual (NIP / Email)</span>
          </button>
        </div>

        {/* Notification Status */}
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'kredensial' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-emerald-900">
                    Akun Saat Ini: <span className="underline">{currentUser.nama}</span> ({roleBadges[currentUser.role]?.label})
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Klik tombol <strong className="text-emerald-700">"Gunakan Akun Ini"</strong> pada salah satu pengguna di bawah untuk langsung beralih hak akses tanpa perlu mengetik kata sandi.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {users.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const roleInfo = roleBadges[u.role];
                  const defaultPwd = u.password || 'password123';

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-emerald-50/40 border-emerald-400 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">{u.nama}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleInfo.badge}`}>
                              {roleInfo.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                                <Check className="w-3 h-3" /> Sedang Aktif
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <div className="flex items-center gap-3">
                              <span>NIP: <span className="font-mono text-slate-700">{u.nip}</span></span>
                              <span>&bull;</span>
                              <span>Email: <span className="text-slate-700 font-medium">{u.email}</span></span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Jabatan: {u.jabatan} ({u.golongan})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          {/* Copy password button */}
                          <button
                            type="button"
                            onClick={() => handleCopyText(defaultPwd, u.id)}
                            title={`Salin Kata Sandi (${defaultPwd})`}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedId === u.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{defaultPwd}</span>
                              </>
                            )}
                          </button>

                          {/* Quick login button */}
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleQuickLogin(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                            }`}
                          >
                            <span>Gunakan Akun Ini</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom hint to change user profile name */}
              {onOpenUbahNama && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenUbahNama();
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline cursor-pointer"
                  >
                    Ingin mengubah Nama Lengkap, NIP, atau Kata Sandi akun aktif? Klik di sini untuk Ubah Profil
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'form' && (
            <form onSubmit={handleLoginForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  NIP atau Alamat Email Kedinasan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: mariesananda1992@gmail.com atau 19820315 200112 1 002"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan NIP lengkap atau email terdaftar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={kataSandi}
                    onChange={(e) => setKataSandi(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kata sandi bawaan untuk semua akun adalah: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">password123</code>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('kredensial')}
                  className="text-xs text-slate-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  Kembali ke Daftar Kredensial Pengguna
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Autentikasi Terenkripsi &bull; Standar Keamanan Setda Kendal</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
