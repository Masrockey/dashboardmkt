<?php

namespace App\Services;

use App\Models\R2;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Shuchkin\SimpleXLSX;

class R2ImportService
{
    /**
     * Known R2 fields list
     */
    protected array $fields = [
        'drv_desc',
        'knd_nopol',
        'knd_nama',
        'knd_alamat',
        'kel_desc',
        'kec_desc',
        'kab_desc',
        'jns_desc',
        'mrk_desc',
        'pkb_desc',
        'knd_thn_buat',
        'knd_cyl',
        'knd_rangka',
        'knd_mesin',
        'knd_warna',
        'guna_desc',
        'wrn_desc',
        'ctk_notice_tanggal',
        'ctk_notice_seri',
        'knd_tgl_notice_new',
        'knd_tgl_notice_old',
        'knd_df_jenis',
    ];

    /**
     * Date fields list
     */
    protected array $dateFields = [
        'ctk_notice_tanggal',
        'knd_tgl_notice_new',
        'knd_tgl_notice_old',
    ];

    /**
     * Import R2 records from an uploaded Excel or CSV file.
     *
     * @return int Number of records imported
     */
    public function import(UploadedFile $file): int
    {
        $filePath = $file->getRealPath();
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = [];

        if ($extension === 'csv') {
            $rows = $this->parseCsv($filePath);
        } else {
            // Try SimpleXLSX first (works without native C ZipArchive extension)
            if (class_exists(SimpleXLSX::class) && ($xlsx = SimpleXLSX::parse($filePath))) {
                $rows = $xlsx->rows();
            } else {
                // Fallback to PhpSpreadsheet IOFactory
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
            return strtolower(trim((string) $val));
        }, $rows[0]);

        $columnIndexMap = [];
        foreach ($this->fields as $field) {
            $index = array_search($field, $headerRow, true);
            if ($index !== false) {
                $columnIndexMap[$field] = $index;
            }
        }

        if (empty($columnIndexMap)) {
            return 0;
        }

        $records = [];
        $now = now()->toDateTimeString();
        $importedCount = 0;

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];

            // Skip empty rows
            if (!array_filter($row)) {
                continue;
            }

            $record = [
                'created_at' => $now,
                'updated_at' => $now,
            ];

            foreach ($this->fields as $field) {
                $cellVal = null;
                if (isset($columnIndexMap[$field]) && isset($row[$columnIndexMap[$field]])) {
                    $cellVal = $row[$columnIndexMap[$field]];
                }

                if ($cellVal === null || trim((string) $cellVal) === '') {
                    $record[$field] = null;
                    continue;
                }

                $cellVal = trim((string) $cellVal);

                if (in_array($field, $this->dateFields, true)) {
                    $record[$field] = $this->parseDateValue($cellVal);
                } else {
                    $record[$field] = $cellVal;
                }
            }

            $records[] = $record;
            $importedCount++;

            // Batch insert every 500 records
            if (count($records) >= 500) {
                R2::insert($records);
                $records = [];
            }
        }

        if (!empty($records)) {
            R2::insert($records);
        }

        return $importedCount;
    }

    /**
     * Parse CSV file into rows array.
     */
    protected function parseCsv(string $filePath): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        }
        return $rows;
    }

    /**
     * Parse date value from string or Excel serial number.
     */
    protected function parseDateValue(string|int|float $value): ?string
    {
        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable $e) {
                // Fallthrough to string parsing
            }
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return (string) $value;
        }
    }
}
