<?php

namespace App\Http\Requests;

use App\Models\Dealer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MeetAndGreetStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->filled('dealer_asal') && $this->filled('dealer_id')) {
            if (is_numeric($this->dealer_id)) {
                $dealer = Dealer::find($this->dealer_id);
                if ($dealer) {
                    $this->merge(['dealer_asal' => $dealer->nama_dealer]);
                }
            } else {
                $this->merge(['dealer_asal' => (string) $this->dealer_id]);
            }
        }

        if (! $this->filled('dealer_asal') && $this->user()?->isDealerOnly() && $this->user()?->dealer) {
            $this->merge(['dealer_asal' => $this->user()->dealer->nama_dealer]);
        }

        if ($this->has('dealer_id')) {
            if (is_numeric($this->dealer_id)) {
                $this->merge(['dealer_id' => (int) $this->dealer_id]);
            } else {
                $this->merge(['dealer_id' => null]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'dealer_asal' => ['required', 'string', 'max:100'],
            'dealer_id' => ['nullable', 'integer'],
            'nama_konsumen' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string', 'max:1000'],
            'no_hp' => ['required', 'string', 'max:30'],
            'tipe_motor' => ['required', 'string', 'max:100'],
            'no_plat' => ['required', 'string', 'max:30'],
            'stnk' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }

    /**
     * Custom attribute names for validation.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'dealer_id' => 'Nama Dealer Asal',
            'nama_konsumen' => 'Nama Konsumen sesuai ID',
            'alamat' => 'Alamat',
            'no_hp' => 'Nomor HP',
            'tipe_motor' => 'Tipe Motor',
            'no_plat' => 'Nomor Plat',
            'stnk' => 'File STNK',
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'stnk.required' => 'Wajib mengunggah berkas foto atau dokumen STNK.',
            'stnk.mimes' => 'Format STNK harus berupa file gambar (JPG, PNG, WEBP) atau PDF.',
            'stnk.max' => 'Ukuran berkas STNK maksimal 5 MB.',
        ];
    }
}
