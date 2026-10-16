<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicFormController extends Controller
{
    /**
     * Display the public / respondent form.
     */
    public function show(Request $request, string $slug): Response
    {
        $form = Form::where('slug', $slug)->firstOrFail();

        $user = $request->user();
        $isPrivate = $form->visibility === 'private';
        $requiresLogin = $isPrivate && ! $user;

        $hasSubmitted = false;
        if (! ($form->settings['allow_multiple'] ?? true)) {
            if ($user) {
                $hasSubmitted = FormResponse::where('form_id', $form->id)
                    ->where('user_id', $user->id)
                    ->exists();
            } else {
                $hasSubmitted = FormResponse::where('form_id', $form->id)
                    ->where('respondent_ip', $request->ip())
                    ->where('created_at', '>=', now()->subHours(24))
                    ->exists();
            }
        }

        return Inertia::render('public/form', [
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'slug' => $form->slug,
                'description' => $form->description,
                'theme' => $form->theme,
                'template_key' => $form->template_key,
                'fields' => $form->fields,
                'visibility' => $form->visibility,
                'status' => $form->status,
                'settings' => $form->settings,
            ],
            'requiresLogin' => $requiresLogin,
            'hasSubmitted' => $hasSubmitted,
            'isSuccess' => (bool) session('submitted_success'),
            'submittedMessage' => session('success_message', $form->settings['success_message'] ?? 'Terima kasih! Tanggapan Anda telah berhasil disimpan.'),
        ]);
    }

    /**
     * Submit an answer for the public form.
     */
    public function submit(Request $request, string $slug): RedirectResponse
    {
        $form = Form::where('slug', $slug)->firstOrFail();

        // 1. Check status
        if ($form->status !== 'published') {
            return back()->withErrors([
                'form' => 'Formulir ini saat ini tidak menerima tanggapan baru.',
            ]);
        }

        // 2. Check private visibility
        if ($form->visibility === 'private' && ! $request->user()) {
            return back()->withErrors([
                'form' => 'Formulir ini bersifat privat. Anda harus masuk (login) terlebih dahulu.',
            ]);
        }

        // 3. Check single response restriction
        if (! ($form->settings['allow_multiple'] ?? true)) {
            $existing = false;
            if ($request->user()) {
                $existing = FormResponse::where('form_id', $form->id)
                    ->where('user_id', $request->user()->id)
                    ->exists();
            } else {
                $existing = FormResponse::where('form_id', $form->id)
                    ->where('respondent_ip', $request->ip())
                    ->where('created_at', '>=', now()->subHours(24))
                    ->exists();
            }

            if ($existing) {
                return back()->withErrors([
                    'form' => 'Anda sudah pernah mengisi formulir ini sebelumnya.',
                ]);
            }
        }

        // 4. Dynamic field validation
        $fields = $form->fields ?? [];
        $answers = $request->input('answers', []);
        $errors = [];

        foreach ($fields as $field) {
            $fieldId = $field['id'];
            $label = $field['label'] ?? 'Field ini';
            $isRequired = ! empty($field['required']);
            $val = $answers[$fieldId] ?? null;

            if ($isRequired) {
                if ($val === null || $val === '' || (is_array($val) && count($val) === 0)) {
                    $errors["answers.{$fieldId}"] = "Pertanyaan '{$label}' wajib diisi.";
                }
            }

            // Email validation if type is email
            if (! empty($val) && ($field['type'] ?? '') === 'email') {
                if (! filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $errors["answers.{$fieldId}"] = "Format email pada pertanyaan '{$label}' tidak valid.";
                }
            }
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        // 5. Store response
        FormResponse::create([
            'form_id' => $form->id,
            'user_id' => $request->user()?->id,
            'respondent_ip' => $request->ip(),
            'answers' => $answers,
        ]);

        $successMsg = $form->settings['success_message'] ?? 'Terima kasih! Tanggapan Anda telah berhasil disimpan.';

        return redirect()
            ->route('forms.public.show', ['slug' => $form->slug])
            ->with('submitted_success', true)
            ->with('success_message', $successMsg);
    }
}
