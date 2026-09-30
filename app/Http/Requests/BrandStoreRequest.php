<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BrandStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_brand' => ['required', 'string', 'max:255', 'unique:brands,nama_brand'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_brand' => 'Nama Brand',
            'category_id' => 'Kategori',
        ];
    }
}
