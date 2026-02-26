<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'super_admin')->first();

        if (!$superAdminRole) {
            $superAdminRole = Role::create([
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
            ]);
        }

        User::updateOrCreate(
            ['email' => 'admin@feline.com'],
            [
                'name' => 'Super Admin',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role_id' => $superAdminRole->id,
                'is_active' => true,
            ]
        );

        $this->command->info('Super Admin created: admin@feline.com / admin / password');
    }
}
