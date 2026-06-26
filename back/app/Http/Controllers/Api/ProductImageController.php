<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageUploadService;

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
        $uploadedFileUrl = ImageUploadService::upload($file);

        $productImage = ProductImage::create([
            'product_id' => $data['product_id'],
            'image_url' => $uploadedFileUrl
        ]);

        return response()->json([
            'message' => 'Upload thành công',
            'data' => $productImage,
            'url' => $uploadedFileUrl
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
        $uploadedFileUrl = ImageUploadService::upload($file);

        $productImage->update([
            'image_url' => $uploadedFileUrl
        ]);

        return response()->json([
            'message' => 'Cập nhật thành công',
            'data' => $productImage,
            'url' => $uploadedFileUrl
        ]);
    }
}
