/**
 * Format angka ke format mata uang Rupiah Indonesia
 */
export function formatRupiah(nominal: number | undefined | null): string {
  if (nominal === undefined || nominal === null || isNaN(nominal)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
}

/**
 * Format angka ke angka desimal Indonesia dengan pemisah ribuan titik
 */
export function formatAngka(nominal: number | undefined | null): string {
  if (nominal === undefined || nominal === null || isNaN(nominal)) return '0';
  return new Intl.NumberFormat('id-ID').format(nominal);
}

/**
 * Mengubah angka menjadi teks Terbilang dalam Bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal === 0) return 'Nol Rupiah';

  const angka = Math.abs(Math.round(nominal));
  const huruf = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function bilang(n: number): string {
    if (n < 12) {
      return huruf[n];
    } else if (n < 20) {
      return bilang(n - 10) + ' Belas';
    } else if (n < 100) {
      return bilang(Math.floor(n / 10)) + ' Puluh ' + bilang(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + bilang(n - 100);
    } else if (n < 1000) {
      return bilang(Math.floor(n / 100)) + ' Ratus ' + bilang(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + bilang(n - 1000);
    } else if (n < 1000000) {
      return bilang(Math.floor(n / 1000)) + ' Ribu ' + bilang(n % 1000);
    } else if (n < 1000000000) {
      return bilang(Math.floor(n / 1000000)) + ' Juta ' + bilang(n % 1000000);
    } else if (n < 1000000000000) {
      return bilang(Math.floor(n / 1000000000)) + ' Milyar ' + bilang(n % 1000000000);
    } else {
      return bilang(Math.floor(n / 1000000000000)) + ' Triliun ' + bilang(n % 1000000000000);
    }
  }

  const hasil = bilang(angka).replace(/\s+/g, ' ').trim();
  const awalanMinus = nominal < 0 ? 'Minus ' : '';
  return `${awalanMinus}${hasil} Rupiah`;
}

/**
 * Format tanggal ISO (YYYY-MM-DD) ke Bahasa Indonesia formal
 * Contoh: "2026-03-24" -> "24 Maret 2026"
 */
export function formatTanggalIndo(tanggalIso?: string): string {
  if (!tanggalIso) return '-';
  try {
    const d = new Date(tanggalIso);
    if (isNaN(d.getTime())) return tanggalIso;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return tanggalIso;
  }
}

/**
 * Format tanggal pendek
 * Contoh: "2026-03-24" -> "24/03/2026"
 */
export function formatTanggalPendek(tanggalIso?: string): string {
  if (!tanggalIso) return '-';
  try {
    const d = new Date(tanggalIso);
    if (isNaN(d.getTime())) return tanggalIso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return tanggalIso;
  }
}

/**
 * Format timestamp lengkap dengan waktu
 */
export function formatTanggalWaktu(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const tgl = formatTanggalIndo(isoString.split('T')[0]);
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    return `${tgl} pukul ${jam}:${menit} WIB`;
  } catch {
    return isoString;
  }
}

/**
 * Nama bulan dalam Bahasa Indonesia
 */
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Hitung selisih hari antara dua tanggal inklusif
 */
export function hitungHari(tglMulai: string, tglSelesai: string): number {
  if (!tglMulai || !tglSelesai) return 1;
  const start = new Date(tglMulai);
  const end = new Date(tglSelesai);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Ekspor data tabular menjadi file CSV untuk diunduh di browser
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let cell = val === null || val === undefined ? '' : String(val);
      // Escape double quotes
      cell = cell.replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(';'); // Semicolon is Excel standard for Indonesian locale
  };

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(row => processRow(row))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
