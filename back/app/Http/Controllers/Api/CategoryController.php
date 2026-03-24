<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Product;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|max:150',
            'description' => 'nullable'
        ]);

        return Category::create($data);
    }

    public function show($id)
    {
        return Category::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|max:150',
            'description' => 'nullable'
        ]);

        $category->update($data);
        return $category;
    }

    public function destroy($id)
    {
        Category::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
