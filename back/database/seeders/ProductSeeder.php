<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    Product::insert([
        [
            'name'=>'Cơm gà',
            'price'=>35000,
            'category_id'=>1,
            'status'=>'available'
        ],
        [
            'name'=>'Trà sữa',
            'price'=>25000,
            'category_id'=>2,
            'status'=>'available'
        ],
        [
            'name'=>'Bánh flan',
            'price'=>15000,
            'category_id'=>3,
            'status'=>'available'
        ],
    ]);
}
}
