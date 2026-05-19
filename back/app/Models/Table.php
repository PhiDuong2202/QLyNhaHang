<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $fillable = ['name','seats','status','sort_order'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
