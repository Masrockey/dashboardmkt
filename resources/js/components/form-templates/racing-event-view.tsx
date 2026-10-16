import React from 'react';
import {
    AlarmClock,
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    FileText,
    Flag,
    Info,
    Lock,
    MapPin,
    Phone,
    ShieldAlert,
    Sparkles,
    UploadCloud,
    UserCheck,
    Bike,
} from 'lucide-react';

export interface FormFieldItem {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    helper?: string;
    required: boolean;
    options?: string[];
}

export interface RacingEventViewProps {
    title: string;
    description?: string | null;
    fields: FormFieldItem[];
    theme?: {
        color?: string;
        accent?: string;
    };
    settings?: {
        layout_type?: string;
        telemetry?: {
            badge?: string;
            title?: string;
            deadline?: string;
            status?: string;
        };
        hero?: {
            banner_url?: string;
            badge_1?: string;
            badge_2?: string;
            badge_3?: string;
            headline_pre?: string;
            validation_pill?: string;
            metrics?: { label: string; value: string; icon?: string }[];
        };
        sidebar?: {
            riders_poster?: string;
            riders?: { num: string; class: string; name: string; team: string }[];
            terms?: string[];
            venue_map_img?: string;
            venue_name?: string;
            venue_address?: string;
            venue_gate?: string;
        };
        success_message?: string;
    };
    answers: Record<string, any>;
    onAnswerChange: (fieldId: string, val: any) => void;
    onSubmit?: (e: React.FormEvent) => void;
    processing?: boolean;
    errors?: Record<string, string | undefined>;
    isPreview?: boolean;
    isSuccess?: boolean;
    requiresLogin?: boolean;
}

export default function RacingEventView({
    title,
    description,
    fields,
    theme,
    settings,
    answers,
    onAnswerChange,
    onSubmit,
    processing = false,
    errors = {},
    isPreview = false,
    isSuccess = false,
    requiresLogin = false,
}: RacingEventViewProps) {
    const primaryColor = theme?.color || '#dc2626';

    const telemetry = settings?.telemetry || {
        badge: 'PADDOCK GATE NTB',
        title: 'MANDALIKA GP EXCLUSIVE FAN ZONE',
        deadline: 'BATAS PENDAFTARAN: 05 OKT 2026 - 23:59 WITA',
        status: 'STATUS: VERIFIKASI DOKUMEN AKTIF',
    };

    const hero = settings?.hero || {
        banner_url:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCYAKHTicHmiVB2xXVLuOVCZVkK0Jd1Yz-0gtzvKIKL4gs6oyRgY4XlKg4qjkR8_gRmAISMzFaYSwV_Nia-m2LfrRtD9ou2CgKZ0I2fV95L9zf48JNosNfmE009WxcqFeqS-I3aIal4q0Bek84KzVLetrw2DAvQd8eWmuR9GuRZvivZ-fptsaNFi-t6mKMerqjRou4rvEvMaLfSXllvAdoDo5ZH3eiCvUcwWGdf7r4XbxNb0S8LdOJ81wmVhKEiHXx87A',
        badge_1: 'PORTAL REGISTRASI RESMI',
        badge_2: 'HONDA VARIO SERIES ONLY',
        badge_3: 'KONSUMEN DOMISILI NTB',
        headline_pre: 'ASTRA HONDA RACING TEAM • MEET & GREET 2026',
        validation_pill: 'Wajib STNK Asli',
        metrics: [
            { label: 'Waktu Pelaksanaan', value: 'Rabu, 07 Okt 2026', icon: 'calendar' },
            { label: 'Paddock Venue', value: 'Dapur Sasak, Udayana', icon: 'map-pin' },
            { label: 'Masa Pendaftaran', value: '2 - 5 Okt 2026', icon: 'clock' },
            { label: 'Kategori Peserta', value: 'Vario Series (NTB)', icon: 'bike' },
        ],
    };

    const sidebar = settings?.sidebar || {
        riders_poster:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCoiD8yX3hnewjP99vbHehq6J1YymruZncjI737XLmbRwRmVd0ZbT8SzrZxddizzyaFF_ZMdMdV1J2_jvMmSM4OnyUnUELgrKcPibV6k16UaTbD5P-lkj15i5AuckpAzu2iGQ7LJiv3LK_z4FZ9KZeL_o5EoXZF_-0Fy9UM2wcxboCv-uCdheyQG2DWdz1rI2700k-f_SSXvICw1unI3e99LtYRMmpyFfYPfY5h4mnZ9lWAJC5ZKkNKS6dFPFgVKncMlA',
        riders: [
            { num: '#64', class: 'MOTO2', name: 'MARIO AJI', team: 'Honda Team Asia • Moto2' },
            { num: '#9', class: 'MOTO3', name: 'VEDA PRATAMA', team: 'Red Bull MotoGP Rookies Cup' },
            { num: '#22 • #17', class: 'MOTO4', name: 'RESKY & MAULANA', team: 'Asia Talent Cup Squad' },
            { num: '#13 • #3', class: 'MOTO4', name: 'BADLY & BINTANG', team: 'Astra Honda Racing School' },
        ],
        terms: [
            'Pria / Wanita konsumen resmi pemilik sepeda motor Honda Vario Series domisili Nusa Tenggara Barat.',
            'Menyukai dan berantusiasme tinggi terhadap dunia Racing & Motorsport Indonesia.',
            'Wajib dapat menunjukkan Fisik STNK Asli Honda Vario dan e-KTP yang cocok saat registrasi ulang di venue.',
            'Follow akun resmi Instagram @hondantb.official.',
            'Memberikan komentar "Honda" serta men-tag 3 teman pada postingan Meet & Greet.',
            'Tim Honda NTB akan menghubungi melalui WhatsApp untuk mengirimkan e-invitation pass resmi.',
        ],
        venue_map_img:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBB9-44rzIlhHdzm0AHfhRdaD_OR5iL-lYYKuZVfzoxJOpPYz69DtxCk8zkIB-E-B8uiG81H1LJ1bGN8pqD8tjoMB2ycVkBlSHhpd1IdnvG4IumwjWYviJLoK5BLbEa7j22U6SxalXH4MzMwU3TVjLbMBEsZ9QeYnV5XYj2nDeAzguSUk0mmAxu-LOfusxkHiQlS-MNdnumFFZocC2NW4RdRDZmmovENjWA2w-KGKWKjcWdtEcu_Z6N',
        venue_name: 'Dapur Sasak, Udayana',
        venue_address: 'Jl. Udayana, Mataram, Nusa Tenggara Barat',
        venue_gate: 'Gate Open: 08:00 WITA',
    };

    const handleCheckboxToggle = (fieldId: string, option: string) => {
        const currentList = (answers[fieldId] as string[]) || [];
        const nextList = currentList.includes(option)
            ? currentList.filter((item) => item !== option)
            : [...currentList, option];
        onAnswerChange(fieldId, nextList);
    };

    const renderMetricIcon = (iconName?: string) => {
        switch (iconName) {
            case 'calendar':
                return <Calendar className="size-6 text-red-600 shrink-0" />;
            case 'map-pin':
                return <MapPin className="size-6 text-red-600 shrink-0" />;
            case 'clock':
                return <Clock className="size-6 text-red-600 shrink-0" />;
            case 'bike':
                return <Bike className="size-6 text-red-600 shrink-0" />;
            default:
                return <Calendar className="size-6 text-red-600 shrink-0" />;
        }
    };

    return (
        <div className="w-full bg-[#f8f9fa] dark:bg-neutral-950 font-sans text-[#111827] dark:text-neutral-100 antialiased min-h-screen">
            {/* 1. Telemetry Sub-Nav Strip */}
            <section className="w-full bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 lg:px-12 py-3 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-white font-black italic uppercase text-[11px] shadow-xs tracking-wider"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {telemetry.badge}
                        </span>
                        <span className="text-gray-900 dark:text-neutral-100 font-bold tracking-wide text-xs">
                            {telemetry.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-2.5 py-1">
                            <AlarmClock className="size-3.5" />
                            {telemetry.deadline}
                        </span>
                        <span className="hidden sm:inline text-gray-300 dark:text-neutral-700">/</span>
                        <span className="text-gray-900 dark:text-neutral-200 font-semibold flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            {telemetry.status}
                        </span>
                    </div>
                </div>
            </section>

            {/* 2. Hero Header Section with Poster Banner */}
            <section className="relative w-full bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 lg:px-12 py-6 sm:py-8 overflow-hidden">
                <div className="max-w-7xl mx-auto w-full mb-6 relative z-10 overflow-hidden shadow-md bg-white border border-gray-200 dark:border-neutral-800 rounded-sm">
                    <div className="relative w-full aspect-[16/6] md:aspect-[8/3] overflow-hidden bg-neutral-900">
                        <img
                            alt="Astra Honda Racing Team Mandalika GP Banner"
                            className="w-full h-full object-cover object-center"
                            src={hero.banner_url}
                        />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col gap-5 relative z-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 text-xs uppercase tracking-wider font-bold">
                            {hero.badge_1}
                        </span>
                        <span
                            className="px-3 py-1 text-white text-xs uppercase tracking-wider font-bold shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {hero.badge_2}
                        </span>
                        <span className="px-3 py-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                            <span className="size-2 bg-red-600" />
                            {hero.badge_3}
                        </span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <p className="text-xs uppercase font-bold tracking-widest text-red-600 dark:text-red-400 mb-1">
                                {hero.headline_pre}
                            </p>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl uppercase italic font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Validation Note Badge */}
                        <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-2.5 self-start lg:self-end shadow-xs">
                            <div
                                className="text-white px-4 py-2 flex flex-col justify-center shadow-xs"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Validasi Paddock</span>
                                <span className="text-sm font-bold italic leading-tight">{hero.validation_pill}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        {hero.metrics?.map((m, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-4 py-3 flex items-center gap-3 shadow-xs"
                            >
                                {renderMetricIcon(m.icon)}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider truncate">
                                        {m.label}
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-bold truncate">
                                        {m.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Main Split Console Grid */}
            <section className="w-full px-4 lg:px-12 py-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: High Velocity Dynamic Registration Form (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {/* Form Step Progress Tracker */}
                        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 flex flex-col gap-3 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="size-2.5 bg-red-600" />
                                    <span className="text-xs font-bold uppercase text-gray-900 dark:text-white tracking-wider">
                                        Formulir Pendaftaran Fan Pass
                                    </span>
                                </div>
                                <span className="text-[11px] text-red-600 dark:text-red-400 font-mono font-bold tracking-widest">
                                    {fields.length} PERTANYAAN
                                </span>
                            </div>

                            <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 overflow-hidden flex">
                                <div className="w-1/2 h-full bg-red-600" />
                                <div className="w-1/2 h-full bg-gray-200 dark:bg-neutral-700" />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                <span className="text-gray-900 dark:text-neutral-200 font-bold">1. Data Peserta &amp; Domisili</span>
                                <span>2. Konfirmasi &amp; Verifikasi</span>
                            </div>
                        </div>

                        {/* Requires Login Alert if Private Form */}
                        {requiresLogin && (
                            <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 rounded-sm text-center space-y-3">
                                <Lock className="size-8 text-blue-600 mx-auto" />
                                <h3 className="font-bold text-base text-blue-950 dark:text-blue-200">
                                    Formulir Bersifat Privat
                                </h3>
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    Halaman pendaftaran ini memerlukan otentikasi login akun internal untuk dapat mengisi data.
                                </p>
                            </div>
                        )}

                        {/* Success Notification Alert */}
                        {isSuccess && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-6 flex flex-col gap-3 rounded-sm shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="size-6" />
                                    <span className="font-bold text-base uppercase">
                                        Registrasi Berhasil Terkirim!
                                    </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-neutral-200 leading-relaxed">
                                    {settings?.success_message ||
                                        'Terima kasih! Data registrasi Anda telah tersimpan di sistem pit wall AHRT NTB. Tim kami akan melakukan validasi dan mengirim konfirmasi via WhatsApp.'}
                                </p>
                                <div className="flex items-center gap-3 pt-2 text-xs font-mono text-gray-600 dark:text-neutral-400 border-t border-emerald-200 dark:border-emerald-900">
                                    <span>
                                        REF-CODE: <strong className="text-red-600 font-bold">#HND-VARIO-8892</strong>
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                        STATUS: MENUNGGU VERIFIKASI ADMIN
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* General Form Error if any */}
                        {errors.form && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs border border-red-200 font-medium flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{errors.form}</span>
                            </div>
                        )}

                        {/* Form Container */}
                        <form
                            onSubmit={onSubmit}
                            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs"
                        >
                            <div className="flex items-center justify-between pb-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-4 py-2.5">
                                <span className="text-sm font-bold uppercase italic text-gray-900 dark:text-white">
                                    Lembar Isian Data Formulir
                                </span>
                                <span className="text-[10px] text-red-600 uppercase font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-2 py-0.5">
                                    Validasi Resmi
                                </span>
                            </div>

                            {/* Dynamic Fields Loop */}
                            {fields.map((field, idx) => {
                                const currentVal = answers[field.id];
                                const fieldError = errors[`answers.${field.id}`];

                                return (
                                    <div key={field.id} className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor={field.id}
                                            className="text-xs uppercase tracking-wider text-gray-900 dark:text-neutral-100 font-bold flex items-center justify-between"
                                        >
                                            <span>
                                                {idx + 1}. {field.label}{' '}
                                                {field.required && <span className="text-red-600">*</span>}
                                            </span>
                                            {field.required && (
                                                <span className="text-[10px] text-red-600 font-normal">Wajib diisi</span>
                                            )}
                                        </label>

                                        {/* TEXT / PHONE / EMAIL / NUMBER / DATE */}
                                        {['text', 'email', 'phone', 'number', 'date'].includes(field.type) && (
                                            <div className="flex items-stretch">
                                                {field.type === 'phone' && (
                                                    <div className="bg-gray-100 dark:bg-neutral-800 border border-r-0 border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 px-3.5 py-2.5 text-xs font-bold flex items-center select-none">
                                                        +62
                                                    </div>
                                                )}
                                                <input
                                                    id={field.id}
                                                    type={
                                                        field.type === 'email'
                                                            ? 'email'
                                                            : field.type === 'phone'
                                                            ? 'tel'
                                                            : field.type === 'number'
                                                            ? 'number'
                                                            : field.type === 'date'
                                                            ? 'date'
                                                            : 'text'
                                                    }
                                                    value={currentVal !== undefined && currentVal !== null ? String(currentVal) : ''}
                                                    onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                                    placeholder={field.placeholder || 'Ketikkan jawaban Anda di sini...'}
                                                    required={field.required}
                                                    className="w-full bg-[#f9fafb] dark:bg-neutral-850 text-gray-900 dark:text-white text-xs px-4 py-2.5 border border-gray-300 dark:border-neutral-700 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors"
                                                />
                                            </div>
                                        )}

                                        {/* PARAGRAPH / TEXTAREA */}
                                        {field.type === 'paragraph' && (
                                            <textarea
                                                id={field.id}
                                                rows={3}
                                                value={currentVal !== undefined && currentVal !== null ? String(currentVal) : ''}
                                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                                placeholder={field.placeholder || 'Tuliskan jawaban Anda secara rinci...'}
                                                required={field.required}
                                                className="w-full bg-[#f9fafb] dark:bg-neutral-850 text-gray-900 dark:text-white text-xs px-4 py-2.5 border border-gray-300 dark:border-neutral-700 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors"
                                            />
                                        )}

                                        {/* SELECT DROPDOWN */}
                                        {field.type === 'select' && (
                                            <div className="relative">
                                                <select
                                                    id={field.id}
                                                    value={currentVal || ''}
                                                    onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                                    required={field.required}
                                                    className="w-full bg-[#f9fafb] dark:bg-neutral-850 text-gray-900 dark:text-white text-xs px-4 py-2.5 border border-gray-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white cursor-pointer"
                                                >
                                                    <option value="">{field.placeholder || '-- Silakan Pilih Opsi --'}</option>
                                                    {field.options?.map((opt, oIdx) => (
                                                        <option key={oIdx} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* RADIO OPTIONS */}
                                        {field.type === 'radio' && (
                                            <div className="space-y-2 mt-1">
                                                {field.options?.map((opt, oIdx) => (
                                                    <label
                                                        key={oIdx}
                                                        className={`flex items-center gap-3 p-3 border cursor-pointer text-xs transition-colors ${
                                                            currentVal === opt
                                                                ? 'border-red-600 bg-red-50/40 dark:bg-red-950/20 font-bold text-red-900 dark:text-red-200'
                                                                : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={field.id}
                                                            checked={currentVal === opt}
                                                            onChange={() => onAnswerChange(field.id, opt)}
                                                            className="text-red-600 focus:ring-red-500"
                                                        />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* CHECKBOX MULTI-SELECT */}
                                        {field.type === 'checkbox' && (
                                            <div className="space-y-2 mt-1">
                                                {field.options?.map((opt, oIdx) => {
                                                    const isChecked = Array.isArray(currentVal) && currentVal.includes(opt);
                                                    return (
                                                        <label
                                                            key={oIdx}
                                                            className={`flex items-center gap-3 p-3 border cursor-pointer text-xs transition-colors ${
                                                                isChecked
                                                                    ? 'border-red-600 bg-red-50/40 dark:bg-red-950/20 font-bold text-red-900 dark:text-red-200'
                                                                    : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                                                className="text-red-600 rounded-xs focus:ring-red-500"
                                                            />
                                                            <span>{opt}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* RATING (1 - 5) */}
                                        {field.type === 'rating' && (
                                            <div className="flex items-center gap-2 py-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => onAnswerChange(field.id, star)}
                                                        className={`size-10 border text-sm font-bold transition-all flex items-center justify-center ${
                                                            Number(currentVal) >= star
                                                                ? 'border-red-600 bg-red-600 text-white shadow-xs'
                                                                : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-600 hover:border-red-400'
                                                        }`}
                                                    >
                                                        ★ {star}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {field.helper && (
                                            <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                                                {field.helper}
                                            </p>
                                        )}

                                        {fieldError && (
                                            <span className="text-[11px] text-red-600 font-semibold mt-0.5">
                                                {fieldError}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Submit CTA Button */}
                            <div className="pt-2">
                                <button
                                    type={isPreview ? 'button' : 'submit'}
                                    disabled={processing}
                                    onClick={isPreview ? () => alert('Ini adalah mode pratinjau live!') : undefined}
                                    className="w-full text-white px-8 py-3.5 text-sm uppercase italic font-black tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg active:translate-y-0 shadow-md cursor-pointer"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <span>{processing ? 'MEMPROSES REGISTRASI...' : 'KIRIM REGISTRASI SEKARANG'}</span>
                                    <Flag className="size-5 shrink-0" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Sticky Event & Rider Information Display (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-8">
                        {/* 1. Lineup Highlight: Riders Honda */}
                        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 shadow-xs flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3.5 py-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 bg-red-600" />
                                    <span className="text-xs font-bold uppercase italic text-gray-900 dark:text-white">
                                        Official Riders Lineup
                                    </span>
                                </div>
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-1.5 py-0.5">
                                    AHRT HEROES
                                </span>
                            </div>

                            {/* Hero Riders Preview Poster */}
                            <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                                <img
                                    className="w-full h-48 sm:h-52 object-cover object-top hover:scale-105 transition-transform duration-500"
                                    alt="Astra Honda Racing Team Riders Lineup"
                                    src={sidebar.riders_poster}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                                    <span className="bg-red-600 text-white text-[11px] italic font-black px-2 py-0.5 uppercase shadow-xs">
                                        Astra Honda Racing Team
                                    </span>
                                    <span className="bg-white/90 text-gray-900 text-[10px] px-2 py-0.5 font-bold backdrop-blur-xs">
                                        MANDALIKA 2026
                                    </span>
                                </div>
                            </div>

                            {/* Riders Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {sidebar.riders?.map((r, rIdx) => (
                                    <div
                                        key={rIdx}
                                        className="bg-gray-50 dark:bg-neutral-850 border border-gray-200 dark:border-neutral-700 p-2.5 flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="px-1 py-0.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-red-600 font-black italic text-xs">
                                                {r.num}
                                            </span>
                                            <span className="text-[9px] px-1 py-0.5 bg-red-600 text-white font-bold">
                                                {r.class}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold uppercase text-gray-900 dark:text-white italic leading-tight">
                                            {r.name}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5 truncate">
                                            {r.team}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Syarat & Ketentuan Masuk Paddock */}
                        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between pb-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5">
                                <span className="text-xs font-bold uppercase italic text-gray-900 dark:text-white">
                                    Syarat &amp; Ketentuan Acara
                                </span>
                                <FileCheck className="size-4 text-red-600" />
                            </div>

                            <ul className="space-y-2.5 text-xs text-gray-700 dark:text-neutral-300">
                                {sidebar.terms?.map((term, tIdx) => (
                                    <li key={tIdx} className="flex items-start gap-2.5">
                                        <span className="size-1.5 mt-1.5 bg-red-600 shrink-0" />
                                        <span>{term}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-1 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Periode Pendaftaran</span>
                                    <span className="text-xs text-red-600 font-bold">2 - 5 Oktober 2026</span>
                                </div>
                                <Clock className="size-4 text-red-600" />
                            </div>
                        </div>

                        {/* 3. Venue Location Map Card */}
                        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between pb-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5">
                                <span className="text-xs font-bold uppercase italic text-gray-900 dark:text-white">
                                    Paddock Venue Map
                                </span>
                                <span className="text-[10px] text-red-600 font-mono font-bold uppercase">
                                    {sidebar.venue_name}
                                </span>
                            </div>

                            <div
                                className="w-full h-36 border border-gray-200 dark:border-neutral-700 flex flex-col items-center justify-center p-3 text-center relative overflow-hidden bg-cover bg-center"
                                style={{ backgroundImage: `url('${sidebar.venue_map_img}')` }}
                            >
                                <div className="absolute inset-0 bg-white/75 dark:bg-neutral-900/80 backdrop-blur-[1px]" />
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <MapPin className="size-6 text-red-600 animate-bounce" />
                                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                                        {sidebar.venue_name}
                                    </span>
                                    <span className="text-[10px] text-gray-600 dark:text-neutral-400">
                                        {sidebar.venue_address}
                                    </span>
                                    <span className="mt-1 px-2.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white text-[9px] uppercase font-bold shadow-xs">
                                        {sidebar.venue_gate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Official Taglines & FIFASTRA Banner */}
                        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600 font-black italic">#pakeMotorkuXaja</span>
                                <span className="text-xs text-gray-700 dark:text-neutral-300 font-bold uppercase tracking-wider">
                                    FIFASTRA
                                </span>
                            </div>
                            <div
                                className="p-3.5 text-white flex flex-col gap-0.5 shadow-xs"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-90">Satu HATI.</span>
                                <span className="text-sm uppercase italic font-black leading-none tracking-tight">
                                    MELESAT LEBIH CEPAT
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold mt-1">
                                    Dukung Pembalap Indonesia di Mandalika!
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
