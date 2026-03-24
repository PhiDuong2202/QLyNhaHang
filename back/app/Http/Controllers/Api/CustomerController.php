<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function index()
    {
        return Customer::latest()->get();
    }

    public function show($id)
    {
        return Customer::findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:30'
        ]);

        return Customer::create($data);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:30'
        ]);

        $customer->update($data);
        return $customer;
    }

    public function destroy($id)
    {
        Customer::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
