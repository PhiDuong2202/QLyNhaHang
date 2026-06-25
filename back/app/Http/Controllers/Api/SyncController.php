<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /**
     * Get consolidated data for real-time synchronization.
     */
    public function sync()
    {
        $tables = Table::orderBy('sort_order')->orderBy('id')->get();
        
        // Load active orders in the restaurant (pending, processing, and not completed/cancelled)
        $activeOrders = Order::with(['orderItems.product', 'table', 'customer'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->get();
            
        // Load all products to check stock status changes
        $products = Product::with('images')->get();

        return response()->json([
            'tables' => $tables,
            'orders' => $activeOrders,
            'products' => $products,
        ]);
    }
}
