<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class InitialAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) env('FONASIN_ADMIN_EMAIL', ''));
        $password = (string) env('FONASIN_ADMIN_PASSWORD', '');

        if ($email === '' || $password === '') {
            return;
        }

        $adminRole = Role::query()->firstOrCreate(['name' => 'admin']);

        $user = User::query()->updateOrCreate(
            ['email' => strtolower($email)],
            [
                'password' => $password,
                'must_change_password' => false,
                'status' => 'active',
            ],
        );

        $user->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
