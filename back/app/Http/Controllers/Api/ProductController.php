<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category', 'images');

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

            $manager = new ImageManager(new Driver());
            $img = $manager->read($file)->scale(width: 500);

            $filename = uniqid() . '.jpg';
            $path = 'products/' . $filename;

            Storage::disk('public')->put($path, (string) $img->toJpeg(80));

            $product->images()->create([
                'image_url' => $path,
            ]);
        }

        return $product->load('category', 'images');
    }

    public function show($id)
    {
        return Product::with('category', 'images')->findOrFail($id);
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

            $manager = new ImageManager(new Driver());
            $img = $manager->read($file)->scale(width: 500);

            $filename = uniqid() . '.jpg';
            $path = 'products/' . $filename;

            Storage::disk('public')->put($path, (string) $img->toJpeg(80));

            // nếu đã có ảnh thì cập nhật ảnh đầu tiên, không thì tạo mới
            $productImage = $product->images()->first();

            if ($productImage) {
                if ($productImage->image_url && Storage::disk('public')->exists($productImage->image_url)) {
                    Storage::disk('public')->delete($productImage->image_url);
                }

                $productImage->update([
                    'image_url' => $path,
                ]);
            } else {
                $product->images()->create([
                    'image_url' => $path,
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
