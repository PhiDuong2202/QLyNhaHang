<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\OrderItem;
use App\Models\Product;

class OrderItemController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required',
            'product_id' => 'required',
            'quantity' => 'required|numeric'
        ]);

        $product = Product::findOrFail($data['product_id']);

        return OrderItem::create([
            'order_id' => $data['order_id'],
            'product_id' => $data['product_id'],
            'quantity' => $data['quantity'],
            'price' => $product->price
        ]);
    }
}
