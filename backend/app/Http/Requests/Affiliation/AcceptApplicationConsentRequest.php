<?php

namespace App\Http\Requests\Affiliation;

use App\Domain\Affiliation\Enums\ConsentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AcceptApplicationConsentRequest extends FormRequest
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
            'consent_type' => ['required', Rule::enum(ConsentType::class)],
            'policy_version' => ['required', 'string', 'max:50'],
        ];
    }
}
