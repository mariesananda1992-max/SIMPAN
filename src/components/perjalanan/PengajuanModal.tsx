import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, hitungHari } from '../../utils/formatters';
import { 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Users, 
  Calendar,
  Building,
  Info
} from 'lucide-react';
import { PesertaPerjalanan } from '../../types';

interface PengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PengajuanModal: React.FC<PengajuanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { 
    currentUser, 
    akunBelanjaList, 
    subKegiatanList, 
    tarifMasterList, 
    users, 
    ajukanPerjalanan,
    hitungEstimasiPerjalanan 
  } = useApp();

  const [maksudPerjalanan, setMaksudPerjalanan] = useState('');
  const [kotaTujuan, setKotaTujuan] = useState('Kota Semarang');
  const [tempatTujuanDetail, setTempatTujuanDetail] = useState('');
  const [tanggalBerangkat, setTanggalBerangkat] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalKembali, setTanggalKembali] = useState(new Date().toISOString().split('T')[0]);
  const [alatTransportasi, setAlatTransportasi] = useState('Kendaraan Dinas Operasional');
  const [akunBelanjaId, setAkunBelanjaId] = useState('');
  
  // Selected participants
  const [pesertaList, setPesertaList] = useState<PesertaPerjalanan[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected account to first travel account
  useEffect(() => {
    if (akunBelanjaList.length > 0 && !akunBelanjaId) {
      const perjad = akunBelanjaList.find(a => a.kelompokBelanja === 'perjalanan');
      if (perjad) {
        setAkunBelanjaId(perjad.id);
      } else {
        setAkunBelanjaId(akunBelanjaList[0].id);
      }
    }
  }, [akunBelanjaList, akunBelanjaId]);

  // Initialize with current user as the first participant
  useEffect(() => {
    if (isOpen && pesertaList.length === 0) {
      const lamaHari = hitungHari(tanggalBerangkat, tanggalKembali);
      const lamaMalam = Math.max(0, lamaHari - 1);
      const est = hitungEstimasiPerjalanan(
        kotaTujuan,
        [{
          nip: currentUser.nip,
          nama: currentUser.nama,
          jabatan: currentUser.jabatan,
          golongan: currentUser.golongan,
        }],
        lamaHari,
        lamaMalam
      );
      setPesertaList(est.peserta);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lamaHari = hitungHari(tanggalBerangkat, tanggalKembali);
  const lamaMalam = Math.max(0, lamaHari - 1);

  // Selected account details
  const selectedAkun = akunBelanjaList.find(a => a.id === akunBelanjaId);
  const sisaPagu = selectedAkun ? (selectedAkun.pagu - selectedAkun.realisasi - selectedAkun.komitmen) : 0;

  // Calculate total estimation across all participants
  const totalEstimasi = pesertaList.reduce((acc, p) => acc + p.totalEstimasi, 0);
  const isBudgetExceeded = totalEstimasi > sisaPagu;

  // Recalculate costs for all participants based on current dates and destination
  const handleRecalculateEstimates = () => {
    if (pesertaList.length === 0) return;
    const rawList = pesertaList.map(p => ({
      nip: p.nip,
      nama: p.nama,
      jabatan: p.jabatan,
      golongan: p.golongan,
    }));
    const est = hitungEstimasiPerjalanan(kotaTujuan, rawList, lamaHari, lamaMalam);
    setPesertaList(est.peserta);
    setErrorMessage('');
  };

  // Add participant
  const handleAddParticipant = () => {
    if (!selectedUserToAdd) return;
    const user = users.find(u => u.id === selectedUserToAdd);
    if (!user) return;

    if (pesertaList.some(p => p.nip === user.nip)) {
      setErrorMessage(`Pegawai ${user.nama} sudah ada dalam daftar peserta.`);
      return;
    }

    const est = hitungEstimasiPerjalanan(
      kotaTujuan,
      [{
        nip: user.nip,
        nama: user.nama,
        jabatan: user.jabatan,
        golongan: user.golongan,
      }],
      lamaHari,
      lamaMalam
    );

    setPesertaList(prev => [...prev, ...est.peserta]);
    setSelectedUserToAdd('');
    setErrorMessage('');
  };

  // Remove participant
  const handleRemoveParticipant = (index: number) => {
    if (pesertaList.length <= 1) {
      setErrorMessage('Perjalanan dinas minimal harus memiliki 1 orang peserta.');
      return;
    }
    setPesertaList(prev => prev.filter((_, i) => i !== index));
    setErrorMessage('');
  };

  // Edit component nominal for a participant
  const handleUpdateComponent = (pesertaIndex: number, komponenIndex: number, newNominal: number) => {
    const updated = [...pesertaList];
    const pst = updated[pesertaIndex];
    pst.komponenBiaya[komponenIndex].nominalEstimasi = newNominal;
    pst.totalEstimasi = pst.komponenBiaya.reduce((sum, c) => sum + c.nominalEstimasi, 0);
    pst.uangMuka = pst.totalEstimasi;
    setPesertaList(updated);
  };

  // Submit request (PRJ-01 & ANG-06 check)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!maksudPerjalanan.trim()) {
      setErrorMessage('Maksud perjalanan dinas wajib diisi.');
      return;
    }
    if (!tempatTujuanDetail.trim()) {
      setErrorMessage('Lokasi/instansi tujuan spesifik wajib diisi.');
      return;
    }
    if (pesertaList.length === 0) {
      setErrorMessage('Daftar peserta perjalanan dinas tidak boleh kosong.');
      return;
    }
    if (!akunBelanjaId) {
      setErrorMessage('Akun belanja yang dibebani wajib dipilih.');
      return;
    }

    // Check budget limit (ANG-06 & BR-02 & AC-02)
    if (totalEstimasi > sisaPagu) {
      setErrorMessage(`Pengajuan Ditolak! Estimasi total biaya (${formatRupiah(totalEstimasi)}) melebihi sisa pagu rekening yang tersedia (${formatRupiah(sisaPagu)}).`);
      return;
    }

    setIsSubmitting(true);
    const result = ajukanPerjalanan({
      maksudPerjalanan,
      kotaTujuan,
      tempatTujuanDetail,
      tanggalBerangkat,
      tanggalKembali,
      alatTransportasi,
      subKegiatanId: 'sub-1',
      akunBelanjaId,
      peserta: pesertaList,
      totalEstimasi,
      totalUangMuka: totalEstimasi,
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight">Pengajuan Perjalanan Dinas Baru (e-Perjadin)</h2>
            <p className="text-xs text-slate-300">Sekretariat Daerah Kabupaten Kendal · Tahun Anggaran 2026</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Validasi Sistem:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Section 1: Data Perjalanan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              1. Maksud & Tujuan Perjalanan Dinas
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maksud Perjalanan Dinas (Sesuai DPA / Arahan Pimpinan) *
              </label>
              <textarea
                rows={2}
                value={maksudPerjalanan}
                onChange={e => setMaksudPerjalanan(e.target.value)}
                placeholder="Contoh: Koordinasi Penataan Batas Wilayah dan Administrasi Kewilayahan ke Biro Tata Pemerintahan Setda Provinsi Jawa Tengah"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Wilayah Tujuan *
                </label>
                <select
                  value={kotaTujuan}
                  onChange={e => {
                    setKotaTujuan(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Kota Semarang">Kota Semarang (Jawa Tengah)</option>
                  <option value="DKI Jakarta">DKI Jakarta</option>
                  <option value="Kota Surakarta (Solo)">Kota Surakarta / Solo</option>
                  <option value="Kabupaten Kendal (Wilayah Kecamatan)">Wilayah Kabupaten Kendal (Lokal / Kecamatan)</option>
                  <option value="Daerah Istimewa Yogyakarta">D.I. Yogyakarta</option>
                  <option value="Kota Surabaya">Kota Surabaya (Jawa Timur)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi / Instansi Spesifik Tujuan *
                </label>
                <input
                  type="text"
                  value={tempatTujuanDetail}
                  onChange={e => setTempatTujuanDetail(e.target.value)}
                  placeholder="Contoh: Kantor Gubernur Jateng / Ditjen Bina Pemdes Kemendagri"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Berangkat *
                </label>
                <input
                  type="date"
                  value={tanggalBerangkat}
                  onChange={e => setTanggalBerangkat(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kembali *
                </label>
                <input
                  type="date"
                  value={tanggalKembali}
                  onChange={e => setTanggalKembali(e.target.value)}
                  min={tanggalBerangkat}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Pelaksanaan
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>{lamaHari} Hari Kerja</span>
                  <span className="text-slate-500">({lamaMalam} Malam)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Moda Transportasi
              </label>
              <select
                value={alatTransportasi}
                onChange={e => setAlatTransportasi(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="Kendaraan Dinas Operasional">Kendaraan Dinas Operasional</option>
                <option value="Kereta Api Eksekutif & Darat">Kereta Api Eksekutif & Darat</option>
                <option value="Pesawat Terbang Kelas Ekonomi">Pesawat Terbang Kelas Ekonomi</option>
                <option value="Kendaraan Umum / Bus">Kendaraan Umum / Bus</option>
              </select>
            </div>
          </div>

          {/* Section 2: Pembebanan Anggaran & Cek Pagu (ANG-06, BR-02) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              2. Pembebanan Rekening Belanja & Cek Sisa Pagu
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Rekening Belanja yang Dibebani *
              </label>
              <select
                value={akunBelanjaId}
                onChange={e => setAkunBelanjaId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                required
              >
                {akunBelanjaList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.kodeRekening} - {a.uraian} (Pagu: {formatRupiah(a.pagu)})
                  </option>
                ))}
              </select>
            </div>

            {selectedAkun && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Pagu DPA</span>
                  <span className="font-mono font-semibold text-slate-800">{formatRupiah(selectedAkun.pagu)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Realisasi SPJ</span>
                  <span className="font-mono font-semibold text-emerald-700">{formatRupiah(selectedAkun.realisasi)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Komitmen Berjalan</span>
                  <span className="font-mono font-semibold text-blue-700">{formatRupiah(selectedAkun.komitmen)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Sisa Pagu Tersedia (BR-01)</span>
                  <span className={`font-mono font-bold ${sisaPagu <= 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatRupiah(sisaPagu)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Peserta & Rincian Estimasi Biaya (PRJ-02, PRJ-03) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Daftar Peserta & Rincian Komponen Biaya (Estimasi SBU)
              </h3>
              <button
                type="button"
                onClick={handleRecalculateEstimates}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Hitung Ulang Tarif Master SBU</span>
              </button>
            </div>

            {/* Add Participant Input */}
            <div className="flex gap-2">
              <select
                value={selectedUserToAdd}
                onChange={e => setSelectedUserToAdd(e.target.value)}
                className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">-- Pilih Pegawai untuk Ditambahkan sebagai Peserta --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nama} ({u.nip}) - {u.golongan}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Peserta</span>
              </button>
            </div>

            {/* Participant Cards with Component Breakdown */}
            <div className="space-y-3">
              {pesertaList.map((pst, pIdx) => (
                <div key={pst.id || pIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-slate-900">{pst.nama}</strong>
                      <div className="text-[11px] text-slate-500 font-mono">
                        NIP. {pst.nip} · {pst.jabatan} · {pst.golongan}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-emerald-800">
                        Subtotal: {formatRupiah(pst.totalEstimasi)}
                      </span>
                      {pesertaList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(pIdx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Hapus Peserta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Components list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 text-xs">
                    {pst.komponenBiaya.map((k, kIdx) => (
                      <div key={k.id || kIdx} className="bg-white p-2 rounded-lg border border-slate-200">
                        <label className="block text-[11px] text-slate-600 font-medium truncate mb-1">
                          {k.uraian}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={k.nominalEstimasi}
                            onChange={e => handleUpdateComponent(pIdx, kIdx, Number(e.target.value) || 0)}
                            className="w-full text-xs pl-8 pr-2 py-1 rounded border border-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary & Budget Check Result */}
            <div className={`p-4 rounded-xl border ${isBudgetExceeded ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'} flex items-center justify-between`}>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">Total Estimasi Seluruh Peserta:</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {formatRupiah(totalEstimasi)}
                </div>
                <div className="text-[11px] text-slate-600">
                  Sisa Pagu Tersedia: <strong className="font-mono">{formatRupiah(sisaPagu)}</strong>
                </div>
              </div>

              <div className="text-right">
                {isBudgetExceeded ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Melebihi Sisa Pagu (Ditolak BR-02)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pagu Mencukupi (Siap Diajukan)</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isBudgetExceeded}
              className={`px-5 py-2.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                isBudgetExceeded 
                  ? 'bg-slate-400 cursor-not-allowed opacity-60' 
                  : 'bg-emerald-700 hover:bg-emerald-800 shadow-xs'
              }`}
            >
              <span>Ajukan Perjalanan ke Atasan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
