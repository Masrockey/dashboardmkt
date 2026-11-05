<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Segment;
use App\Models\Series;
use App\Models\Type;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Shuchkin\SimpleXLSX;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TypeExcelService
{
    /**
     * Export master types to an Excel (.xlsx) spreadsheet.
     */
    public function export(?string $search = null): StreamedResponse
    {
        $types = Type::query()
            ->with(['category', 'segment', 'series'])
            ->when($search !== null && $search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('nama_type', 'like', "%{$search}%")
                        ->orWhere('nama_pasar', 'like', "%{$search}%")
                        ->orWhereHas('segment', fn (Builder $q) => $q->where('nama_segment', 'like', "%{$search}%"))
                        ->orWhereHas('category', fn (Builder $q) => $q->where('nama_kategori', 'like', "%{$search}%"))
                        ->orWhereHas('series', fn (Builder $q) => $q->where('nama', 'like', "%{$search}%"));
                });
            })
            ->latest('id')
            ->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Master Type');

        $spreadsheet->getProperties()
            ->setCreator('Dashboard Marketing')
            ->setTitle('Data Master Type');

        // Document Title Banner (Row 1 & 2)
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'DATA MASTER TYPE KENDARAAN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new Color('CC0000'));
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $subtitle = 'Tanggal Ekspor: '.now()->translatedFormat('d F Y H:i').' WITA | Total: '.$types->count().' Type';
        if ($search !== null && $search !== '') {
            $subtitle .= ' | Pencarian: '.$search;
        }
        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', $subtitle);
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10)->setColor(new Color('666666'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header Row (Row 4)
        $headers = [
            'A' => 'NO',
            'B' => 'TYPE / NAMA TYPE',
            'C' => 'KATEGORI',
            'D' => 'SEGMENT',
            'E' => 'SERIES',
            'F' => 'NAMA PASAR',
            'G' => 'TANGGAL DIBUAT',
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
        $sheet->getStyle('A4:G4')->applyFromArray($headerStyle);
        $sheet->getRowDimension(4)->setRowHeight(26);

        // Data Rows
        $row = 5;
        foreach ($types as $index => $type) {
            $sheet->setCellValue('A'.$row, $index + 1);
            $sheet->setCellValue('B'.$row, $type->nama_type);
            $sheet->setCellValue('C'.$row, $type->category?->nama_kategori ?? '-');
            $sheet->setCellValue('D'.$row, $type->segment?->nama_segment ?? '-');
            $sheet->setCellValue('E'.$row, $type->series?->nama ?? '-');
            $sheet->setCellValue('F'.$row, $type->nama_pasar ?? '-');
            $sheet->setCellValue('G'.$row, $type->created_at ? $type->created_at->format('d/m/Y H:i') : '-');

            if ($index % 2 === 1) {
                $sheet->getStyle('A'.$row.':G'.$row)->getFill()
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
        $sheet->getStyle('A5:G'.$lastRow)->applyFromArray($dataBorderStyle);

        $sheet->getStyle('A5:A'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C5:E'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('G5:G'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Data-Master-Type-'.now()->format('Ymd-His').'.xlsx';

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
     * Download template Excel for importing master types.
     */
    public function template(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Import');

        $headers = [
            'A1' => 'TYPE',
            'B1' => 'KATEGORI',
            'C1' => 'SEGMENT',
            'D1' => 'SERIES',
            'E1' => 'NAMA PASAR',
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
                'startColor' => ['argb' => 'FF1E293B'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF0F172A'],
                ],
            ],
        ];
        $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(24);

        // Example rows
        $sampleRows = [
            ['VARIO 160', 'HONDA', 'AT HIGH', 'Vario Series', 'VARIO EVO 160 CBS NITRO'],
            ['BEAT FI', 'HONDA', 'AT LOW', 'BeAT Series', 'BEAT SPORTY CBS ISS'],
            ['CBR 150R', 'HONDA', 'SPORT MID', 'CBR Series', 'CBR 150R RACING RED'],
            ['YZF-R15', 'YAMAHA', 'SPORT MID', 'R-Series', 'R15 CONNECTED'],
        ];

        $r = 2;
        foreach ($sampleRows as $row) {
            $sheet->setCellValue('A'.$r, $row[0]);
            $sheet->setCellValue('B'.$r, $row[1]);
            $sheet->setCellValue('C'.$r, $row[2]);
            $sheet->setCellValue('D'.$r, $row[3]);
            $sheet->setCellValue('E'.$r, $row[4]);
            $sheet->getRowDimension($r)->setRowHeight(20);
            $r++;
        }

        $sheet->getStyle('A2:E'.($r - 1))->applyFromArray([
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

        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Template-Import-Master-Type.xlsx';

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
     * Import master types from uploaded Excel or CSV file.
     *
     * @return int Number of records created or updated
     */
    public function import(UploadedFile $file): int
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
            return 0;
        }

        // Header mapping
        $headerRow = array_map(function ($val) {
            return strtolower(trim(preg_replace('/\s+/', ' ', (string) $val)));
        }, $rows[0]);

        $columnMap = [
            'nama_type' => $this->findHeaderIndex($headerRow, ['nama_type', 'nama type', 'type', 'tipe', 'nama tipe']),
            'kategori' => $this->findHeaderIndex($headerRow, ['kategori', 'category', 'nama_kategori', 'nama kategori']),
            'segment' => $this->findHeaderIndex($headerRow, ['segment', 'segmen', 'nama_segment', 'nama segment']),
            'series' => $this->findHeaderIndex($headerRow, ['series', 'seri', 'nama_series', 'nama series']),
            'nama_pasar' => $this->findHeaderIndex($headerRow, ['nama_pasar', 'nama pasar', 'market_name', 'market name']),
        ];

        if ($columnMap['nama_type'] === null) {
            return 0;
        }

        // Cache existing lookup records
        $categories = [];
        foreach (Category::all() as $cat) {
            $categories[strtoupper(trim($cat->nama_kategori))] = $cat->id;
        }

        $segments = [];
        foreach (Segment::all() as $seg) {
            $segments[strtoupper(trim($seg->nama_segment))] = $seg->id;
        }

        $seriesList = [];
        foreach (Series::all() as $ser) {
            $seriesList[strtoupper(trim($ser->nama))] = $ser->id;
        }

        $count = 0;

        DB::transaction(function () use ($rows, $columnMap, &$categories, &$segments, &$seriesList, &$count) {
            $dataRows = array_slice($rows, 1);
            foreach ($dataRows as $row) {
                $namaType = isset($row[$columnMap['nama_type']]) ? trim((string) $row[$columnMap['nama_type']]) : '';
                if ($namaType === '') {
                    continue;
                }

                // Resolve Category
                $categoryId = null;
                if ($columnMap['kategori'] !== null && isset($row[$columnMap['kategori']])) {
                    $catVal = trim((string) $row[$columnMap['kategori']]);
                    if ($catVal !== '' && $catVal !== '-') {
                        $catKey = strtoupper($catVal);
                        if (! isset($categories[$catKey])) {
                            $cat = Category::firstOrCreate(['nama_kategori' => $catVal]);
                            $categories[$catKey] = $cat->id;
                        }
                        $categoryId = $categories[$catKey];
                    }
                }

                // Resolve Segment
                $segmentId = null;
                if ($columnMap['segment'] !== null && isset($row[$columnMap['segment']])) {
                    $segVal = trim((string) $row[$columnMap['segment']]);
                    if ($segVal !== '' && $segVal !== '-') {
                        $segKey = strtoupper($segVal);
                        if (! isset($segments[$segKey])) {
                            $seg = Segment::firstOrCreate(['nama_segment' => $segVal]);
                            $segments[$segKey] = $seg->id;
                        }
                        $segmentId = $segments[$segKey];
                    }
                }

                // Resolve Series
                $seriesId = null;
                if ($columnMap['series'] !== null && isset($row[$columnMap['series']])) {
                    $serVal = trim((string) $row[$columnMap['series']]);
                    if ($serVal !== '' && $serVal !== '-') {
                        $serKey = strtoupper($serVal);
                        if (! isset($seriesList[$serKey])) {
                            $ser = Series::firstOrCreate(['nama' => $serVal]);
                            $seriesList[$serKey] = $ser->id;
                        }
                        $seriesId = $seriesList[$serKey];
                    }
                }

                // Resolve Nama Pasar
                $namaPasar = null;
                if ($columnMap['nama_pasar'] !== null && isset($row[$columnMap['nama_pasar']])) {
                    $val = trim((string) $row[$columnMap['nama_pasar']]);
                    $namaPasar = ($val !== '' && $val !== '-') ? $val : null;
                }

                Type::updateOrCreate(
                    ['nama_type' => $namaType],
                    [
                        'category_id' => $categoryId,
                        'segment_id' => $segmentId,
                        'series_id' => $seriesId,
                        'nama_pasar' => $namaPasar,
                    ]
                );

                $count++;
            }
        });

        return $count;
    }

    /**
     * Parse CSV file with auto delimiter detection.
     *
     * @return array<int, array<int, string>>
     */
    protected function parseCsv(string $filePath): array
    {
        $content = file_get_contents($filePath);
        if ($content === false || trim($content) === '') {
            return [];
        }

        // Strip UTF-8 BOM if present
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($content));
        if (empty($lines)) {
            return [];
        }

        // Auto-detect delimiter from the first line
        $firstLine = $lines[0];
        $delimiter = str_contains($firstLine, ';') ? ';' : ',';

        $rows = [];
        $stream = fopen('php://memory', 'r+');
        if ($stream === false) {
            return [];
        }

        fwrite($stream, $content);
        rewind($stream);

        while (($row = fgetcsv($stream, 0, $delimiter)) !== false) {
            $rows[] = $row;
        }

        fclose($stream);

        return $rows;
    }

    /**
     * Find index of a header given multiple aliases.
     *
     * @param  array<int, string>  $headers
     * @param  array<int, string>  $aliases
     */
    protected function findHeaderIndex(array $headers, array $aliases): ?int
    {
        foreach ($aliases as $alias) {
            $index = array_search(strtolower($alias), $headers, true);
            if ($index !== false) {
                return (int) $index;
            }
        }

        return null;
    }
}

