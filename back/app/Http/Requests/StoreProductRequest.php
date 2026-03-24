<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Product;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules()
    {
        return [
            'name' => 'required|max:200',
            'price' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
            'category_id' => 'required|exists:categories,id',
            'status' => 'required'
        ];
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? 1;
        return Product::create($data);
    }
}
