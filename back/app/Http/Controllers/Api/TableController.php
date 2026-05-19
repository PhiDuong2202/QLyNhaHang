<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Table;

class TableController extends Controller
{
    public function index()
    {
        return Table::orderBy('sort_order')->orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'status' => 'required',
            'seats' => 'nullable|integer|min:1',
            'sort_order' => 'nullable|integer',
        ]);

        return Table::create(array_merge(['sort_order' => 0], $data));
    }

    public function update(Request $request, $id)
    {
        $table = Table::findOrFail($id);
        $table->update($request->all());
        return $table;
    }
}
