<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePublicContentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'kind' => [Rule::requiredIf($this->isMethod('post')), Rule::in(['news', 'social_balance', 'agreement', 'banner'])],
            'title' => [Rule::requiredIf($this->isMethod('post')), 'sometimes', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:3000'],
            'category' => [Rule::requiredIf($this->input('kind') === 'agreement'), 'nullable', Rule::in(['Salud y bienestar', 'Funerarios', 'Turismo', 'Servicios vehiculares'])],
            'link_url' => ['nullable', 'url', 'regex:/^https:\/\//i', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'published' => ['sometimes', 'boolean'],
        ];
    }
}
