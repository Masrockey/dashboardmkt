<?php

namespace App\Http\Controllers;

use App\Http\Requests\BrandStoreRequest;
use App\Http\Requests\BrandUpdateRequest;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    /**
     * Display a listing of brands.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $brands = Brand::query()
            ->with('category')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('nama_brand', 'like', "%{$search}%")
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

        return Inertia::render('brands/index', [
            'brands' => $brands,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created brand in storage.
     */
    public function store(BrandStoreRequest $request): RedirectResponse
    {
        Brand::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Brand berhasil ditambahkan.',
        ]);

        return to_route('brands.index');
    }

    /**
     * Update the specified brand in storage.
     */
    public function update(BrandUpdateRequest $request, Brand $brand): RedirectResponse
    {
        $brand->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Brand berhasil diperbarui.',
        ]);

        return to_route('brands.index');
    }

    /**
     * Remove the specified brand from storage.
     */
    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Brand berhasil dihapus.',
        ]);

        return to_route('brands.index');
    }
}
