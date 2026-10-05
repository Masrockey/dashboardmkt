<?php

namespace App\Http\Controllers;

use App\Http\Requests\MeetAndGreetStoreRequest;
use App\Http\Requests\MeetAndGreetUpdateRequest;
use App\Models\Dealer;
use App\Models\MeetAndGreet;
use App\Models\Type;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MeetAndGreetController extends Controller
{
    /**
     * Display a listing of the Meet & Greet records.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->toString();
        $dealerFilter = $request->input('dealer_asal') ?: $request->input('dealer_id');

        $meetAndGreets = MeetAndGreet::query()
            ->with([
                'dealer:id,kode_dealer,nama_dealer',
                'createdByUser:id,name',
            ])
            ->when($user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('dealer_id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->when($dealerFilter && ! $user->isDealerOnly(), function (Builder $query) use ($dealerFilter) {
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
            })
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
            'filters' => [
                'search' => $search,
                'dealer_id' => $dealerFilter,
                'dealer_asal' => $dealerFilter,
            ],
        ]);
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
            if ($matchedDealerId) {
                $data['dealer_id'] = $matchedDealerId;
            }
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
            if ($matchedDealerId) {
                $data['dealer_id'] = $matchedDealerId;
            }
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
