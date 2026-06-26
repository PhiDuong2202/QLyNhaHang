<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageUploadService;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category', 'images', 'reviews');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return $query->get();
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();

        // tạo sản phẩm trước (không lưu field image vì dùng bảng product_images)
        $product = Product::create([
            'name' => $data['name'],
            'price' => $data['price'],
            'category_id' => $data['category_id'],
            'status' => $data['status'] ?? 1,
            'description' => $data['description'] ?? null,
        ]);

        // nếu có ảnh kèm theo thì xử lý và lưu vào bảng product_images
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $uploadedFileUrl = ImageUploadService::upload($file);
 
            $product->images()->create([
                'image_url' => $uploadedFileUrl,
            ]);
        }

        return $product->load('category', 'images');
    }

    public function show($id)
    {
        return Product::with('category', 'images', 'reviews')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // cập nhật các field cơ bản (trừ image)
        $data = $request->all();
        unset($data['image']);
        $product->update($data);

        // nếu có ảnh mới, xử lý giống ProductImageController
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpg,jpeg,png|max:2048',
            ]);
 
            $file = $request->file('image');
            $uploadedFileUrl = ImageUploadService::upload($file);
 
            // nếu đã có ảnh thì cập nhật ảnh đầu tiên, không thì tạo mới
            $productImage = $product->images()->first();
 
            if ($productImage) {
                $productImage->update([
                    'image_url' => $uploadedFileUrl,
                ]);
            } else {
                $product->images()->create([
                    'image_url' => $uploadedFileUrl,
                ]);
            }
        }

        return $product->load('category', 'images');
    }

    public function destroy($id)
    {
        Product::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
