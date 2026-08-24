<?php

namespace App\Http\Requests\Associates;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssociateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', Rule::in(['CC', 'CE', 'Pasaporte', 'TI'])],
            'document_number' => ['required', 'string', 'min:3', 'max:16'],
            'full_name' => ['required', 'string', 'min:3', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['nullable', 'string', 'min:8', 'max:128'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
        ];
    }
}
