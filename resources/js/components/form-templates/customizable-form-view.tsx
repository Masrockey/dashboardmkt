import React from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Flag,
    Info,
    Lock,
    LogIn,
    MapPin,
    Phone,
    RotateCcw,
    Send,
    Star,
    Store,
    Bike,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface FormFieldItem {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    helper?: string;
    required: boolean;
    options?: string[];
}

export interface MetricItem {
    label: string;
    value: string;
    icon?: string;
}

export interface ProfileItem {
    num?: string;
    class?: string;
    name: string;
    team?: string;
}

export interface FormSettings {
    layout_type?: 'centered_card' | 'split_screen' | 'hero_centered';
    top_bar?: {
        enabled?: boolean;
        badge?: string;
        title?: string;
        deadline?: string;
        status?: string;
    };
    hero?: {
        enabled?: boolean;
        banner_url?: string;
        badge_category?: string;
        headline_pre?: string;
        validation_pill?: string;
        badges?: string[];
    };
    metrics?: {
        enabled?: boolean;
        items?: MetricItem[];
    };
    sidebar?: {
        enabled?: boolean;
        profile_card?: {
            enabled?: boolean;
            title?: string;
            image_url?: string;
            items?: ProfileItem[];
        };
        terms_card?: {
            enabled?: boolean;
            title?: string;
            items?: string[];
        };
        map_card?: {
            enabled?: boolean;
            title?: string;
            venue_name?: string;
            venue_address?: string;
            venue_gate?: string;
            map_image_url?: string;
        };
        callout_card?: {
            enabled?: boolean;
            tagline?: string;
            sponsor?: string;
            message?: string;
        };
    };
    allow_multiple?: boolean;
    success_message?: string;
}

export interface CustomizableFormViewProps {
    title: string;
    description?: string | null;
    fields: FormFieldItem[];
    theme?: {
        color?: string;
        accent?: string;
        theme_name?: string;
    };
    settings?: FormSettings;
    answers: Record<string, any>;
    onAnswerChange: (fieldId: string, val: any) => void;
    onSubmit?: (e: React.FormEvent) => void;
    processing?: boolean;
    errors?: Record<string, string | undefined>;
    isPreview?: boolean;
    isSuccess?: boolean;
    requiresLogin?: boolean;
    submittedMessage?: string;
}

export default function CustomizableFormView({
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
    submittedMessage = 'Terima kasih! Tanggapan Anda telah berhasil disimpan.',
}: CustomizableFormViewProps) {
    const primaryColor = theme?.color || '#dc2626';
    const layoutType = settings?.layout_type || 'centered_card';

    // Section toggles
    const showTopBar = settings?.top_bar?.enabled ?? false;
    const showHero = settings?.hero?.enabled ?? false;
    const showMetrics = settings?.metrics?.enabled ?? false;
    const showSidebar = layoutType === 'split_screen' && (settings?.sidebar?.enabled ?? true);

    const handleCheckboxToggle = (fieldId: string, option: string) => {
        const currentList = (answers[fieldId] as string[]) || [];
        const nextList = currentList.includes(option)
            ? currentList.filter((item) => item !== option)
            : [...currentList, option];
        onAnswerChange(fieldId, nextList);
    };

    // Render Icon Helper
    const renderMetricIcon = (iconName?: string) => {
        switch (iconName) {
            case 'calendar':
                return <Calendar className="size-4" />;
            case 'map-pin':
                return <MapPin className="size-4" />;
            case 'clock':
                return <Clock className="size-4" />;
            case 'bike':
                return <Bike className="size-4" />;
            case 'store':
                return <Store className="size-4" />;
            default:
                return <Info className="size-4" />;
        }
    };

    // 1. Success Message View
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-12 px-4 flex items-center justify-center">
                <Card className="max-w-md w-full overflow-hidden shadow-2xl border bg-white dark:bg-neutral-900 rounded-3xl text-center">
                    <div className="h-4 w-full" style={{ backgroundColor: primaryColor }} />
                    <div className="p-8 space-y-4">
                        <div
                            className="size-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg animate-bounce"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <CheckCircle2 className="size-10" />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                            {title}
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                            {submittedMessage}
                        </p>
                        {settings?.allow_multiple && (
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    className="text-xs font-semibold gap-1.5"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Kirim Tanggapan Lain
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // 2. Requires Login View
    if (requiresLogin) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-12 px-4 flex items-center justify-center">
                <Card className="max-w-md w-full p-8 text-center shadow-xl border-2 border-blue-500/30 bg-white dark:bg-neutral-900 rounded-3xl">
                    <div className="size-16 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center mx-auto mb-4">
                        <Lock className="size-8" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        Formulir Bersifat Privat
                    </h2>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                        Formulir &quot;<strong>{title}</strong>&quot; hanya dapat diisi oleh pengguna yang telah login ke dalam sistem.
                    </p>
                    <Button
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 px-6 h-9 shadow-md"
                    >
                        <a href={`/login`}>
                            <LogIn className="size-4" />
                            Masuk / Login Sekarang
                        </a>
                    </Button>
                </Card>
            </div>
        );
    }

    // 3. Form Input Component Generator
    const renderFormQuestions = () => (
        <div className="space-y-4">
            {/* Form Title & Description Card */}
            <Card className="overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-2xl">
                <div className="h-3 w-full" style={{ backgroundColor: primaryColor }} />
                <div className="p-6">
                    <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 whitespace-pre-line leading-relaxed">
                            {description}
                        </p>
                    )}
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-red-600 font-medium">
                        * Menandakan pertanyaan yang wajib diisi
                    </div>
                </div>
            </Card>

            {/* General Error Notice */}
            {errors.form && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errors.form}</span>
                </div>
            )}

            {/* Questions Fields */}
            {fields.map((field, idx) => {
                const fieldError = errors[`answers.${field.id}`] || errors[field.id];
                const currentVal = answers[field.id];

                return (
                    <Card
                        key={field.id}
                        className={`p-5 sm:p-6 shadow-sm border rounded-2xl transition-all duration-150 bg-white dark:bg-neutral-950 ${fieldError
                            ? 'border-red-400 bg-red-50/10'
                            : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <div className="mb-3">
                            <label className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
                                {idx + 1}. {field.label}{' '}
                                {field.required && (
                                    <span className="text-red-600 font-black ml-0.5">*</span>
                                )}
                            </label>
                            {field.helper && (
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                    {field.helper}
                                </p>
                            )}
                        </div>

                        {/* Text Input */}
                        {field.type === 'text' && (
                            <Input
                                value={currentVal || ''}
                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                placeholder={field.placeholder || 'Jawaban Anda...'}
                                className="text-xs h-10 bg-neutral-50/50 dark:bg-neutral-900/50"
                            />
                        )}

                        {/* Paragraph / Textarea */}
                        {field.type === 'paragraph' && (
                            <Textarea
                                value={currentVal || ''}
                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                placeholder={field.placeholder || 'Tuliskan jawaban lengkap Anda...'}
                                className="text-xs bg-neutral-50/50 dark:bg-neutral-900/50 resize-y"
                                rows={3}
                            />
                        )}

                        {/* Phone Input */}
                        {field.type === 'phone' && (
                            <div className="relative">
                                <Phone className="size-4 absolute left-3 top-3 text-neutral-400" />
                                <Input
                                    type="tel"
                                    value={currentVal || ''}
                                    onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                    placeholder={field.placeholder || '08xxxxxxxxxx'}
                                    className="text-xs h-10 pl-9 bg-neutral-50/50 dark:bg-neutral-900/50 font-mono"
                                />
                            </div>
                        )}

                        {/* Email Input */}
                        {field.type === 'email' && (
                            <Input
                                type="email"
                                value={currentVal || ''}
                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                placeholder={field.placeholder || 'nama@contoh.com'}
                                className="text-xs h-10 bg-neutral-50/50 dark:bg-neutral-900/50"
                            />
                        )}

                        {/* Number Input */}
                        {field.type === 'number' && (
                            <Input
                                type="number"
                                value={currentVal || ''}
                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                placeholder={field.placeholder || '0'}
                                className="text-xs h-10 bg-neutral-50/50 dark:bg-neutral-900/50"
                            />
                        )}

                        {/* Date Input */}
                        {field.type === 'date' && (
                            <Input
                                type="date"
                                value={currentVal || ''}
                                onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                className="text-xs h-10 bg-neutral-50/50 dark:bg-neutral-900/50"
                            />
                        )}

                        {/* Rating Stars (1 - 5) */}
                        {field.type === 'rating' && (
                            <div className="flex items-center gap-2 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => onAnswerChange(field.id, star)}
                                        className={`size-10 rounded-xl border flex items-center justify-center font-bold text-sm transition-all ${currentVal === star
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                            }`}
                                    >
                                        <Star
                                            className={`size-4 mr-1 ${currentVal >= star ? 'fill-amber-400 text-amber-400' : ''}`}
                                        />
                                        {star}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Radio Options */}
                        {field.type === 'radio' && (
                            <div className="space-y-2 mt-2">
                                {(field.options || []).map((opt, oIdx) => (
                                    <label
                                        key={oIdx}
                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer text-xs"
                                    >
                                        <input
                                            type="radio"
                                            name={`field_${field.id}`}
                                            value={opt}
                                            checked={currentVal === opt}
                                            onChange={() => onAnswerChange(field.id, opt)}
                                            className="size-4 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                                            {opt}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Checkbox Options */}
                        {field.type === 'checkbox' && (
                            <div className="space-y-2 mt-2">
                                {(field.options || []).map((opt, oIdx) => {
                                    const checked = ((currentVal as string[]) || []).includes(opt);
                                    return (
                                        <label
                                            key={oIdx}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer text-xs"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                                className="size-4 rounded text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                                                {opt}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Dropdown Select */}
                        {field.type === 'select' && (
                            <Select
                                value={currentVal || ''}
                                onValueChange={(val) => onAnswerChange(field.id, val)}
                            >
                                <SelectTrigger className="h-10 text-xs bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <SelectValue placeholder={field.placeholder || '-- Pilih salah satu opsi --'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(field.options || []).map((opt, oIdx) => (
                                        <SelectItem key={oIdx} value={opt} className="text-xs">
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {fieldError && (
                            <p className="text-[11px] text-red-600 mt-2 font-medium flex items-center gap-1">
                                <AlertCircle className="size-3" />
                                {fieldError}
                            </p>
                        )}
                    </Card>
                );
            })}

            {/* Action Bar & Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                    type="submit"
                    disabled={processing}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full sm:w-auto px-8 h-11 text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-xl"
                >
                    <Send className="size-4" />
                    {processing ? 'Sedang Mengirim...' : isPreview ? 'Kirim Tanggapan (Simulasi)' : 'Kirim Formulir Sekarang'}
                </Button>
                <span className="text-[11px] text-neutral-400">
                    Formulir Resmi • Dilindungi Sistem Honda
                </span>
            </div>
        </div>
    );

    // 4. Sidebar Content Component (For Split Screen)
    const renderSidebarWidgets = () => {
        const sb = settings?.sidebar;
        if (!sb) return null;

        return (
            <div className="space-y-4">
                {/* Widget 1: Profile / Lineup Card */}
                {sb.profile_card?.enabled && (
                    <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm">
                        <div className="p-3 bg-neutral-950 text-white font-mono text-[11px] font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Flag className="size-3.5 text-red-500" />
                                {sb.profile_card.title || 'OFFICIAL LINEUP'}
                            </span>
                        </div>
                        {sb.profile_card.image_url && (
                            <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900">
                                <img
                                    src={sb.profile_card.image_url}
                                    alt={sb.profile_card.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        {sb.profile_card.items && sb.profile_card.items.length > 0 && (
                            <div className="p-3 space-y-2 divide-y divide-neutral-100 dark:divide-neutral-800">
                                {sb.profile_card.items.map((item, idx) => (
                                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                                        <div>
                                            <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                {item.num && <span className="text-red-600 font-mono mr-1.5">{item.num}</span>}
                                                {item.name}
                                            </div>
                                            {item.team && (
                                                <div className="text-[10px] text-neutral-500">{item.team}</div>
                                            )}
                                        </div>
                                        {item.class && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-700 dark:text-neutral-300">
                                                {item.class}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* Widget 2: Terms & Conditions Card */}
                {sb.terms_card?.enabled && (
                    <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm space-y-3">
                        <h3 className="text-xs font-bold font-mono tracking-wider text-neutral-900 dark:text-neutral-100 border-b pb-2 flex items-center gap-1.5">
                            <FileText className="size-3.5 text-neutral-500" />
                            {sb.terms_card.title || 'SYARAT & KETENTUAN'}
                        </h3>
                        <ul className="space-y-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                            {(sb.terms_card.items || []).map((term, tIdx) => (
                                <li key={tIdx} className="flex items-start gap-2">
                                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                    <span>{term}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {/* Widget 3: Venue & Map Card */}
                {sb.map_card?.enabled && (
                    <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-b flex items-center justify-between text-xs font-bold font-mono">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-red-600" />
                                {sb.map_card.title || 'LOKASI VENUE'}
                            </span>
                            {sb.map_card.venue_gate && (
                                <span className="text-[10px] text-red-600 font-normal">
                                    {sb.map_card.venue_gate}
                                </span>
                            )}
                        </div>
                        {sb.map_card.map_image_url && (
                            <div className="aspect-[16/8] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                <img
                                    src={sb.map_card.map_image_url}
                                    alt="Venue Map"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="p-3.5 space-y-1">
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                {sb.map_card.venue_name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {sb.map_card.venue_address}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Widget 4: Callout / Sponsor Banner */}
                {sb.callout_card?.enabled && (
                    <Card className="p-4 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-md space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-90">
                            <span>{sb.callout_card.tagline}</span>
                            <span>{sb.callout_card.sponsor}</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider leading-relaxed">
                            {sb.callout_card.message}
                        </p>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-100/80 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between">
            <div>
                {/* 1. TOP ANNOUNCEMENT / TELEMETRY STRIP */}
                {showTopBar && settings?.top_bar && (
                    <div className="bg-[#0f172a] text-white border-b border-neutral-800 py-2.5 px-4 sm:px-8 text-[11px] font-mono">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {settings.top_bar.badge && (
                                    <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-wider">
                                        {settings.top_bar.badge}
                                    </span>
                                )}
                                <span className="font-bold tracking-wide">
                                    {settings.top_bar.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-neutral-400 text-[10px]">
                                {settings.top_bar.deadline && (
                                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                                        <Clock className="size-3" />
                                        {settings.top_bar.deadline}
                                    </span>
                                )}
                                {settings.top_bar.status && (
                                    <span className="flex items-center gap-1 text-emerald-400">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {settings.top_bar.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                    {/* 2. HERO BANNER / POSTER */}
                    {showHero && settings?.hero && (
                        <div className="space-y-4">
                            {settings.hero.banner_url && (
                                <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 relative aspect-[21/9] sm:aspect-[24/8] bg-neutral-900">
                                    <img
                                        src={settings.hero.banner_url}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Hero Badges Row */}
                            <div className="flex flex-wrap items-center gap-2">
                                {(settings.hero.badges || []).map((badge, bIdx) => (
                                    <span
                                        key={bIdx}
                                        className={`text-[10px] font-mono px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${bIdx === 0
                                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                                            : bIdx === 1
                                                ? 'bg-red-600 text-white'
                                                : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                            }`}
                                    >
                                        {badge}
                                    </span>
                                ))}
                                {settings.hero.validation_pill && (
                                    <span className="ml-auto text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                        ★ {settings.hero.validation_pill}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. QUICK METRICS GRID */}
                    {showMetrics && settings?.metrics?.items && settings.metrics.items.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {settings.metrics.items.map((metric, mIdx) => (
                                <Card
                                    key={mIdx}
                                    className="p-3.5 sm:p-4 border rounded-2xl bg-white dark:bg-neutral-900 shadow-xs flex items-center gap-3"
                                >
                                    <div
                                        className="size-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {renderMetricIcon(metric.icon)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider truncate">
                                            {metric.label}
                                        </div>
                                        <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                                            {metric.value}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* 4. MAIN BODY FORM LAYOUT (SPLIT 2-COLUMN vs CENTERED CARD) */}
                    <form onSubmit={onSubmit}>
                        {layoutType === 'split_screen' ? (
                            /* Split 2-Column Grid */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                <div className={showSidebar ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
                                    {renderFormQuestions()}
                                </div>
                                {showSidebar && (
                                    <div className="lg:col-span-4 sticky top-6">
                                        {renderSidebarWidgets()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Centered 1-Column Card (Google Form style) */
                            <div className="max-w-2xl mx-auto space-y-4">
                                {renderFormQuestions()}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
                <p>&copy; {new Date().getFullYear()} Astra Honda Motor NTB • Form Builder</p>
            </footer>
        </div>
    );
}
