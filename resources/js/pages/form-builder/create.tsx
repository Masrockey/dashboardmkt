import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Globe,
    Layers,
    Lock,
    Palette,
    Plus,
    QrCode,
    RotateCcw,
    Send,
    Share2,
    Sliders,
    Trash2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import GoogleFormView from '@/components/form-templates/google-form-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import forms from '@/routes/forms';
import type { BreadcrumbItem } from '@/types';

export interface FormField {
    id: string;
    type: 'text' | 'paragraph' | 'radio' | 'checkbox' | 'select' | 'number' | 'date' | 'rating' | 'email' | 'phone';
    label: string;
    placeholder?: string;
    helper?: string;
    required: boolean;
    options?: string[];
}

export interface FormTheme {
    color: string;
    accent: string;
    theme_name: string;
    banner_style?: string;
}

export interface TemplatePreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    badge: string;
    layout_type?: string;
    features?: string[];
    title: string;
    subtitle: string;
    theme: FormTheme;
    fields: FormField[];
    settings?: any;
}

export interface ThemePreset {
    id: string;
    theme_name: string;
    color: string;
    accent: string;
    preview_bg: string;
}

interface CreateFormProps {
    initialForm?: {
        id: number;
        title: string;
        slug: string;
        description: string | null;
        template_key: string;
        theme: FormTheme;
        fields: FormField[];
        visibility: 'public' | 'private';
        status: 'draft' | 'published' | 'closed';
        settings: any;
        share_url?: string;
    };
    templates: TemplatePreset[];
    themePresets: ThemePreset[];
}

const FIELD_TYPES = [
    { value: 'text', label: 'Jawaban Singkat (Text)' },
    { value: 'paragraph', label: 'Paragraf (Jawaban Panjang)' },
    { value: 'radio', label: 'Pilihan Ganda (Satu Pilihan)' },
    { value: 'checkbox', label: 'Kotak Centang (Bisa Banyak Pilihan)' },
    { value: 'select', label: 'Dropdown (Menu Tarik-Turun)' },
    { value: 'rating', label: 'Skala Penilaian / Bintang (1 - 5)' },
    { value: 'number', label: 'Angka (Nominal / Jumlah)' },
    { value: 'date', label: 'Tanggal' },
    { value: 'phone', label: 'Nomor WhatsApp / HP' },
    { value: 'email', label: 'Alamat Email' },
];

export default function CreateForm({
    initialForm,
    templates = [],
    themePresets = [],
}: CreateFormProps) {
    const isEdit = !!initialForm;

    // Tabs: 'builder' (Pertanyaan) | 'preview' (Pratinjau)
    const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

    // Form core state
    const [title, setTitle] = useState<string>(
        initialForm?.title || 'Formulir Tanpa Judul',
    );
    const [description, setDescription] = useState<string>(
        initialForm?.description || 'Silakan lengkapi formulir di bawah ini dengan data yang valid.',
    );
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
        initialForm?.template_key || 'blank',
    );
    const [theme, setTheme] = useState<FormTheme>(
        initialForm?.theme || {
            color: '#673ab7', // Google Form Purple default
            accent: '#ede7f6',
            theme_name: 'Google Purple',
            banner_style: 'solid',
        },
    );
    const [fields, setFields] = useState<FormField[]>(
        initialForm?.fields || [
            {
                id: 'field_1',
                type: 'text',
                label: 'Nama Lengkap',
                placeholder: 'Jawaban singkat Anda',
                required: true,
            },
            {
                id: 'field_2',
                type: 'phone',
                label: 'Nomor WhatsApp / HP',
                placeholder: '08123456789',
                helper: 'Digunakan untuk konfirmasi informasi',
                required: true,
            },
            {
                id: 'field_3',
                type: 'radio',
                label: 'Pilihan Layanan / Minat',
                options: ['Opsi 1', 'Opsi 2', 'Opsi 3'],
                required: false,
            },
        ],
    );

    // Active focused card index for Google Forms styling accent
    const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(0);

    // Settings & Visibility
    const [visibility, setVisibility] = useState<'public' | 'private'>(
        initialForm?.visibility || 'public',
    );
    const [allowMultiple, setAllowMultiple] = useState<boolean>(
        initialForm?.settings?.allow_multiple ?? true,
    );
    const [successMessage, setSuccessMessage] = useState<string>(
        initialForm?.settings?.success_message ||
        'Terima kasih! Tanggapan Anda telah berhasil disimpan.',
    );

    // Preview state
    const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

    // Publish dialogs
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSuccessShareOpen, setIsSuccessShareOpen] = useState<boolean>(false);
    const [shareUrl, setShareUrl] = useState<string>(initialForm?.share_url || '');
    const [publishedFormId, setPublishedFormId] = useState<number | null>(initialForm?.id || null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [hasCopied, setHasCopied] = useState<boolean>(false);

    // Generate QR Code when shareUrl changes
    useEffect(() => {
        if (!shareUrl) return;
        QRCode.toDataURL(shareUrl, {
            width: 480,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        })
            .then(setQrDataUrl)
            .catch(console.error);
    }, [shareUrl]);

    // Download QR Code as PNG
    const handleDownloadQr = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        const cleanSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        link.download = `qr-code-${cleanSlug || 'form'}.png`;
        link.click();
    };

    // Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Form Builder',
            href: forms.index(),
        },
        {
            title: isEdit ? 'Edit Form' : 'Buat Form',
            href: isEdit && initialForm ? forms.edit(initialForm.id) : forms.create(),
        },
    ];

    // Select a quick template
    const handleApplyTemplate = (template: TemplatePreset) => {
        if (!confirm(`Terapkan contoh template "${template.name}"? Ini akan memperbarui judul dan pertanyaan.`)) {
            return;
        }
        setSelectedTemplateKey(template.id);
        setTitle(template.title);
        setDescription(template.subtitle);
        if (template.theme) {
            setTheme(template.theme);
        }
        setFields(JSON.parse(JSON.stringify(template.fields)));
        setActiveFieldIndex(0);
    };

    // Add field
    const handleAddField = (type: FormField['type'] = 'text') => {
        const newId = `field_${Date.now()}`;
        const newField: FormField = {
            id: newId,
            type,
            label: type === 'rating' ? 'Bagaimana penilaian Anda?' : 'Pertanyaan Tanpa Judul',
            placeholder: 'Jawaban Anda...',
            required: false,
            options: ['radio', 'checkbox', 'select'].includes(type)
                ? ['Opsi 1', 'Opsi 2', 'Opsi 3']
                : undefined,
        };
        const updated = [...fields, newField];
        setFields(updated);
        setActiveFieldIndex(updated.length - 1);
    };

    // Update field
    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    };

    // Remove field
    const handleRemoveField = (id: string) => {
        if (fields.length <= 1) {
            alert('Formulir harus memiliki minimal satu pertanyaan.');
            return;
        }
        setFields(fields.filter((f) => f.id !== id));
    };

    // Duplicate field
    const handleDuplicateField = (index: number) => {
        const target = fields[index];
        const duplicated: FormField = {
            ...JSON.parse(JSON.stringify(target)),
            id: `field_${Date.now()}`,
            label: `${target.label} (Salinan)`,
        };
        const next = [...fields];
        next.splice(index + 1, 0, duplicated);
        setFields(next);
        setActiveFieldIndex(index + 1);
    };

    // Move field up/down
    const handleMoveField = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;
        const next = [...fields];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        setFields(next);
        setActiveFieldIndex(targetIndex);
    };

    // Options helpers for radio, checkbox, select
    const handleAddOption = (fieldId: string) => {
        setFields(
            fields.map((f) => {
                if (f.id === fieldId) {
                    const currentOptions = f.options || [];
                    return {
                        ...f,
                        options: [...currentOptions, `Opsi ${currentOptions.length + 1}`],
                    };
                }
                return f;
            }),
        );
    };

    const handleUpdateOption = (fieldId: string, optIndex: number, value: string) => {
        setFields(
            fields.map((f) => {
                if (f.id === fieldId && f.options) {
                    const nextOptions = [...f.options];
                    nextOptions[optIndex] = value;
                    return { ...f, options: nextOptions };
                }
                return f;
            }),
        );
    };

    const handleRemoveOption = (fieldId: string, optIndex: number) => {
        setFields(
            fields.map((f) => {
                if (f.id === fieldId && f.options) {
                    if (f.options.length <= 1) return f;
                    const nextOptions = f.options.filter((_, idx) => idx !== optIndex);
                    return { ...f, options: nextOptions };
                }
                return f;
            }),
        );
    };

    // Handle Publish
    const handlePublish = async (status: 'published' | 'draft' = 'published') => {
        if (!title.trim()) {
            alert('Judul formulir tidak boleh kosong.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            title,
            description,
            template_key: selectedTemplateKey,
            theme,
            fields,
            visibility,
            status,
            settings: {
                layout_type: 'centered_card',
                allow_multiple: allowMultiple,
                success_message: successMessage,
            },
        };

        try {
            const url = isEdit && initialForm ? forms.update.url(initialForm.id) : forms.store.url();
            const method = isEdit ? 'PUT' : 'POST';

            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Gagal menyimpan formulir.');
                setIsSubmitting(false);
                return;
            }

            setIsPublishDialogOpen(false);
            setShareUrl(data.share_url);
            if (data.form?.id) {
                setPublishedFormId(data.form.id);
            }
            setIsSuccessShareOpen(true);
        } catch {
            alert('Terjadi kesalahan koneksi saat mempublikasikan form.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 3000);
    };

    const primaryColor = theme.color || '#673ab7';

    return (
        <>
            <Head title={isEdit ? `Edit: ${title}` : 'Buat Formulir (Google Form)'} />

            <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 flex flex-col">
                {/* ========================================================
                    TOP APP BAR (GOOGLE FORMS STYLE)
                   ======================================================== */}
                <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-xs px-4 py-2.5">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                        {/* Left: Back & Title */}
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit(forms.index())}
                                className="h-8 px-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
                                title="Kembali ke Daftar Form"
                            >
                                <ArrowLeft className="size-4 mr-1" />
                                <span className="hidden sm:inline text-xs font-medium">Daftar</span>
                            </Button>

                            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

                            <div className="flex items-center gap-2 truncate">
                                <span
                                    className="size-3 rounded-full shrink-0 shadow-xs"
                                    style={{ backgroundColor: primaryColor }}
                                    title={`Warna Tema: ${theme.theme_name}`}
                                />
                                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                    {title || 'Formulir Tanpa Judul'}
                                </span>
                                <Badge
                                    variant={visibility === 'public' ? 'default' : 'secondary'}
                                    className={`text-[10px] py-0 px-1.5 hidden md:inline-flex ${
                                        visibility === 'public'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : ''
                                    }`}
                                >
                                    {visibility === 'public' ? (
                                        <Globe className="size-2.5 mr-1 inline" />
                                    ) : (
                                        <Lock className="size-2.5 mr-1 inline" />
                                    )}
                                    {visibility === 'public' ? 'Publik' : 'Privat'}
                                </Badge>
                            </div>
                        </div>

                        {/* Center: Navigation Tabs (Pertanyaan | Pratinjau) */}
                        <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-100/80 p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                            <button
                                type="button"
                                onClick={() => setActiveTab('builder')}
                                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'builder'
                                        ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                }`}
                            >
                                <FileText className="size-3.5" style={{ color: activeTab === 'builder' ? primaryColor : undefined }} />
                                <span>Pertanyaan</span>
                                <span className="ml-1 rounded-full bg-neutral-200/80 dark:bg-neutral-700 px-1.5 text-[10px] text-neutral-700 dark:text-neutral-300">
                                    {fields.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'preview'
                                        ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                }`}
                            >
                                <Eye className="size-3.5" style={{ color: activeTab === 'preview' ? primaryColor : undefined }} />
                                <span>Pratinjau</span>
                            </button>
                            {isEdit && initialForm && (
                                <button
                                    type="button"
                                    onClick={() => router.visit(forms.responses(initialForm.id))}
                                    className="rounded-md px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 hidden sm:flex items-center gap-1.5"
                                >
                                    <span>Tanggapan &rarr;</span>
                                </button>
                            )}
                        </div>

                        {/* Right: Quick Tools (Theme Color & Publish) */}
                        <div className="flex items-center gap-2">
                            {/* Color Palette Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs gap-1.5"
                                        title="Ubah Warna Tema Formulir"
                                    >
                                        <Palette className="size-3.5" style={{ color: primaryColor }} />
                                        <span className="hidden sm:inline">Tema</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2">
                                    <DropdownMenuLabel className="text-xs font-semibold text-neutral-500">
                                        Pilih Warna Tema Formulir:
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="grid grid-cols-4 gap-2 p-1">
                                        {[
                                            { name: 'Google Purple', color: '#673ab7', accent: '#ede7f6' },
                                            { name: 'Honda Racing Red', color: '#dc2626', accent: '#fef2f2' },
                                            { name: 'Sapphire Blue', color: '#2563eb', accent: '#eff6ff' },
                                            { name: 'Emerald Green', color: '#059669', accent: '#ecfdf5' },
                                            { name: 'Sunset Amber', color: '#d97706', accent: '#fffbeb' },
                                            { name: 'Teal Cyan', color: '#0891b2', accent: '#ecfeff' },
                                            { name: 'Indigo Night', color: '#4f46e5', accent: '#eef2ff' },
                                            { name: 'Dark Slate', color: '#1e293b', accent: '#f8fafc' },
                                        ].map((tp) => (
                                            <button
                                                key={tp.color}
                                                type="button"
                                                onClick={() =>
                                                    setTheme({
                                                        color: tp.color,
                                                        accent: tp.accent,
                                                        theme_name: tp.name,
                                                        banner_style: 'solid',
                                                    })
                                                }
                                                className={`size-9 rounded-lg flex items-center justify-center transition-all ${
                                                    primaryColor === tp.color
                                                        ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-105'
                                                        : 'hover:opacity-80'
                                                }`}
                                                style={{ backgroundColor: tp.color }}
                                                title={tp.name}
                                            >
                                                {primaryColor === tp.color && (
                                                    <Check className="size-4 text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Preset Template Menu */}
                            {templates.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs gap-1 hidden md:flex"
                                            title="Gunakan Contoh Template Pertanyaan"
                                        >
                                            <Layers className="size-3.5 text-neutral-500" />
                                            <span>Contoh Template</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuLabel className="text-xs">
                                            Terapkan Contoh Formulir:
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {templates.map((tpl) => (
                                            <DropdownMenuItem
                                                key={tpl.id}
                                                onClick={() => handleApplyTemplate(tpl)}
                                                className="text-xs cursor-pointer py-1.5"
                                            >
                                                <div>
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {tpl.name}
                                                    </div>
                                                    <div className="text-[10.5px] text-neutral-500 line-clamp-1">
                                                        {tpl.description}
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Kirim / Publish Button */}
                            <Button
                                type="button"
                                onClick={() => setIsPublishDialogOpen(true)}
                                className="h-8 text-xs font-bold gap-1.5 text-white shadow-xs"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Send className="size-3.5" />
                                <span>Kirim / Publish</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* ========================================================
                    MAIN CONTENT AREA
                   ======================================================== */}
                <main className="flex-1 py-6 px-4">
                    {/* TAB 1: PERTANYAAN (GOOGLE FORMS EDITOR) */}
                    {activeTab === 'builder' && (
                        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
                            {/* FORM HEADER CARD */}
                            <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
                                {/* Top Accent Color Bar */}
                                <div
                                    className="h-3 w-full transition-all"
                                    style={{ backgroundColor: primaryColor }}
                                />

                                <div className="p-6 space-y-4">
                                    <div>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Formulir Tanpa Judul"
                                            className="text-2xl font-bold border-0 border-b border-transparent focus-visible:border-neutral-400 focus-visible:ring-0 px-0 rounded-none h-auto pb-1 text-neutral-900 dark:text-neutral-100"
                                        />
                                    </div>
                                    <div>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Deskripsi formulir..."
                                            rows={2}
                                            className="text-sm border-0 border-b border-transparent focus-visible:border-neutral-400 focus-visible:ring-0 px-0 rounded-none resize-none text-neutral-600 dark:text-neutral-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* QUESTION CARDS LIST */}
                            {fields.map((field, idx) => {
                                const isFocused = activeFieldIndex === idx;

                                return (
                                    <div
                                        key={field.id}
                                        onClick={() => setActiveFieldIndex(idx)}
                                        className={`bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-xs border transition-all relative ${
                                            isFocused
                                                ? 'border-l-4 shadow-sm'
                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                                        }`}
                                        style={{
                                            borderLeftColor: isFocused ? primaryColor : undefined,
                                        }}
                                    >
                                        {/* Question Top Row: Label input + Field Type Select */}
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                            <div className="flex-1">
                                                <div className="text-[11px] font-semibold text-neutral-500 mb-1 flex items-center gap-1.5">
                                                    <span>Pertanyaan {idx + 1}</span>
                                                    {field.required && (
                                                        <span className="text-red-500 font-bold">*</span>
                                                    )}
                                                </div>
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) =>
                                                        handleUpdateField(field.id, { label: e.target.value })
                                                    }
                                                    placeholder="Tuliskan pertanyaan di sini..."
                                                    className="font-medium text-sm bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 focus-visible:ring-1"
                                                />
                                            </div>

                                            <div className="w-full sm:w-56 shrink-0">
                                                <div className="text-[11px] font-semibold text-neutral-500 mb-1">
                                                    Tipe Jawaban
                                                </div>
                                                <Select
                                                    value={field.type}
                                                    onValueChange={(val: FormField['type']) => {
                                                        const needOptions = ['radio', 'checkbox', 'select'].includes(val);
                                                        handleUpdateField(field.id, {
                                                            type: val,
                                                            options: needOptions
                                                                ? field.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']
                                                                : undefined,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FIELD_TYPES.map((t) => (
                                                            <SelectItem key={t.value} value={t.value} className="text-xs">
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Question Body: Choices / Options / Placeholders */}
                                        <div className="py-2">
                                            {/* Options for Radio / Checkbox / Select */}
                                            {['radio', 'checkbox', 'select'].includes(field.type) && (
                                                <div className="space-y-2.5">
                                                    {(field.options || []).map((opt, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-2.5">
                                                            {field.type === 'radio' && (
                                                                <span className="size-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shrink-0" />
                                                            )}
                                                            {field.type === 'checkbox' && (
                                                                <span className="size-4 rounded border-2 border-neutral-300 dark:border-neutral-600 shrink-0" />
                                                            )}
                                                            {field.type === 'select' && (
                                                                <span className="text-xs font-mono text-neutral-400 w-4 text-center">
                                                                    {optIdx + 1}.
                                                                </span>
                                                            )}
                                                            <Input
                                                                value={opt}
                                                                onChange={(e) =>
                                                                    handleUpdateOption(field.id, optIdx, e.target.value)
                                                                }
                                                                placeholder={`Opsi ${optIdx + 1}`}
                                                                className="h-8 text-xs max-w-md bg-transparent"
                                                            />
                                                            {(field.options?.length || 0) > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveOption(field.id, optIdx)}
                                                                    className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors"
                                                                    title="Hapus opsi"
                                                                >
                                                                    &times;
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    <div className="pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAddOption(field.id)}
                                                            className="h-7 text-xs px-2 gap-1.5 font-medium"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            <Plus className="size-3" />
                                                            <span>Tambahkan opsi</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Preview line for Text / Phone / Email / Number */}
                                            {['text', 'phone', 'email', 'number'].includes(field.type) && (
                                                <div className="space-y-1">
                                                    <div className="py-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-400 max-w-sm">
                                                        {field.placeholder || 'Teks jawaban singkat'}
                                                    </div>
                                                    <Input
                                                        value={field.placeholder || ''}
                                                        onChange={(e) =>
                                                            handleUpdateField(field.id, { placeholder: e.target.value })
                                                        }
                                                        placeholder="Contoh teks placeholder (opsional)..."
                                                        className="h-7 text-[11px] text-neutral-500 mt-2 bg-neutral-50/50 dark:bg-neutral-800/30 max-w-md"
                                                    />
                                                </div>
                                            )}

                                            {/* Preview for Paragraph */}
                                            {field.type === 'paragraph' && (
                                                <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-400">
                                                    Teks jawaban panjang...
                                                </div>
                                            )}

                                            {/* Preview for Date */}
                                            {field.type === 'date' && (
                                                <div className="py-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-400 max-w-xs">
                                                    dd/mm/yyyy
                                                </div>
                                            )}

                                            {/* Preview for Rating */}
                                            {field.type === 'rating' && (
                                                <div className="flex items-center gap-1.5 py-2 text-amber-400">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <span key={s} className="text-xl">★</span>
                                                    ))}
                                                    <span className="text-xs text-neutral-400 ml-2">Skala 1 - 5</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Question Footer Bar (Actions & Required Toggle) */}
                                        <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                                            {/* Move up / down */}
                                            <div className="flex items-center gap-1 text-neutral-500">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveField(idx, 'up');
                                                    }}
                                                    className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                                                    title="Pindah ke atas"
                                                >
                                                    <ChevronUp className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === fields.length - 1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveField(idx, 'down');
                                                    }}
                                                    className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                                                    title="Pindah ke bawah"
                                                >
                                                    <ChevronDown className="size-4" />
                                                </button>
                                            </div>

                                            {/* Duplicate, Delete, Required Switch */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDuplicateField(idx);
                                                        }}
                                                        className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded"
                                                        title="Duplikasi pertanyaan"
                                                    >
                                                        <Copy className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveField(field.id);
                                                        }}
                                                        className="p-1.5 text-neutral-500 hover:text-red-600 rounded"
                                                        title="Hapus pertanyaan"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>

                                                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

                                                <div className="flex items-center gap-2">
                                                    <Label
                                                        htmlFor={`required_${field.id}`}
                                                        className="text-xs cursor-pointer text-neutral-600 dark:text-neutral-400 font-medium"
                                                    >
                                                        Wajib diisi
                                                    </Label>
                                                    <Switch
                                                        id={`required_${field.id}`}
                                                        checked={field.required}
                                                        onCheckedChange={(checked) =>
                                                            handleUpdateField(field.id, { required: checked })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ADD QUESTION BUTTON (CENTERED & PROMINENT) */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 pb-8">
                                <Button
                                    type="button"
                                    onClick={() => handleAddField('text')}
                                    className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 dark:bg-neutral-900 dark:text-white dark:border-neutral-700 text-xs font-semibold h-10 px-4 gap-2 shadow-xs"
                                >
                                    <Plus className="size-4" style={{ color: primaryColor }} />
                                    <span>Tambah Pertanyaan Baru</span>
                                </Button>

                                <div className="flex items-center gap-1.5 text-xs">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddField('radio')}
                                        className="h-8 text-[11px] text-neutral-500 hover:text-neutral-900"
                                    >
                                        + Pilihan Ganda
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddField('checkbox')}
                                        className="h-8 text-[11px] text-neutral-500 hover:text-neutral-900"
                                    >
                                        + Kotak Centang
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddField('rating')}
                                        className="h-8 text-[11px] text-neutral-500 hover:text-neutral-900"
                                    >
                                        + Bintang / Rating
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PRATINJAU LANGSUNG (LIVE GOOGLE FORM PREVIEW) */}
                    {activeTab === 'preview' && (
                        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
                            {/* Information bar */}
                            <div className="bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 text-xs flex items-center justify-between gap-2 shadow-xs">
                                <div className="flex items-center gap-2">
                                    <Eye className="size-4 text-purple-600 shrink-0" />
                                    <span>
                                        Ini adalah pratinjau langsung bagaimana responden melihat formulir ini.
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActiveTab('builder')}
                                    className="h-7 text-xs bg-white dark:bg-neutral-900 border-purple-300 gap-1"
                                >
                                    <FileText className="size-3" />
                                    Edit Pertanyaan
                                </Button>
                            </div>

                            {/* Google Form Live Render */}
                            <div className="rounded-xl overflow-hidden shadow-md">
                                <GoogleFormView
                                    title={title}
                                    description={description}
                                    fields={fields}
                                    theme={theme}
                                    answers={previewAnswers}
                                    onAnswerChange={(fieldId, val) =>
                                        setPreviewAnswers((prev) => ({ ...prev, [fieldId]: val }))
                                    }
                                    isPreview={true}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ========================================================
                MODAL PUBLISH FORM (PILIH PUBLIC / PRIVATE)
               ======================================================== */}
            <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <Send className="size-4" style={{ color: primaryColor }} />
                            Publikasikan Formulir
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Atur izin visibilitas dan pengaturan sebelum membagikan link formulir kepada responden.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        {/* Pilihan Visibility: Public vs Private */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                Akses &amp; Visibilitas Formulir:
                            </Label>

                            <div
                                onClick={() => setVisibility('public')}
                                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    visibility === 'public'
                                        ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                                }`}
                            >
                                <Checkbox
                                    checked={visibility === 'public'}
                                    onCheckedChange={() => setVisibility('public')}
                                    className="mt-0.5"
                                />
                                <div>
                                    <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                        <Globe className="size-3.5 text-emerald-600" />
                                        Publish to Public (Terbuka untuk Umum)
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                                        Formulir dapat diakses dan diisi oleh siapa saja yang memiliki link tanpa harus login.
                                    </p>
                                </div>
                            </div>

                            <div
                                onClick={() => setVisibility('private')}
                                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    visibility === 'private'
                                        ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                                }`}
                            >
                                <Checkbox
                                    checked={visibility === 'private'}
                                    onCheckedChange={() => setVisibility('private')}
                                    className="mt-0.5"
                                />
                                <div>
                                    <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-blue-600" />
                                        Publish Private (Khusus Pengguna Internal)
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                                        Hanya pengguna yang telah terdaftar dan login yang dapat mengisi formulir.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pengaturan Tambahan */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                                        Izinkan Tanggapan Berulang
                                    </div>
                                    <p className="text-[10px] text-neutral-500">
                                        Responden dapat mengirimkan jawaban lebih dari satu kali.
                                    </p>
                                </div>
                                <Switch
                                    checked={allowMultiple}
                                    onCheckedChange={setAllowMultiple}
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                                    Pesan Sukses Setelah Kirim Tanggapan:
                                </Label>
                                <Input
                                    value={successMessage}
                                    onChange={(e) => setSuccessMessage(e.target.value)}
                                    placeholder="Terima kasih atas tanggapan Anda..."
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPublishDialogOpen(false)}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handlePublish('published')}
                            className="text-white text-xs font-bold gap-1.5"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {isSubmitting ? 'Memproses...' : 'Konfirmasi & Publish'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================
                MODAL SUKSES PUBLISH: DAPAT LINK YANG BISA DIBAGIKAN
               ======================================================== */}
            <Dialog open={isSuccessShareOpen} onOpenChange={setIsSuccessShareOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2">
                            <Share2 className="size-5" />
                        </div>
                        <DialogTitle className="text-center text-base font-bold text-neutral-900 dark:text-neutral-100">
                            Formulir Berhasil Dipublikasikan!
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs">
                            Formulir Anda siap dibagikan. Salin tautan di bawah ini untuk mengundang responden mengisi data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Box Link URL */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                Tautan Publik Formulir:
                            </Label>
                            <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 p-1.5 rounded-lg border">
                                <Input
                                    readOnly
                                    value={shareUrl}
                                    className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 font-mono text-neutral-800 dark:text-neutral-200"
                                />
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={handleCopyLink}
                                    className={`h-8 text-xs font-bold gap-1 shrink-0 ${
                                        hasCopied
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    }`}
                                >
                                    {hasCopied ? (
                                        <>
                                            <Check className="size-3.5" /> Tersalin!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" /> Salin Link
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Box QR Code & Download QR */}
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
                            {qrDataUrl ? (
                                <img
                                    src={qrDataUrl}
                                    alt="QR Code"
                                    className="size-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white p-1 shadow-xs shrink-0"
                                />
                            ) : (
                                <div className="size-20 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
                                    <QrCode className="size-6 text-neutral-400 animate-pulse" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    <QrCode className="size-3.5 text-neutral-600 dark:text-neutral-300" />
                                    <span>QR Code Responden</span>
                                </div>
                                <p className="text-[11px] text-neutral-500 leading-tight">
                                    Cetak atau bagikan QR Code agar responden bisa scan langsung lewat kamera HP.
                                </p>
                                <div className="pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!qrDataUrl}
                                        onClick={handleDownloadQr}
                                        className="h-7 text-xs font-semibold gap-1.5 bg-white dark:bg-neutral-800 shadow-xs"
                                    >
                                        <Download className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                                        <span>Download QR Code (PNG)</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons: Buka Form, Bagikan ke WhatsApp, Buka Tanggapan */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.open(shareUrl, '_blank')}
                                className="h-8 text-xs gap-1.5"
                            >
                                <ExternalLink className="size-3.5" />
                                Buka Form
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const text = encodeURIComponent(
                                        `Halo! Silakan mengisi formulir "${title}" melalui tautan berikut:\n${shareUrl}`,
                                    );
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                }}
                                className="h-8 text-xs gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400"
                            >
                                <Share2 className="size-3.5" />
                                WhatsApp
                            </Button>

                            {publishedFormId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(forms.responses(publishedFormId))}
                                    className="h-8 text-xs gap-1.5 col-span-2 sm:col-span-1 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                                >
                                    <BarChart3 className="size-3.5 text-red-600" />
                                    Buka Tanggapan
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t pt-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSuccessShareOpen(false)}
                            className="text-xs text-neutral-500"
                        >
                            Lanjut Edit Form
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => router.visit(forms.index())}
                            className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white font-semibold dark:bg-neutral-100 dark:text-neutral-900"
                        >
                            Ke Daftar Form &rarr;
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CreateForm.layout = {
    breadcrumbs: [
        {
            title: 'Form Builder',
            href: forms.index(),
        },
        {
            title: 'Buat Form',
            href: forms.create(),
        },
    ],
};
