<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicMeetAndGreetStoreRequest;
use App\Models\Dealer;
use App\Models\MeetAndGreet;
use App\Models\Type;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicMeetAndGreetController extends Controller
{
    /**
     * Display the public Meet & Greet registration form.
     */
    public function index(Request $request): Response
    {
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

        $registeredNo = $request->query('registered') ?: session('no_registrasi');
        $registrationSuccess = null;

        if ($registeredNo) {
            $registrationSuccess = MeetAndGreet::query()
                ->with('dealer:id,kode_dealer,nama_dealer')
                ->where('no_registrasi', $registeredNo)
                ->first();
        }

        return Inertia::render('meet-and-greet/public', [
            'dealers' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'dealerOptions' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'motorcycleTypes' => $motorcycleTypes,
            'status' => session('success'),
            'registeredNo' => $registeredNo,
            'registrationSuccess' => $registrationSuccess,
        ]);
    }

    /**
     * Store a newly submitted Meet & Greet record from the public form.
     */
    public function store(PublicMeetAndGreetStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['dealer_id']) && ! empty($data['dealer_asal'])) {
            $keyword = preg_replace('/^(SO|PT\.?\s*Astra\s*International\s*Tbk-Honda\s*-?)\s*/i', '', $data['dealer_asal']);
            $matchedDealerId = Dealer::where('nama_dealer', 'like', "%{$keyword}%")->value('id');
            if ($matchedDealerId) {
                $data['dealer_id'] = $matchedDealerId;
            }
        }

        if ($request->hasFile('stnk')) {
            $path = $request->file('stnk')->store('meet-and-greet/stnk', 'public');
            $data['stnk_path'] = $path;
        }

        unset($data['stnk']);
        $data['created_by_user_id'] = $request->user()?->id;

        $meetAndGreet = MeetAndGreet::create($data);

        return redirect()
            ->route('meetngreethonda.index', ['registered' => $meetAndGreet->no_registrasi])
            ->with('success', 'Pendaftaran Meet & Greet Honda berhasil disimpan! Terima kasih telah melakukan registrasi.')
            ->with('no_registrasi', $meetAndGreet->no_registrasi);
    }
}
