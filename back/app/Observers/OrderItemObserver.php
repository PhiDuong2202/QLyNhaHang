<?php

namespace App\Observers;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Ingredient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderItemObserver
{
    /**
     * Handle the OrderItem "created" event.
     */
    public function created(OrderItem $orderItem): void
    {
        DB::transaction(function () use ($orderItem) {
            $recipes = Recipe::where('product_id', $orderItem->product_id)->get();
            
            foreach ($recipes as $recipe) {
                $ingredient = Ingredient::find($recipe->ingredient_id);
                if ($ingredient) {
                    $deductAmount = $recipe->amount * $orderItem->quantity;
                    $ingredient->quantity -= $deductAmount;
                    $ingredient->save();

                    // Check and update stock status for all products using this ingredient
                    $this->updateProductsStockUsingIngredient($ingredient->id);
                }
            }
        });
    }

    /**
     * Handle the OrderItem "updated" event.
     */
    public function updated(OrderItem $orderItem): void
    {
        DB::transaction(function () use ($orderItem) {
            // Calculate quantity difference
            $oldQuantity = $orderItem->getOriginal('quantity');
            $newQuantity = $orderItem->quantity;
            $diff = $newQuantity - $oldQuantity;

            if ($diff !== 0) {
                $recipes = Recipe::where('product_id', $orderItem->product_id)->get();
                
                foreach ($recipes as $recipe) {
                    $ingredient = Ingredient::find($recipe->ingredient_id);
                    if ($ingredient) {
                        $deductAmount = $recipe->amount * $diff;
                        $ingredient->quantity -= $deductAmount;
                        $ingredient->save();

                        // Check and update stock status for all products using this ingredient
                        $this->updateProductsStockUsingIngredient($ingredient->id);
                    }
                }
            }
        });
    }

    /**
     * Handle the OrderItem "deleted" event.
     */
    public function deleted(OrderItem $orderItem): void
    {
        DB::transaction(function () use ($orderItem) {
            $recipes = Recipe::where('product_id', $orderItem->product_id)->get();
            
            foreach ($recipes as $recipe) {
                $ingredient = Ingredient::find($recipe->ingredient_id);
                if ($ingredient) {
                    // Restore stock
                    $restoreAmount = $recipe->amount * $orderItem->quantity;
                    $ingredient->quantity += $restoreAmount;
                    $ingredient->save();

                    // Check and update stock status for all products using this ingredient
                    $this->updateProductsStockUsingIngredient($ingredient->id);
                }
            }
        });
    }

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
