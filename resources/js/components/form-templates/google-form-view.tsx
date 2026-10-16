import React from 'react';
import {
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Send,
    Star,
    Lock,
    LogIn,
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

export interface GoogleFormViewProps {
    title: string;
    description?: string | null;
    fields: FormFieldItem[];
    theme?: {
        color?: string;
        accent?: string;
        theme_name?: string;
    };
    answers: Record<string, any>;
    onAnswerChange: (fieldId: string, val: any) => void;
    onSubmit?: (e: React.FormEvent) => void;
    processing?: boolean;
    errors?: Record<string, string | undefined>;
    isPreview?: boolean;
    isSuccess?: boolean;
    requiresLogin?: boolean;
    submittedMessage?: string;
    allowMultiple?: boolean;
    isClosed?: boolean;
}

export default function GoogleFormView({
    title,
    description,
    fields,
    theme,
    answers,
    onAnswerChange,
    onSubmit,
    processing = false,
    errors = {},
    isPreview = false,
    isSuccess = false,
    requiresLogin = false,
    submittedMessage = 'Terima kasih! Tanggapan Anda telah berhasil disimpan.',
    allowMultiple = true,
    isClosed = false,
}: GoogleFormViewProps) {
    const primaryColor = theme?.color || '#673ab7'; // Default Google Form Purple

    const handleCheckboxToggle = (fieldId: string, option: string) => {
        const currentList = (answers[fieldId] as string[]) || [];
        const nextList = currentList.includes(option)
            ? currentList.filter((item) => item !== option)
            : [...currentList, option];
        onAnswerChange(fieldId, nextList);
    };

    // 1. Tampilan Sukses (Setelah Kirim Form)
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-12 px-4 flex items-center justify-center">
                <Card className="max-w-xl w-full overflow-hidden shadow-md border bg-white dark:bg-neutral-900 rounded-2xl">
                    <div className="h-3 w-full" style={{ backgroundColor: primaryColor }} />
                    <div className="p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="size-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <CheckCircle2 className="size-6" />
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                {title}
                            </h2>
                        </div>

                        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed pt-2">
                            {submittedMessage}
                        </p>

                        {allowMultiple && (
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => window.location.reload()}
                                    className="p-0 text-xs font-semibold"
                                    style={{ color: primaryColor }}
                                >
                                    <RotateCcw className="size-3.5 mr-1.5" />
                                    Kirim tanggapan lain
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // 2. Tampilan Memerlukan Login
    if (requiresLogin) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-12 px-4 flex items-center justify-center">
                <Card className="max-w-md w-full overflow-hidden shadow-md border bg-white dark:bg-neutral-900 rounded-2xl text-center">
                    <div className="h-3 w-full" style={{ backgroundColor: primaryColor }} />
                    <div className="p-8 space-y-4">
                        <div className="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-600 dark:text-neutral-300">
                            <Lock className="size-6" />
                        </div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            Formulir Bersifat Privat
                        </h2>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            Formulir ini hanya dapat diisi oleh pengguna internal yang telah login. Silakan login terlebih dahulu untuk melanjutkan.
                        </p>
                        <div className="pt-2">
                            <Button
                                asChild
                                style={{ backgroundColor: primaryColor }}
                                className="text-white text-xs font-bold w-full h-9"
                            >
                                <a href="/login">
                                    <LogIn className="size-3.5 mr-1.5" />
                                    Login Sekarang
                                </a>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // 3. Tampilan Formulir Ditutup (Closed)
    if (isClosed) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-12 px-4 flex items-center justify-center">
                <Card className="max-w-xl w-full overflow-hidden shadow-md border bg-white dark:bg-neutral-900 rounded-2xl">
                    <div className="h-3 w-full bg-red-600" />
                    <div className="p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                                <Lock className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {title}
                                </h2>
                                <p className="text-xs text-red-600 font-semibold mt-0.5">
                                    Formulir Sudah Ditutup
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed pt-2">
                            Formulir &quot;{title}&quot; saat ini sudah tidak lagi menerima tanggapan baru. Hubungi pemilik formulir jika Anda merasa ini adalah sebuah kekeliruan.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    // 4. Tampilan Utama Formulir (Gaya Google Form Klasik)
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-4">
                {/* Header Card Form */}
                <Card className="overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl">
                    {/* Top Color Accent Bar */}
                    <div
                        className="h-3.5 w-full transition-all"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div className="p-6 sm:p-7 space-y-3">
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                            {title || 'Formulir Tanpa Judul'}
                        </h1>
                        {description && (
                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                                {description}
                            </p>
                        )}
                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-red-600 dark:text-red-400 font-medium">
                            * Menandakan pertanyaan yang wajib diisi
                        </div>
                    </div>
                </Card>

                {/* Form Questions Form Container */}
                <form onSubmit={onSubmit} className="space-y-4">
                    {fields.map((field, idx) => {
                        const fieldError = errors[`answers.${field.id}`] || errors[field.id];
                        const currentVal = answers[field.id];

                        return (
                            <Card
                                key={field.id}
                                className={`p-5 sm:p-6 shadow-xs border bg-white dark:bg-neutral-900 rounded-xl transition-all ${fieldError
                                        ? 'border-red-400 dark:border-red-800 ring-1 ring-red-400'
                                        : 'border-neutral-200 dark:border-neutral-800'
                                    }`}
                            >
                                <div className="mb-3 space-y-1">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 block">
                                        {field.label}{' '}
                                        {field.required && (
                                            <span className="text-red-600 text-sm ml-0.5">*</span>
                                        )}
                                    </label>
                                    {field.helper && (
                                        <p className="text-[11px] text-neutral-500">
                                            {field.helper}
                                        </p>
                                    )}
                                </div>

                                {/* Field Type: Jawaban Singkat (Text) */}
                                {field.type === 'text' && (
                                    <Input
                                        placeholder={field.placeholder || 'Jawaban Anda'}
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700 focus-visible:ring-1"
                                    />
                                )}

                                {/* Field Type: Paragraf (Textarea) */}
                                {field.type === 'paragraph' && (
                                    <Textarea
                                        placeholder={field.placeholder || 'Jawaban panjang Anda'}
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        rows={3}
                                        className="text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700 focus-visible:ring-1"
                                    />
                                )}

                                {/* Field Type: Nomor Telepon / WA */}
                                {field.type === 'phone' && (
                                    <Input
                                        type="tel"
                                        placeholder={field.placeholder || '08xxxxxxxxxx'}
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700"
                                    />
                                )}

                                {/* Field Type: Email */}
                                {field.type === 'email' && (
                                    <Input
                                        type="email"
                                        placeholder={field.placeholder || 'nama@contoh.com'}
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700"
                                    />
                                )}

                                {/* Field Type: Angka / Number */}
                                {field.type === 'number' && (
                                    <Input
                                        type="number"
                                        placeholder={field.placeholder || '0'}
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700"
                                    />
                                )}

                                {/* Field Type: Tanggal */}
                                {field.type === 'date' && (
                                    <Input
                                        type="date"
                                        value={currentVal || ''}
                                        onChange={(e) => onAnswerChange(field.id, e.target.value)}
                                        className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700"
                                    />
                                )}

                                {/* Field Type: Pilihan Ganda (Radio) */}
                                {field.type === 'radio' && (
                                    <div className="space-y-2.5 pt-1">
                                        {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, oIdx) => (
                                            <label
                                                key={oIdx}
                                                className="flex items-center gap-3 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer p-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`field_${field.id}`}
                                                    checked={currentVal === opt}
                                                    onChange={() => onAnswerChange(field.id, opt)}
                                                    className="size-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Field Type: Kotak Centang (Checkbox) */}
                                {field.type === 'checkbox' && (
                                    <div className="space-y-2.5 pt-1">
                                        {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, oIdx) => {
                                            const isChecked = ((currentVal as string[]) || []).includes(opt);
                                            return (
                                                <label
                                                    key={oIdx}
                                                    className="flex items-center gap-3 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer p-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleCheckboxToggle(field.id, opt)}
                                                        className="size-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                    />
                                                    <span>{opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Field Type: Dropdown (Select) */}
                                {field.type === 'select' && (
                                    <Select
                                        value={currentVal || ''}
                                        onValueChange={(val) => onAnswerChange(field.id, val)}
                                    >
                                        <SelectTrigger className="h-10 text-xs sm:text-sm bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-300 dark:border-neutral-700">
                                            <SelectValue placeholder={field.placeholder || '-- Pilih opsi --'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(field.options || []).map((opt, oIdx) => (
                                                <SelectItem key={oIdx} value={opt} className="text-xs sm:text-sm">
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {/* Field Type: Rating Bintang (1 - 5) */}
                                {field.type === 'rating' && (
                                    <div className="flex items-center gap-2 py-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => onAnswerChange(field.id, star)}
                                                className={`size-9 rounded-lg border flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${currentVal === star
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                                    }`}
                                            >
                                                <Star className={`size-4 mr-0.5 ${currentVal >= star ? 'fill-current' : ''}`} />
                                                {star}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Error Text */}
                                {fieldError && (
                                    <p className="text-[11px] text-red-600 mt-2 font-medium flex items-center gap-1">
                                        <AlertCircle className="size-3" />
                                        {fieldError}
                                    </p>
                                )}
                            </Card>
                        );
                    })}

                    {/* Tombol Kirim Form */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button
                            type="submit"
                            disabled={processing}
                            style={{ backgroundColor: primaryColor }}
                            className="w-full sm:w-auto px-8 h-10 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-lg"
                        >
                            <Send className="size-3.5" />
                            {processing ? 'Sedang Mengirim...' : isPreview ? 'Kirim Tanggapan (Simulasi)' : 'Kirim'}
                        </Button>

                        <span className="text-[11px] text-neutral-400">
                            Jangan pernah mengirimkan sandi melalui Form.
                        </span>
                    </div>
                </form>

                {/* Footer */}
                <footer className="pt-6 pb-4 text-center text-xs text-neutral-400">
                    <p>Formulir dibuat dengan Astra Motor NTB Form Builder</p>
                </footer>
            </div>
        </div>
    );
}
