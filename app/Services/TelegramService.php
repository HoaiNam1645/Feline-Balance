<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\MediaTransaction;

class TelegramService
{
    protected string $botToken;
    protected string $chatId;
    protected string $apiBase;

    public function __construct()
    {
        $this->botToken = config('telegram.bot_token');
        $this->chatId = config('telegram.chat_id');
        $this->apiBase = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Send notification when a new media transaction is created.
     */
    public function sendMediaTransactionNotification(MediaTransaction $record, ?string $creatorName = null): void
    {
        if (empty($this->botToken) || empty($this->chatId)) {
            Log::warning('Telegram bot_token or chat_id not configured. Skipping notification.');
            return;
        }

        $record->load('team');

        $teamName = $record->team?->name ?? 'Company';
        $creator = $creatorName ?? 'Unknown';
        $expenseType = ucfirst($record->expense_type ?? '—');
        $amount = number_format((float) $record->amount, 0, ',', '.') . ' VND';
        $bank = $record->bank ?? '—';
        $txCode = $record->transaction_code ?? '—';
        $date = $record->transaction_date
            ? $record->transaction_date->format('d/m/Y H:i')
            : '—';
        $note = $record->note ?? '—';
        $status = strtoupper($record->status ?? 'pending');

        $text = "📢 <b>Giao dịch mới #MT-{$record->id}</b>\n"
            . "━━━━━━━━━━━━━━━\n"
            . "👤 <b>Người tạo:</b> {$creator}\n"
            . "🏢 <b>Team:</b> {$teamName}\n"
            . "📋 <b>Loại chi phí:</b> {$expenseType}\n"
            . "🏦 <b>Ngân hàng:</b> {$bank}\n"
            . "💰 <b>Số tiền:</b> <code>{$amount}</code>\n"
            . "🧾 <b>Mã GD:</b> <code>{$txCode}</code>\n"
            . "📅 <b>Ngày:</b> {$date}\n"
            . "📝 <b>Ghi chú:</b> {$note}\n"
            . "━━━━━━━━━━━━━━━\n"
            . "⏳ <b>Trạng thái:</b> {$status}";

        $inlineKeyboard = [];
        if ($status === 'PENDING') {
            $inlineKeyboard = [
                'inline_keyboard' => [
                    [
                        ['text' => '✅ Approve', 'callback_data' => "approve_media_{$record->id}"],
                        ['text' => '❌ Reject', 'callback_data' => "reject_media_{$record->id}"],
                    ]
                ]
            ];
        }

        try {
            // If there's an image, send as photo with caption
            if (!empty($record->image)) {
                $payload = [
                    'chat_id' => $this->chatId,
                    'photo' => $record->image,
                    'caption' => $text,
                    'parse_mode' => 'HTML',
                ];
                if (!empty($inlineKeyboard)) {
                    $payload['reply_markup'] = json_encode($inlineKeyboard);
                }
                $response = Http::post("{$this->apiBase}/sendPhoto", $payload);
            } else {
                $payload = [
                    'chat_id' => $this->chatId,
                    'text' => $text,
                    'parse_mode' => 'HTML',
                ];
                if (!empty($inlineKeyboard)) {
                    $payload['reply_markup'] = json_encode($inlineKeyboard);
                }
                $response = Http::post("{$this->apiBase}/sendMessage", $payload);
            }

            if (!$response->successful()) {
                Log::error('Telegram API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            } else {
                Log::info("Telegram notification sent for MediaTransaction #{$record->id}");
            }
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram notification', [
                'error' => $e->getMessage(),
                'media_transaction_id' => $record->id,
            ]);
        }
    }

    /**
     * Send a summary message with totals to Telegram.
     */
    public function sendSummaryMessage(
        int $pendingCount,
        string $pendingAmount,
        int $completeCount,
        string $completeAmount,
        int $rejectedCount,
        string $rejectedAmount,
        int $totalCount,
        string $totalAmount
    ): void {
        if (empty($this->botToken) || empty($this->chatId)) {
            Log::warning('Telegram bot_token or chat_id not configured.');
            return;
        }

        $now = now()->format('d/m/Y H:i');

        $text = "📊 <b>COST SUMMARY REPORT</b>\n"
            . "━━━━━━━━━━━━━━━\n"
            . "⏳ <b>Pending:</b> {$pendingCount} transactions — <code>{$pendingAmount}</code>\n"
            . "✅ <b>Complete:</b> {$completeCount} transactions — <code>{$completeAmount}</code>\n"
            . "❌ <b>Rejected:</b> {$rejectedCount} transactions — <code>{$rejectedAmount}</code>\n"
            . "━━━━━━━━━━━━━━━\n"
            . "💰 <b>Total:</b> {$totalCount} transactions — <code>{$totalAmount}</code>\n"
            . "━━━━━━━━━━━━━━━\n"
            . "🕐 Report at: {$now}";

        try {
            $response = Http::post("{$this->apiBase}/sendMessage", [
                'chat_id' => $this->chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ]);

            if (!$response->successful()) {
                Log::error('Telegram summary send error', ['body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram summary', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Handle callback query from inline button press.
     */
    public function handleCallbackQuery(array $callbackQuery): void
    {
        $callbackId = $callbackQuery['id'] ?? '';
        $data = $callbackQuery['data'] ?? '';
        $user = $callbackQuery['from'] ?? [];
        $message = $callbackQuery['message'] ?? [];
        $chatId = $message['chat']['id'] ?? $this->chatId;
        $messageId = $message['message_id'] ?? null;

        $approverName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        $approverUsername = $user['username'] ?? $approverName;

        // Parse action: approve_media_{id} or reject_media_{id}
        if (preg_match('/^(approve|reject)_media_(\d+)$/', $data, $matches)) {
            $action = $matches[1];
            $mediaId = (int) $matches[2];

            $record = MediaTransaction::find($mediaId);

            if (!$record) {
                $this->answerCallbackQuery($callbackId, '❌ Transaction not found!');
                return;
            }

            if ($record->status === 'complete') {
                $this->answerCallbackQuery($callbackId, '⚠️ Transaction already approved!');
                return;
            }

            if ($action === 'approve') {
                $record->update(['status' => 'complete']);
                $statusText = "✅ APPROVED";
                $this->answerCallbackQuery($callbackId, '✅ Transaction approved!');
            } else {
                $record->update(['status' => 'rejected']);
                $statusText = "❌ REJECTED";
                $this->answerCallbackQuery($callbackId, '❌ Transaction rejected!');
            }

            // Update the original message to reflect the new status
            $now = now()->format('d/m/Y H:i');
            $newText = $this->buildUpdatedMessage($record, $statusText, $approverUsername, $now);

            if ($messageId) {
                // Determine method based on whether original was a photo or text
                if (!empty($message['photo'])) {
                    $this->editMessageCaption($chatId, $messageId, $newText);
                } else {
                    $this->editMessageText($chatId, $messageId, $newText);
                }
            }
        } else {
            $this->answerCallbackQuery($callbackId, '⚠️ Unknown action');
        }
    }

    /**
     * Build updated message text after approval/rejection.
     */
    protected function buildUpdatedMessage(MediaTransaction $record, string $statusText, string $approver, string $time): string
    {
        $record->load('team');
        $teamName = $record->team?->name ?? 'Company';
        $expenseType = ucfirst($record->expense_type ?? '—');
        $amount = number_format((float) $record->amount, 0, ',', '.') . ' VND';
        $bank = $record->bank ?? '—';
        $txCode = $record->transaction_code ?? '—';
        $date = $record->transaction_date
            ? $record->transaction_date->format('d/m/Y H:i')
            : '—';
        $note = $record->note ?? '—';

        return "📢 <b>Transaction #MT-{$record->id}</b>\n"
            . "━━━━━━━━━━━━━━━\n"
            . "🏢 <b>Team:</b> {$teamName}\n"
            . "📋 <b>Expense Type:</b> {$expenseType}\n"
            . "🏦 <b>Bank:</b> {$bank}\n"
            . "💰 <b>Amount:</b> <code>{$amount}</code>\n"
            . "🧾 <b>TX Code:</b> <code>{$txCode}</code>\n"
            . "📅 <b>Date:</b> {$date}\n"
            . "📝 <b>Note:</b> {$note}\n"
            . "━━━━━━━━━━━━━━━\n"
            . "{$statusText}\n"
            . "👤 By: @{$approver} at {$time}";
    }

    /**
     * Answer a callback query (shows a toast on Telegram).
     */
    protected function answerCallbackQuery(string $callbackId, string $text): void
    {
        try {
            Http::post("{$this->apiBase}/answerCallbackQuery", [
                'callback_query_id' => $callbackId,
                'text' => $text,
                'show_alert' => true,
            ]);
        } catch (\Exception $e) {
            Log::error('answerCallbackQuery failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Edit a text message.
     */
    protected function editMessageText(string|int $chatId, int $messageId, string $text): void
    {
        try {
            Http::post("{$this->apiBase}/editMessageText", [
                'chat_id' => $chatId,
                'message_id' => $messageId,
                'text' => $text,
                'parse_mode' => 'HTML',
                // Remove inline keyboard after action
                'reply_markup' => json_encode(['inline_keyboard' => []]),
            ]);
        } catch (\Exception $e) {
            Log::error('editMessageText failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Edit a photo message caption.
     */
    protected function editMessageCaption(string|int $chatId, int $messageId, string $caption): void
    {
        try {
            Http::post("{$this->apiBase}/editMessageCaption", [
                'chat_id' => $chatId,
                'message_id' => $messageId,
                'caption' => $caption,
                'parse_mode' => 'HTML',
                'reply_markup' => json_encode(['inline_keyboard' => []]),
            ]);
        } catch (\Exception $e) {
            Log::error('editMessageCaption failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Register webhook URL with Telegram.
     */
    public function setWebhook(): array
    {
        $url = rtrim(config('telegram.app_url'), '/') . '/api/telegram/webhook';
        $secret = config('telegram.webhook_secret');

        $params = [
            'url' => $url,
            'allowed_updates' => json_encode(['callback_query']),
        ];

        if (!empty($secret)) {
            $params['secret_token'] = $secret;
        }

        $response = Http::post("{$this->apiBase}/setWebhook", $params);

        return $response->json();
    }

    /**
     * Remove webhook.
     */
    public function deleteWebhook(): array
    {
        $response = Http::post("{$this->apiBase}/deleteWebhook");
        return $response->json();
    }

    /**
     * Get webhook info.
     */
    public function getWebhookInfo(): array
    {
        $response = Http::get("{$this->apiBase}/getWebhookInfo");
        return $response->json();
    }
}
