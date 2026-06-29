<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Role;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cancelling_order_restores_ingredients()
    {
        // 1. Setup Role and User
        $role = Role::create(['id' => 1, 'name' => 'Admin']);
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'test@admin.com',
            'password' => bcrypt('password'),
            'role_id' => $role->id,
        ]);

        // 2. Setup Category and Product
        $category = Category::create(['name' => 'Test Category']);
        $product = Product::create([
            'name' => 'Test Dish',
            'price' => 50000,
            'category_id' => $category->id,
            'status' => 1,
        ]);

        // 3. Setup Ingredient and Recipe
        $ingredient = Ingredient::create([
            'name' => 'Test Ingredient',
            'quantity' => 10.0, // 10 units in stock
            'unit' => 'kg',
            'min_quantity' => 1.0,
        ]);

        $recipe = Recipe::create([
            'product_id' => $product->id,
            'ingredient_id' => $ingredient->id,
            'amount' => 0.5, // requires 0.5 units per dish
        ]);

        // 4. Setup Table
        $table = Table::create([
            'name' => 'Table 1',
            'status' => 'available',
        ]);

        // 5. Create Order
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'total_price' => 50000,
            'order_type' => 'dine_in',
        ]);

        // 6. Create OrderItem (triggers OrderItemObserver)
        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2, // 2 dishes * 0.5 = 1 unit required
            'price' => 50000,
        ]);

        // Assert ingredients were deducted
        $ingredient->refresh();
        $this->assertEquals(9.0, (float)$ingredient->quantity);

        // 7. Update Order status to 'cancelled' (triggers OrderObserver)
        $order->status = 'cancelled';
        $order->save();

        // Assert ingredients were restored
        $ingredient->refresh();
        $this->assertEquals(10.0, (float)$ingredient->quantity);

        // 8. Revert Order status back to 'pending' (triggers OrderObserver)
        $order->status = 'pending';
        $order->save();

        // Assert ingredients were deducted again
        $ingredient->refresh();
        $this->assertEquals(9.0, (float)$ingredient->quantity);

        // 9. Delete the Order (triggers OrderObserver)
        $order->delete();

        // Assert ingredients were restored
        $ingredient->refresh();
        $this->assertEquals(10.0, (float)$ingredient->quantity);
    }
}
