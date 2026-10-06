<?php

namespace App\Http\Controllers;

use App\Enums\BillboardLampStatus;
use App\Enums\BillboardPhysicalStatus;
use App\Http\Requests\BillboardStoreRequest;
use App\Http\Requests\BillboardUpdateRequest;
use App\Models\Billboard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillboardController extends Controller
{
    /**
     * Display a listing of billboards.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasPermission('promosi.atl.billboard.read'), 403, 'Anda tidak memiliki akses ke menu Billboard.');

        $search = $request->string('search')->toString();
        $statusLampu = $request->string('status_lampu')->toString();
        $statusFisik = $request->string('status_fisik')->toString();

        $billboards = Billboard::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('lokasi', 'like', "%{$search}%")
                        ->orWhere('ukuran', 'like', "%{$search}%");
                });
            })
            ->when($statusLampu !== '', fn (Builder $query) => $query->where('status_lampu', $statusLampu))
            ->when($statusFisik !== '', fn (Builder $query) => $query->where('status_fisik', $statusFisik))
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('billboards/index', [
            'billboards' => $billboards,
            'stats' => [
                'total' => Billboard::count(),
                'lampu_menyala' => Billboard::where('status_lampu', BillboardLampStatus::Menyala)->count(),
                'fisik_rusak' => Billboard::whereIn('status_fisik', [BillboardPhysicalStatus::RusakRingan, BillboardPhysicalStatus::RusakBerat])->count(),
                'segera_berakhir' => Billboard::whereNotNull('tanggal_berakhir')
                    ->whereBetween('tanggal_berakhir', [now()->toDateString(), now()->addDays(30)->toDateString()])
                    ->count(),
            ],
            'lampStatuses' => collect(BillboardLampStatus::cases())
                ->map(fn (BillboardLampStatus $status) => ['value' => $status->value, 'label' => $status->label()])
                ->all(),
            'physicalStatuses' => collect(BillboardPhysicalStatus::cases())
                ->map(fn (BillboardPhysicalStatus $status) => ['value' => $status->value, 'label' => $status->label()])
                ->all(),
            'can' => [
                'write' => $user->hasPermission('promosi.atl.billboard.write'),
                'delete' => $user->hasPermission('promosi.atl.billboard.delete'),
            ],
            'filters' => [
                'search' => $search,
                'status_lampu' => $statusLampu,
                'status_fisik' => $statusFisik,
            ],
        ]);
    }

    /**
     * Store a newly created billboard in storage.
     */
    public function store(BillboardStoreRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(Billboard::PHOTO_FIELDS);

        foreach (Billboard::PHOTO_FIELDS as $field) {
            $data[$field] = $request->hasFile($field)
                ? $request->file($field)->store('billboards', 'public')
                : null;
        }

        $data['created_by_user_id'] = $request->user()->id;

        Billboard::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data billboard berhasil ditambahkan.',
        ]);

        return to_route('billboards.index');
    }

    /**
     * Update the specified billboard in storage.
     */
    public function update(BillboardUpdateRequest $request, Billboard $billboard): RedirectResponse
    {
        $data = $request->safe()->except([
            ...Billboard::PHOTO_FIELDS,
            'remove_foto_siang',
            'remove_foto_malam',
            'remove_foto_jarak_jauh',
            'remove_foto_jarak_dekat',
        ]);

        foreach (Billboard::PHOTO_FIELDS as $field) {
            if ($request->hasFile($field)) {
                Billboard::deleteStoredFile($billboard->{$field});
                $data[$field] = $request->file($field)->store('billboards', 'public');
            } elseif ($request->boolean("remove_{$field}")) {
                Billboard::deleteStoredFile($billboard->{$field});
                $data[$field] = null;
            }
        }

        $billboard->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data billboard berhasil diperbarui.',
        ]);

        return to_route('billboards.index');
    }

    /**
     * Remove the specified billboard from storage.
     */
    public function destroy(Request $request, Billboard $billboard): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('promosi.atl.billboard.delete'), 403, 'Anda tidak memiliki izin menghapus data Billboard.');

        $billboard->deletePhotos();
        $billboard->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data billboard berhasil dihapus.',
        ]);

        return to_route('billboards.index');
    }
}
