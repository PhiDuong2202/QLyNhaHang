<?php

namespace App\Observers;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Ingredient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Traits\UpdatesProductStock;

class OrderItemObserver
{
    use UpdatesProductStock;

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
            // Check if the order is already cancelled. If it is cancelled, the ingredients are already restored.
            $order = $orderItem->order;
            if ($order && $order->status === 'cancelled') {
                return;
            }

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
}
