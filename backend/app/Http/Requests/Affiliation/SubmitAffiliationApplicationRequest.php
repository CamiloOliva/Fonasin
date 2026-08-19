<?php

namespace App\Http\Requests\Affiliation;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAffiliationApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'policy_version' => ['required', 'string', 'max:50'],
        ];
    }
}
