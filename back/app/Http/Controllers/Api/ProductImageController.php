<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductImageController extends Controller
{
    // ================= STORE =================
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer',
            'image' => 'required|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        $file = $request->file('image');

        $manager = new ImageManager(new Driver());

        // resize nhưng giữ tỉ lệ
        $img = $manager->read($file)->scale(width: 500);

        // tránh trùng tên file
        $filename = uniqid() . '.jpg';
        $path = 'products/' . $filename;

        Storage::disk('public')->put($path, (string) $img->toJpeg(80));

        $productImage = ProductImage::create([
            'product_id' => $data['product_id'],
            'image_url' => $path
        ]);

        return response()->json([
            'message' => 'Upload thành công',
            'data' => $productImage,
            'url' => asset('storage/' . $path)
        ]);
    }

    // ================= UPDATE =================
    public function update(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        $productImage = ProductImage::findOrFail($id);

        // XÓA ẢNH CŨ
        if ($productImage->image_url && Storage::disk('public')->exists($productImage->image_url)) {
            Storage::disk('public')->delete($productImage->image_url);
        }

        $file = $request->file('image');

        $manager = new ImageManager(new Driver());
        $img = $manager->read($file)->scale(width: 500);

        $filename = uniqid() . '.jpg';
        $path = 'products/' . $filename;

        Storage::disk('public')->put($path, (string) $img->toJpeg(80));

        $productImage->update([
            'image_url' => $path
        ]);

        return response()->json([
            'message' => 'Cập nhật thành công',
            'data' => $productImage,
            'url' => asset('storage/' . $path)
        ]);
    }
}
