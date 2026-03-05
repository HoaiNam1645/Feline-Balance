<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MediaTransactionService;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Exception;

class MediaTransactionController extends Controller
{
    protected MediaTransactionService $service;

    public function __construct(MediaTransactionService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['team_id', 'expense_type', 'bank', 'status', 'search', 'year', 'month', 'page', 'per_page']);
            $result = $this->service->getMediaTransactions($filters);

            return response()->json([
                'code'       => HttpCode::SUCCESS,
                'status'     => true,
                'success'    => true,
                'message'    => 'Media transactions fetched successfully.',
                'data'       => $result['data'],
                'pagination' => $result['pagination'],
                'summary'    => $result['summary'],
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->all();

            // Handle image upload to B2
            if ($request->hasFile('image_file')) {
                $file = $request->file('image_file');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = "image_media/{$filename}";
                Storage::disk('b2')->put($path, file_get_contents($file), 'public');
                $data['image'] = Storage::disk('b2')->url($path);
                unset($data['image_file']);
            }

            $record = $this->service->createMediaTransaction($data);

            return response()->json([
                'code'    => HttpCode::CREATED,
                'status'  => true,
                'success' => true,
                'message' => 'Media transaction created successfully.',
                'data'    => $record,
            ], HttpCode::CREATED);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $data = $request->all();

            // Handle image upload to B2
            if ($request->hasFile('image_file')) {
                $file = $request->file('image_file');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = "image_media/{$filename}";
                Storage::disk('b2')->put($path, file_get_contents($file), 'public');
                $data['image'] = Storage::disk('b2')->url($path);
                unset($data['image_file']);
            }

            $record = $this->service->updateMediaTransaction($id, $data);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => 'Media transaction updated successfully.',
                'data'    => $record,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $code = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $code,
                'status'  => false,
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deleteMediaTransaction($id);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => 'Media transaction deleted successfully.',
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $code = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $code,
                'status'  => false,
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    /**
     * Upload image to B2 (standalone endpoint).
     */
    public function uploadImage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
            ]);

            $file = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = "image_media/{$filename}";

            Storage::disk('b2')->put($path, file_get_contents($file), 'public');
            $url = Storage::disk('b2')->url($path);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Image uploaded successfully.',
                'data'    => ['url' => $url, 'path' => $path],
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
