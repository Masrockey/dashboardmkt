<?php

namespace App\Http\Requests;

use App\Enums\BillboardLampStatus;
use App\Enums\BillboardPhysicalStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BillboardStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasPermission('promosi.atl.billboard.write');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $photoRule = ['nullable', 'file', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'];

        return [
            'lokasi' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'ukuran' => ['required', 'string', 'max:100'],
            'tanggal_pasang' => ['required', 'date'],
            'tanggal_berakhir' => ['nullable', 'date', 'after_or_equal:tanggal_pasang'],
            'status_lampu' => ['required', Rule::enum(BillboardLampStatus::class)],
            'status_fisik' => ['required', Rule::enum(BillboardPhysicalStatus::class)],
            'foto_siang' => $photoRule,
            'foto_malam' => $photoRule,
            'foto_jarak_jauh' => $photoRule,
            'foto_jarak_dekat' => $photoRule,
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
            'tanggal_pasang' => 'tanggal pasang',
            'tanggal_berakhir' => 'tanggal berakhir',
            'status_lampu' => 'status lampu',
            'status_fisik' => 'status fisik',
            'foto_siang' => 'foto siang hari',
            'foto_malam' => 'foto malam hari',
            'foto_jarak_jauh' => 'foto jarak jauh',
            'foto_jarak_dekat' => 'foto jarak dekat',
        ];
    }
}
