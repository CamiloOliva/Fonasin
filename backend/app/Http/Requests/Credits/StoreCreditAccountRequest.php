<?php

namespace App\Http\Requests\Credits;

use App\Domain\Credits\Enums\CreditLine;
use App\Rules\ExactDecimal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCreditAccountRequest extends FormRequest
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
            'associate_id' => ['required', 'uuid', 'exists:associates,id'],
            'credit_line' => ['required', 'string', Rule::enum(CreditLine::class)],
            'initial_balance' => ['bail', 'required', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'current_balance' => ['bail', 'required', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'last_payment_date' => ['bail', 'nullable', 'date_format:Y-m-d', 'after_or_equal:1000-01-01', 'before_or_equal:9999-12-31'],
            'term_months' => ['required', 'integer', 'between:1,60'],
            'interest_rate' => ['bail', 'required', new ExactDecimal(3, 4), 'numeric', 'between:0,100'],
            'interest_rate_nominal_annual' => ['bail', 'nullable', new ExactDecimal(3, 4), 'numeric', 'between:0,100'],
            'installment_amount' => ['bail', 'required', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
