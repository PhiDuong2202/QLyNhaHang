<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;

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
        $base64 = 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));

        $productImage = ProductImage::create([
            'product_id' => $data['product_id'],
            'image_url' => $base64
        ]);

        return response()->json([
            'message' => 'Upload thành công',
            'data' => $productImage,
            'url' => $base64
        ]);
    }

    // ================= UPDATE =================
    public function update(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        $productImage = ProductImage::findOrFail($id);

        $file = $request->file('image');
        $base64 = 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));

        $productImage->update([
            'image_url' => $base64
        ]);

        return response()->json([
            'message' => 'Cập nhật thành công',
            'data' => $productImage,
            'url' => $base64
        ]);
    }
}
