import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';
import { 
  Database, 
  Users, 
  Coins, 
  MapPin, 
  Building, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X,
  Shield
} from 'lucide-react';
import { TarifMaster, PejabatPenandatangan, User } from '../../types';

export const DataMasterView: React.FC = () => {
  const { 
    currentUser, 
    unitKerjaList, 
    subKegiatanList, 
    akunBelanjaList, 
    tarifMasterList, 
    tambahTarif, 
    updateTarif, 
    hapusTarif, 
    pejabatList, 
    updatePejabat, 
    pengaturan, 
    updatePengaturan, 
    users, 
    tambahUser, 
    updateUser, 
    toggleUserStatus 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tarif' | 'pejabat' | 'pegawai' | 'pengaturan' | 'akun'>('tarif');
  const [notification, setNotification] = useState<string>('');

  // Tarif Modal state
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<TarifMaster | null>(null);
  const [formKota, setFormKota] = useState('Kota Semarang');
  const [formProvinsi, setFormProvinsi] = useState('Jawa Tengah');
  const [formGolongan, setFormGolongan] = useState('Golongan III');
  const [formUangHarian, setFormUangHarian] = useState(380000);
  const [formPenginapan, setFormPenginapan] = useState(550000);
  const [formTransport, setFormTransport] = useState(200000);
  const [formRepresentasi, setFormRepresentasi] = useState(0);

  // Settings form
  const [settingsForm, setSettingsForm] = useState(pengaturan);

  // Pejabat edit state
  const [editingPejabat, setEditingPejabat] = useState<PejabatPenandatangan | null>(null);
  const [pejabatNama, setPejabatNama] = useState('');
  const [pejabatNip, setPejabatNip] = useState('');
  const [pejabatSK, setPejabatSK] = useState('');

  // Handle save tarif
  const handleSaveTarif = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTarif) {
      updateTarif(editingTarif.id, {
        kotaTujuan: formKota,
        provinsi: formProvinsi,
        golongan: formGolongan,
        uangHarianPerHari: formUangHarian,
        penginapanPerMalam: formPenginapan,
        transportDefault: formTransport,
        representasiPerHari: formRepresentasi,
      });
      setNotification('Tarif master berhasil diperbarui.');
    } else {
      tambahTarif({
        kotaTujuan: formKota,
        provinsi: formProvinsi,
        golongan: formGolongan,
        uangHarianPerHari: formUangHarian,
        penginapanPerMalam: formPenginapan,
        transportDefault: formTransport,
        representasiPerHari: formRepresentasi,
        masaBerlakuMulai: '2026-01-01',
        masaBerlakuSelesai: '2026-12-31',
      });
      setNotification('Tarif tujuan baru berhasil ditambahkan.');
    }
    setIsTarifModalOpen(false);
    setEditingTarif(null);
  };

  // Open edit tarif
  const handleOpenEditTarif = (t: TarifMaster) => {
    setEditingTarif(t);
    setFormKota(t.kotaTujuan);
    setFormProvinsi(t.provinsi);
    setFormGolongan(t.golongan);
    setFormUangHarian(t.uangHarianPerHari);
    setFormPenginapan(t.penginapanPerMalam);
    setFormTransport(t.transportDefault);
    setFormRepresentasi(t.representasiPerHari);
    setIsTarifModalOpen(true);
  };

  // Handle save settings (MST-05)
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePengaturan(settingsForm);
    setNotification('Pengaturan instansi dan format penomoran surat berhasil disimpan.');
  };

  // Handle save pejabat (MST-04)
  const handleSavePejabat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPejabat) return;
    updatePejabat(editingPejabat.id, {
      nama: pejabatNama,
      nip: pejabatNip,
      nomorSK: pejabatSK,
    });
    setEditingPejabat(null);
    setNotification('Data pejabat penandatangan berhasil diperbarui.');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengelolaan Data Master (MST)
          </h1>
          <p className="text-xs text-slate-500">
            Pengaturan tarif SBU, pejabat penandatangan, format surat, dan data pegawai (MST-01 s/d MST-06)
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="text-xs font-semibold">Tutup</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit text-xs">
        <button
          onClick={() => setActiveTab('tarif')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'tarif' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tarif SBU & Tujuan (MST-03)
        </button>
        <button
          onClick={() => setActiveTab('pejabat')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'pejabat' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pejabat Penandatangan (MST-04)
        </button>
        <button
          onClick={() => setActiveTab('pegawai')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'pegawai' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pengguna & Pegawai (MST-01)
        </button>
        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'pengaturan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Format Surat & Instansi (MST-05)
        </button>
      </div>

      {/* Tab 1: Tarif Master (MST-03 & MST-06) */}
      {activeTab === 'tarif' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Standar Biaya Masukan (SBU) Perjalanan Dinas
            </span>
            <button
              onClick={() => {
                setEditingTarif(null);
                setFormKota('');
                setFormProvinsi('');
                setFormGolongan('Golongan III');
                setFormUangHarian(380000);
                setFormPenginapan(550000);
                setFormTransport(200000);
                setFormRepresentasi(0);
                setIsTarifModalOpen(true);
              }}
              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tarif Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                  <th className="py-2.5 px-3">Kota Tujuan</th>
                  <th className="py-2.5 px-3">Tingkat Golongan</th>
                  <th className="py-2.5 px-3 text-right">Uang Harian</th>
                  <th className="py-2.5 px-3 text-right">Penginapan/Malam</th>
                  <th className="py-2.5 px-3 text-right">Transportasi</th>
                  <th className="py-2.5 px-3 text-right">Representasi</th>
                  <th className="py-2.5 px-3 text-center">Masa Berlaku</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tarifMasterList.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{t.kotaTujuan}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{t.golongan}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 tabular-nums">{formatRupiah(t.uangHarianPerHari)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 tabular-nums">{formatRupiah(t.penginapanPerMalam)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 tabular-nums">{formatRupiah(t.transportDefault)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 tabular-nums">{formatRupiah(t.representasiPerHari)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-[11px] text-slate-500">{t.masaBerlakuMulai} s.d {t.masaBerlakuSelesai}</td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditTarif(t)}
                          className="p-1 text-slate-500 hover:text-emerald-700 cursor-pointer"
                          title="Edit Tarif"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            hapusTarif(t.id);
                            setNotification(`Tarif ${t.kotaTujuan} berhasil dihapus.`);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Hapus"
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
        </div>
      )}

      {/* Tab 2: Pejabat Penandatangan (MST-04) */}
      {activeTab === 'pejabat' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pejabatList.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {p.keteranganPeran}
                </span>
                <button
                  onClick={() => {
                    setEditingPejabat(p);
                    setPejabatNama(p.nama);
                    setPejabatNip(p.nip);
                    setPejabatSK(p.nomorSK);
                  }}
                  className="text-xs font-medium text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Pejabat</span>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{p.nama}</h3>
                <p className="text-xs text-slate-600 font-mono mt-0.5">NIP. {p.nip}</p>
                <p className="text-xs text-slate-500 mt-1">{p.jabatanDinas}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>SK: {p.nomorSK}</span>
                <span>{p.masaBerlaku}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Pengguna & Pegawai (MST-01 & AUT-03) */}
      {activeTab === 'pegawai' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Pegawai & Hak Akses Pengguna
            </span>
            <span className="text-xs text-slate-500">{users.length} Pengguna Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-left">
                  <th className="py-2.5 px-3">Nama Pegawai</th>
                  <th className="py-2.5 px-3">NIP & Email</th>
                  <th className="py-2.5 px-3">Jabatan & Golongan</th>
                  <th className="py-2.5 px-3">Peran Akses</th>
                  <th className="py-2.5 px-3">Kata Sandi</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{u.nama}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="font-mono text-[11px]">{u.nip}</div>
                      <div className="text-[11px] text-emerald-700 font-medium">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{u.jabatan} ({u.golongan})</td>
                    <td className="py-2.5 px-3 capitalize font-medium text-slate-800">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {u.password || 'password123'}
                      </code>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.statusAktif ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.statusAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="text-[11px] text-slate-600 hover:text-emerald-700 underline cursor-pointer"
                      >
                        {u.statusAktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pengaturan Format Surat & Penomoran (MST-05) */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Pengaturan Parameter & Format Surat (MST-05)</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Instansi Pemerintah</label>
              <input
                type="text"
                value={settingsForm.namaPemerintah}
                onChange={e => setSettingsForm({ ...settingsForm, namaPemerintah: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / SKPD</label>
              <input
                type="text"
                value={settingsForm.namaUnitKerja}
                onChange={e => setSettingsForm({ ...settingsForm, namaUnitKerja: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kota Tempat Surat Dibuat</label>
                <input
                  type="text"
                  value={settingsForm.kotaSurat}
                  onChange={e => setSettingsForm({ ...settingsForm, kotaSurat: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batas Maksimum Ukuran Upload (MB)</label>
                <input
                  type="number"
                  value={settingsForm.maxUploadMB}
                  onChange={e => setSettingsForm({ ...settingsForm, maxUploadMB: Number(e.target.value) || 10 })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Format Penomoran SPT Otomatis (BR-09)</label>
              <input
                type="text"
                value={settingsForm.formatNomorSPT}
                onChange={e => setSettingsForm({ ...settingsForm, formatNomorSPT: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Contoh hasil: 090/088/Bag.Pem/2026. Gunakan tag {'{no}'} dan {'{tahun}'}.
              </span>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Pejabat */}
      {editingPejabat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Ubah Data Pejabat {editingPejabat.keteranganPeran}</h3>
            
            <form onSubmit={handleSavePejabat} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={pejabatNama}
                  onChange={e => setPejabatNama(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP</label>
                <input
                  type="text"
                  value={pejabatNip}
                  onChange={e => setPejabatNip(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor SK Pengangkatan</label>
                <input
                  type="text"
                  value={pejabatSK}
                  onChange={e => setPejabatSK(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPejabat(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Tarif */}
      {isTarifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              {editingTarif ? 'Edit Tarif Master SBU' : 'Tambah Tarif Master SBU Baru'}
            </h3>

            <form onSubmit={handleSaveTarif} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Wilayah Tujuan *</label>
                  <input
                    type="text"
                    value={formKota}
                    onChange={e => setFormKota(e.target.value)}
                    placeholder="Contoh: Kota Solo"
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formProvinsi}
                    onChange={e => setFormProvinsi(e.target.value)}
                    placeholder="Contoh: Jawa Tengah"
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tingkat Golongan</label>
                <select
                  value={formGolongan}
                  onChange={e => setFormGolongan(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="Golongan IV">Golongan IV (Pembina / Eselon III/II)</option>
                  <option value="Golongan III">Golongan III (Penata)</option>
                  <option value="Golongan II/I">Golongan II / I (Pengatur / Juru)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uang Harian / Hari (Rp)</label>
                  <input
                    type="number"
                    value={formUangHarian}
                    onChange={e => setFormUangHarian(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penginapan / Malam (Rp)</label>
                  <input
                    type="number"
                    value={formPenginapan}
                    onChange={e => setFormPenginapan(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transport Default (Rp)</label>
                  <input
                    type="number"
                    value={formTransport}
                    onChange={e => setFormTransport(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uang Representasi (Rp)</label>
                  <input
                    type="number"
                    value={formRepresentasi}
                    onChange={e => setFormRepresentasi(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTarifModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan Tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
