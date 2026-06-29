<?php

namespace App\Traits;

use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Support\Facades\Log;

trait UpdatesProductStock
{
    /**
     * Helper to update stock availability status for all products using a specific ingredient.
     */
    public function updateProductsStockUsingIngredient(int $ingredientId): void
    {
        // Find all products that use this ingredient
        $productIds = Recipe::where('ingredient_id', $ingredientId)->pluck('product_id')->unique();

        foreach ($productIds as $productId) {
            $this->checkProductStockStatus($productId);
        }
    }

    /**
     * Check if a product has enough ingredients in stock and update its status.
     */
    public function checkProductStockStatus(int $productId): void
    {
        $product = Product::find($productId);
        if (!$product) {
            return;
        }

        $recipes = Recipe::with('ingredient')->where('product_id', $productId)->get();
        if ($recipes->isEmpty()) {
            return; // No recipe, meaning unlimited/manual stock
        }

        $isAvailable = true;
        foreach ($recipes as $recipe) {
            if (!$recipe->ingredient || $recipe->ingredient->quantity < $recipe->amount) {
                $isAvailable = false;
                break;
            }
        }

        $newStatus = $isAvailable ? 1 : 0; // 1 = available, 0 = out of stock

        if ((int)$product->status !== $newStatus) {
            $product->status = $newStatus;
            $product->save();
            
            Log::info("Product status auto-updated by inventory check", [
                'product_id' => $productId,
                'product_name' => $product->name,
                'new_status' => $newStatus
            ]);
        }
    }
}
