<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PameranStoreRequest extends FormRequest
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
        return [
            'dealer_id' => ['required', 'exists:dealers,id'],
            'jenis_pameran_id' => ['required', 'exists:jenis_pamerans,id'],
            'mulai_tanggal_sewa' => ['required', 'date'],
            'tanggal_sewa_berakhir' => ['required', 'date', 'after_or_equal:mulai_tanggal_sewa'],
            'kecamatan' => ['required', 'string', 'max:100'],
            'detail_alamat' => ['required', 'string', 'max:1000'],
            'kode_pameran_ahm' => ['nullable', 'string', 'max:50'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
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
            'dealer_id' => 'nama dealer',
            'jenis_pameran_id' => 'jenis pameran',
            'mulai_tanggal_sewa' => 'mulai tanggal sewa',
            'tanggal_sewa_berakhir' => 'tanggal sewa berakhir',
            'kecamatan' => 'kecamatan',
            'detail_alamat' => 'detail alamat',
            'kode_pameran_ahm' => 'kode pameran AHM',
        ];
    }
}
