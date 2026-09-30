<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_kategori' => ['required', 'string', 'max:255', 'unique:categories,nama_kategori'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_kategori' => 'Nama Kategori',
        ];
    }
}
