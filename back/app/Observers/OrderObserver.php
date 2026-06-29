<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Recipe;
use App\Models\Ingredient;
use App\Traits\UpdatesProductStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    use UpdatesProductStock;

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        if ($order->isDirty('status')) {
            $oldStatus = $order->getOriginal('status');
            $newStatus = $order->status;

            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                Log::info("Order #{$order->id} status updated to cancelled. Restoring ingredients.");
                $this->restoreIngredients($order);
            } elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                Log::info("Order #{$order->id} status reverted from cancelled. Deducting ingredients.");
                $this->deductIngredients($order);
            }
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        if ($order->status !== 'cancelled') {
            Log::info("Order #{$order->id} deleted while not in cancelled status. Restoring ingredients.");
            $this->restoreIngredients($order);
        }
    }

    private function restoreIngredients(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->loadMissing('orderItems');

            foreach ($order->orderItems as $orderItem) {
                $recipes = Recipe::where('product_id', $orderItem->product_id)->get();
                
                foreach ($recipes as $recipe) {
                    $ingredient = Ingredient::find($recipe->ingredient_id);
                    if ($ingredient) {
                        $restoreAmount = $recipe->amount * $orderItem->quantity;
                        $ingredient->quantity += $restoreAmount;
                        $ingredient->save();

                        $this->updateProductsStockUsingIngredient($ingredient->id);
                    }
                }
            }
        });
    }

    private function deductIngredients(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->loadMissing('orderItems');

            foreach ($order->orderItems as $orderItem) {
                $recipes = Recipe::where('product_id', $orderItem->product_id)->get();
                
                foreach ($recipes as $recipe) {
                    $ingredient = Ingredient::find($recipe->ingredient_id);
                    if ($ingredient) {
                        $deductAmount = $recipe->amount * $orderItem->quantity;
                        $ingredient->quantity -= $deductAmount;
                        $ingredient->save();

                        $this->updateProductsStockUsingIngredient($ingredient->id);
                    }
                }
            }
        });
    }
}
