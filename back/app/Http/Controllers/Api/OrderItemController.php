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

    public function update(Request $request, $id)
    {
        $orderItem = OrderItem::findOrFail($id);

        $data = $request->validate([
            'quantity' => 'required|numeric|min:1'
        ]);

        $orderItem->update($data);
        return $orderItem;
    }

    public function destroy($id)
    {
        $orderItem = OrderItem::findOrFail($id);
        $orderItem->delete();
        return response()->noContent();
    }
}
