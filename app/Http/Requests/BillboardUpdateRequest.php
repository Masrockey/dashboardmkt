<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;

class BillboardUpdateRequest extends BillboardStoreRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'remove_foto_siang' => ['nullable', 'boolean'],
            'remove_foto_malam' => ['nullable', 'boolean'],
            'remove_foto_jarak_jauh' => ['nullable', 'boolean'],
            'remove_foto_jarak_dekat' => ['nullable', 'boolean'],
        ]);
    }
}
