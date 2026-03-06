<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    /**
     * Handle incoming webhook from Telegram.
     */
    public function handle(Request $request): JsonResponse
    {
        // Verify secret token if configured
        $secret = config('telegram.webhook_secret');
        if (!empty($secret)) {
            $headerSecret = $request->header('X-Telegram-Bot-Api-Secret-Token');
            if ($headerSecret !== $secret) {
                Log::warning('Telegram webhook: invalid secret token');
                return response()->json(['ok' => false], 403);
            }
        }

        $payload = $request->all();

        Log::info('Telegram webhook received', ['payload' => $payload]);

        // Handle callback_query (inline button clicks)
        if (isset($payload['callback_query'])) {
            try {
                $telegramService = app(TelegramService::class);
                $telegramService->handleCallbackQuery($payload['callback_query']);
            } catch (\Exception $e) {
                Log::error('Telegram webhook callback error', ['error' => $e->getMessage()]);
            }
        }

        // Telegram expects a 200 OK response
        return response()->json(['ok' => true]);
    }

    /**
     * Set webhook URL with Telegram (manual trigger).
     */
    public function setWebhook(): JsonResponse
    {
        $telegramService = app(TelegramService::class);
        $result = $telegramService->setWebhook();

        return response()->json([
            'success' => true,
            'message' => 'Webhook set',
            'data' => $result,
        ]);
    }

    /**
     * Get webhook info from Telegram.
     */
    public function webhookInfo(): JsonResponse
    {
        $telegramService = app(TelegramService::class);
        $result = $telegramService->getWebhookInfo();

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
