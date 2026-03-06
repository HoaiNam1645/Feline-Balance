<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramService;
use App\Models\MediaTransaction;
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

    /**
     * Resend pending media transactions to Telegram.
     * type=detail → resend each pending record individually
     * type=summary → send a single summary message with totals
     */
    public function resendPending(Request $request): JsonResponse
    {
        $type = $request->input('type', 'detail');

        try {
            $telegramService = app(TelegramService::class);

            if ($type === 'summary') {
                // Send summary message
                $pendingCount = MediaTransaction::where('status', 'pending')->whereNull('deleted_at')->count();
                $pendingAmount = MediaTransaction::where('status', 'pending')->whereNull('deleted_at')->sum('amount');
                $completeCount = MediaTransaction::where('status', 'complete')->whereNull('deleted_at')->count();
                $completeAmount = MediaTransaction::where('status', 'complete')->whereNull('deleted_at')->sum('amount');
                $totalCount = $pendingCount + $completeCount;
                $totalAmount = $pendingAmount + $completeAmount;

                $fmtPending = number_format((float) $pendingAmount, 0, ',', '.') . ' VND';
                $fmtComplete = number_format((float) $completeAmount, 0, ',', '.') . ' VND';
                $fmtTotal = number_format((float) $totalAmount, 0, ',', '.') . ' VND';

                $telegramService->sendSummaryMessage($pendingCount, $fmtPending, $completeCount, $fmtComplete, $totalCount, $fmtTotal);

                return response()->json([
                    'success' => true,
                    'message' => 'Summary sent to Telegram.',
                ]);
            }

            // Default: detail — resend each pending record
            $pendings = MediaTransaction::where('status', 'pending')
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            if ($pendings->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No pending transactions to resend.',
                    'sent' => 0,
                ]);
            }

            $sent = 0;
            $failed = 0;

            foreach ($pendings as $record) {
                try {
                    $telegramService->sendMediaTransactionNotification($record, 'Resend');
                    $sent++;
                    usleep(500000);
                } catch (\Exception $e) {
                    $failed++;
                    Log::error("Resend failed for MT #{$record->id}", ['error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Resent {$sent} pending transactions to Telegram." . ($failed > 0 ? " ({$failed} failed)" : ''),
                'sent' => $sent,
                'failed' => $failed,
                'total' => $pendings->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resend failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
