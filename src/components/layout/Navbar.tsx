import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Building2, 
  UserCircle, 
  ChevronDown, 
  Check, 
  RotateCcw, 
  HelpCircle,
  KeyRound,
  Edit3,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenHelp: () => void;
  onOpenLogin: () => void;
  onOpenUbahNama: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenHelp,
  onOpenLogin,
  onOpenUbahNama,
}) => {
  const { currentUser, switchRole, perjalananList, resetAllData } = useApp();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Calculate pending task counts for badge
  const pendingAtasan = perjalananList.filter(p => p.status === 'diajukan').length;
  const pendingOperator = perjalananList.filter(p => p.status === 'menunggu_verifikasi_operator').length;
  const pendingBendahara = perjalananList.filter(p => p.status === 'menunggu_verifikasi_bendahara').length;

  const getRolePendingCount = () => {
    if (currentUser.role === 'atasan') return pendingAtasan;
    if (currentUser.role === 'operator') return pendingOperator;
    if (currentUser.role === 'bendahara') return pendingBendahara;
    if (currentUser.role === 'admin') return pendingAtasan + pendingOperator + pendingBendahara;
    return 0;
  };

  const pendingCount = getRolePendingCount();

  const roleLabels: Record<UserRole, { label: string; desc: string; color: string }> = {
    pegawai: { label: 'Pegawai', desc: 'Pengaju perjalanan dinas & pelapor SPJ', color: 'bg-blue-100 text-blue-800' },
    atasan: { label: 'Atasan / KPA', desc: 'Persetujuan perjalanan & penerbitan SPT', color: 'bg-purple-100 text-purple-800' },
    operator: { label: 'Operator', desc: 'Pemeriksa berkas kelengkapan & dokumen', color: 'bg-amber-100 text-amber-800' },
    bendahara: { label: 'Bendahara', desc: 'Verifikasi bukti keuangan & buku kas', color: 'bg-emerald-100 text-emerald-800' },
    admin: { label: 'Administrator', desc: 'Kelola data master, anggaran & sistem', color: 'bg-slate-800 text-white' },
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* Zone 1: Single text element wordmark with official emblem hint */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 block whitespace-nowrap">
                e-Perjadin Kendal
              </span>
              <span className="text-[11px] text-slate-500 block -mt-0.5 whitespace-nowrap">
                Sekretariat Daerah Kab. Kendal
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean text hover) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 ${
                activeTab === 'dashboard' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('perjalanan')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'perjalanan' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              <span>Perjalanan Dinas</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('anggaran')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 ${
                activeTab === 'anggaran' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              Pagu Anggaran
            </button>
            <button
              onClick={() => setActiveTab('bukukas')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 ${
                activeTab === 'bukukas' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              Buku Kas (BKU)
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 ${
                activeTab === 'laporan' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              Laporan & SPJ
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap py-1 cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'workspace' ? 'text-emerald-700 border-emerald-700 font-semibold' : 'border-transparent'
              }`}
            >
              <span>Drive & Sheets</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action area: Data Login, Role Switcher & Help Modal */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Data Login Button */}
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat Data Kredensial & Masuk Akun"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Data Login</span>
            </button>

            <button
              onClick={onOpenHelp}
              title="Panduan Alur Sistem"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Profile & Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                title="Profil Pengguna & Simulasi Peran"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentUser.nama.charAt(0)}
                </div>
                <div className="text-left hidden sm:block max-w-[150px] truncate">
                  <div className="font-semibold text-slate-900 leading-none truncate">{currentUser.nama}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{roleLabels[currentUser.role].label}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  {/* Current User Card */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun Aktif</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleLabels[currentUser.role].color}`}>
                        {roleLabels[currentUser.role].label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{currentUser.nama}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIP: {currentUser.nip}</p>
                  </div>

                  {/* Profile Actions: Ubah Nama & Data Login */}
                  <div className="p-2 border-b border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onOpenUbahNama();
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 hover:bg-emerald-50 text-emerald-900 font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ubah Nama & Profil Pengguna</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Data Login & Kredensial Semua Akun</span>
                    </button>
                  </div>

                  {/* Role Switcher */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ganti Peran Cepat</p>
                  </div>
                  
                  <div className="py-1 px-1">
                    {(Object.keys(roleLabels) as UserRole[]).map(roleKey => {
                      const info = roleLabels[roleKey];
                      const isSelected = currentUser.role === roleKey;
                      return (
                        <button
                          key={roleKey}
                          onClick={() => {
                            switchRole(roleKey);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{info.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 inline" />}
                            </div>
                            <p className="text-[10px] text-slate-500 font-normal">{info.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        resetAllData();
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 py-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Data Bawaan</span>
                    </button>
                    <span className="text-[10px] text-slate-400">TA 2026</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
