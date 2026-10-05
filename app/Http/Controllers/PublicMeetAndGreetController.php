<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicMeetAndGreetStoreRequest;
use App\Models\Dealer;
use App\Models\MeetAndGreet;
use App\Models\Setting;
use App\Models\Type;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
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

        $registeredParam = $request->query('registered');
        $actualNoRegistrasi = null;

        if ($registeredParam) {
            try {
                $actualNoRegistrasi = Crypt::decryptString($registeredParam);
            } catch (DecryptException) {
                // If encrypted token is invalid or tampered with, do not reveal any data
                $actualNoRegistrasi = null;
            }
        }

        if (! $actualNoRegistrasi && session('no_registrasi')) {
            $actualNoRegistrasi = session('no_registrasi');
        }

        $registrationSuccess = null;

        if ($actualNoRegistrasi) {
            $registrationSuccess = MeetAndGreet::query()
                ->with('dealer:id,kode_dealer,nama_dealer')
                ->where('no_registrasi', $actualNoRegistrasi)
                ->first();
        }

        return Inertia::render('meet-and-greet/public', [
            'dealers' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'dealerOptions' => MeetAndGreet::DEALER_ASAL_OPTIONS,
            'motorcycleTypes' => $motorcycleTypes,
            'status' => session('success'),
            'errorMessage' => session('error'),
            'isRegistrationOpen' => Setting::isMeetAndGreetPublicOpen(),
            'registeredNo' => $actualNoRegistrasi,
            'registrationSuccess' => $registrationSuccess,
        ]);
    }

    /**
     * Store a newly submitted Meet & Greet record from the public form.
     */
    public function store(PublicMeetAndGreetStoreRequest $request): RedirectResponse
    {
        if (! Setting::isMeetAndGreetPublicOpen()) {
            return redirect()
                ->route('meetngreethonda.index')
                ->with('error', 'Mohon maaf, pendaftaran formulir Meet & Greet saat ini sedang ditutup.');
        }

        $data = $request->validated();

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
        $data['created_by_user_id'] = $request->user()?->id;

        $meetAndGreet = MeetAndGreet::create($data);

        $encryptedToken = Crypt::encryptString($meetAndGreet->no_registrasi);

        return redirect()
            ->route('meetngreethonda.index', ['registered' => $encryptedToken])
            ->with('success', 'Pendaftaran Meet & Greet Honda berhasil disimpan! Terima kasih telah melakukan registrasi.')
            ->with('no_registrasi', $meetAndGreet->no_registrasi);
    }
}
