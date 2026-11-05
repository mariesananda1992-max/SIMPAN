/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PerjalananListView } from './components/perjalanan/PerjalananListView';
import { DetailPerjalananView } from './components/perjalanan/DetailPerjalananView';
import { PengajuanModal } from './components/perjalanan/PengajuanModal';
import { AnggaranView } from './components/anggaran/AnggaranView';
import { BukuKasView } from './components/keuangan/BukuKasView';
import { SPPView } from './components/keuangan/SPPView';
import { LaporanKeuanganView } from './components/laporan/LaporanKeuanganView';
import { DataMasterView } from './components/master/DataMasterView';
import { TemplateDokumenView } from './components/template/TemplateDokumenView';
import { AuditLogView } from './components/audit/AuditLogView';
import { CetakDokumenModal } from './components/dokumen/CetakDokumenModal';
import { HelpFlowModal } from './components/common/HelpFlowModal';
import { LoginModal } from './components/auth/LoginModal';
import { UbahNamaModal } from './components/auth/UbahNamaModal';
import { GoogleWorkspaceView } from './components/workspace/GoogleWorkspaceView';
import { PerjalananDinas } from './types';

function MainApp() {
  const { perjalananList } = useApp();
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPerjalananId, setSelectedPerjalananId] = useState<string | null>(null);

  // Modals
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUbahNamaModalOpen, setIsUbahNamaModalOpen] = useState(false);
  const [printModalConfig, setPrintModalConfig] = useState<{
    isOpen: boolean;
    docType: 'spt' | 'laporan' | 'rincian_biaya';
    perjalanan: PerjalananDinas | null;
  }>({
    isOpen: false,
    docType: 'spt',
    perjalanan: null,
  });

  // Get current selected travel from the reactive context list
  const currentSelectedPerjalanan = selectedPerjalananId
    ? perjalananList.find(p => p.id === selectedPerjalananId) || null
    : null;

  const handleSelectPerjalanan = (p: PerjalananDinas) => {
    setSelectedPerjalananId(p.id);
    setActiveTab('perjalanan');
  };

  const handleOpenPrintModal = (docType: 'spt' | 'laporan' | 'rincian_biaya', p: PerjalananDinas) => {
    setPrintModalConfig({
      isOpen: true,
      docType,
      perjalanan: p,
    });
  };

  const handleClosePrintModal = () => {
    setPrintModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedPerjalananId(null);
          setActiveTab(tab);
        }}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenUbahNama={() => setIsUbahNamaModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedPerjalananId(null);
            setActiveTab(tab);
          }}
          onOpenAjukan={() => setIsAjukanModalOpen(true)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          
          {/* Active View Switching */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAjukan={() => setIsAjukanModalOpen(true)}
              onSelectPerjalanan={handleSelectPerjalanan}
              onNavigateTab={(tab) => {
                setSelectedPerjalananId(null);
                setActiveTab(tab);
              }}
              onOpenUbahNama={() => setIsUbahNamaModalOpen(true)}
              onOpenLogin={() => setIsLoginModalOpen(true)}
            />
          )}

          {activeTab === 'perjalanan' && (
            <>
              {currentSelectedPerjalanan ? (
                <DetailPerjalananView
                  perjalanan={currentSelectedPerjalanan}
                  onBack={() => setSelectedPerjalananId(null)}
                  onOpenPrintModal={handleOpenPrintModal}
                />
              ) : (
                <PerjalananListView
                  onOpenAjukan={() => setIsAjukanModalOpen(true)}
                  onSelectPerjalanan={handleSelectPerjalanan}
                />
              )}
            </>
          )}

          {activeTab === 'anggaran' && <AnggaranView />}

          {activeTab === 'bukukas' && <BukuKasView />}

          {activeTab === 'spp' && <SPPView />}

          {activeTab === 'laporan' && <LaporanKeuanganView />}

          {activeTab === 'workspace' && <GoogleWorkspaceView />}

          {activeTab === 'master' && <DataMasterView />}

          {activeTab === 'template' && <TemplateDokumenView />}

          {activeTab === 'audit' && <AuditLogView />}

        </main>
      </div>

      {/* Modals */}
      <PengajuanModal
        isOpen={isAjukanModalOpen}
        onClose={() => setIsAjukanModalOpen(false)}
        onSuccess={() => {
          setSelectedPerjalananId(null);
          setActiveTab('perjalanan');
        }}
      />

      <CetakDokumenModal
        isOpen={printModalConfig.isOpen}
        docType={printModalConfig.docType}
        perjalanan={printModalConfig.perjalanan}
        onClose={handleClosePrintModal}
      />

      <HelpFlowModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenUbahNama={() => setIsUbahNamaModalOpen(true)}
      />

      <UbahNamaModal
        isOpen={isUbahNamaModalOpen}
        onClose={() => setIsUbahNamaModalOpen(false)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
