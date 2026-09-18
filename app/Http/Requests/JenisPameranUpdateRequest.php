<?php

namespace App\Http\Requests;

use App\Models\JenisPameran;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JenisPameranUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var JenisPameran|null $jenisPameran */
        $jenisPameran = $this->route('jenis_pameran');

        return [
            'kode_pameran' => [
                'required',
                'string',
                'max:50',
                Rule::unique('jenis_pamerans', 'kode_pameran')->ignore($jenisPameran),
            ],
            'jenis_pameran' => ['required', 'string', 'max:255'],
            'icon_map' => ['nullable', 'file', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'remove_icon_map' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'kode_pameran' => 'kode pameran',
            'jenis_pameran' => 'jenis pameran',
            'icon_map' => 'icon map',
        ];
    }
}
