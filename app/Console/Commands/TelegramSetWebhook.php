<?php

namespace App\Console\Commands;

use App\Services\TelegramService;
use Illuminate\Console\Command;

class TelegramSetWebhook extends Command
{
    protected $signature = 'telegram:set-webhook';
    protected $description = 'Register the Telegram bot webhook URL';

    public function handle(): int
    {
        $service = app(TelegramService::class);
        $result = $service->setWebhook();

        if ($result['ok'] ?? false) {
            $this->info('✅ Webhook set successfully!');
            $this->info('URL: ' . rtrim(config('telegram.app_url'), '/') . '/api/telegram/webhook');
        } else {
            $this->error('❌ Failed to set webhook:');
            $this->error(json_encode($result, JSON_PRETTY_PRINT));
        }

        // Show current info
        $info = $service->getWebhookInfo();
        $this->table(
            ['Field', 'Value'],
            collect($info['result'] ?? [])->map(fn($v, $k) => [$k, is_array($v) ? json_encode($v) : (string) $v])->values()->toArray()
        );

        return 0;
    }
}
