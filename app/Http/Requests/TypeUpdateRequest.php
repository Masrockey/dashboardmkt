<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TypeUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_type' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'segment_id' => ['nullable', 'exists:segments,id'],
            'nama_pasar' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_type' => 'Type / Nama Type',
            'category_id' => 'Kategori',
            'segment_id' => 'Segment',
            'nama_pasar' => 'Nama Pasar',
        ];
    }
}
