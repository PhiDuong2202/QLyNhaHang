<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImageUploadService
{
    /**
     * Upload an image to Supabase Storage and return the public URL.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string
     * @throws \Exception
     */
    public static function upload($file)
    {
        $supabaseKey = env('SUPABASE_KEY');
        $projectRef = env('SUPABASE_PROJECT_REF', 'zvxwhbrvbduoixenqkhl');
        $bucket = env('SUPABASE_BUCKET', 'products');

        if (!$supabaseKey) {
            throw new \Exception('Chưa cấu hình SUPABASE_KEY trong file .env hoặc Render Dashboard.');
        }

        // Tạo tên file ngẫu nhiên để tránh trùng lặp
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

        $url = "https://{$projectRef}.supabase.co/storage/v1/object/{$bucket}/{$filename}";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $supabaseKey,
            'Content-Type' => $file->getMimeType(),
        ])->withBody(
            file_get_contents($file->getRealPath()), $file->getMimeType()
        )->post($url);

        if (!$response->successful()) {
            throw new \Exception('Upload ảnh lên Supabase Storage thất bại: ' . $response->body());
        }

        // Trả về link CDN công khai của ảnh
        return "https://{$projectRef}.supabase.co/storage/v1/object/public/{$bucket}/{$filename}";
    }
}
