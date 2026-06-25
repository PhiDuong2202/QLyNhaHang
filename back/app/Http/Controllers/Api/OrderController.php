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

        // Xử lý tranh chấp đặt bàn (Conflict handling)
        if ($orderType !== 'take_away' && !empty($data['table_id'])) {
            $table = Table::find($data['table_id']);
            if ($table) {
                $activeOrderExists = Order::where('table_id', $table->id)
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->exists();

                if ($activeOrderExists || in_array($table->status, ['occupied', 'reserved'])) {
                    return response()->json([
                        'message' => "Bàn {$table->name} đã có khách hoặc đang được đặt chỗ bởi nhân viên khác. Vui lòng chọn bàn khác."
                    ], 409);
                }
            }
        }

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
            'payment_method' => 'nullable|string',
        ]);

        // Kiểm tra tranh chấp khi chuyển bàn (Conflict handling for moving table)
        if (isset($data['table_id']) && $data['table_id'] != $order->table_id) {
            $newTable = Table::find($data['table_id']);
            if ($newTable) {
                $activeOrderExists = Order::where('table_id', $newTable->id)
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->exists();

                if ($activeOrderExists || in_array($newTable->status, ['occupied', 'reserved'])) {
                    return response()->json([
                        'message' => "Bàn {$newTable->name} đã có khách hoặc đang được phục vụ. Không thể chuyển sang bàn này."
                    ], 409);
                }
            }
        }

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

        if ($oldStatus !== 'completed' && $order->status === 'completed' && $order->total_price > 0) {
            Payment::create([
                'order_id' => $order->id,
                'method' => request('payment_method', 'cash'),
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
