<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KabupatenUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $kabupatenId = $this->route('kabupaten')?->id ?? $this->route('kabupaten');

        return [
            'nama_kabupaten' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kabupatens', 'nama_kabupaten')->ignore($kabupatenId),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_kabupaten' => 'Nama Kabupaten',
        ];
    }
}
