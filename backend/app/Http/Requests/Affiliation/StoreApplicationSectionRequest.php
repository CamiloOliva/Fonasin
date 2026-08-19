<?php

namespace App\Http\Requests\Affiliation;

use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'section' => $this->route('section'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'section' => ['required', Rule::in(array_map(
                fn (AffiliationApplicationStep $section): string => $section->value,
                AffiliationApplicationStep::formSections(),
            ))],
            'schema_version' => ['required', 'integer', 'min:1'],
            'data' => ['required', 'array'],
            'completed' => ['sometimes', 'boolean'],
        ];
    }
}
