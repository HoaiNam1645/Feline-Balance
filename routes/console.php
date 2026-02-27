<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('sync:teams')
    ->everyTenMinutes()
    ->appendOutputTo(storage_path('logs/schedule-sync.log'));

Schedule::command('sync:design-statistics')
    ->everyTenMinutes()
    ->appendOutputTo(storage_path('logs/schedule-sync.log'));

Schedule::command('sync:fulfillment-statistics')
    ->everyTenMinutes()
    ->appendOutputTo(storage_path('logs/schedule-sync.log'));
