<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Constants\HttpCode;
use Illuminate\Support\Facades\Storage;
use Exception;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240', // 10MB max
            ]);

            if ($request->file('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

                $path = "image_topup/{$filename}";

                // Store to B2
                Storage::disk('b2')->put($path, file_get_contents($file), 'public');

                // Get URL from B2
                $url = Storage::disk('b2')->url($path);

                return response()->json([
                    'code'    => HttpCode::SUCCESS,
                    'success' => true,
                    'message' => 'Image uploaded successfully.',
                    'data'    => [
                        'url' => $url,
                        'path' => $path
                    ],
                ], HttpCode::SUCCESS);
            }

            return response()->json([
                'code'    => HttpCode::BAD_REQUEST,
                'success' => false,
                'message' => 'No image uploaded.',
            ], HttpCode::BAD_REQUEST);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
