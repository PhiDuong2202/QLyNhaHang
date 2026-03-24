<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;

class PaymentController extends Controller
{
    public function index()
    {
        return Payment::with('order')->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required',
            'method' => 'required',
            'amount' => 'required|numeric'
        ]);

        return Payment::create([
            ...$data,
            'status' => 'paid'
        ]);
    }
}
