import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatTanggalWaktu } from '../../utils/formatters';
import { 
  FileCode2, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  X,
  Code2
} from 'lucide-react';
import { TemplateDokumen } from '../../types';

export const TemplateDokumenView: React.FC = () => {
  const { templateList, simpanTemplate } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDokumen | null>(templateList[0] || null);
  const [templateName, setTemplateName] = useState(selectedTemplate?.nama || '');
  const [templateJenis, setTemplateJenis] = useState<TemplateDokumen['jenis']>(selectedTemplate?.jenis || 'spt');
  const [templateContent, setTemplateContent] = useState(selectedTemplate?.content || '');

  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    unknownPlaceholders: string[];
  } | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Available valid placeholders list (TPL-05)
  const availablePlaceholders = [
    { tag: '{nomor_spt}', desc: 'Nomor resmi SPT' },
    { tag: '{nama_pegawai}', desc: 'Nama pegawai pelaksana tugas' },
    { tag: '{nip}', desc: 'Nomor Induk Pegawai' },
    { tag: '{jabatan}', desc: 'Jabatan resmi pegawai' },
    { tag: '{golongan}', desc: 'Pangkat dan golongan ruang' },
    { tag: '{tujuan}', desc: 'Kota dan instansi tujuan' },
    { tag: '{tanggal_berangkat}', desc: 'Tanggal mulai perjalanan dinas' },
    { tag: '{tanggal_kembali}', desc: 'Tanggal selesai tugas' },
    { tag: '{maksud_perjalanan}', desc: 'Maksud & uraian penugasan' },
    { tag: '{alat_transportasi}', desc: 'Moda kendaraan yang digunakan' },
    { tag: '{total_biaya}', desc: 'Total biaya nominal (Rp)' },
    { tag: '{terbilang}', desc: 'Nominal dalam ejaan kata bahasa Indonesia' },
    { tag: '{penandatangan}', desc: 'Nama & NIP pejabat penandatangan' },
    { tag: '{unit_kerja}', desc: 'Nama instansi / Bagian Pemerintah' },
  ];

  // Select a template from the list
  const handleSelectTemplate = (tpl: TemplateDokumen) => {
    setSelectedTemplate(tpl);
    setTemplateName(tpl.nama);
    setTemplateJenis(tpl.jenis);
    setTemplateContent(tpl.content);
    setValidationResult(null);
  };

  // Save template with validation (TPL-02 & AC-07)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationResult(null);

    const res = simpanTemplate(
      {
        nama: templateName,
        jenis: templateJenis,
        content: templateContent,
        placeholders: [],
      },
      selectedTemplate?.id
    );

    setValidationResult(res);
  };

  // Generate preview content with sample data (TPL-03)
  const getRenderedPreview = () => {
    let rendered = templateContent;
    const sampleData: Record<string, string> = {
      '{nomor_spt}': '090/088/Bag.Pem/2026',
      '{nama_pegawai}': 'Ahmad Fauzi, S.Kom',
      '{nip}': '19890714 201101 1 005',
      '{jabatan}': 'Pranata Komputer Ahli Pertama',
      '{golongan}': 'Penata (III/c)',
      '{tujuan}': 'Biro Tata Pemerintahan Setda Provinsi Jateng, Semarang',
      '{tanggal_berangkat}': '15 Februari 2026',
      '{tanggal_kembali}': '16 Februari 2026',
      '{maksud_perjalanan}': 'Koordinasi Penataan Batas Wilayah dan Administrasi Kewilayahan',
      '{alat_transportasi}': 'Kendaraan Dinas Operasional',
      '{total_biaya}': 'Rp 2.980.000',
      '{terbilang}': 'Dua Juta Sembilan Ratus Delapan Puluh Ribu Rupiah',
      '{penandatangan}': 'Dra. Nurhasanah, M.M. (NIP. 19740512 199803 2 004)',
      '{unit_kerja}': 'Sekretariat Daerah Kabupaten Kendal',
      '{dasar}': 'DPA-SKPD No. 4.01.02.2.01.0002 Tahun Anggaran 2026',
      '{maksud_tujuan}': 'Konsultasi sinkronisasi data batas kewilayahan',
      '{waktu_tempat}': 'Semarang, 15 - 16 Februari 2026',
      '{uraian}': 'Melakukan koordinasi dengan Bagian Tapem Pemprov Jateng',
      '{hasil}': 'Tersusun draft naskah kesepakatan batas daerah',
      '{kesimpulan}': 'Penyusunan peta spasial skala 1:5000',
      '{penutup}': 'Demikian laporan ini dibuat sebagai pertanggungjawaban',
      '{pelapor}': 'Ahmad Fauzi, S.Kom',
      '{bulan}': 'Februari',
      '{tahun_anggaran}': '2026',
      '{sub_kegiatan}': 'Pengelolaan Administrasi Kewilayahan',
      '{empat_penandatangan}': 'KPA, PPTK, Bendahara, Pembantu Bendahara',
    };

    Object.keys(sampleData).forEach(tag => {
      rendered = rendered.split(tag).join(sampleData[tag]);
    });

    return rendered;
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Kelola Template Dokumen Resmi (TPL)
        </h1>
        <p className="text-xs text-slate-500">
          Template format dinamis dengan penanda data (placeholders) dan versioning dokumen (TPL-01 s/d TPL-05)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Template List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Template Tersimpan
            </span>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setTemplateName('');
                setTemplateJenis('spt');
                setTemplateContent('KOP SURAT PEMKAB KENDAL\nNomor: {nomor_spt}\nMenugaskan: {nama_pegawai} ({nip})\nTujuan: {tujuan}\nTanggal: {tanggal_berangkat}');
                setValidationResult(null);
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Baru</span>
            </button>
          </div>

          <div className="space-y-2">
            {templateList.map(t => {
              const isSelected = selectedTemplate?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{t.nama}</span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                      v{t.versi}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-1 flex items-center justify-between">
                    <span className="capitalize">{t.jenis.replace(/_/g, ' ')}</span>
                    <span>{t.placeholders.length} Penanda</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Available Placeholders Reference List (TPL-05) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Penanda Data Valid (TPL-05)</span>
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-[11px]">
              {availablePlaceholders.map(p => (
                <div key={p.tag} className="p-1.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-800">{p.tag}</span>
                  <span className="text-slate-500 text-[10px]">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Template Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedTemplate ? `Edit Template: ${selectedTemplate.nama}` : 'Buat Template Dokumen Baru'}
              </h3>
              {selectedTemplate && (
                <span className="text-xs text-slate-500">
                  Versi Saat Ini: <strong>v{selectedTemplate.versi}</strong> (TPL-04 & AC-09: Versioning menjaga konsistensi cetak ulang)
                </span>
              )}
            </div>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Contoh (TPL-03)</span>
            </button>
          </div>

          {/* Validation Feedback (TPL-02 & AC-07) */}
          {validationResult && (
            <div className={`p-4 rounded-xl text-xs border ${
              validationResult.success 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {validationResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-semibold">
                    {validationResult.success ? 'Berhasil:' : 'Validasi Penanda Data Tidak Dikenal (AC-07):'}
                  </strong>
                  <p>{validationResult.message}</p>
                  {validationResult.unknownPlaceholders.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {validationResult.unknownPlaceholders.map(u => (
                        <span key={u} className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono font-bold rounded">
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Template *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Dokumen *</label>
                <select
                  value={templateJenis}
                  onChange={e => setTemplateJenis(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="spt">Surat Perintah Tugas (SPT)</option>
                  <option value="laporan">Laporan Hasil Kegiatan</option>
                  <option value="rincian_biaya">Rincian Biaya & Kuitansi</option>
                  <option value="surat_pengantar_spj">Surat Pengantar SPJ</option>
                  <option value="pk6">Format PK6 (Buku Pembantu)</option>
                  <option value="daftar_pengumpulan">Daftar Pengumpulan</option>
                  <option value="dokumen_a2">Dokumen A2</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Isi Format Template & Penanda Data (TPL-01) *
                </label>
                <span className="text-[11px] text-slate-500">
                  Ketik penanda dalam kurung kurawal, misal: <code className="text-emerald-700">{'{nomor_spt}'}</code>
                </span>
              </div>
              <textarea
                rows={12}
                value={templateContent}
                onChange={e => setTemplateContent(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Template (Validasi Penanda Data)</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Modal Preview With Sample Data (TPL-03) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Template dengan Data Contoh (TPL-03)
              </h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-slate-800 leading-relaxed text-[11px]">
              {getRenderedPreview()}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
