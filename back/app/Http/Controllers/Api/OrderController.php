<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Table;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index()
    {
        // load kèm thông tin bàn, khách và các món trong đơn
        return Order::with(['orderItems.product', 'table', 'customer'])->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'table_id' => 'required_unless:order_type,take_away|nullable|integer|exists:tables,id',
            'customer_id' => 'nullable|integer',
            'status' => 'nullable|string',
            'total_price' => 'nullable|numeric',
            'order_type' => 'nullable|string|in:dine_in,take_away,preorder',
        ]);

        $orderType = $data['order_type'] ?? 'dine_in';

        $order = Order::create([
            'table_id' => $orderType === 'take_away' ? null : ($data['table_id'] ?? null),
            'user_id' => Auth::id(),
            'customer_id' => $data['customer_id'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'total_price' => $data['total_price'] ?? 0,
            'order_type' => $orderType,
        ]);

        // cập nhật trạng thái bàn khi tạo đơn
        $table = Table::find($order->table_id);
        if ($table) {
            if (($order->order_type ?? 'dine_in') === 'dine_in') {
                $table->status = 'occupied';
            } elseif ($order->order_type === 'preorder') {
                $table->status = 'reserved';
            }
            $table->save();
        }

        return $order;
    }

    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $oldStatus = $order->status;

        $data = $request->validate([
            'table_id' => 'nullable|integer|exists:tables,id',
            'customer_id' => 'nullable|integer',
            'status' => 'nullable|string',
            'total_price' => 'nullable|numeric',
            'order_type' => 'nullable|string|in:dine_in,take_away,preorder',
        ]);

        $order->update($data);

        // cập nhật trạng thái bàn nếu có truyền table_id hoặc status/order_type đổi
        if ($order->table_id) {
            $table = Table::find($order->table_id);
            if ($table) {
                if (in_array($order->status, ['completed', 'cancelled'])) {
                    // đơn xong / huỷ => bàn trống
                    $table->status = 'available';
                } else {
                    if (($order->order_type ?? 'dine_in') === 'dine_in') {
                        $table->status = 'occupied';
                    } elseif ($order->order_type === 'preorder') {
                        $table->status = 'reserved';
                    }
                }
                $table->save();
            }
        }

        // nếu chuyển sang completed lần đầu => tạo bản ghi doanh thu (payment)
        if ($oldStatus !== 'completed' && $order->status === 'completed' && $order->total_price > 0) {
            Payment::create([
                'order_id' => $order->id,
                'method' => 'cash',
                'amount' => $order->total_price,
            ]);
        }

        return $order;
    }

    public function destroy($id)
    {
        Order::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
