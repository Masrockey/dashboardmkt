<?php

namespace App\Http\Controllers;

use App\Http\Requests\MeetAndGreetStoreRequest;
use App\Http\Requests\MeetAndGreetUpdateRequest;
use App\Models\Dealer;
use App\Models\MeetAndGreet;
use App\Models\Setting;
use App\Models\Type;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MeetAndGreetController extends Controller
{
    /**
     * Build the query for Meet & Greet based on request filters and user role.
     */
    private function buildQuery(Request $request, $user): Builder
    {
        $search = $request->string('search')->toString();
        $dealerFilter = $request->input('dealer_asal') ?: $request->input('dealer_id');

        return MeetAndGreet::query()
            ->with([
                'dealer:id,kode_dealer,nama_dealer',
                'createdByUser:id,name',
            ])
            ->when($user && $user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('dealer_id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->when($dealerFilter && ! ($user && $user->isDealerOnly()), function (Builder $query) use ($dealerFilter) {
                if (is_numeric($dealerFilter)) {
                    $query->where('dealer_id', $dealerFilter);
                } else {
                    $query->where('dealer_asal', $dealerFilter);
                }
            })
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $sub) use ($search) {
                    $sub->where('nama_konsumen', 'like', "%{$search}%")
                        ->orWhere('no_registrasi', 'like', "%{$search}%")
                        ->orWhere('dealer_asal', 'like', "%{$search}%")
                        ->orWhere('no_hp', 'like', "%{$search}%")
                        ->orWhere('no_plat', 'like', "%{$search}%")
                        ->orWhere('tipe_motor', 'like', "%{$search}%")
                        ->orWhere('alamat', 'like', "%{$search}%")
                        ->orWhereHas('dealer', function (Builder $dealerSub) use ($search) {
                            $dealerSub->where('nama_dealer', 'like', "%{$search}%")
                                ->orWhere('kode_dealer', 'like', "%{$search}%");
                        });
                });
            });
    }

    /**
     * Display a listing of the Meet & Greet records.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->toString();
        $dealerFilter = $request->input('dealer_asal') ?: $request->input('dealer_id');

        $meetAndGreets = $this->buildQuery($request, $user)
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $motorcycleTypes = Type::query()
            ->whereHas('category', function (Builder $query) {
                $query->where('nama_kategori', 'HONDA');
            })
            ->whereNotNull('nama_pasar')
            ->where('nama_pasar', '!=', '')
            ->pluck('nama_pasar')
            ->map(fn ($item) => trim($item))
            ->filter(fn ($item) => $item !== '')
            ->unique()
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return Inertia::render('meet-and-greet/index', [
            'meetAndGreets' => $meetAndGreets,
            'dealers' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'dealerOptions' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'motorcycleTypes' => $motorcycleTypes,
            'isRegistrationOpen' => Setting::isMeetAndGreetPublicOpen(),
            'canToggleRegistration' => ! ($user && $user->isDealerOnly()),
            'filters' => [
                'search' => $search,
                'dealer_id' => $dealerFilter,
                'dealer_asal' => $dealerFilter,
            ],
        ]);
    }

    /**
     * Export Meet & Greet records to an Excel (.xlsx) spreadsheet.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $query = $this->buildQuery($request, $user);
        $records = $query->latest('id')->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Meet & Greet');

        // Document properties
        $spreadsheet->getProperties()
            ->setCreator('Astra Motor NTB')
            ->setTitle('Data Meet & Greet Honda');

        // Title Header (Row 1 & 2)
        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', 'DATA KONSUMEN MEET & GREET HONDA - MANDALIKA GP');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new Color('CC0000'));
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $filterInfo = 'Tanggal Ekspor: '.now()->translatedFormat('d F Y H:i').' WITA';
        $search = $request->string('search')->toString();
        $dealerFilter = $request->input('dealer_asal') ?: $request->input('dealer_id');
        if ($dealerFilter) {
            $filterInfo .= ' | Filter Dealer: '.$dealerFilter;
        }
        if ($search !== '') {
            $filterInfo .= ' | Pencarian: '.$search;
        }
        $filterInfo .= ' | Total: '.$records->count().' Konsumen';

        $sheet->mergeCells('A2:L2');
        $sheet->setCellValue('A2', $filterInfo);
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10)->setColor(new Color('666666'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Table Header (Row 4)
        $headers = [
            'NO',
            'NO REGISTRASI',
            'NAMA DEALER ASAL',
            'KODE DEALER',
            'NAMA KONSUMEN',
            'NO WHATSAPP / HP',
            'ALAMAT KONSUMEN',
            'TIPE MOTOR',
            'NO PLAT POLISI',
            'BERKAS STNK',
            'WAKTU INPUT',
            'DIINPUT OLEH',
        ];

        $col = 'A';
        foreach ($headers as $headerText) {
            $sheet->setCellValue($col.'4', $headerText);
            $col++;
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
                'wrapText' => true,
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
        $sheet->getStyle('A4:L4')->applyFromArray($headerStyle);
        $sheet->getRowDimension(4)->setRowHeight(28);

        // Data Rows (Row 5 onwards)
        $row = 5;
        foreach ($records as $index => $item) {
            $stnkUrl = $item->stnk_url ? url($item->stnk_url) : ($item->stnk_path ? url(Storage::url($item->stnk_path)) : null);
            $createdByName = $item->createdByUser?->name ?? 'Pendaftaran Publik (Mandiri)';
            $waktuInput = $item->created_at ? $item->created_at->translatedFormat('d M Y H:i') : '-';

            $sheet->setCellValue('A'.$row, $index + 1);
            $sheet->setCellValueExplicit('B'.$row, $item->no_registrasi ?? '-', DataType::TYPE_STRING);
            $sheet->setCellValue('C'.$row, $item->dealer_asal ?: ($item->dealer?->nama_dealer ?? '-'));
            $sheet->setCellValueExplicit('D'.$row, $item->dealer?->kode_dealer ?? '-', DataType::TYPE_STRING);
            $sheet->setCellValue('E'.$row, $item->nama_konsumen);
            $sheet->setCellValueExplicit('F'.$row, $item->no_hp, DataType::TYPE_STRING);
            $sheet->setCellValue('G'.$row, $item->alamat);
            $sheet->setCellValue('H'.$row, $item->tipe_motor);
            $sheet->setCellValueExplicit('I'.$row, $item->no_plat, DataType::TYPE_STRING);

            if ($stnkUrl) {
                $sheet->setCellValue('J'.$row, 'Lihat STNK');
                $sheet->getCell('J'.$row)->getHyperlink()->setUrl($stnkUrl);
                $sheet->getStyle('J'.$row)->getFont()->setColor(new Color('0000FF'))->setUnderline(true);
            } else {
                $sheet->setCellValue('J'.$row, 'Tidak Ada');
            }

            $sheet->setCellValue('K'.$row, $waktuInput);
            $sheet->setCellValue('L'.$row, $createdByName);

            if ($index % 2 === 1) {
                $sheet->getStyle('A'.$row.':L'.$row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFF9FAFB');
            }

            $sheet->getRowDimension($row)->setRowHeight(22);
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
        $sheet->getStyle('A5:L'.$lastRow)->applyFromArray($dataBorderStyle);

        $sheet->getStyle('A5:A'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B5:B'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('D5:D'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('F5:F'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('I5:I'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('J5:J'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('K5:K'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        foreach (range('A', 'L') as $columnID) {
            $sheet->getColumnDimension($columnID)->setAutoSize(true);
        }

        $filename = 'Data-Meet-And-Greet-Honda-'.now()->format('Ymd-His').'.xlsx';

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
     * Toggle the public Meet & Greet registration status.
     */
    public function toggleStatus(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user && $user->isDealerOnly()) {
            abort(403, 'Hanya admin yang dapat mengubah status pendaftaran.');
        }

        $request->validate([
            'is_open' => ['nullable', 'boolean'],
        ]);

        if ($request->has('is_open')) {
            $newState = $request->boolean('is_open');
        } else {
            $newState = ! Setting::isMeetAndGreetPublicOpen();
        }

        Setting::setMeetAndGreetPublicOpen($newState);

        $statusText = $newState ? 'dibuka' : 'ditutup';

        return back()->with('success', "Status pendaftaran formulir publik Meet & Greet berhasil {$statusText}.");
    }

    /**
     * Store a newly created Meet & Greet record in storage.
     */
    public function store(MeetAndGreetStoreRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($user->isDealerOnly()) {
            if (! $user->dealer_id) {
                abort(403, 'Akun Anda belum terhubung dengan data Dealer.');
            }
            $data['dealer_id'] = $user->dealer_id;
            if (empty($data['dealer_asal']) && $user->dealer) {
                $data['dealer_asal'] = $user->dealer->nama_dealer;
            }
        }

        if (empty($data['dealer_id']) && ! empty($data['dealer_asal'])) {
            $keyword = preg_replace('/^(SO|PT\.?\s*Astra\s*International\s*Tbk-Honda\s*-?)\s*/i', '', $data['dealer_asal']);
            $matchedDealerId = Dealer::where('nama_dealer', 'like', "%{$keyword}%")->value('id');
            $data['dealer_id'] = $matchedDealerId ?: null;
        } elseif (! empty($data['dealer_id']) && ! is_numeric($data['dealer_id'])) {
            $data['dealer_id'] = null;
        }

        if ($request->hasFile('stnk')) {
            $path = $request->file('stnk')->store('meet-and-greet/stnk', 'public');
            $data['stnk_path'] = $path;
        }

        unset($data['stnk']);
        $data['created_by_user_id'] = $user->id;

        MeetAndGreet::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data Meet & Greet konsumen berhasil disimpan.',
        ]);

        return to_route('meet-and-greet.index');
    }

    /**
     * Update the specified Meet & Greet record in storage.
     */
    public function update(MeetAndGreetUpdateRequest $request, MeetAndGreet $meetAndGreet): RedirectResponse
    {
        $user = $request->user();

        if ($user->isDealerOnly() && $meetAndGreet->dealer_id !== $user->dealer_id) {
            abort(403, 'Anda tidak memiliki akses untuk mengubah data dealer lain.');
        }

        $data = $request->validated();

        if ($user->isDealerOnly()) {
            $data['dealer_id'] = $user->dealer_id;
            if (empty($data['dealer_asal']) && $user->dealer) {
                $data['dealer_asal'] = $user->dealer->nama_dealer;
            }
        }

        if (empty($data['dealer_id']) && ! empty($data['dealer_asal'])) {
            $keyword = preg_replace('/^(SO|PT\.?\s*Astra\s*International\s*Tbk-Honda\s*-?)\s*/i', '', $data['dealer_asal']);
            $matchedDealerId = Dealer::where('nama_dealer', 'like', "%{$keyword}%")->value('id');
            $data['dealer_id'] = $matchedDealerId ?: null;
        } elseif (! empty($data['dealer_id']) && ! is_numeric($data['dealer_id'])) {
            $data['dealer_id'] = null;
        }

        if ($request->hasFile('stnk')) {
            if ($meetAndGreet->stnk_path && Storage::disk('public')->exists($meetAndGreet->stnk_path)) {
                Storage::disk('public')->delete($meetAndGreet->stnk_path);
            }
            $path = $request->file('stnk')->store('meet-and-greet/stnk', 'public');
            $data['stnk_path'] = $path;
        }

        unset($data['stnk']);

        $meetAndGreet->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data Meet & Greet konsumen berhasil diperbarui.',
        ]);

        return to_route('meet-and-greet.index');
    }

    /**
     * Remove the specified Meet & Greet record from storage.
     */
    public function destroy(Request $request, MeetAndGreet $meetAndGreet): RedirectResponse
    {
        $user = $request->user();

        if ($user->isDealerOnly() && $meetAndGreet->dealer_id !== $user->dealer_id) {
            abort(403, 'Anda tidak memiliki akses untuk menghapus data dealer lain.');
        }

        if ($meetAndGreet->stnk_path && Storage::disk('public')->exists($meetAndGreet->stnk_path)) {
            Storage::disk('public')->delete($meetAndGreet->stnk_path);
        }

        $meetAndGreet->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data Meet & Greet konsumen berhasil dihapus.',
        ]);

        return to_route('meet-and-greet.index');
    }
}
