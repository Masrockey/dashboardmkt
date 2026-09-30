<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KabupatenStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_kabupaten' => ['required', 'string', 'max:255', 'unique:kabupatens,nama_kabupaten'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_kabupaten' => 'Nama Kabupaten',
        ];
    }
}
