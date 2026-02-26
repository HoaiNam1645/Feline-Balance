<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vendors = [
            ['name' => 'Gearment', 'description' => 'Gearment Fulfillment'],
            ['name' => 'Pressify', 'description' => ''],
            ['name' => 'Printify', 'description' => ''],
            ['name' => 'Merchize', 'description' => ''],
            ['name' => 'Lemiex', 'description' => 'Lemiex Fulfillment'],
            ['name' => 'MKP', 'description' => ''],
        ];

        foreach ($vendors as $vendor) {
            \App\Models\Vendor::firstOrCreate(['name' => $vendor['name']], $vendor);
        }
    }
}
