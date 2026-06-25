<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = [
        'name', 'unit', 'quantity', 'min_quantity'
    ];

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }
}
