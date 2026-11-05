import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  signInWithGoogle,
  logoutGoogle,
  subscribeGoogleAuth,
  getGoogleAccessToken,
  getGoogleUser,
  WORKSPACE_SCOPES
} from '../../services/googleAuth';
import {
  listDriveFiles,
  createDriveFolder,
  uploadFileToDrive,
  deleteDriveFile,
  getDriveAbout,
  GoogleDriveFile,
  DriveStorageQuota
} from '../../services/googleDriveService';
import {
  exportPerjadinToGoogleSheets,
  getSpreadsheetMetadata,
  getSpreadsheetPreview,
  SpreadsheetInfo
} from '../../services/googleSheetsService';
import {
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  FolderPlus,
  RefreshCw,
  Search,
  Trash2,
  Download,
  Folder,
  FileText,
  FileImage,
  FileCode,
  File,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  LogOut,
  ShieldCheck,
  Table,
  Plus,
  X,
  Eye,
  Info
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

export const GoogleWorkspaceView: React.FC = () => {
  const { perjalananList, akunBelanjaList, bukuKasList, exportDatabaseJSON } = useApp();

  // Auth state
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getGoogleUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab state: 'sheets' | 'drive'
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive'>('sheets');

  // Sheets state
  const [sheetTitle, setSheetTitle] = useState(`Rekap e-Perjadin Setda Kendal T.A. 2026`);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [lastExportedSheet, setLastExportedSheet] = useState<SpreadsheetInfo | null>(null);
  const [driveSheets, setDriveSheets] = useState<GoogleDriveFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [selectedSheetPreview, setSelectedSheetPreview] = useState<{
    info: SpreadsheetInfo;
    values: string[][];
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveTypeFilter, setDriveTypeFilter] = useState<'all' | 'spreadsheet' | 'folder'>('all');
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);

  // Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Destructive delete confirmation modal (MANDATORY per SKILL.md)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listen to Google Auth changes
  useEffect(() => {
    const unsubscribe = subscribeGoogleAuth((user, token) => {
      setGoogleUser(user);
      setAccessToken(token);
      if (token) {
        loadDriveFiles();
        loadDriveSheets();
        loadAboutStorage();
      }
    });
    return () => unsubscribe();
  }, []);

  const showNotify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        showNotify('success', `Berhasil terhubung dengan Google (${res.user.email || 'Pengguna'})`);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setAuthError(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setDriveFiles([]);
    setDriveSheets([]);
    setStorageQuota(null);
    setSelectedSheetPreview(null);
    setLastExportedSheet(null);
    showNotify('success', 'Akun Google telah diputuskan.');
  };

  const loadAboutStorage = async () => {
    try {
      const about = await getDriveAbout();
      if (about.storageQuota) {
        setStorageQuota(about.storageQuota);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveFiles({
        query: driveSearch,
        mimeTypeFilter: driveTypeFilter,
        pageSize: 40,
      });
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      showNotify('error', err.message || 'Gagal memuat file Google Drive.');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const loadDriveSheets = async () => {
    if (!accessToken) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await listDriveFiles({
        mimeTypeFilter: 'spreadsheet',
        pageSize: 25,
      });
      setDriveSheets(sheets);
    } catch (err: any) {
      console.error('Failed to load sheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Re-fetch files when search or filter changes
  useEffect(() => {
    if (accessToken && activeTab === 'drive') {
      const timer = setTimeout(() => {
        loadDriveFiles();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [driveSearch, driveTypeFilter, accessToken, activeTab]);

  // Google Sheets Export
  const handleExportToSheets = async () => {
    if (!accessToken) {
      showNotify('error', 'Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    setIsExportingSheet(true);
    try {
      const res = await exportPerjadinToGoogleSheets(
        sheetTitle,
        perjalananList,
        akunBelanjaList,
        bukuKasList
      );
      setLastExportedSheet(res);
      showNotify('success', `Spreadsheet "${sheetTitle}" berhasil dibuat di Google Drive Anda!`);
      loadDriveSheets();
      loadDriveFiles();
    } catch (err: any) {
      console.error('Failed to export to sheets:', err);
      showNotify('error', err.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setIsExportingSheet(false);
    }
  };

  // Preview a sheet in-app
  const handlePreviewSheet = async (file: GoogleDriveFile) => {
    if (!accessToken) return;
    setIsLoadingPreview(true);
    try {
      const meta = await getSpreadsheetMetadata(file.id);
      const firstSheetTitle = meta.sheets?.[0]?.title || 'Sheet1';
      const preview = await getSpreadsheetPreview(file.id, `'${firstSheetTitle}'!A1:N25`);
      setSelectedSheetPreview({
        info: meta,
        values: preview.values,
      });
    } catch (err: any) {
      console.error('Preview error:', err);
      showNotify('error', err.message || 'Gagal membaca pratinjau spreadsheet.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Create folder in Drive
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await createDriveFolder(newFolderName.trim());
      showNotify('success', `Folder "${newFolderName}" berhasil dibuat di Google Drive!`);
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      loadDriveFiles();
    } catch (err: any) {
      showNotify('error', err.message || 'Gagal membuat folder di Google Drive.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Backup entire app database to Google Drive as JSON
  const handleBackupToDrive = async () => {
    if (!accessToken) return;
    try {
      const jsonStr = exportDatabaseJSON();
      const fileName = `Backup_ePerjadin_Kendal_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await uploadFileToDrive(fileName, jsonStr, 'application/json');
      showNotify('success', `Berkas cadangan "${fileName}" berhasil diunggah ke Google Drive!`);
      loadDriveFiles();
    } catch (err: any) {
      showNotify('error', err.message || 'Gagal mencadangkan data ke Google Drive.');
    }
  };

  // Execute Destructive Delete File after Confirmation
  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      showNotify('success', `File "${fileToDelete.name}" berhasil dihapus dari Google Drive.`);
      setFileToDelete(null);
      loadDriveFiles();
      loadDriveSheets();
    } catch (err: any) {
      showNotify('error', err.message || 'Gagal menghapus file dari Google Drive.');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 shrink-0" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (mimeType.includes('image')) {
      return <FileImage className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    if (mimeType.includes('json') || mimeType.includes('javascript')) {
      return <FileCode className="w-5 h-5 text-purple-500 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '-';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheets</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Google Drive</span>
              </span>
              <span>&bull;</span>
              <span>Integrasi Resmi</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Integrasi Google Workspace e-Perjadin
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Ekspor rekapitulasi perjalanan dinas, pagu anggaran, dan buku kas umum langsung ke <strong>Google Sheets</strong>, serta simpan arsip berkas SPJ secara aman di <strong>Google Drive</strong> Sekretariat Daerah Kabupaten Kendal.
            </p>
          </div>

          {/* Google Auth Status / Button */}
          <div className="shrink-0 flex items-center">
            {accessToken && googleUser ? (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    (googleUser.displayName || googleUser.email || 'G').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{googleUser.displayName || 'Akun Google Terhubung'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] truncate max-w-[190px]">
                    {googleUser.email}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Drive & Sheets Siap Digunakan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  title="Putuskan Hubungan Google"
                  className="p-2 ml-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                {/* Official "Sign in with Google" Button Style */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="gsi-material-button group inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-5 h-5 shrink-0"
                    >
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>{isLoggingIn ? 'Menghubungkan...' : 'Hubungkan dengan Google'}</span>
                  </div>
                </button>
                {authError && (
                  <p className="text-[11px] text-rose-600 mt-1 max-w-[240px]">
                    {authError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Workspace Sub-tabs */}
        <div className="flex border-b border-slate-200 mt-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets (Rekap & Lembar Kerja)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('drive');
              if (accessToken) loadDriveFiles();
            }}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'drive'
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Google Drive (Arsip Digital & Dokumen SPJ)</span>
          </button>
        </div>
      </div>

      {/* Unauthenticated notice if not signed in */}
      {!accessToken && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-950">
                Akses Google Workspace Memerlukan Izin
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Silakan klik tombol <strong>"Hubungkan dengan Google"</strong> di atas untuk mengaktifkan sinkronisasi otomatis ke Google Sheets dan Google Drive Anda dengan aman.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition-colors shrink-0 cursor-pointer text-xs"
          >
            Masuk dengan Akun Google
          </button>
        </div>
      )}

      {/* TAB 1: GOOGLE SHEETS */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          
          {/* Export Generator Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Ekspor Data e-Perjadin ke Google Sheets
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Membuat file Google Spreadsheet otomatis berisi 3 lembar kerja: Daftar Perjalanan, Pagu Anggaran, dan Buku Kas Umum (BKU).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Spreadsheet Baru
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="Contoh: Rekap e-Perjadin Setda Kendal T.A. 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!accessToken || isExportingSheet}
                  onClick={handleExportToSheets}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingSheet ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Buat di Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Last Exported Sheet Feedback */}
            {lastExportedSheet && (
              <div className="mt-3 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950">
                      Spreadsheet Berhasil Dibuat: {lastExportedSheet.title}
                    </span>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      Berisi data {perjalananList.length} perjalanan dinas, {akunBelanjaList.length} akun anggaran, dan {bukuKasList.length} entri kas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={lastExportedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Existing Google Sheets in Drive */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Spreadsheet di Google Drive Anda
                </h3>
                <p className="text-[11px] text-slate-500">
                  Klik untuk membuka langsung di Google Sheets atau melihat pratinjau di aplikasi
                </p>
              </div>
              <button
                type="button"
                onClick={loadDriveSheets}
                disabled={isLoadingSheets || !accessToken}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Segarkan Daftar Spreadsheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingSheets ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                <span>Memuat spreadsheet dari Google Drive...</span>
              </div>
            ) : driveSheets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Belum ada Google Spreadsheet</p>
                <p className="text-slate-400 mt-0.5">
                  Gunakan tombol di atas untuk membuat spreadsheet rekapitulasi baru.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {driveSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-slate-900 truncate" title={sheet.name}>
                          {sheet.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Diperbarui: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => handlePreviewSheet(sheet)}
                        className="text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pratinjau</span>
                      </button>

                      <a
                        href={sheet.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive In-App Sheet Preview */}
          {selectedSheetPreview && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Pratinjau Lembar Kerja: {selectedSheetPreview.info.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedSheetPreview.info.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Edit di Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setSelectedSheetPreview(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
                <table className="w-full text-xs divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-100">
                    {selectedSheetPreview.values.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx === 0 || rIdx === 4 ? 'bg-slate-50 font-bold text-slate-800' : 'hover:bg-slate-50/60'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 border-r border-slate-100 text-slate-700 whitespace-nowrap font-mono text-[11px]"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: GOOGLE DRIVE */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          
          {/* Storage & Drive Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Penyimpanan Google Drive e-Perjadin
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Kelola arsip dokumen perjalanan dinas, bukti kuitansi hotel/tiket, dan cadangan data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!accessToken}
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buat Folder Baru</span>
                </button>

                <button
                  type="button"
                  disabled={!accessToken}
                  onClick={handleBackupToDrive}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  title="Cadangkan seluruh basis data e-Perjadin (JSON) ke Google Drive"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Cadangkan Database ke Drive</span>
                </button>
              </div>
            </div>

            {/* Drive Search and Filter Toolbar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  placeholder="Cari file di Google Drive..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={driveTypeFilter}
                  onChange={(e: any) => setDriveTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Tipe File</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="folder">Folder</option>
                </select>

                <button
                  type="button"
                  onClick={loadDriveFiles}
                  disabled={isLoadingDrive || !accessToken}
                  className="p-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Segarkan File Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Drive Files Listing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Berkas di Google Drive ({driveFiles.length})
              </span>
              {storageQuota?.usage && (
                <span className="text-[11px] text-slate-500">
                  Terpakai: {formatFileSize(storageQuota.usage)}
                </span>
              )}
            </div>

            {isLoadingDrive ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>Memuat berkas dari Google Drive...</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Tidak ada file yang ditemukan</p>
                <p className="text-slate-400 mt-0.5">
                  Gunakan tombol cadangkan atau buat spreadsheet untuk menyimpan data ke Drive.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                      <th className="py-2.5 px-4">Nama Berkas</th>
                      <th className="py-2.5 px-3">Tipe Berkas</th>
                      <th className="py-2.5 px-3">Ukuran</th>
                      <th className="py-2.5 px-3">Terakhir Diperbarui</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driveFiles.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(f.mimeType)}
                            <span className="truncate max-w-xs md:max-w-md" title={f.name}>
                              {f.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {f.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {formatFileSize(f.size)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {f.modifiedTime ? new Date(f.modifiedTime).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka di Google Drive"
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            
                            {f.webContentLink && (
                              <a
                                href={f.webContentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Unduh Berkas"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Delete File Button triggers confirmation dialog */}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(f)}
                              title="Hapus Berkas dari Google Drive"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Buat Folder Baru di Google Drive</h3>
              <button
                onClick={() => setIsCreateFolderOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Folder
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Berkas SPJ Perjadin 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE DRIVE OPERATIONS */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Konfirmasi Hapus Berkas dari Google Drive
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus berkas berikut secara permanen dari akun Google Drive Anda?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-semibold text-slate-900 truncate">
                {fileToDelete.name}
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Tipe: {fileToDelete.mimeType}</span>
                <span>&bull;</span>
                <span>Ukuran: {formatFileSize(fileToDelete.size)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={handleConfirmDeleteFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeletingFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus File Ini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
