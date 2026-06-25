<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\Product;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * Display a listing of the recipes, grouped by products.
     */
    public function index()
    {
        // Return products with their recipes and ingredients
        return Product::with('recipes.ingredient')->orderBy('name')->get();
    }

    /**
     * Store or update a recipe item (single ingredient in a recipe).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'ingredient_id' => 'required|integer|exists:ingredients,id',
            'amount' => 'required|numeric|min:0.001',
        ]);

        $recipe = Recipe::updateOrCreate(
            ['product_id' => $data['product_id'], 'ingredient_id' => $data['ingredient_id']],
            ['amount' => $data['amount']]
        );

        // Update product stock status based on the new recipe
        $observer = new \App\Observers\OrderItemObserver();
        $observer->checkProductStockStatus($recipe->product_id);

        return $recipe->load('ingredient');
    }

    /**
     * Remove an ingredient from a product's recipe.
     */
    public function destroy($id)
    {
        $recipe = Recipe::findOrFail($id);
        $productId = $recipe->product_id;
        $recipe->delete();

        // Recheck and update product stock status
        $observer = new \App\Observers\OrderItemObserver();
        $observer->checkProductStockStatus($productId);

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Bulk sync recipes for a product.
     */
    public function sync(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        
        $request->validate([
            'ingredients' => 'present|array',
            'ingredients.*.ingredient_id' => 'required|integer|exists:ingredients,id',
            'ingredients.*.amount' => 'required|numeric|min:0.001',
        ]);

        $ingredientIds = [];
        
        foreach ($request->input('ingredients') as $item) {
            $recipe = Recipe::updateOrCreate(
                ['product_id' => $productId, 'ingredient_id' => $item['ingredient_id']],
                ['amount' => $item['amount']]
            );
            $ingredientIds[] = $item['ingredient_id'];
        }

        // Delete any ingredients that were not in the sync list
        Recipe::where('product_id', $productId)
            ->whereNotIn('ingredient_id', $ingredientIds)
            ->delete();

        // Recheck and update product stock status
        $observer = new \App\Observers\OrderItemObserver();
        $observer->checkProductStockStatus($productId);

        return $product->load('recipes.ingredient');
    }
}
