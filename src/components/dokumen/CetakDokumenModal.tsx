import React from 'react';
import { useApp } from '../../context/AppContext';
import { PerjalananDinas } from '../../types';
import { formatRupiah, formatTanggalIndo, terbilang } from '../../utils/formatters';
import { Printer, X, ShieldCheck, QrCode } from 'lucide-react';

interface CetakDokumenModalProps {
  isOpen: boolean;
  docType: 'spt' | 'laporan' | 'rincian_biaya';
  perjalanan: PerjalananDinas | null;
  onClose: () => void;
}

export const CetakDokumenModal: React.FC<CetakDokumenModalProps> = ({
  isOpen,
  docType,
  perjalanan,
  onClose,
}) => {
  const { pejabatList, pengaturan } = useApp();

  if (!isOpen || !perjalanan) return null;

  const kpa = pejabatList.find(p => p.peran === 'kpa') || pejabatList[0];
  const pptk = pejabatList.find(p => p.peran === 'pptk') || pejabatList[1];
  const bendahara = pejabatList.find(p => p.peran === 'bendahara_pengeluaran_pembantu') || pejabatList[2];

  const handlePrint = () => {
    window.print();
  };

  const totalBiayaTampil = perjalanan.status === 'selesai' || perjalanan.status === 'terverifikasi_bendahara'
    ? perjalanan.totalRealisasi
    : perjalanan.totalEstimasi;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar (no-print) */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold tracking-tight">
              Pratinjau Cetak Dokumen Resmi (e-Perjadin Kendal)
            </h2>
            <p className="text-xs text-slate-300">
              {docType === 'spt' ? 'Surat Perintah Tugas (SPT) Resmi' :
               docType === 'laporan' ? 'Laporan Hasil Pelaksanaan Perjalanan Dinas' :
               'Rincian Biaya & Tanda Terima Kuitansi'} · Siap Cetak A4
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Ctrl + P)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
          
          <div className="printable-document bg-white w-full max-w-[210mm] p-10 shadow-sm border border-slate-200 text-slate-900 font-serif leading-relaxed text-xs">
            
            {/* ========================================================== */}
            {/* DOK-01: SURAT PERINTAH TUGAS (SPT) RESMI                    */}
            {/* ========================================================== */}
            {docType === 'spt' && (
              <div className="space-y-6">
                
                {/* Official Kendal Kop Surat */}
                <div className="border-b-4 border-double border-slate-900 pb-3 text-center space-y-0.5 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    Pemerintah Kabupaten Kendal
                  </h3>
                  <h2 className="text-base font-extrabold uppercase text-slate-900">
                    Sekretariat Daerah
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {pengaturan.alamatKantor} · Telp. (0294) 381232 · Fax. (0294) 381232 Kendal 51311
                  </p>
                </div>

                {/* Judul & Nomor SPT */}
                <div className="text-center space-y-1 font-sans">
                  <h1 className="text-sm font-extrabold uppercase tracking-wider underline">
                    Surat Perintah Tugas
                  </h1>
                  <p className="text-xs font-mono font-semibold text-slate-800">
                    Nomor : {perjalanan.nomorSPT || '090/...../Bag.Pem/2026'}
                  </p>
                </div>

                {/* Dasar Hukum */}
                <div className="space-y-1">
                  <div className="flex items-start gap-4">
                    <span className="font-sans font-bold w-20 shrink-0">Dasar :</span>
                    <ol className="list-decimal pl-4 space-y-1 text-justify">
                      <li>Peraturan Bupati Kendal tentang Standar Biaya Masukan Tahun Anggaran 2026;</li>
                      <li>Dokumen Pelaksanaan Anggaran (DPA) Sub Kegiatan 4.01.02.2.01.0002 Pengelolaan Administrasi Kewilayahan Bagian Pemerintahan Setda Kabupaten Kendal Tahun Anggaran 2026.</li>
                    </ol>
                  </div>
                </div>

                <div className="text-center font-sans font-bold uppercase tracking-widest py-1">
                  Memerintahkan :
                </div>

                {/* Kepada / Menugaskan */}
                <div className="space-y-2">
                  <span className="font-sans font-bold block">Kepada :</span>
                  <div className="space-y-2 pl-4">
                    {perjalanan.peserta.map((pst, idx) => (
                      <div key={pst.id} className="grid grid-cols-12 gap-2 text-xs">
                        <span className="col-span-1">{idx + 1}.</span>
                        <div className="col-span-11 space-y-0.5">
                          <p className="font-bold font-sans">{pst.nama}</p>
                          <p className="font-mono text-[11px] text-slate-700">NIP. {pst.nip}</p>
                          <p className="text-[11px]">{pst.golongan} / {pst.jabatan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Untuk */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-start gap-4">
                    <span className="font-sans font-bold w-20 shrink-0">Untuk :</span>
                    <div className="space-y-1 text-justify flex-1">
                      <p>
                        1. Melaksanakan perjalanan dinas dalam rangka: <strong>{perjalanan.maksudPerjalanan}</strong>;
                      </p>
                      <p>
                        2. Tujuan: <strong>{perjalanan.tempatTujuanDetail} ({perjalanan.kotaTujuan})</strong>;
                      </p>
                      <p>
                        3. Waktu pelaksanaan selama <strong>{perjalanan.lamaHari} ({perjalanan.lamaHari === 1 ? 'satu' : perjalanan.lamaHari === 2 ? 'dua' : 'tiga'}) hari</strong>, terhitung mulai tanggal <strong>{formatTanggalIndo(perjalanan.tanggalBerangkat)}</strong> sampai dengan <strong>{formatTanggalIndo(perjalanan.tanggalKembali)}</strong>;
                      </p>
                      <p>
                        4. Melaporkan hasil pelaksanaan tugas kepada atasan setelah selesai melaksanakan tugas;
                      </p>
                      <p>
                        5. Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tanggal & Tanda Tangan Pejabat (DOK-05) */}
                <div className="pt-8 flex justify-end font-sans">
                  <div className="text-center w-72 space-y-1">
                    <p>Ditetapkan di {pengaturan.kotaSurat}</p>
                    <p>Pada tanggal {formatTanggalIndo(perjalanan.tanggalSPT || perjalanan.tanggalBerangkat)}</p>
                    <p className="font-bold text-slate-900 mt-2">
                      An. Sekretaris Daerah Kabupaten Kendal
                    </p>
                    <p className="text-[11px] font-semibold text-slate-700">
                      Kepala Bagian Pemerintahan selaku KPA
                    </p>
                    <div className="h-20 flex items-center justify-center italic text-slate-300">
                      (Tanda Tangan & Cap Dinas)
                    </div>
                    <p className="font-bold underline text-slate-900">{kpa.nama}</p>
                    <p className="font-mono text-[11px] text-slate-600">NIP. {kpa.nip}</p>
                  </div>
                </div>

                {/* QR Code Verifikasi (DOK-06) */}
                <div className="pt-6 border-t border-slate-300 flex items-center justify-between font-sans text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-100 border border-slate-300 rounded">
                      <QrCode className="w-7 h-7 text-slate-800" />
                    </div>
                    <div>
                      <p className="font-bold font-mono text-slate-800">{perjalanan.kodeVerifikasiQR}</p>
                      <p>Dokumen Resmi e-Perjadin Kendal · Versi Dokumen: {perjalanan.versiTemplateDipakai}</p>
                    </div>
                  </div>
                  <div>
                    Dicetak pada: {formatTanggalIndo(new Date().toISOString().split('T')[0])}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* DOK-02: LAPORAN KEGIATAN PERJALANAN DINAS                   */}
            {/* ========================================================== */}
            {docType === 'laporan' && (
              <div className="space-y-6">
                
                <div className="border-b-2 border-slate-900 pb-3 text-center space-y-0.5 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    Pemerintah Kabupaten Kendal · Sekretariat Daerah
                  </h3>
                  <h2 className="text-sm font-extrabold uppercase text-slate-900">
                    Laporan Hasil Pelaksanaan Perjalanan Dinas
                  </h2>
                </div>

                <div className="space-y-4 text-justify">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900">I. Dasar Pelaksanaan Tugas</h3>
                    <p className="pl-4 mt-1">{perjalanan.laporanKegiatan.dasarPelaksanaan || `Surat Perintah Tugas Nomor: ${perjalanan.nomorSPT}`}</p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">II. Maksud dan Tujuan</h3>
                    <p className="pl-4 mt-1">{perjalanan.laporanKegiatan.maksudTujuan || perjalanan.maksudPerjalanan}</p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">III. Waktu dan Tempat Pelaksanaan</h3>
                    <p className="pl-4 mt-1">
                      Dilaksanakan pada tanggal {formatTanggalIndo(perjalanan.tanggalBerangkat)} s.d. {formatTanggalIndo(perjalanan.tanggalKembali)} di {perjalanan.tempatTujuanDetail} ({perjalanan.kotaTujuan}).
                    </p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">IV. Uraian Jalannya Kegiatan</h3>
                    <p className="pl-4 mt-1 whitespace-pre-line">
                      {perjalanan.laporanKegiatan.uraianKegiatan || 'Uraian koordinasi dan konsultasi teknis terlaksana sesuai dengan agenda yang direncanakan.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">V. Hasil yang Dicapai</h3>
                    <p className="pl-4 mt-1 whitespace-pre-line">
                      {perjalanan.laporanKegiatan.hasilKegiatan || 'Tercapai kesepahaman dan penyerahan data dukung sinkronisasi batas wilayah.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">VI. Kesimpulan dan Tindak Lanjut</h3>
                    <p className="pl-4 mt-1 whitespace-pre-line">
                      {perjalanan.laporanKegiatan.kesimpulanTindakLanjut || 'Tindak lanjut akan dikoordinasikan bersama pihak terkait.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-slate-900">VII. Penutup</h3>
                    <p className="pl-4 mt-1">
                      {perjalanan.laporanKegiatan.penutup || 'Demikian laporan hasil pelaksanaan tugas perjalanan dinas ini disampaikan sebagai bahan pertanggungjawaban.'}
                    </p>
                  </div>
                </div>

                {/* Tanda Tangan Pelapor / Peserta */}
                <div className="pt-8 flex justify-end font-sans">
                  <div className="text-center w-64 space-y-1">
                    <p>Kendal, {formatTanggalIndo(perjalanan.tanggalKembali)}</p>
                    <p className="font-bold text-slate-900">Pegawai yang Melaksanakan Tugas,</p>
                    <div className="h-20 flex items-center justify-center italic text-slate-300">
                      (Tanda Tangan Basah)
                    </div>
                    <p className="font-bold underline text-slate-900">{perjalanan.peserta[0]?.nama}</p>
                    <p className="font-mono text-[11px] text-slate-600">NIP. {perjalanan.peserta[0]?.nip}</p>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* DOK-03 & KEU-07: RINCIAN BIAYA & TANDA TERIMA KUITANSI     */}
            {/* ========================================================== */}
            {docType === 'rincian_biaya' && (
              <div className="space-y-6">
                
                <div className="border-b-2 border-slate-900 pb-3 text-center space-y-0.5 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    Pemerintah Kabupaten Kendal · Sekretariat Daerah
                  </h3>
                  <h2 className="text-sm font-extrabold uppercase text-slate-900">
                    Rincian Biaya Perjalanan Dinas & Tanda Terima Uang
                  </h2>
                  <p className="text-[11px] font-mono text-slate-600">
                    Lampiran SPT Nomor : {perjalanan.nomorSPT || '-'}
                  </p>
                </div>

                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-xs border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th className="border border-slate-900 p-2 w-10">No</th>
                        <th className="border border-slate-900 p-2">Nama Peserta / NIP</th>
                        <th className="border border-slate-900 p-2">Rincian Komponen Biaya</th>
                        <th className="border border-slate-900 p-2 text-right w-28">Jumlah (Rp)</th>
                        <th className="border border-slate-900 p-2 w-28">Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perjalanan.peserta.map((pst, idx) => (
                        <tr key={pst.id}>
                          <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 p-2">
                            <p className="font-bold">{pst.nama}</p>
                            <p className="font-mono text-[10px] text-slate-600">NIP. {pst.nip}</p>
                            <p className="text-[10px] text-slate-500">{pst.golongan}</p>
                          </td>
                          <td className="border border-slate-900 p-2">
                            <ul className="space-y-0.5 text-[11px]">
                              {pst.komponenBiaya.map(k => (
                                <li key={k.id} className="flex justify-between">
                                  <span>{k.uraian}</span>
                                  <span className="font-mono font-semibold">{formatRupiah(k.nominalRealisasi || k.nominalEstimasi)}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="border border-slate-900 p-2 text-right font-mono font-bold">
                            {formatRupiah(pst.totalRealisasi || pst.totalEstimasi)}
                          </td>
                          <td className="border border-slate-900 p-2 text-center italic text-slate-300">
                            {idx + 1}. ..................
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                        <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase">
                          Jumlah Total Pembayaran :
                        </td>
                        <td className="border border-slate-900 p-2 text-right font-mono font-extrabold text-sm">
                          {formatRupiah(totalBiayaTampil)}
                        </td>
                        <td className="border border-slate-900 p-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terbilang Otomatis (KEU-07) */}
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-xs font-sans">
                  <span className="font-bold text-slate-800">Terbilang : </span>
                  <span className="italic font-semibold text-slate-900 capitalize">
                    {terbilang(totalBiayaTampil)}
                  </span>
                </div>

                {/* Dual Signatures */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                  <div>
                    <p className="font-bold text-slate-900">Lunas Dibayar,</p>
                    <p className="text-slate-600 text-[11px]">Bendahara Pengeluaran Pembantu</p>
                    <div className="h-16 flex items-center justify-center italic text-slate-300">
                      (Tanda Tangan)
                    </div>
                    <p className="font-bold underline text-slate-900">{bendahara.nama}</p>
                    <p className="font-mono text-[11px] text-slate-600">NIP. {bendahara.nip}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                    <p className="text-slate-600 text-[11px]">Ketua Tim Kerja Administrasi Kewilayahan</p>
                    <div className="h-16 flex items-center justify-center italic text-slate-300">
                      (Tanda Tangan)
                    </div>
                    <p className="font-bold underline text-slate-900">{pptk.nama}</p>
                    <p className="font-mono text-[11px] text-slate-600">NIP. {pptk.nip}</p>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
