<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    /**
     * Display a listing of the ingredients.
     */
    public function index()
    {
        return Ingredient::orderBy('name')->get();
    }

    /**
     * Store a newly created ingredient in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'quantity' => 'nullable|numeric|min:0',
            'min_quantity' => 'nullable|numeric|min:0',
        ]);

        return Ingredient::create($data);
    }

    /**
     * Update the specified ingredient in storage.
     */
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'quantity' => 'sometimes|required|numeric|min:0',
            'min_quantity' => 'sometimes|required|numeric|min:0',
        ]);

        $ingredient->update($data);

        // Recheck and update availability of all products that use this ingredient
        $observer = new \App\Observers\OrderItemObserver();
        $observer->updateProductsStockUsingIngredient($ingredient->id);

        return $ingredient;
    }

    /**
     * Remove the specified ingredient from storage.
     */
    public function destroy($id)
    {
        Ingredient::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Import stock for an ingredient (increase quantity).
     */
    public function importStock(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.001',
        ]);

        $ingredient->quantity += $data['amount'];
        $ingredient->save();

        // Recheck and update availability of all products that use this ingredient
        $observer = new \App\Observers\OrderItemObserver();
        $observer->updateProductsStockUsingIngredient($ingredient->id);

        return $ingredient;
    }
}
