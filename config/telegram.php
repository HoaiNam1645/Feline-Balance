<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Telegram Bot Token
    |--------------------------------------------------------------------------
    | Get from @BotFather on Telegram
    */
    'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),

    /*
    |--------------------------------------------------------------------------
    | Telegram Chat ID
    |--------------------------------------------------------------------------
    | Group or Channel chat ID (e.g. -100xxxxxxxxxx)
    */
    'chat_id' => env('TELEGRAM_CHAT_ID', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook Secret Token
    |--------------------------------------------------------------------------
    | Used to verify incoming webhook requests from Telegram
    */
    'webhook_secret' => env('TELEGRAM_WEBHOOK_SECRET', ''),

    /*
    |--------------------------------------------------------------------------
    | App base URL (for webhook setup)
    |--------------------------------------------------------------------------
    */
    'app_url' => env('APP_URL', 'http://localhost'),
];
