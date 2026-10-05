<?php

namespace App\Http\Controllers;

use App\Http\Requests\DealerStoreRequest;
use App\Http\Requests\DealerUpdateRequest;
use App\Models\Category;
use App\Models\Dealer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealerController extends Controller
{
    /**
     * Display a listing of dealers.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $dealers = Dealer::query()
            ->with('category')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('kode_dealer', 'like', "%{$search}%")
                        ->orWhere('nama_dealer', 'like', "%{$search}%")
                        ->orWhereHas('category', function (Builder $catQuery) use ($search) {
                            $catQuery->where('nama_kategori', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $categories = Category::query()
            ->orderBy('nama_kategori')
            ->get(['id', 'nama_kategori']);

        return Inertia::render('dealers/index', [
            'dealers' => $dealers,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created dealer in storage.
     */
    public function store(DealerStoreRequest $request): RedirectResponse
    {
        Dealer::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dealer berhasil ditambahkan.',
        ]);

        return to_route('dealers.index');
    }

    /**
     * Update the specified dealer in storage.
     */
    public function update(DealerUpdateRequest $request, Dealer $dealer): RedirectResponse
    {
        $dealer->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dealer berhasil diperbarui.',
        ]);

        return to_route('dealers.index');
    }

    /**
     * Remove the specified dealer from storage.
     */
    public function destroy(Dealer $dealer): RedirectResponse
    {
        $dealer->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dealer berhasil dihapus.',
        ]);

        return to_route('dealers.index');
    }
}
