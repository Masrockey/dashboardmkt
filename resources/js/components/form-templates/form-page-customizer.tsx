import React from 'react';
import {
    Bike,
    Calendar,
    Check,
    Clock,
    FileText,
    Flag,
    Image as ImageIcon,
    Info,
    Layout,
    Layers,
    MapPin,
    Palette,
    Plus,
    Sliders,
    Sparkles,
    Star,
    Store,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { FormSettings, FormTheme } from './customizable-form-view';

interface FormPageCustomizerProps {
    settings: FormSettings;
    onChange: (nextSettings: FormSettings) => void;
    theme: FormTheme;
    onThemeChange: (theme: FormTheme) => void;
    themePresets?: Array<{
        id: string;
        theme_name: string;
        color: string;
        accent: string;
    }>;
}

const PRESET_BANNERS = [
    {
        name: 'Astra Honda Racing Mandalika',
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1600&auto=format&fit=crop',
    },
    {
        name: 'Showroom Astra Motor',
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1600&auto=format&fit=crop',
    },
    {
        name: 'AHASS Service & Care',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1600&auto=format&fit=crop',
    },
];

export default function FormPageCustomizer({
    settings,
    onChange,
    theme,
    onThemeChange,
    themePresets = [],
}: FormPageCustomizerProps) {
    const layoutType = settings?.layout_type || 'centered_card';

    // Helper update nested settings
    const update = (patch: Partial<FormSettings>) => {
        onChange({
            ...settings,
            ...patch,
        });
    };

    const updateTopBar = (patch: any) => {
        update({
            top_bar: {
                ...(settings.top_bar || { enabled: false }),
                ...patch,
            },
        });
    };

    const updateHero = (patch: any) => {
        update({
            hero: {
                ...(settings.hero || { enabled: false }),
                ...patch,
            },
        });
    };

    const updateMetrics = (patch: any) => {
        update({
            metrics: {
                ...(settings.metrics || { enabled: false }),
                ...patch,
            },
        });
    };

    const updateSidebar = (patch: any) => {
        update({
            sidebar: {
                ...(settings.sidebar || { enabled: false }),
                ...patch,
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Elementor Intro Banner */}
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Sparkles className="size-4 text-red-600" />
                        Kustomisasi Blok Halaman Ala Elementor
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Sesuaikan tata letak halaman, aktifkan atau nonaktifkan blok banner, telemetri, statistik, dan sidebar interaktif secara bebas.
                    </p>
                </div>
                <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-300 text-[11px] font-mono py-1 px-2.5">
                    Layout Aktif: {layoutType.toUpperCase()}
                </Badge>
            </div>

            {/* =========================================================
                1. TIPE TATA LETAK UTAMA (LAYOUT CANVAS)
               ========================================================= */}
            <Card className="p-4 border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Layout className="size-3.5 text-red-600" />
                            1. Tata Letak Halaman (Page Structure)
                        </Label>
                        <p className="text-[11px] text-neutral-500">
                            Pilih model halaman yang diinginkan untuk formulir Anda.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* Centered Card */}
                    <div
                        onClick={() =>
                            update({
                                layout_type: 'centered_card',
                                top_bar: { ...settings.top_bar, enabled: false },
                                hero: { ...settings.hero, enabled: false },
                                metrics: { ...settings.metrics, enabled: false },
                                sidebar: { ...settings.sidebar, enabled: false },
                            })
                        }
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-between ${
                            layoutType === 'centered_card'
                                ? 'border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                        }`}
                    >
                        <div className="space-y-2">
                            {/* Visual wireframe */}
                            <div className="h-16 rounded-md bg-neutral-100 dark:bg-neutral-800 p-2 flex flex-col items-center justify-center">
                                <div className="h-2 w-12 bg-neutral-300 dark:bg-neutral-600 rounded mb-1.5" />
                                <div className="h-7 w-20 bg-white dark:bg-neutral-900 border rounded shadow-2xs" />
                            </div>
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                                <span>Centered Card (Klasik)</span>
                                {layoutType === 'centered_card' && <Check className="size-3 text-red-600" />}
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                Form minimalis terpusat tanpa banner dan tanpa sidebar (mirip Google Form).
                            </p>
                        </div>
                    </div>

                    {/* Split Screen 2-Kolom */}
                    <div
                        onClick={() =>
                            update({
                                layout_type: 'split_screen',
                                top_bar: { ...(settings.top_bar || {}), enabled: true },
                                hero: { ...(settings.hero || {}), enabled: true },
                                metrics: { ...(settings.metrics || {}), enabled: true },
                                sidebar: { ...(settings.sidebar || {}), enabled: true },
                            })
                        }
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-between ${
                            layoutType === 'split_screen'
                                ? 'border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                        }`}
                    >
                        <div className="space-y-2">
                            {/* Visual wireframe */}
                            <div className="h-16 rounded-md bg-neutral-100 dark:bg-neutral-800 p-1.5 flex gap-1">
                                <div className="w-1/2 bg-red-100 dark:bg-red-950/50 rounded flex flex-col p-1 gap-1">
                                    <div className="h-4 bg-red-300 dark:bg-red-800 rounded" />
                                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                                </div>
                                <div className="w-1/2 bg-white dark:bg-neutral-900 rounded border p-1 flex flex-col gap-1">
                                    <div className="h-2 bg-neutral-300 rounded" />
                                    <div className="h-4 bg-neutral-200 rounded" />
                                </div>
                            </div>
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                                <span>Split Screen 2-Kolom</span>
                                {layoutType === 'split_screen' && <Check className="size-3 text-red-600" />}
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                Poster banner &amp; sidebar interaktif di kiri, formulir pertanyaan lengkap di kanan.
                            </p>
                        </div>
                    </div>

                    {/* Hero Centered */}
                    <div
                        onClick={() =>
                            update({
                                layout_type: 'hero_centered',
                                top_bar: { ...(settings.top_bar || {}), enabled: false },
                                hero: { ...(settings.hero || {}), enabled: true },
                                metrics: { ...(settings.metrics || {}), enabled: false },
                                sidebar: { ...(settings.sidebar || {}), enabled: false },
                            })
                        }
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-between ${
                            layoutType === 'hero_centered'
                                ? 'border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                        }`}
                    >
                        <div className="space-y-2">
                            {/* Visual wireframe */}
                            <div className="h-16 rounded-md bg-neutral-100 dark:bg-neutral-800 p-1.5 flex flex-col gap-1">
                                <div className="h-6 bg-red-200 dark:bg-red-900 rounded" />
                                <div className="h-6 w-3/4 mx-auto bg-white dark:bg-neutral-900 rounded border" />
                            </div>
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                                <span>Hero Header Terpusat</span>
                                {layoutType === 'hero_centered' && <Check className="size-3 text-red-600" />}
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                Header banner lebar di bagian atas, formulir kartu di bawahnya di tengah.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* =========================================================
                2. BLOK TELEMETRI & TOP STATUS BAR
               ========================================================= */}
            <Card className="p-4 border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Clock className="size-3.5 text-amber-500" />
                            2. Blok Telemetri &amp; Top Status Bar
                        </Label>
                        <p className="text-[11px] text-neutral-500">
                            Bilah informasi atas berisi tag lokasi, nama event, batas waktu, dan status formulir.
                        </p>
                    </div>
                    <Switch
                        checked={settings.top_bar?.enabled ?? false}
                        onCheckedChange={(checked) => updateTopBar({ enabled: checked })}
                    />
                </div>

                {settings.top_bar?.enabled && (
                    <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                            <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                Badge Tag Kiri
                            </Label>
                            <Input
                                value={settings.top_bar?.badge || ''}
                                onChange={(e) => updateTopBar({ badge: e.target.value })}
                                placeholder="PADDOCK GATE NTB"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                Judul / Event Tag
                            </Label>
                            <Input
                                value={settings.top_bar?.title || ''}
                                onChange={(e) => updateTopBar({ title: e.target.value })}
                                placeholder="MANDALIKA GP EXCLUSIVE FAN ZONE"
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                Batas Pendaftaran / Countdown
                            </Label>
                            <Input
                                value={settings.top_bar?.deadline || ''}
                                onChange={(e) => updateTopBar({ deadline: e.target.value })}
                                placeholder="BATAS PENDAFTARAN: 05 OKT 2026 - 23:59 WITA"
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                Status Form Kanan
                            </Label>
                            <Input
                                value={settings.top_bar?.status || ''}
                                onChange={(e) => updateTopBar({ status: e.target.value })}
                                placeholder="STATUS: VERIFIKASI DOKUMEN AKTIF"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* =========================================================
                3. BLOK HERO BANNER & POSTER
               ========================================================= */}
            <Card className="p-4 border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <ImageIcon className="size-3.5 text-blue-500" />
                            3. Blok Hero Banner &amp; Poster Gambar
                        </Label>
                        <p className="text-[11px] text-neutral-500">
                            Poster gambar visual di bagian depan form beserta badge kategori dan judul besar.
                        </p>
                    </div>
                    <Switch
                        checked={settings.hero?.enabled ?? false}
                        onCheckedChange={(checked) => updateHero({ enabled: checked })}
                    />
                </div>

                {settings.hero?.enabled && (
                    <div className="pt-2 border-t space-y-3 text-xs">
                        {/* URL Gambar */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                    URL Gambar Banner Poster
                                </Label>
                                <span className="text-[10px] text-neutral-400">
                                    Format: JPG, PNG, WebP
                                </span>
                            </div>
                            <Input
                                value={settings.hero?.banner_url || ''}
                                onChange={(e) => updateHero({ banner_url: e.target.value })}
                                placeholder="https://example.com/poster.jpg"
                                className="h-8 text-xs"
                            />

                            {/* Tombol Preset Cepat */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-neutral-400">Pilihan Cepat:</span>
                                {PRESET_BANNERS.map((pb, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => updateHero({ banner_url: pb.url })}
                                        className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                                    >
                                        {pb.name}
                                    </button>
                                ))}
                            </div>

                            {/* Preview thumbnail */}
                            {settings.hero?.banner_url && (
                                <div className="mt-2 rounded-lg overflow-hidden border max-w-sm max-h-24 bg-neutral-900">
                                    <img
                                        src={settings.hero.banner_url}
                                        alt="Banner Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                    Kategori Pill (Kiri Atas)
                                </Label>
                                <Input
                                    value={settings.hero?.badge_category || ''}
                                    onChange={(e) => updateHero({ badge_category: e.target.value })}
                                    placeholder="PORTAL REGISTRASI RESMI"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                    Sub-headline / Kicker Text
                                </Label>
                                <Input
                                    value={settings.hero?.headline_pre || ''}
                                    onChange={(e) => updateHero({ headline_pre: e.target.value })}
                                    placeholder="ASTRA HONDA RACING TEAM • MEET & GREET 2026"
                                    className="h-8 text-xs font-semibold"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                                Badges Tambahan (Pisahkan dengan koma)
                            </Label>
                            <Input
                                value={(settings.hero?.badges || []).join(', ')}
                                onChange={(e) =>
                                    updateHero({
                                        badges: e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                    })
                                }
                                placeholder="HONDA VARIO SERIES ONLY, KONSUMEN DOMISILI NTB"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* =========================================================
                4. BLOK QUICK METRICS (3 KOTAK INFO)
               ========================================================= */}
            <Card className="p-4 border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Layers className="size-3.5 text-emerald-500" />
                            4. Blok Quick Metrics (3 Kartu Ringkasan)
                        </Label>
                        <p className="text-[11px] text-neutral-500">
                            Tampilkan 3 ringkasan cepat seperti tanggal periode, lokasi gate, atau info kuota.
                        </p>
                    </div>
                    <Switch
                        checked={settings.metrics?.enabled ?? false}
                        onCheckedChange={(checked) => updateMetrics({ enabled: checked })}
                    />
                </div>

                {settings.metrics?.enabled && (
                    <div className="pt-2 border-t space-y-3 text-xs">
                        {(settings.metrics?.items || [
                            { label: 'PERIODE PENDAFTARAN', value: '2 - 5 Oktober 2026', icon: 'calendar' },
                            { label: 'LOKASI VENUE', value: 'Dapur Sasak, Udayana', icon: 'map-pin' },
                            { label: 'STATUS KUOTA', value: 'Terbatas (50 Seat)', icon: 'clock' },
                        ]).map((metric, mIdx) => (
                            <div
                                key={mIdx}
                                className="p-2.5 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/50 grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                                <div>
                                    <Label className="text-[10px] text-neutral-400 block mb-0.5">
                                        Label Box {mIdx + 1}
                                    </Label>
                                    <Input
                                        value={metric.label}
                                        onChange={(e) => {
                                            const nextItems = [...(settings.metrics?.items || [])];
                                            nextItems[mIdx] = { ...metric, label: e.target.value };
                                            updateMetrics({ items: nextItems });
                                        }}
                                        className="h-7 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] text-neutral-400 block mb-0.5">
                                        Nilai / Deskripsi
                                    </Label>
                                    <Input
                                        value={metric.value}
                                        onChange={(e) => {
                                            const nextItems = [...(settings.metrics?.items || [])];
                                            nextItems[mIdx] = { ...metric, value: e.target.value };
                                            updateMetrics({ items: nextItems });
                                        }}
                                        className="h-7 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] text-neutral-400 block mb-0.5">
                                        Icon
                                    </Label>
                                    <Select
                                        value={metric.icon || 'calendar'}
                                        onValueChange={(val) => {
                                            const nextItems = [...(settings.metrics?.items || [])];
                                            nextItems[mIdx] = { ...metric, icon: val };
                                            updateMetrics({ items: nextItems });
                                        }}
                                    >
                                        <SelectTrigger className="h-7 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="calendar" className="text-xs">📅 Calendar</SelectItem>
                                            <SelectItem value="map-pin" className="text-xs">📍 Map Pin</SelectItem>
                                            <SelectItem value="clock" className="text-xs">⏰ Clock</SelectItem>
                                            <SelectItem value="bike" className="text-xs">🏍️ Motorbike</SelectItem>
                                            <SelectItem value="store" className="text-xs">🏪 Store</SelectItem>
                                            <SelectItem value="info" className="text-xs">ℹ️ Info</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* =========================================================
                5. BLOK SIDEBAR WIDGETS (KHUSUS SPLIT SCREEN)
               ========================================================= */}
            {layoutType === 'split_screen' && (
                <Card className="p-4 border shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                <Sliders className="size-3.5 text-purple-600" />
                                5. Blok Sidebar Widgets (Kolom Samping)
                            </Label>
                            <p className="text-[11px] text-neutral-500">
                                Kelola kartu interaktif di kolom samping kiri: Profil, Syarat &amp; Ketentuan, Peta Venue, dan Promo.
                            </p>
                        </div>
                        <Switch
                            checked={settings.sidebar?.enabled ?? true}
                            onCheckedChange={(checked) => updateSidebar({ enabled: checked })}
                        />
                    </div>

                    {settings.sidebar?.enabled && (
                        <div className="pt-2 border-t space-y-4 text-xs">
                            {/* Widget 1: Profile / Lineup */}
                            <div className="p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                        <Flag className="size-3 text-red-600" />
                                        Widget 1: Profil / Lineup Riders
                                    </Label>
                                    <Switch
                                        checked={settings.sidebar?.profile_card?.enabled ?? true}
                                        onCheckedChange={(checked) =>
                                            updateSidebar({
                                                profile_card: {
                                                    ...(settings.sidebar?.profile_card || {}),
                                                    enabled: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                {settings.sidebar?.profile_card?.enabled && (
                                    <div className="space-y-2 pt-1">
                                        <Input
                                            value={settings.sidebar?.profile_card?.title || ''}
                                            onChange={(e) =>
                                                updateSidebar({
                                                    profile_card: {
                                                        ...(settings.sidebar?.profile_card || {}),
                                                        title: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="LINE UP RIDERS RESMI"
                                            className="h-7 text-xs font-bold"
                                        />
                                        <p className="text-[10px] text-neutral-400">
                                            Menampilkan kartu rider Mario Aji, Fadillah Arbi, Veda Ega Pratama, dll.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Widget 2: Syarat & Ketentuan */}
                            <div className="p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                        <FileText className="size-3 text-amber-600" />
                                        Widget 2: Syarat &amp; Ketentuan Acara
                                    </Label>
                                    <Switch
                                        checked={settings.sidebar?.terms_card?.enabled ?? true}
                                        onCheckedChange={(checked) =>
                                            updateSidebar({
                                                terms_card: {
                                                    ...(settings.sidebar?.terms_card || {}),
                                                    enabled: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                {settings.sidebar?.terms_card?.enabled && (
                                    <div className="space-y-2 pt-1">
                                        <Input
                                            value={settings.sidebar?.terms_card?.title || ''}
                                            onChange={(e) =>
                                                updateSidebar({
                                                    terms_card: {
                                                        ...(settings.sidebar?.terms_card || {}),
                                                        title: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="SYARAT & KETENTUAN TIKET"
                                            className="h-7 text-xs font-bold"
                                        />
                                        <Textarea
                                            value={(settings.sidebar?.terms_card?.items || []).join('\n')}
                                            onChange={(e) =>
                                                updateSidebar({
                                                    terms_card: {
                                                        ...(settings.sidebar?.terms_card || {}),
                                                        items: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                                                    },
                                                })
                                            }
                                            placeholder="Tuliskan tiap poin syarat di baris baru..."
                                            rows={3}
                                            className="text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Widget 3: Venue Map */}
                            <div className="p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                        <MapPin className="size-3 text-red-600" />
                                        Widget 3: Peta &amp; Lokasi Venue
                                    </Label>
                                    <Switch
                                        checked={settings.sidebar?.map_card?.enabled ?? true}
                                        onCheckedChange={(checked) =>
                                            updateSidebar({
                                                map_card: {
                                                    ...(settings.sidebar?.map_card || {}),
                                                    enabled: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                {settings.sidebar?.map_card?.enabled && (
                                    <div className="space-y-2 pt-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Input
                                                value={settings.sidebar?.map_card?.venue_name || ''}
                                                onChange={(e) =>
                                                    updateSidebar({
                                                        map_card: {
                                                            ...(settings.sidebar?.map_card || {}),
                                                            venue_name: e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Nama Lokasi / Tempat"
                                                className="h-7 text-xs font-bold"
                                            />
                                            <Input
                                                value={settings.sidebar?.map_card?.venue_gate || ''}
                                                onChange={(e) =>
                                                    updateSidebar({
                                                        map_card: {
                                                            ...(settings.sidebar?.map_card || {}),
                                                            venue_gate: e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Info Gate / Jam Buka"
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                        <Input
                                            value={settings.sidebar?.map_card?.venue_address || ''}
                                            onChange={(e) =>
                                                updateSidebar({
                                                    map_card: {
                                                        ...(settings.sidebar?.map_card || {}),
                                                        venue_address: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Alamat lengkap lokasi acara..."
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Widget 4: Callout Promo & Sponsor */}
                            <div className="p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                        <Star className="size-3 text-amber-500" />
                                        Widget 4: Banner Callout Promo &amp; Sponsor
                                    </Label>
                                    <Switch
                                        checked={settings.sidebar?.callout_card?.enabled ?? true}
                                        onCheckedChange={(checked) =>
                                            updateSidebar({
                                                callout_card: {
                                                    ...(settings.sidebar?.callout_card || {}),
                                                    enabled: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                {settings.sidebar?.callout_card?.enabled && (
                                    <div className="space-y-2 pt-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Input
                                                value={settings.sidebar?.callout_card?.tagline || ''}
                                                onChange={(e) =>
                                                    updateSidebar({
                                                        callout_card: {
                                                            ...(settings.sidebar?.callout_card || {}),
                                                            tagline: e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Tagline / Hashtag"
                                                className="h-7 text-xs italic font-bold"
                                            />
                                            <Input
                                                value={settings.sidebar?.callout_card?.sponsor || ''}
                                                onChange={(e) =>
                                                    updateSidebar({
                                                        callout_card: {
                                                            ...(settings.sidebar?.callout_card || {}),
                                                            sponsor: e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Nama Sponsor / Mitra"
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                        <Input
                                            value={settings.sidebar?.callout_card?.message || ''}
                                            onChange={(e) =>
                                                updateSidebar({
                                                    callout_card: {
                                                        ...(settings.sidebar?.callout_card || {}),
                                                        message: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Pesan ajakan promo..."
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* =========================================================
                6. WARNA TEMA & AKSEN
               ========================================================= */}
            <Card className="p-4 border shadow-xs space-y-3">
                <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Palette className="size-3.5 text-neutral-500" />
                    6. Palet Warna Tema &amp; Brand
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                    {themePresets.map((tp) => {
                        const isSelected = theme.color === tp.color;
                        return (
                            <button
                                key={tp.id}
                                type="button"
                                onClick={() =>
                                    onThemeChange({
                                        color: tp.color,
                                        accent: tp.accent,
                                        theme_name: tp.theme_name,
                                    })
                                }
                                className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border text-xs font-medium transition-all ${
                                    isSelected
                                        ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-900 ring-2 ring-neutral-400'
                                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                                }`}
                            >
                                <span
                                    className="size-4 rounded-full border border-white shadow-2xs"
                                    style={{ backgroundColor: tp.color }}
                                />
                                <span className="text-[11px] text-neutral-800 dark:text-neutral-200">
                                    {tp.theme_name}
                                </span>
                                {isSelected && <Check className="size-3 ml-1 text-neutral-900 dark:text-neutral-100" />}
                            </button>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
