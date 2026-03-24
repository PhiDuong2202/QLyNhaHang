<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    Customer::insert([
        ['name'=>'Khách lẻ','phone'=>''],
        ['name'=>'Nguyễn Văn A','phone'=>'0900000001'],
    ]);
}
}
