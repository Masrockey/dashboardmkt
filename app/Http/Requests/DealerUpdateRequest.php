<?php

namespace App\Http\Requests;

use App\Models\Dealer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DealerUpdateRequest extends FormRequest
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
        /** @var Dealer $dealer */
        $dealer = $this->route('dealer');

        return [
            'kode_dealer' => [
                'required',
                'string',
                'max:50',
                Rule::unique('dealers', 'kode_dealer')->ignore($dealer),
            ],
            'nama_dealer' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
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
            'kode_dealer' => 'kode dealer',
            'nama_dealer' => 'nama dealer',
            'category_id' => 'kategori',
        ];
    }
}
