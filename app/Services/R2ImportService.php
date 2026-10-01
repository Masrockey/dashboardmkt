<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Kabupaten;
use App\Models\R2;
use App\Models\Segment;
use App\Models\Type;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Shuchkin\SimpleXLSX;

class R2ImportService
{
    /**
     * Known R2 database fields list
     */
    protected array $fields = [
        'drv_desc',
        'knd_nopol',
        'knd_nama',
        'knd_alamat',
        'kel_desc',
        'kec_desc',
        'kab_desc',
        'model',
        'jns_desc',
        'mrk_desc',
        'roda',
        'pkb_desc',
        'type',
        'segment',
        'nama_pasar',
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
     * Aliases for flexible header recognition (case-insensitive, trimmed)
     */
    protected array $headerAliases = [
        'ctk_notice_tanggal' => ['tgl', 'tanggal', 'ctk_notice_tanggal', 'tgl notice', 'tanggal notice', 'tgl_notice'],
        'knd_nama' => ['pemilik', 'nama', 'nama pemilik', 'knd_nama', 'pemilik kendaraan'],
        'knd_alamat' => ['alamat', 'knd_alamat', 'alamat pemilik'],
        'kel_desc' => ['kel', 'kelurahan', 'desa', 'kel_desc', 'kel/desa', 'kel / desa'],
        'kec_desc' => ['kec', 'kecamatan', 'kec_desc'],
        'kab_desc' => ['kab 1', 'kab1', 'kab', 'kabupaten', 'kab_desc', 'kab / kota', 'kab/kota'],
        'model' => ['model'],
        'mrk_desc' => ['brand', 'merk', 'mrk_desc'],
        'roda' => ['roda', 'jml_roda', 'jumlah roda'],
        'knd_thn_buat' => ['tahun', 'thn', 'tahun buat', 'thn buat', 'knd_thn_buat'],
        'knd_cyl' => ['cc', 'cyl', 'cylinder', 'kapasitas', 'knd_cyl'],
        'knd_rangka' => ['noka', 'no rangka', 'no_rangka', 'knd_rangka', 'nomor rangka'],
        'knd_mesin' => ['nosin', 'no mesin', 'no_mesin', 'knd_mesin', 'nomor mesin'],
        'knd_warna' => ['warna', 'knd_warna', 'warna kendaraan'],
        'wrn_desc' => ['wrn_desc', 'warna tnkb'],
        'type' => ['type', 'tipe', 'type kendaraan', 'nama_type'],
        'pkb_desc' => ['pkb_desc', 'pkb desc', 'model / pkb'],
        'segment' => ['segment', 'nama_segment', 'segmen'],
        'nama_pasar' => ['nama pasar', 'nama_pasar', 'namapasar'],
        'knd_nopol' => ['nopol', 'no polisi', 'no. polisi', 'no_polisi', 'knd_nopol', 'plat nomor'],
        'drv_desc' => ['drv_desc', 'drv desc', 'driver'],
        'jns_desc' => ['jns_desc', 'jenis', 'jenis kendaraan'],
        'guna_desc' => ['guna_desc', 'penggunaan', 'fungsi', 'peruntukan'],
        'ctk_notice_seri' => ['ctk_notice_seri', 'seri notice', 'no seri'],
        'knd_tgl_notice_new' => ['knd_tgl_notice_new', 'tgl notice baru'],
        'knd_tgl_notice_old' => ['knd_tgl_notice_old', 'tgl notice lama'],
        'knd_df_jenis' => ['knd_df_jenis', 'jenis daftar'],
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

        // Header mapping with alias support
        $headerRow = array_map(function ($val) {
            return strtolower(trim((string) $val));
        }, $rows[0]);

        $columnIndexMap = [];
        foreach ($this->fields as $field) {
            // Check direct match
            $index = array_search(strtolower($field), $headerRow, true);
            if ($index !== false) {
                $columnIndexMap[$field] = $index;

                continue;
            }

            // Check aliases
            if (isset($this->headerAliases[$field])) {
                foreach ($this->headerAliases[$field] as $alias) {
                    $index = array_search(strtolower($alias), $headerRow, true);
                    if ($index !== false) {
                        $columnIndexMap[$field] = $index;
                        break;
                    }
                }
            }
        }

        if (empty($columnIndexMap)) {
            return 0;
        }

        // Preload Master Data for instant matching & adjustment
        $kabupatens = Kabupaten::all();
        $brands = Brand::all();
        $types = Type::with('segment')->get();
        $segments = Segment::all();

        $typeByCode = [];
        $typeByMarket = [];
        foreach ($types as $t) {
            $typeByCode[strtoupper(trim((string) $t->nama_type))] = $t;
            if (! empty($t->nama_pasar)) {
                $typeByMarket[strtoupper(trim((string) $t->nama_pasar))] = $t;
            }
        }

        $records = [];
        $now = now()->toDateTimeString();
        $importedCount = 0;

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];

            // Skip empty rows
            if (! array_filter($row)) {
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

            // Adjust with Master Data: KAB, Brand, TYPE, Segment, NAMA PASAR
            $this->adjustWithMasterData(
                $record,
                $kabupatens,
                $brands,
                $types,
                $segments,
                $typeByCode,
                $typeByMarket
            );

            $records[] = $record;
            $importedCount++;

            // Batch insert every 500 records
            if (count($records) >= 500) {
                R2::insert($records);
                $records = [];
            }
        }

        if (! empty($records)) {
            R2::insert($records);
        }

        return $importedCount;
    }

    /**
     * Adjust a single record with Master Data.
     */
    public function adjustRecord(array &$record): void
    {
        $kabupatens = Kabupaten::all();
        $brands = Brand::all();
        $types = Type::with('segment')->get();
        $segments = Segment::all();

        $typeByCode = [];
        $typeByMarket = [];
        foreach ($types as $t) {
            $typeByCode[strtoupper(trim((string) $t->nama_type))] = $t;
            if (! empty($t->nama_pasar)) {
                $typeByMarket[strtoupper(trim((string) $t->nama_pasar))] = $t;
            }
        }

        $this->adjustWithMasterData(
            $record,
            $kabupatens,
            $brands,
            $types,
            $segments,
            $typeByCode,
            $typeByMarket
        );
    }

    /**
     * Adjust record fields with Master Data (KAB, Brand, TYPE, Segment, NAMA PASAR)
     */
    public function adjustWithMasterData(
        array &$record,
        $kabupatens,
        $brands,
        $types,
        $segments,
        array $typeByCode,
        array $typeByMarket
    ): void {
        // 1. KAB (Kabupaten) - match with kabupatens table
        if (! empty($record['kab_desc'])) {
            $cleanKab = strtoupper(trim((string) $record['kab_desc']));
            $matchedKab = $kabupatens->first(function ($kab) use ($cleanKab) {
                $normMaster = strtoupper(trim((string) $kab->nama_kabupaten));
                if ($normMaster === $cleanKab) {
                    return true;
                }
                $simplifiedMaster = preg_replace('/^(KAB\.?|KOTA)\s*/i', '', $normMaster);
                $simplifiedInput = preg_replace('/^(KAB\.?|KOTA)\s*/i', '', $cleanKab);

                return $simplifiedMaster === $simplifiedInput;
            });

            if ($matchedKab) {
                $record['kab_desc'] = $matchedKab->nama_kabupaten;
            }
        }

        // 2. Brand (Merk) - match with brands table
        if (! empty($record['mrk_desc'])) {
            $cleanBrand = strtoupper(trim((string) $record['mrk_desc']));
            $matchedBrand = $brands->first(function ($brand) use ($cleanBrand) {
                return strtoupper(trim((string) $brand->nama_brand)) === $cleanBrand;
            });

            if ($matchedBrand) {
                $record['mrk_desc'] = $matchedBrand->nama_brand;
            }
        }

        // 3. TYPE, Segment, and NAMA PASAR - match with types table
        $inputCode = strtoupper(trim((string) ($record['type'] ?? ($record['pkb_desc'] ?? ''))));
        $inputMarket = strtoupper(trim((string) ($record['nama_pasar'] ?? '')));

        $matchedType = null;
        if ($inputCode !== '' && isset($typeByCode[$inputCode])) {
            $matchedType = $typeByCode[$inputCode];
        } elseif ($inputMarket !== '' && isset($typeByMarket[$inputMarket])) {
            $matchedType = $typeByMarket[$inputMarket];
        } else {
            // Fallback fuzzy match (ignoring whitespace and symbols)
            $simplifiedCode = preg_replace('/[\s\/\-]+/', '', $inputCode);
            if ($simplifiedCode !== '') {
                foreach ($typeByCode as $codeKey => $typeItem) {
                    if (preg_replace('/[\s\/\-]+/', '', $codeKey) === $simplifiedCode) {
                        $matchedType = $typeItem;
                        break;
                    }
                }
            }
        }

        if ($matchedType) {
            $record['type'] = $matchedType->nama_type;
            $record['pkb_desc'] = $matchedType->nama_type;
            $record['segment'] = $matchedType->segment?->nama_segment ?? ($record['segment'] ?? null);
            $record['nama_pasar'] = $matchedType->nama_pasar ?? ($record['nama_pasar'] ?? null);
        }

        // 4. Segment - if still not adjusted, match with segments table
        if (! empty($record['segment'])) {
            $cleanSegment = strtoupper(trim((string) $record['segment']));
            $matchedSegment = $segments->first(function ($seg) use ($cleanSegment) {
                return strtoupper(trim((string) $seg->nama_segment)) === $cleanSegment;
            });
            if ($matchedSegment) {
                $record['segment'] = $matchedSegment->nama_segment;
            }
        }

        // Synchronize type and pkb_desc
        if (empty($record['pkb_desc']) && ! empty($record['type'])) {
            $record['pkb_desc'] = $record['type'];
        }
        if (empty($record['type']) && ! empty($record['pkb_desc'])) {
            $record['type'] = $record['pkb_desc'];
        }

        // Set default values if missing
        if (empty($record['model'])) {
            $record['model'] = 'SOLO';
        }
        if (empty($record['roda'])) {
            $record['roda'] = '2';
        }
        if (empty($record['jns_desc']) && ! empty($record['roda'])) {
            $record['jns_desc'] = "SPM R {$record['roda']}";
        }
    }

    /**
     * Backfill existing records in the database with master data values.
     */
    public function backfillExistingRecords(): int
    {
        $kabupatens = Kabupaten::all();
        $brands = Brand::all();
        $types = Type::with('segment')->get();
        $segments = Segment::all();

        $typeByCode = [];
        $typeByMarket = [];
        foreach ($types as $t) {
            $typeByCode[strtoupper(trim((string) $t->nama_type))] = $t;
            if (! empty($t->nama_pasar)) {
                $typeByMarket[strtoupper(trim((string) $t->nama_pasar))] = $t;
            }
        }

        $allR2s = R2::all();
        $count = 0;

        foreach ($allR2s as $r2) {
            $record = $r2->toArray();
            $this->adjustWithMasterData(
                $record,
                $kabupatens,
                $brands,
                $types,
                $segments,
                $typeByCode,
                $typeByMarket
            );

            $r2->update([
                'kab_desc' => $record['kab_desc'] ?? $r2->kab_desc,
                'mrk_desc' => $record['mrk_desc'] ?? $r2->mrk_desc,
                'model' => $record['model'] ?? $r2->model,
                'roda' => $record['roda'] ?? $r2->roda,
                'type' => $record['type'] ?? $r2->type,
                'pkb_desc' => $record['pkb_desc'] ?? $r2->pkb_desc,
                'segment' => $record['segment'] ?? $r2->segment,
                'nama_pasar' => $record['nama_pasar'] ?? $r2->nama_pasar,
            ]);

            $count++;
        }

        return $count;
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

        $str = trim((string) $value);

        // Match DD/MM/YYYY or DD-MM-YYYY
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $str, $matches)) {
            try {
                return Carbon::createFromDate((int) $matches[3], (int) $matches[2], (int) $matches[1])->format('Y-m-d');
            } catch (\Throwable $e) {
                // Fallthrough
            }
        }

        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Throwable $e) {
            return $str;
        }
    }
}
