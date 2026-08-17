<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['admin', 'reviewer', 'associate'] as $role) {
            Role::query()->firstOrCreate(['name' => $role]);
        }
    }
}
