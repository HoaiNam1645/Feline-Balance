<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FelineService
{
    private string $baseUrl;
    private string $email;
    private string $password;

    public function __construct()
    {
        $this->baseUrl = config('services.feline.base_url', 'https://felineez.com/api/v1');
        $this->email = config('services.feline.email', '');
        $this->password = config('services.feline.password', '');
    }

    /**
     * Login to Feline API and get access token.
     * Token is cached for 6 days (token expires in 7 days).
     */
    public function getAccessToken(): string
    {
        return Cache::remember('feline_access_token', now()->addDays(6), function () {
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'content-type' => 'application/json',
                'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
            ])->post("{$this->baseUrl}/login", [
                'email' => $this->email,
                'password' => $this->password,
            ]);

            if (!$response->successful()) {
                Log::error('Feline login failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Failed to authenticate with Feline API');
            }

            $data = $response->json();
            return $data['access_token'] ?? '';
        });
    }

    /**
     * Force refresh the access token (clear cache and re-login).
     */
    public function refreshToken(): string
    {
        Cache::forget('feline_access_token');
        return $this->getAccessToken();
    }

    /**
     * Make an authenticated request to Feline API with auto-retry on 401.
     */
    private function authenticatedGet(string $url, array $queryParams = []): \Illuminate\Http\Client\Response
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'accept' => 'application/json',
            'Authorization' => "Bearer {$token}",
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        ])->get($url, $queryParams);

        // If unauthorized, try refreshing token once
        if ($response->status() === 401) {
            $token = $this->refreshToken();
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'Authorization' => "Bearer {$token}",
                'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
            ])->get($url, $queryParams);
        }

        return $response;
    }

    /**
     * Fetch ALL design statistics from Feline API for a given year/month.
     * Fetches full data (limit=9999) so we can paginate/filter locally.
     * Results are cached for 10 minutes to avoid hammering the external API.
     */
    public function getDesignStatistics(int $year, int $month): array
    {
        $cacheKey = "feline_design_stats_{$year}_{$month}";

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($year, $month) {
            $response = $this->authenticatedGet("{$this->baseUrl}/designs/statistics", [
                'page' => 1,
                'limit' => 9999,
                'year' => $year,
                'month' => $month,
            ]);

            if (!$response->successful()) {
                Log::error('Feline design statistics fetch failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Failed to fetch design statistics from Feline API');
            }

            return $response->json();
        });
    }

    /**
     * Fetch ALL fulfillment statistics from Feline API for a given type and year/month.
     * Fetches full data (limit=9999) so we can paginate/filter locally.
     * Results are cached for 10 minutes to avoid hammering the external API.
     */
    public function getFulfillmentStatistics(string $type, int $year, int $month, ?int $fulfillId = null): array
    {
        $cacheKey = "feline_fulfillment_stats_{$type}_{$year}_{$month}_{$fulfillId}";

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($type, $year, $month, $fulfillId) {
            $params = [
                'type' => $type,
                'page' => 1,
                'limit' => 9999,
                'year' => $year,
                'month' => $month,
            ];

            if ($fulfillId !== null) {
                $params['fulfill_id'] = $fulfillId;
            }

            $response = $this->authenticatedGet("{$this->baseUrl}/order-fulfillments/statistics", $params);

            if (!$response->successful()) {
                Log::error('Feline fulfillment statistics fetch failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Failed to fetch fulfillment statistics from Feline API');
            }

            return $response->json();
        });
    }

    /**
     * Fetch ALL fulfill units from Feline API.
     * Results are cached for 1 hour to avoid frequent external API calls.
     */
    public function getFulfillUnits(): array
    {
        $cacheKey = "feline_fulfill_units";

        return Cache::remember($cacheKey, now()->addHours(1), function () {
            $response = $this->authenticatedGet("{$this->baseUrl}/fulfill-units");

            if (!$response->successful()) {
                Log::error('Feline fulfill units fetch failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return ['data' => []]; // Fallback to empty
            }

            return $response->json();
        });
    }
}
