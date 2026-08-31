<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class InitialAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) env('FONASIN_ADMIN_EMAIL', ''));
        $password = (string) env('FONASIN_ADMIN_PASSWORD', '');
        $documentType = trim((string) env('FONASIN_ADMIN_DOCUMENT_TYPE', ''));
        $documentNumber = strtoupper(trim((string) env('FONASIN_ADMIN_DOCUMENT_NUMBER', '')));

        if ($email === '' || $password === '') {
            return;
        }

        $adminRole = Role::query()->firstOrCreate(['name' => 'admin']);

        $attributes = [
            'password' => $password,
            'must_change_password' => false,
            'status' => 'active',
        ];

        if ($documentType !== '' && $documentNumber !== '') {
            $attributes['document_type'] = $documentType;
            $attributes['document_number_hash'] = hash('sha256', $documentNumber);
            $attributes['document_number_encrypted'] = Crypt::encryptString($documentNumber);
        }

        $user = User::query()->updateOrCreate(['email' => strtolower($email)], $attributes);

        $user->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
