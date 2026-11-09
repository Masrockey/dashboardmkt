<?php

namespace App\Services;

use App\Enums\PameranStatus;
use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use App\Models\User;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Shuchkin\SimpleXLSX;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PameranExcelService
{
    /**
     * Export channels (pameran) to an Excel (.xlsx) spreadsheet.
     *
     * @param  array<string, mixed>|null  $filters
     */
    public function export(?array $filters = null, ?User $user = null): StreamedResponse
    {
        $parseFilter = function (string $key) use ($filters): array {
            $raw = $filters[$key] ?? null;
            if (is_array($raw)) {
                return array_values(array_filter(array_map('strval', $raw), fn ($v) => trim($v) !== ''));
            }
            if (is_string($raw) && trim($raw) !== '') {
                return array_values(array_filter(array_map('trim', explode(',', $raw)), fn ($v) => $v !== ''));
            }

            return [];
        };

        $search = isset($filters['search']) ? trim((string) $filters['search']) : '';
        $dealerFilter = ($user && $user->isDealerOnly())
            ? ($user->dealer_id ? [(string) $user->dealer_id] : [])
            : $parseFilter('dealer_id');
        $jenisFilter = $parseFilter('jenis_pameran_id');
        $statusFilter = $parseFilter('status');
        $kabupatenFilter = $parseFilter('kabupaten');
        $kecamatanFilter = $parseFilter('kecamatan');

        $pamerans = Pameran::query()
            ->with(['dealer', 'jenisPameran', 'creator', 'spvApprover', 'kabagApprover'])
            ->when($user && $user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('dealer_id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('kode_pameran_md', 'like', "%{$search}%")
                        ->orWhere('kode_pameran_ahm', 'like', "%{$search}%")
                        ->orWhere('kabupaten', 'like', "%{$search}%")
                        ->orWhere('kecamatan', 'like', "%{$search}%")
                        ->orWhere('detail_alamat', 'like', "%{$search}%")
                        ->orWhereHas('dealer', function (Builder $dq) use ($search) {
                            $dq->where('kode_dealer', 'like', "%{$search}%")
                                ->orWhere('nama_dealer', 'like', "%{$search}%");
                        })
                        ->orWhereHas('jenisPameran', function (Builder $jq) use ($search) {
                            $jq->where('kode_pameran', 'like', "%{$search}%")
                                ->orWhere('jenis_pameran', 'like', "%{$search}%");
                        });
                });
            })
            ->when(! empty($dealerFilter), fn ($q) => $q->whereIn('dealer_id', $dealerFilter))
            ->when(! empty($jenisFilter), fn ($q) => $q->whereIn('jenis_pameran_id', $jenisFilter))
            ->when(! empty($statusFilter), fn ($q) => $q->whereIn('status', $statusFilter))
            ->when(! empty($kabupatenFilter), fn ($q) => $q->whereIn('kabupaten', $kabupatenFilter))
            ->when(! empty($kecamatanFilter), fn ($q) => $q->whereIn('kecamatan', $kecamatanFilter))
            ->latest('id')
            ->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Channel');

        $spreadsheet->getProperties()
            ->setCreator('Dashboard Marketing')
            ->setTitle('Data Channel Pameran');

        // Document Title Banner (Rows 1 & 2)
        $sheet->mergeCells('A1:R1');
        $sheet->setCellValue('A1', 'DATA JADWAL CHANNEL & PAMERAN PCD');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new Color('CC0000'));
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $subtitle = 'Tanggal Ekspor: '.now()->translatedFormat('d F Y H:i').' WITA | Total: '.$pamerans->count().' Channel';
        if ($search !== '') {
            $subtitle .= ' | Pencarian: '.$search;
        }
        $sheet->mergeCells('A2:R2');
        $sheet->setCellValue('A2', $subtitle);
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10)->setColor(new Color('666666'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header Row (Row 4)
        $headers = [
            'A' => 'NO',
            'B' => 'STATUS',
            'C' => 'KODE CHANNEL MD',
            'D' => 'KODE CHANNEL AHM',
            'E' => 'KODE DEALER',
            'F' => 'NAMA DEALER',
            'G' => 'KODE JENIS',
            'H' => 'NAMA JENIS CHANNEL',
            'I' => 'MULAI SEWA',
            'J' => 'AKHIR SEWA',
            'K' => 'KABUPATEN',
            'L' => 'KECAMATAN',
            'M' => 'DETAIL ALAMAT',
            'N' => 'LATITUDE',
            'O' => 'LONGITUDE',
            'P' => 'CATATAN PENOLAKAN',
            'Q' => 'CATATAN APPROVAL',
            'R' => 'TANGGAL DIBUAT',
        ];

        foreach ($headers as $col => $text) {
            $sheet->setCellValue($col.'4', $text);
        }

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 10,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFDC2626'], // Honda Red
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFB91C1C'],
                ],
            ],
        ];
        $sheet->getStyle('A4:R4')->applyFromArray($headerStyle);
        $sheet->getRowDimension(4)->setRowHeight(26);

        // Data Rows
        $row = 5;
        foreach ($pamerans as $index => $item) {
            $statusLabel = match ($item->status) {
                PameranStatus::MenungguSpv => 'Menunggu SPV',
                PameranStatus::MenungguKabag => 'Menunggu Kabag',
                PameranStatus::Disetujui => 'Disetujui',
                PameranStatus::Ditolak => 'Ditolak',
                default => (string) ($item->status?->value ?? $item->status),
            };

            $sheet->setCellValue('A'.$row, $index + 1);
            $sheet->setCellValue('B'.$row, $statusLabel);
            $sheet->setCellValue('C'.$row, $item->kode_pameran_md ?? '-');
            $sheet->setCellValue('D'.$row, $item->kode_pameran_ahm ?? '-');
            $sheet->setCellValue('E'.$row, $item->dealer?->kode_dealer ?? '-');
            $sheet->setCellValue('F'.$row, $item->dealer?->nama_dealer ?? '-');
            $sheet->setCellValue('G'.$row, $item->jenisPameran?->kode_pameran ?? '-');
            $sheet->setCellValue('H'.$row, $item->jenisPameran?->jenis_pameran ?? '-');
            $sheet->setCellValue('I'.$row, $item->mulai_tanggal_sewa ? Carbon::parse($item->mulai_tanggal_sewa)->format('Y-m-d') : '-');
            $sheet->setCellValue('J'.$row, $item->tanggal_sewa_berakhir ? Carbon::parse($item->tanggal_sewa_berakhir)->format('Y-m-d') : '-');
            $sheet->setCellValue('K'.$row, $item->kabupaten ?? '-');
            $sheet->setCellValue('L'.$row, $item->kecamatan ?? '-');
            $sheet->setCellValue('M'.$row, $item->detail_alamat ?? '-');
            $sheet->setCellValue('N'.$row, $item->latitude ?? '-');
            $sheet->setCellValue('O'.$row, $item->longitude ?? '-');
            $sheet->setCellValue('P'.$row, $item->catatan_penolakan ?? '-');
            $sheet->setCellValue('Q'.$row, $item->catatan_approval ?? '-');
            $sheet->setCellValue('R'.$row, $item->created_at ? Carbon::parse($item->created_at)->format('Y-m-d H:i') : '-');

            if ($index % 2 === 1) {
                $sheet->getStyle('A'.$row.':R'.$row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFF9FAFB');
            }

            $sheet->getRowDimension($row)->setRowHeight(20);
            $row++;
        }

        $lastRow = max(5, $row - 1);
        $dataBorderStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFE5E7EB'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];
        $sheet->getStyle('A5:R'.$lastRow)->applyFromArray($dataBorderStyle);

        $sheet->getStyle('A5:A'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B5:E'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('G5:G'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('I5:J'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('N5:O'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('R5:R'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        foreach (range('A', 'R') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Data-Channel-Pameran-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Download template Excel for importing channel exhibitions.
     */
    public function template(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;

        // Sheet 1: Template Import Channel
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Import Channel');

        $headers = [
            'A1' => 'KODE DEALER',
            'B1' => 'NAMA DEALER',
            'C1' => 'KODE JENIS CHANNEL',
            'D1' => 'NAMA JENIS CHANNEL',
            'E1' => 'MULAI SEWA',
            'F1' => 'AKHIR SEWA',
            'G1' => 'KABUPATEN',
            'H1' => 'KECAMATAN',
            'I1' => 'DETAIL ALAMAT',
            'J1' => 'KODE CHANNEL AHM',
            'K1' => 'LATITUDE',
            'L1' => 'LONGITUDE',
            'M1' => 'STATUS',
        ];

        foreach ($headers as $cell => $text) {
            $sheet->setCellValue($cell, $text);
        }

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 10,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E293B'], // Slate 800
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF0F172A'],
                ],
            ],
        ];
        $sheet->getStyle('A1:M1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(24);

        // Fetch sample real dealers and jenis pameran for realistic examples
        $sampleDealers = Dealer::take(3)->get();
        $sampleJenis = JenisPameran::take(3)->get();

        $d1 = $sampleDealers->get(0);
        $d2 = $sampleDealers->get(1) ?? $d1;
        $j1 = $sampleJenis->get(0);
        $j2 = $sampleJenis->get(1) ?? $j1;

        $sampleRows = [
            [
                $d1?->kode_dealer ?? '9226',
                $d1?->nama_dealer ?? 'SO Ampenan',
                $j1?->kode_pameran ?? 'PMR',
                $j1?->jenis_pameran ?? 'PAMERAN TENDA',
                now()->format('Y-m-d'),
                now()->addMonth()->format('Y-m-d'),
                'Lombok Barat',
                'Gerung',
                'Jalan Raya Meninting No. 12 Depan Alfamart',
                'AHM-001',
                '-8.556323',
                '116.126380',
                'Menunggu SPV',
            ],
            [
                $d2?->kode_dealer ?? '12703',
                $d2?->nama_dealer ?? 'SO Sriwijaya',
                $j2?->kode_pameran ?? 'PMRPLS',
                $j2?->jenis_pameran ?? 'PAMERAN PLUS (RUKO)',
                now()->addDays(2)->format('Y-m-d'),
                now()->addMonths(2)->format('Y-m-d'),
                'Lombok Tengah',
                'Praya',
                'Kompleks Pertokoan Praya Blok B3',
                '',
                '-8.673667',
                '116.135359',
                'Disetujui',
            ],
        ];

        $r = 2;
        foreach ($sampleRows as $row) {
            foreach (range('A', 'M') as $idx => $col) {
                $sheet->setCellValue($col.$r, $row[$idx]);
            }
            $sheet->getRowDimension($r)->setRowHeight(20);
            $r++;
        }

        $sheet->getStyle('A2:M'.($r - 1))->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFE2E8F0'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Sheet 2: Referensi Master Data
        $refSheet = $spreadsheet->createSheet();
        $refSheet->setTitle('Referensi Master Data');

        // Dealer Table Header
        $refSheet->setCellValue('A1', 'KODE DEALER');
        $refSheet->setCellValue('B1', 'NAMA DEALER');
        $refSheet->getStyle('A1:B1')->applyFromArray($headerStyle);

        $dealers = Dealer::query()->select(['kode_dealer', 'nama_dealer'])->orderBy('nama_dealer')->get();
        $dRow = 2;
        foreach ($dealers as $dealer) {
            $refSheet->setCellValue('A'.$dRow, $dealer->kode_dealer);
            $refSheet->setCellValue('B'.$dRow, $dealer->nama_dealer);
            $dRow++;
        }

        // Jenis Pameran Table Header
        $refSheet->setCellValue('D1', 'KODE JENIS');
        $refSheet->setCellValue('E1', 'NAMA JENIS CHANNEL');
        $refSheet->getStyle('D1:E1')->applyFromArray($headerStyle);

        $jenisList = JenisPameran::query()->select(['kode_pameran', 'jenis_pameran'])->orderBy('jenis_pameran')->get();
        $jRow = 2;
        foreach ($jenisList as $jp) {
            $refSheet->setCellValue('D'.$jRow, $jp->kode_pameran);
            $refSheet->setCellValue('E'.$jRow, $jp->jenis_pameran);
            $jRow++;
        }

        foreach (['A', 'B', 'C', 'D', 'E'] as $col) {
            $refSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Return to first sheet active
        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'Template-Import-Channel-Pameran.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Import channels from uploaded Excel or CSV file.
     *
     * @return array{imported: int, skipped: int, errors: array<int, string>}
     */
    public function import(UploadedFile $file, ?User $user = null): array
    {
        $filePath = $file->getRealPath();
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = [];

        if ($extension === 'csv') {
            $rows = $this->parseCsv($filePath);
        } else {
            if (class_exists(SimpleXLSX::class) && ($xlsx = SimpleXLSX::parse($filePath))) {
                $rows = $xlsx->rows();
            } else {
                $spreadsheet = IOFactory::load($filePath);
                $sheet = $spreadsheet->getActiveSheet();
                $rows = $sheet->toArray(null, true, true, false);
            }
        }

        if (empty($rows) || count($rows) < 2) {
            return [
                'imported' => 0,
                'skipped' => 0,
                'errors' => ['File kosong atau tidak memiliki baris data.'],
            ];
        }

        // Header mapping
        $headerRow = array_map(function ($val) {
            return strtolower(trim(preg_replace('/\s+/', ' ', (string) $val)));
        }, $rows[0]);

        $columnMap = [
            'kode_dealer' => $this->findHeaderIndex($headerRow, ['kode_dealer', 'kode dealer', 'dealer_code', 'dealer code', 'dealer']),
            'nama_dealer' => $this->findHeaderIndex($headerRow, ['nama_dealer', 'nama dealer', 'dealer_name', 'dealer name']),
            'kode_jenis' => $this->findHeaderIndex($headerRow, ['kode_jenis_channel', 'kode jenis channel', 'kode_pameran', 'kode pameran', 'kode_jenis', 'kode jenis', 'kode channel']),
            'nama_jenis' => $this->findHeaderIndex($headerRow, ['nama_jenis_channel', 'nama jenis channel', 'jenis_pameran', 'jenis pameran', 'nama_jenis', 'nama jenis', 'channel']),
            'mulai_sewa' => $this->findHeaderIndex($headerRow, ['mulai_sewa', 'mulai sewa', 'mulai_tanggal_sewa', 'mulai tanggal sewa', 'tanggal_mulai', 'tanggal mulai', 'start_date']),
            'akhir_sewa' => $this->findHeaderIndex($headerRow, ['akhir_sewa', 'akhir sewa', 'tanggal_sewa_berakhir', 'tanggal sewa berakhir', 'tanggal_akhir', 'tanggal akhir', 'end_date']),
            'kabupaten' => $this->findHeaderIndex($headerRow, ['kabupaten', 'kabupaten/kota', 'kabupaten / kota', 'kota']),
            'kecamatan' => $this->findHeaderIndex($headerRow, ['kecamatan', 'nama_kecamatan', 'nama kecamatan']),
            'detail_alamat' => $this->findHeaderIndex($headerRow, ['detail_alamat', 'detail alamat', 'alamat', 'alamat lengkap', 'lokasi']),
            'kode_ahm' => $this->findHeaderIndex($headerRow, ['kode_channel_ahm', 'kode channel ahm', 'kode_pameran_ahm', 'kode pameran ahm', 'kode_ahm', 'kode ahm', 'channel ahm', 'kode ahm channel']),
            'latitude' => $this->findHeaderIndex($headerRow, ['latitude', 'lat']),
            'longitude' => $this->findHeaderIndex($headerRow, ['longitude', 'long', 'lng']),
            'status' => $this->findHeaderIndex($headerRow, ['status']),
        ];

        // Cache Dealers
        $dealersByCode = [];
        $dealersByName = [];
        foreach (Dealer::all() as $d) {
            if ($d->kode_dealer) {
                $dealersByCode[strtoupper(trim($d->kode_dealer))] = $d;
            }
            if ($d->nama_dealer) {
                $dealersByName[strtoupper(trim($d->nama_dealer))] = $d;
            }
        }

        // Cache Jenis Pameran
        $jenisByCode = [];
        $jenisByName = [];
        foreach (JenisPameran::all() as $j) {
            if ($j->kode_pameran) {
                $jenisByCode[strtoupper(trim($j->kode_pameran))] = $j;
            }
            if ($j->jenis_pameran) {
                $jenisByName[strtoupper(trim($j->jenis_pameran))] = $j;
            }
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $columnMap, $user, &$dealersByCode, &$dealersByName, &$jenisByCode, &$jenisByName, &$imported, &$skipped, &$errors) {
            $dataRows = array_slice($rows, 1);

            foreach ($dataRows as $idx => $row) {
                $rowNum = $idx + 2;

                // Check if row is empty
                $nonEmpty = array_filter($row, fn ($v) => trim((string) $v) !== '');
                if (empty($nonEmpty)) {
                    continue;
                }

                // 1. Resolve Dealer
                $dealerId = null;
                if ($user && $user->isDealerOnly()) {
                    $dealerId = $user->dealer_id;
                } else {
                    $kodeDealerRaw = $columnMap['kode_dealer'] !== null ? trim((string) ($row[$columnMap['kode_dealer']] ?? '')) : '';
                    $namaDealerRaw = $columnMap['nama_dealer'] !== null ? trim((string) ($row[$columnMap['nama_dealer']] ?? '')) : '';

                    if ($kodeDealerRaw !== '' && isset($dealersByCode[strtoupper($kodeDealerRaw)])) {
                        $dealerId = $dealersByCode[strtoupper($kodeDealerRaw)]->id;
                    } elseif ($namaDealerRaw !== '' && isset($dealersByName[strtoupper($namaDealerRaw)])) {
                        $dealerId = $dealersByName[strtoupper($namaDealerRaw)]->id;
                    }
                }

                if (! $dealerId) {
                    $skipped++;
                    $errors[] = "Baris {$rowNum}: Data dealer tidak ditemukan atau tidak valid.";

                    continue;
                }

                // 2. Resolve Jenis Pameran
                $jenisPameran = null;
                $kodeJenisRaw = $columnMap['kode_jenis'] !== null ? trim((string) ($row[$columnMap['kode_jenis']] ?? '')) : '';
                $namaJenisRaw = $columnMap['nama_jenis'] !== null ? trim((string) ($row[$columnMap['nama_jenis']] ?? '')) : '';

                if ($kodeJenisRaw !== '' && isset($jenisByCode[strtoupper($kodeJenisRaw)])) {
                    $jenisPameran = $jenisByCode[strtoupper($kodeJenisRaw)];
                } elseif ($namaJenisRaw !== '' && isset($jenisByName[strtoupper($namaJenisRaw)])) {
                    $jenisPameran = $jenisByName[strtoupper($namaJenisRaw)];
                }

                if (! $jenisPameran) {
                    // Fallback to first available or create if name given
                    if ($namaJenisRaw !== '') {
                        $jenisPameran = JenisPameran::firstOrCreate(
                            ['jenis_pameran' => $namaJenisRaw],
                            ['kode_pameran' => $kodeJenisRaw ?: 'PMR']
                        );
                        $jenisByName[strtoupper($namaJenisRaw)] = $jenisPameran;
                    } else {
                        $jenisPameran = JenisPameran::first();
                    }
                }

                if (! $jenisPameran) {
                    $skipped++;
                    $errors[] = "Baris {$rowNum}: Jenis channel tidak ditemukan.";

                    continue;
                }

                // 3. Resolve Dates
                $mulaiRaw = $columnMap['mulai_sewa'] !== null ? ($row[$columnMap['mulai_sewa']] ?? null) : null;
                $akhirRaw = $columnMap['akhir_sewa'] !== null ? ($row[$columnMap['akhir_sewa']] ?? null) : null;

                $mulaiDate = $this->parseDateValue($mulaiRaw) ?? now()->format('Y-m-d');
                $akhirDate = $this->parseDateValue($akhirRaw) ?? Carbon::parse($mulaiDate)->addMonth()->format('Y-m-d');

                if ($akhirDate < $mulaiDate) {
                    $temp = $mulaiDate;
                    $mulaiDate = $akhirDate;
                    $akhirDate = $temp;
                }

                // 4. Resolve Location & Details
                $kabupaten = $columnMap['kabupaten'] !== null ? trim((string) ($row[$columnMap['kabupaten']] ?? '')) : '';
                $kecamatan = $columnMap['kecamatan'] !== null ? trim((string) ($row[$columnMap['kecamatan']] ?? '')) : '';
                $detailAlamat = $columnMap['detail_alamat'] !== null ? trim((string) ($row[$columnMap['detail_alamat']] ?? '')) : '';

                if ($kecamatan === '') {
                    $kecamatan = $kabupaten ?: 'Kecamatan Terdaftar';
                }
                if ($detailAlamat === '') {
                    $detailAlamat = "Channel di {$kecamatan}";
                }

                // 5. Coordinates
                $latRaw = $columnMap['latitude'] !== null ? trim((string) ($row[$columnMap['latitude']] ?? '')) : '';
                $lngRaw = $columnMap['longitude'] !== null ? trim((string) ($row[$columnMap['longitude']] ?? '')) : '';

                $latitude = is_numeric($latRaw) ? (float) $latRaw : null;
                $longitude = is_numeric($lngRaw) ? (float) $lngRaw : null;

                // 6. Optional AHM code
                $kodeAhm = $columnMap['kode_ahm'] !== null ? trim((string) ($row[$columnMap['kode_ahm']] ?? '')) : null;
                if ($kodeAhm === '' || $kodeAhm === '-') {
                    $kodeAhm = null;
                }

                // 7. Status & MD Code
                $statusRaw = $columnMap['status'] !== null ? strtolower(trim((string) ($row[$columnMap['status']] ?? ''))) : '';
                $status = PameranStatus::MenungguSpv;
                $kodeMd = null;

                if (in_array($statusRaw, ['disetujui', 'approved', 'setuju', 'aktif'], true)) {
                    $status = PameranStatus::Disetujui;
                    $kodeMd = Pameran::generateKodePameranMd($jenisPameran);
                } elseif (in_array($statusRaw, ['ditolak', 'rejected', 'tolak'], true)) {
                    $status = PameranStatus::Ditolak;
                }

                Pameran::create([
                    'dealer_id' => $dealerId,
                    'jenis_pameran_id' => $jenisPameran->id,
                    'mulai_tanggal_sewa' => $mulaiDate,
                    'tanggal_sewa_berakhir' => $akhirDate,
                    'kabupaten' => $kabupaten ?: null,
                    'kecamatan' => $kecamatan,
                    'detail_alamat' => $detailAlamat,
                    'kode_pameran_md' => $kodeMd,
                    'kode_pameran_ahm' => $kodeAhm,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'status' => $status,
                    'created_by_user_id' => $user?->id ?? 1,
                    'spv_approved_by' => $status === PameranStatus::Disetujui ? ($user?->id ?? 1) : null,
                    'spv_approved_at' => $status === PameranStatus::Disetujui ? now() : null,
                ]);

                $imported++;
            }
        });

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Find index of a column from candidate headers.
     *
     * @param  array<int, string>  $headerRow
     * @param  array<int, string>  $candidates
     */
    private function findHeaderIndex(array $headerRow, array $candidates): ?int
    {
        foreach ($candidates as $candidate) {
            $normalizedCandidate = strtolower(trim($candidate));
            $index = array_search($normalizedCandidate, $headerRow, true);
            if ($index !== false) {
                return (int) $index;
            }
        }

        // Fuzzy partial match
        foreach ($candidates as $candidate) {
            $normalizedCandidate = strtolower(trim($candidate));
            foreach ($headerRow as $idx => $header) {
                if (str_contains($header, $normalizedCandidate)) {
                    return $idx;
                }
            }
        }

        return null;
    }

    /**
     * Parse date value from Excel / CSV representation.
     */
    private function parseDateValue(mixed $value): ?string
    {
        if ($value === null || $value === '' || $value === '-') {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        // Excel serial date number
        if (is_numeric($value) && (float) $value > 30000 && (float) $value < 60000) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable) {
                // fallback to string parsing
            }
        }

        $str = trim((string) $value);

        // Try standard formats
        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y', 'Y/m/d'];
        foreach ($formats as $fmt) {
            try {
                $d = Carbon::createFromFormat($fmt, $str);
                if ($d !== false) {
                    return $d->format('Y-m-d');
                }
            } catch (\Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Parse CSV file into rows array.
     *
     * @return array<int, array<int, mixed>>
     */
    private function parseCsv(string $filePath): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($data = fgetcsv($handle, 10000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        }

        return $rows;
    }
}
