<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrandUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $brandId = $this->route('brand')?->id ?? $this->route('brand');

        return [
            'nama_brand' => [
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'nama_brand')->ignore($brandId),
            ],
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
