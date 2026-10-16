<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FormBuilderController extends Controller
{
    /**
     * Display a listing of forms.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $visibility = $request->query('visibility');

        $query = Form::query()
            ->with('user:id,name,email')
            ->withCount('responses')
            ->latest('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($visibility && $visibility !== 'all') {
            $query->where('visibility', $visibility);
        }

        $forms = $query->paginate(12)->withQueryString();

        $stats = [
            'total_forms' => Form::count(),
            'published_forms' => Form::where('status', 'published')->count(),
            'public_forms' => Form::where('visibility', 'public')->count(),
            'total_responses' => FormResponse::count(),
        ];

        return Inertia::render('form-builder/index', [
            'forms' => $forms,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'visibility' => $visibility ?? 'all',
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form creation interface with template selection & live builder.
     */
    public function create(): Response
    {
        return Inertia::render('form-builder/create', [
            'templates' => $this->getTemplates(),
            'themePresets' => $this->getThemePresets(),
        ]);
    }

    /**
     * Store a newly created form.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_key' => 'nullable|string|max:100',
            'theme' => 'nullable|array',
            'fields' => 'required|array|min:1',
            'fields.*.id' => 'required|string',
            'fields.*.type' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.placeholder' => 'nullable|string',
            'fields.*.helper' => 'nullable|string',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'visibility' => 'required|in:public,private',
            'status' => 'required|in:draft,published,closed',
            'settings' => 'nullable|array',
        ]);

        $baseSlug = Str::slug($validated['title']);
        if (empty($baseSlug)) {
            $baseSlug = 'form';
        }
        $slug = $baseSlug.'-'.Str::lower(Str::random(6));

        // Ensure slug uniqueness
        while (Form::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.Str::lower(Str::random(6));
        }

        $form = Form::create([
            'user_id' => $request->user()?->id,
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'template_key' => $validated['template_key'] ?? 'blank',
            'theme' => $validated['theme'] ?? $this->getDefaultTheme(),
            'fields' => $validated['fields'],
            'visibility' => $validated['visibility'],
            'status' => $validated['status'],
            'settings' => $validated['settings'] ?? [
                'allow_multiple' => true,
                'success_message' => 'Terima kasih! Tanggapan Anda telah berhasil disimpan.',
            ],
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'form' => $form,
                'share_url' => $form->share_url,
                'message' => 'Formulir berhasil disimpan dan dipublikasikan!',
            ]);
        }

        return redirect()
            ->route('forms.index')
            ->with('success', 'Formulir berhasil dibuat!');
    }

    /**
     * Show the form edit interface.
     */
    public function edit(Form $form): Response
    {
        return Inertia::render('form-builder/create', [
            'initialForm' => $form,
            'templates' => $this->getTemplates(),
            'themePresets' => $this->getThemePresets(),
        ]);
    }

    /**
     * Update the specified form.
     */
    public function update(Request $request, Form $form): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'theme' => 'nullable|array',
            'fields' => 'required|array|min:1',
            'fields.*.id' => 'required|string',
            'fields.*.type' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.placeholder' => 'nullable|string',
            'fields.*.helper' => 'nullable|string',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'visibility' => 'required|in:public,private',
            'status' => 'required|in:draft,published,closed',
            'settings' => 'nullable|array',
        ]);

        $form->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'theme' => $validated['theme'] ?? $form->theme,
            'fields' => $validated['fields'],
            'visibility' => $validated['visibility'],
            'status' => $validated['status'],
            'settings' => $validated['settings'] ?? $form->settings,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'form' => $form->fresh(),
                'share_url' => $form->share_url,
                'message' => 'Formulir berhasil diperbarui!',
            ]);
        }

        return redirect()
            ->route('forms.index')
            ->with('success', 'Formulir berhasil diperbarui!');
    }

    /**
     * Remove the specified form.
     */
    public function destroy(Form $form): RedirectResponse
    {
        $form->delete();

        return redirect()
            ->route('forms.index')
            ->with('success', 'Formulir berhasil dihapus.');
    }

    /**
     * Display all responses for a form.
     */
    public function responses(Request $request, Form $form): Response
    {
        $responses = $form->responses()
            ->with('user:id,name,email')
            ->latest('id')
            ->paginate(25);

        return Inertia::render('form-builder/responses', [
            'form' => $form,
            'responses' => $responses,
        ]);
    }

    /**
     * Toggle form open/closed acceptance status.
     */
    public function toggleStatus(Request $request, Form $form): RedirectResponse|JsonResponse
    {
        $newStatus = $form->status === 'closed' ? 'published' : 'closed';
        $form->update([
            'status' => $newStatus,
        ]);

        $message = $form->status === 'published'
            ? 'Formulir berhasil dibuka. Sekarang menerima tanggapan baru.'
            : 'Formulir berhasil ditutup. Responden tidak dapat lagi mengisi formulir.';

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'status' => $form->status,
                'message' => $message,
            ]);
        }

        return back()->with('success', $message);
    }

    /**
     * Export responses to CSV.
     */
    public function export(Form $form): StreamedResponse
    {
        $fileName = 'tanggapan-'.Str::slug($form->title).'-'.now()->format('Ymd_His').'.csv';
        $fields = $form->fields ?? [];

        return response()->streamDownload(function () use ($form, $fields) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel utf-8
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header row
            $headers = ['No', 'Tanggal Kirim', 'IP Responden', 'User (Jika Login)'];
            foreach ($fields as $f) {
                $headers[] = $f['label'] ?? 'Field '.$f['id'];
            }
            fputcsv($handle, $headers);

            $index = 1;
            $form->responses()->with('user:id,name,email')->chunk(100, function ($chunk) use ($handle, $fields, &$index) {
                foreach ($chunk as $response) {
                    $row = [
                        $index++,
                        $response->created_at->format('Y-m-d H:i:s'),
                        $response->respondent_ip ?? '-',
                        $response->user?->name ?? 'Publik',
                    ];

                    $answers = $response->answers ?? [];
                    foreach ($fields as $f) {
                        $fId = $f['id'];
                        $val = $answers[$fId] ?? '';
                        if (is_array($val)) {
                            $val = implode(', ', $val);
                        }
                        $row[] = (string) $val;
                    }

                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Design templates for quick start.
     */
    protected function getTemplates(): array
    {
        return [
            [
                'id' => 'blank',
                'name' => 'Formulir Kosong',
                'description' => 'Mulai membuat formulir kustom dari awal dengan format bersih dan sederhana ala Google Form.',
                'icon' => 'Plus',
                'badge' => 'Format Standar',
                'layout_type' => 'centered_card',
                'features' => [
                    'Kartu Terpusat Responsif (Google Form)',
                    'Bilah Aksen Warna Tema Atas',
                    'Alur Pertanyaan Bersih & Simpel',
                ],
                'title' => 'Formulir Tanpa Judul',
                'subtitle' => 'Silakan lengkapi formulir di bawah ini dengan data yang valid.',
                'theme' => [
                    'color' => '#673ab7',
                    'accent' => '#ede7f6',
                    'theme_name' => 'Google Purple',
                    'banner_style' => 'bar',
                ],
                'settings' => [
                    'layout_type' => 'centered_card',
                    'allow_multiple' => true,
                    'success_message' => 'Terima kasih! Tanggapan Anda telah berhasil disimpan.',
                ],
                'fields' => [
                    [
                        'id' => 'gf_1',
                        'type' => 'text',
                        'label' => 'Nama Lengkap',
                        'placeholder' => 'Jawaban Anda',
                        'required' => true,
                    ],
                    [
                        'id' => 'gf_2',
                        'type' => 'phone',
                        'label' => 'Nomor WhatsApp / HP',
                        'placeholder' => '08xxxxxxxxxx',
                        'required' => true,
                    ],
                ],
            ],
            [
                'id' => 'google_form',
                'name' => 'Google Form Klasik (Centered Card)',
                'description' => 'Desain murni Google Form: bersih, terpusat, dengan bilah warna tema di atas tanpa hero banner atau sidebar.',
                'icon' => 'FileText',
                'badge' => 'Google Form Klasik',
                'layout_type' => 'centered_card',
                'features' => [
                    'Kartu Terpusat Responsif (Google Form)',
                    'Bilah Aksen Warna Tema Atas',
                    'Tanpa Banner & Tanpa Sidebar (Minimalis)',
                    'Alur Pertanyaan Cepat & Elegan',
                ],
                'title' => 'Formulir Pendaftaran & Registrasi Online',
                'subtitle' => 'Silakan lengkapi formulir di bawah ini dengan data yang valid.',
                'theme' => [
                    'color' => '#673ab7',
                    'accent' => '#ede7f6',
                    'theme_name' => 'Classic Purple',
                    'banner_style' => 'bar',
                ],
                'settings' => [
                    'layout_type' => 'centered_card',
                    'top_bar' => ['enabled' => false],
                    'hero' => ['enabled' => false],
                    'metrics' => ['enabled' => false],
                    'sidebar' => ['enabled' => false],
                ],
                'fields' => [
                    [
                        'id' => 'gf_1',
                        'type' => 'text',
                        'label' => 'Nama Lengkap',
                        'placeholder' => 'Jawaban Anda',
                        'required' => true,
                    ],
                    [
                        'id' => 'gf_2',
                        'type' => 'email',
                        'label' => 'Alamat Email',
                        'placeholder' => 'email@domain.com',
                        'required' => true,
                    ],
                    [
                        'id' => 'gf_3',
                        'type' => 'phone',
                        'label' => 'Nomor WhatsApp / Telepon',
                        'placeholder' => '08xxxxxxxxxx',
                        'required' => true,
                    ],
                    [
                        'id' => 'gf_4',
                        'type' => 'radio',
                        'label' => 'Kategori Pilihan Anda',
                        'required' => true,
                        'options' => ['Pilihan A', 'Pilihan B', 'Pilihan C'],
                    ],
                    [
                        'id' => 'gf_5',
                        'type' => 'paragraph',
                        'label' => 'Catatan Tambahan atau Pertanyaan',
                        'placeholder' => 'Tuliskan catatan Anda...',
                        'required' => false,
                    ],
                ],
            ],
            [
                'id' => 'showroom_dealer',
                'name' => 'Dealer Showroom & Test Ride Showcase',
                'description' => 'Desain marketing untuk booking test ride, pameran unit baru, dan promosi dealer resmi Honda.',
                'icon' => 'Store',
                'badge' => 'UI Showroom & Promo',
                'layout_type' => 'split_screen',
                'features' => [
                    'Header Showroom Banner & Promo Badge',
                    'Card Pilihan Unit Motor Unggulan',
                    'Pilihan Jaringan Dealer Resmi Honda NTB',
                    'Integrasi Penjadwalan Test Ride',
                ],
                'title' => 'Booking Test Ride & Info Promo Honda NTB',
                'subtitle' => 'Rasakan sensasi kenyamanan berkendara dan dapatkan penawaran diskon spesial dealer.',
                'theme' => [
                    'color' => '#2563eb',
                    'accent' => '#eff6ff',
                    'theme_name' => 'Sapphire Blue',
                    'banner_style' => 'gradient',
                ],
                'settings' => [
                    'layout_type' => 'split_screen',
                    'top_bar' => [
                        'enabled' => true,
                        'badge' => 'DEALER RESMI NTB',
                        'title' => 'PORTAL BOOKING TEST RIDE HONDA NTB',
                        'deadline' => 'PROMO BULAN INI',
                        'status' => 'STATUS: UNIT TEST READY',
                    ],
                    'hero' => [
                        'enabled' => true,
                        'banner_url' => 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
                        'headline_pre' => 'ASTRA MOTOR DEALER SHOWCASE',
                        'validation_pill' => 'Diskon OTR & DP Ringan',
                        'badges' => ['BOOKING TEST RIDE', 'PROMO CASH & KREDIT', 'SEMUA DEALER NTB'],
                    ],
                    'metrics' => [
                        'enabled' => true,
                        'items' => [
                            ['label' => 'Lokasi Dealer', 'value' => 'Seluruh NTB', 'icon' => 'map-pin'],
                            ['label' => 'Model R2', 'value' => 'PCX, Vario, Scoopy', 'icon' => 'bike'],
                            ['label' => 'Pelayanan', 'value' => 'Sales & Konsultasi', 'icon' => 'store'],
                            ['label' => 'Proses', 'value' => 'Cepat 1 Hari', 'icon' => 'clock'],
                        ],
                    ],
                    'sidebar' => [
                        'enabled' => true,
                        'profile_card' => [
                            'enabled' => true,
                            'title' => 'UNIT TERFAVORIT',
                            'image_url' => 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
                            'items' => [
                                ['num' => '01', 'class' => 'PREMIUM', 'name' => 'New PCX 160 & Vario 160', 'team' => 'Mesin eSP+ 4-Katup Nyaman & Mewah'],
                                ['num' => '02', 'class' => 'FASHION', 'name' => 'Stylo 160 & Scoopy Stylish', 'team' => 'Desain Klasik Modern Elegan'],
                            ],
                        ],
                        'terms_card' => [
                            'enabled' => true,
                            'title' => 'KETENTUAN TEST RIDE',
                            'items' => [
                                'Membawa SIM C aktif dan e-KTP',
                                'Mengisi konfirmasi jadwal kunjungan',
                                'Sales konsultan kami akan menghubungi via WhatsApp',
                            ],
                        ],
                        'map_card' => [
                            'enabled' => true,
                            'title' => 'JARINGAN DEALER NTB',
                            'venue_name' => 'Astra Motor Mataram & Jaringan Dealer',
                            'venue_address' => 'Jl. Pejanggik No. 45, Cakranegara, Mataram',
                            'venue_gate' => 'Buka: 08:30 - 17:00 WITA',
                            'map_image_url' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB9-44rzIlhHdzm0AHfhRdaD_OR5iL-lYYKuZVfzoxJOpPYz69DtxCk8zkIB-E-B8uiG81H1LJ1bGN8pqD8tjoMB2ycVkBlSHhpd1IdnvG4IumwjWYviJLoK5BLbEa7j22U6SxalXH4MzMwU3TVjLbMBEsZ9QeYnV5XYj2nDeAzguSUk0mmAxu-LOfusxkHiQlS-MNdnumFFZocC2NW4RdRDZmmovENjWA2w-KGKWKjcWdtEcu_Z6N',
                        ],
                        'callout_card' => [
                            'enabled' => true,
                            'tagline' => '#Cari_Aman',
                            'sponsor' => 'HONDA NTB',
                            'message' => 'NIKMATI DISKON SPESIAL & VOUCHER BELANJA HINGGA JUTAAN RUPIAH',
                        ],
                    ],
                ],
                'fields' => [
                    [
                        'id' => 'sh_1',
                        'type' => 'text',
                        'label' => 'Nama Lengkap Calon Konsumen',
                        'placeholder' => 'Nama sesuai KTP',
                        'required' => true,
                    ],
                    [
                        'id' => 'sh_2',
                        'type' => 'phone',
                        'label' => 'Nomor WhatsApp Aktif',
                        'placeholder' => '08xxxxxxxxxx',
                        'required' => true,
                    ],
                    [
                        'id' => 'sh_3',
                        'type' => 'select',
                        'label' => 'Model Motor yang Diminati',
                        'required' => true,
                        'options' => [
                            'New PCX 160 ABS/CBS',
                            'New Scoopy Prestige & Stylish',
                            'Vario 160 Street Style',
                            'Vario 125 Sporty',
                            'Stylo 160 Retro Modern',
                            'BeAT Street CBS',
                            'CRF 150L Off-Road',
                        ],
                    ],
                    [
                        'id' => 'sh_4',
                        'type' => 'select',
                        'label' => 'Pilihan Dealer Resmi Terdekat',
                        'required' => true,
                        'options' => [
                            'Astra Motor Ampenan (Mataram)',
                            'Astra Motor Mataram (Jl. Pejanggik)',
                            'Krida Dinamik Mataram',
                            'Astra Motor Praya (Lombok Tengah)',
                            'Astra Motor Selong (Lombok Timur)',
                            'Astra Motor Sumbawa Besar',
                            'Astra Motor Bima',
                        ],
                    ],
                    [
                        'id' => 'sh_5',
                        'type' => 'date',
                        'label' => 'Rencana Tanggal Kunjungan / Test Ride',
                        'required' => true,
                    ],
                    [
                        'id' => 'sh_6',
                        'type' => 'radio',
                        'label' => 'Rencana Metode Pembelian',
                        'required' => true,
                        'options' => ['Kredit / Angsuran Ringan', 'Tunai / Cash', 'Tukar Tambah (Trade-in)'],
                    ],
                ],
            ],
            [
                'id' => 'customer_satisfaction',
                'name' => 'Survei Kepuasan & Evaluasi Konsumen',
                'description' => 'Desain kuesioner interaktif untuk survei kepuasan pelanggan, pelayanan dealer, dan purna jual bengkel AHASS.',
                'icon' => 'Star',
                'badge' => 'UI Survei & Rating',
                'layout_type' => 'hero_centered',
                'features' => [
                    'Hero Banner Bengkel Resmi AHASS',
                    'Skala Rating Bintang Interaktif (1 - 5)',
                    'Indikator Kepuasan Layanan & Keramahan',
                    'Kotak Saran & Aspirasi Konsumen',
                ],
                'title' => 'Survei Kepuasan Pelanggan Honda NTB',
                'subtitle' => 'Pendapat Anda sangat berharga bagi kami untuk terus meningkatkan mutu pelayanan.',
                'theme' => [
                    'color' => '#059669',
                    'accent' => '#ecfdf5',
                    'theme_name' => 'Emerald Green',
                    'banner_style' => 'pattern',
                ],
                'settings' => [
                    'layout_type' => 'hero_centered',
                    'top_bar' => ['enabled' => false],
                    'hero' => [
                        'enabled' => true,
                        'banner_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
                        'headline_pre' => 'BENGKEL RESMI AHASS HONDA NTB',
                        'validation_pill' => 'Garansi Servis Pasti',
                        'badges' => ['SURVEI KEPUASAN', 'LAYANAN AHASS', 'SUKU CADANG ASLI'],
                    ],
                    'metrics' => ['enabled' => false],
                    'sidebar' => ['enabled' => false],
                ],
                'fields' => [
                    [
                        'id' => 'cs_1',
                        'type' => 'text',
                        'label' => 'Nama Pelanggan',
                        'placeholder' => 'Nama Anda',
                        'required' => true,
                    ],
                    [
                        'id' => 'cs_2',
                        'type' => 'phone',
                        'label' => 'Nomor Kontak Aktif',
                        'placeholder' => '08xxxxxxxxxx',
                        'required' => true,
                    ],
                    [
                        'id' => 'cs_3',
                        'type' => 'text',
                        'label' => 'Tipe Motor Honda yang Dimiliki',
                        'placeholder' => 'Contoh: PCX 160, Scoopy, BeAT, dll.',
                        'required' => true,
                    ],
                    [
                        'id' => 'cs_4',
                        'type' => 'rating',
                        'label' => 'Seberapa puas Anda dengan keramahan & kecepatan pelayanan sales/dealer?',
                        'helper' => '1 = Sangat Kecewa, 5 = Sangat Memuaskan',
                        'required' => true,
                    ],
                    [
                        'id' => 'cs_5',
                        'type' => 'radio',
                        'label' => 'Apakah Anda bersedia merekomendasikan motor Honda kepada rekan atau keluarga?',
                        'required' => true,
                        'options' => ['Sangat Bersedia', 'Mungkin / Ragu-ragu', 'Tidak Bersedia'],
                    ],
                    [
                        'id' => 'cs_6',
                        'type' => 'paragraph',
                        'label' => 'Saran dan Masukan untuk Peningkatan Layanan Kami',
                        'placeholder' => 'Tuliskan kritik, saran, atau pengalaman Anda...',
                        'required' => false,
                    ],
                ],
            ],
        ];
    }

    /**
     * Preset color themes for forms.
     */
    protected function getThemePresets(): array
    {
        return [
            [
                'id' => 'red',
                'theme_name' => 'Honda Racing Red',
                'color' => '#dc2626',
                'accent' => '#fef2f2',
                'preview_bg' => 'from-red-600 to-rose-700',
            ],
            [
                'id' => 'blue',
                'theme_name' => 'Sapphire Blue',
                'color' => '#2563eb',
                'accent' => '#eff6ff',
                'preview_bg' => 'from-blue-600 to-indigo-700',
            ],
            [
                'id' => 'emerald',
                'theme_name' => 'Emerald Green',
                'color' => '#059669',
                'accent' => '#ecfdf5',
                'preview_bg' => 'from-emerald-600 to-teal-700',
            ],
            [
                'id' => 'purple',
                'theme_name' => 'Royal Violet',
                'color' => '#7c3aed',
                'accent' => '#f5f3ff',
                'preview_bg' => 'from-purple-600 to-indigo-800',
            ],
            [
                'id' => 'amber',
                'theme_name' => 'Sunset Amber',
                'color' => '#d97706',
                'accent' => '#fffbeb',
                'preview_bg' => 'from-amber-600 to-orange-700',
            ],
            [
                'id' => 'dark',
                'theme_name' => 'Modern Midnight',
                'color' => '#0f172a',
                'accent' => '#f8fafc',
                'preview_bg' => 'from-slate-900 to-neutral-800',
            ],
        ];
    }

    /**
     * Default theme fallback.
     */
    protected function getDefaultTheme(): array
    {
        return [
            'color' => '#dc2626',
            'accent' => '#fef2f2',
            'theme_name' => 'Honda Racing Red',
            'banner_style' => 'gradient',
        ];
    }
}
