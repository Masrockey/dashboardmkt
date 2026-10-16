import { Head, useForm } from '@inertiajs/react';
import formsRoute from '@/routes/forms';
import GoogleFormView, {
    FormFieldItem,
} from '@/components/form-templates/google-form-view';

interface PublicFormProps {
    form: {
        id: number;
        title: string;
        slug: string;
        description: string | null;
        template_key?: string;
        theme?: {
            color: string;
            accent: string;
            theme_name: string;
        };
        fields: FormFieldItem[];
        visibility: 'public' | 'private';
        status: 'draft' | 'published' | 'closed';
        settings?: any;
    };
    requiresLogin: boolean;
    hasSubmitted: boolean;
    isSuccess: boolean;
    submittedMessage: string;
}

type AnswerValue = string | number | boolean | string[] | null;

interface FormPayload {
    answers: Record<string, AnswerValue>;
}

export default function PublicFormView({
    form,
    requiresLogin,
    hasSubmitted,
    isSuccess,
    submittedMessage,
}: PublicFormProps) {
    const { data, setData, post, processing, errors } = useForm<FormPayload>({
        answers: {},
    });

    const handleAnswerChange = (fieldId: string, val: AnswerValue) => {
        setData('answers', {
            ...data.answers,
            [fieldId]: val,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(formsRoute.public.submit.url(form.slug), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={form.title} />
            <GoogleFormView
                title={form.title}
                description={form.description}
                fields={form.fields}
                theme={form.theme}
                answers={data.answers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmit}
                processing={processing}
                errors={errors as Record<string, string | undefined>}
                isSuccess={isSuccess}
                requiresLogin={requiresLogin}
                submittedMessage={submittedMessage}
                allowMultiple={form.settings?.allow_multiple ?? true}
                isClosed={form.status === 'closed'}
            />
        </>
    );
}
