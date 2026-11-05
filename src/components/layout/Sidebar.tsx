import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Coins, 
  BookOpen, 
  FileText, 
  Database, 
  FileCode2, 
  ShieldAlert,
  PlusCircle,
  Clock,
  Layers,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAjukan: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenAjukan }) => {
  const { currentUser, perjalananList } = useApp();

  // Task counters by role
  const pendingAtasan = perjalananList.filter(p => p.status === 'diajukan').length;
  const pendingOperator = perjalananList.filter(p => p.status === 'menunggu_verifikasi_operator').length;
  const pendingBendahara = perjalananList.filter(p => p.status === 'menunggu_verifikasi_bendahara').length;

  const getPendingBadge = () => {
    if (currentUser.role === 'atasan' && pendingAtasan > 0) return pendingAtasan;
    if (currentUser.role === 'operator' && pendingOperator > 0) return pendingOperator;
    if (currentUser.role === 'bendahara' && pendingBendahara > 0) return pendingBendahara;
    if (currentUser.role === 'admin') {
      const tot = pendingAtasan + pendingOperator + pendingBendahara;
      return tot > 0 ? tot : 0;
    }
    return 0;
  };

  const badgeCount = getPendingBadge();

  // Menu items config with role visibility
  const navItems = [
    {
      id: 'dashboard',
      label: 'Ringkasan Eksekutif',
      icon: LayoutDashboard,
      roles: ['pegawai', 'atasan', 'operator', 'bendahara', 'admin'],
    },
    {
      id: 'perjalanan',
      label: 'Perjalanan Dinas',
      icon: Briefcase,
      badge: badgeCount > 0 ? badgeCount : null,
      roles: ['pegawai', 'atasan', 'operator', 'bendahara', 'admin'],
    },
    {
      id: 'anggaran',
      label: 'Pagu & Realisasi',
      icon: Coins,
      roles: ['pegawai', 'atasan', 'operator', 'bendahara', 'admin'],
    },
    {
      id: 'bukukas',
      label: 'Buku Kas (BKU)',
      icon: BookOpen,
      roles: ['bendahara', 'admin', 'operator', 'atasan'],
    },
    {
      id: 'spp',
      label: 'Permintaan Bayar (SPP)',
      icon: Receipt,
      roles: ['bendahara', 'admin', 'operator', 'atasan'],
    },
    {
      id: 'laporan',
      label: 'Laporan Keuangan & SPJ',
      icon: FileText,
      roles: ['pegawai', 'atasan', 'operator', 'bendahara', 'admin'],
    },
    {
      id: 'workspace',
      label: 'Google Drive & Sheets',
      icon: FileSpreadsheet,
      roles: ['pegawai', 'atasan', 'operator', 'bendahara', 'admin'],
    },
    {
      id: 'master',
      label: 'Data Master Instansi',
      icon: Database,
      roles: ['bendahara', 'admin'],
    },
    {
      id: 'template',
      label: 'Template Dokumen',
      icon: FileCode2,
      roles: ['admin', 'bendahara'],
    },
    {
      id: 'audit',
      label: 'Log Audit & Cadangan',
      icon: ShieldAlert,
      roles: ['admin', 'bendahara'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="no-print w-64 shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Quick CTA button */}
        {(currentUser.role === 'pegawai' || currentUser.role === 'admin' || currentUser.role === 'operator') && (
          <button
            onClick={onOpenAjukan}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajukan Perjalanan Baru</span>
          </button>
        )}

        {/* Navigation list */}
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Menu Navigasi
          </div>
          <nav className="space-y-1">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Unit Kerja Info Card */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sub Kegiatan Terpilih</div>
          <div className="text-xs font-medium text-slate-900 mt-1 line-clamp-2">
            Pengelolaan Administrasi Kewilayahan
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            4.01.02.2.01.0002
          </div>
        </div>
      </div>

      {/* User Info Bar at bottom of sidebar */}
      <div className="pt-4 border-t border-slate-200">
        <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.nama}</div>
        <div className="text-[11px] text-slate-500 font-mono truncate">NIP. {currentUser.nip}</div>
        <div className="text-[10px] text-emerald-700 font-medium mt-1 truncate">{currentUser.jabatan}</div>
      </div>
    </aside>
  );
};
