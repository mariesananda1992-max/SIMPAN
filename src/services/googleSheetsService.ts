import { getGoogleAccessToken } from './googleAuth';
import { PerjalananDinas, AkunBelanja, BukuKasEntri } from '../types';
import { formatRupiah } from '../utils/formatters';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheets?: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

export const createEmptySpreadsheet = async (title: string): Promise<SpreadsheetInfo> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal membuat Google Spreadsheet (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
};

export const exportPerjadinToGoogleSheets = async (
  title: string,
  travels: PerjalananDinas[],
  paguAccounts: AkunBelanja[],
  bkuEntries: BukuKasEntri[]
): Promise<SpreadsheetInfo> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  // 1. Create spreadsheet with 3 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Rekap Perjalanan Dinas Setda Kendal - ${new Date().toISOString().split('T')[0]}`,
      },
      sheets: [
        { properties: { title: 'Daftar Perjalanan Dinas' } },
        { properties: { title: 'Realisasi Pagu Anggaran' } },
        { properties: { title: 'Buku Kas Umum (BKU)' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal membuat spreadsheet baru (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Data for Sheet 1: Perjalanan Dinas
  const sheet1Values: (string | number)[][] = [
    ['PEMERINTAH KABUPATEN KENDAL - SEKRETARIAT DAERAH'],
    ['BAGIAN PEMERINTAHAN - LAPORAN REKAPITULASI PERJALANAN DINAS T.A. 2026'],
    [`Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [''],
    [
      'No',
      'Nomor SPT',
      'Maksud Perjalanan',
      'Kota Tujuan',
      'Tgl Berangkat',
      'Tgl Kembali',
      'Lama (Hari)',
      'Pengaju',
      'Peserta',
      'Estimasi Biaya',
      'Realisasi Biaya',
      'Status SPJ',
      'Kode QR Verifikasi',
    ],
  ];

  let totalEstimasiAll = 0;
  let totalRealisasiAll = 0;

  travels.forEach((t, idx) => {
    const pesertaNames = (t.peserta || []).map(p => p.nama).join(', ');
    const est = t.totalEstimasi || 0;
    const real = t.totalRealisasi || est;
    totalEstimasiAll += est;
    totalRealisasiAll += real;

    sheet1Values.push([
      idx + 1,
      t.nomorSPT || '(Belum Terbit SPT)',
      t.maksudPerjalanan,
      t.kotaTujuan,
      t.tanggalBerangkat,
      t.tanggalKembali,
      t.lamaHari,
      t.pegawaiPengajuNama,
      pesertaNames,
      est,
      real,
      t.status.toUpperCase().replace(/_/g, ' '),
      t.kodeVerifikasiQR || '-',
    ]);
  });

  // Summary Row
  sheet1Values.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    '',
    totalEstimasiAll,
    totalRealisasiAll,
    '',
    '',
  ]);

  // 3. Prepare Data for Sheet 2: Realisasi Pagu Anggaran
  const sheet2Values: (string | number)[][] = [
    ['REKAPITULASI PAGU DAN REALISASI BELANJA PERJALANAN DINAS'],
    ['SUB KEGIATAN: PENGELOLAAN ADMINISTRASI KEWILAYAHAN'],
    [''],
    [
      'No',
      'Kode Rekening',
      'Uraian Akun Belanja',
      'Pagu DPA (Rp)',
      'Komitmen (Rp)',
      'Realisasi SPJ (Rp)',
      'Sisa Anggaran (Rp)',
      'Persentase Realisasi (%)',
    ],
  ];

  let totalPaguAll = 0;
  let totalKomitmenAll = 0;
  let totalRealisasiPaguAll = 0;

  paguAccounts.forEach((acc, idx) => {
    const sisa = acc.pagu - acc.realisasi - acc.komitmen;
    const pct = acc.pagu > 0 ? ((acc.realisasi / acc.pagu) * 100).toFixed(2) : '0';
    totalPaguAll += acc.pagu;
    totalKomitmenAll += acc.komitmen;
    totalRealisasiPaguAll += acc.realisasi;

    sheet2Values.push([
      idx + 1,
      acc.kodeRekening,
      acc.uraian,
      acc.pagu,
      acc.komitmen,
      acc.realisasi,
      sisa,
      `${pct}%`,
    ]);
  });

  sheet2Values.push([
    '',
    '',
    'TOTAL BELANJA',
    totalPaguAll,
    totalKomitmenAll,
    totalRealisasiPaguAll,
    totalPaguAll - totalRealisasiPaguAll - totalKomitmenAll,
    totalPaguAll > 0 ? `${((totalRealisasiPaguAll / totalPaguAll) * 100).toFixed(2)}%` : '0%',
  ]);

  // 4. Prepare Data for Sheet 3: Buku Kas Umum (BKU)
  const sheet3Values: (string | number)[][] = [
    ['BUKU KAS UMUM (BKU) PENGELUARAN PEMBANTU'],
    ['BAGIAN PEMERINTAHAN SETDA KABUPATEN KENDAL - T.A. 2026'],
    [''],
    [
      'No',
      'Tanggal',
      'Nomor Bukti',
      'Uraian Pembayaran / Penerimaan',
      'Kode Rekening',
      'Penerimaan / Debet (Rp)',
      'Pengeluaran / Kredit (Rp)',
      'Saldo Kas (Rp)',
    ],
  ];

  bkuEntries.forEach((kas, idx) => {
    sheet3Values.push([
      idx + 1,
      kas.tanggal,
      kas.nomorBukti,
      kas.uraian,
      kas.kodeRekening,
      kas.debet || 0,
      kas.kredit || 0,
      kas.saldoBerjalan,
    ]);
  });

  // 5. Populate all sheets via batchUpdate
  const batchData = [
    {
      range: "'Daftar Perjalanan Dinas'!A1",
      values: sheet1Values,
    },
    {
      range: "'Realisasi Pagu Anggaran'!A1",
      values: sheet2Values,
    },
    {
      range: "'Buku Kas Umum (BKU)'!A1",
      values: sheet3Values,
    },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    const errBody = await updateRes.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal mengisi data spreadsheet (${updateRes.status})`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
};

export const getSpreadsheetPreview = async (
  spreadsheetId: string,
  range: string = 'A1:Z50'
): Promise<{ values: string[][] }> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal membaca isi Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return { values: data.values || [] };
};

export const getSpreadsheetMetadata = async (
  spreadsheetId: string
): Promise<SpreadsheetInfo> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung dengan akun Google.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Gagal mengambil metadata spreadsheet (${res.status})`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title,
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || 'Spreadsheet',
    sheets,
  };
};
