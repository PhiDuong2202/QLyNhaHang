<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'Admin')->first();

        User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('123456'),
                'role_id' => $adminRole ? $adminRole->id : 1,
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@admin.com'],
            [
                'name' => 'Staff',
                'password' => Hash::make('123456'),
                'role_id' => $adminRole ? $adminRole->id : 2,
            ]
        );
    }
}
