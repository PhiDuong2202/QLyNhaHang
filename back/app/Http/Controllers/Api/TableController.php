<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Table;

class TableController extends Controller
{
    public function index()
    {
        return Table::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'status' => 'required'
        ]);

        return Table::create($data);
    }

    public function update(Request $request, $id)
    {
        $table = Table::findOrFail($id);
        $table->update($request->all());
        return $table;
    }
}
