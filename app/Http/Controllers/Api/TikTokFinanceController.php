<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TikTokFinanceController extends Controller
{
    // Bắt buộc phải khớp với API_SECRET_KEY trong file db.ts ở app Electron
    private const API_SECRET_KEY = 's1642002abc123@';

    public function saveData(Request $request)
    {
        // 1. Kiểm tra Authorization Header (Bảo mật)
        $token = $request->bearerToken();
        if ($token !== self::API_SECRET_KEY) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Lấy toàn bộ data gửi từ Electron
        $data = $request->json()->all();
        $profileId = $data['profileId'] ?? null;

        if (!$profileId) {
            return response()->json(['success' => false, 'message' => 'Profile ID is required'], 400);
        }

        try {
            DB::beginTransaction();

            $bankAccountNumber = $data['bankAccountNumber'] ?? null;
            $bankLast4 = $bankAccountNumber ? substr($bankAccountNumber, -4) : null;

            // Xử lý tách profile_code (ví dụ từ "1373 Monica..." ra "1373")
            $profileCode = $profileId;
            $profileName = $data['profileName'] ?? '';
            $parts = explode(' ', $profileName);
            if (count($parts) > 0 && is_numeric($parts[0])) {
                $profileCode = $parts[0];
            }

            // 1. Upsert Profile
            DB::table('profiles')
                ->updateOrInsert(
                    ['id' => $profileId],
                    [
                        'profile_name'     => $profileName,
                        'profile_code'     => $profileCode,
                        'seller_id'        => $data['sellerId'] ?? DB::raw('seller_id'),
                        'bank_last4'       => $bankLast4 ?? DB::raw('bank_last4'),
                        'beneficiary_name' => $data['beneficiaryName'] ?? DB::raw('beneficiary_name'),
                        'status'           => 'active',
                        'updated_at'       => now(),
                    ]
                );

            // 2. Insert Fetch Log
            if (!empty($data['status'])) {
                DB::table('fetch_logs')->insert([
                    'profile_id'    => $profileId,
                    'status'        => $data['status'],
                    'error_message' => $data['errorMessage'] ?? null,
                    'duration_ms'   => $data['durationMs'] ?? 0,
                    'fetched_at'    => now(),
                ]);
            }

            // Nếu status không success, không có sellerId thì dừng lại, không upsert balance/chi tiết
            if (($data['status'] ?? '') !== 'success' && empty($data['sellerId'])) {
                DB::commit();
                return response()->json(['success' => true, 'message' => 'Logged failed fetch.']);
            }

            // Helpers: Xóa $, dấu , và chuyển thành số
            $parseMoney = function ($val) {
                if (!$val) return 0;
                return (float) str_replace(['$', ','], '', $val);
            };

            // 3. Upsert Balance
            DB::table('balances')
                ->updateOrInsert(
                    ['profile_id' => $profileId],
                    [
                        'net_earning'    => $parseMoney($data['netEarning'] ?? ''),
                        'on_hold_amount' => $parseMoney($data['onHoldAmount'] ?? ''),
                        'total_paid'     => $parseMoney($data['sumAmount'] ?? ''),
                        'fetched_at'     => now(),
                    ]
                );

            // 4. Upsert Monthly Settlements
            if (!empty($data['monthlyData']) && is_array($data['monthlyData'])) {
                foreach ($data['monthlyData'] as $monthItem) {
                    // Chuyển "01/2026" thành "2026-01"
                    $parts = explode('/', $monthItem['month']);
                    if (count($parts) === 2) {
                        $monthFormatted = $parts[1] . '-' . $parts[0];
                        $settlementAmount = $parseMoney($monthItem['settlement'] ?? '');

                        DB::table('monthly_settlements')
                            ->updateOrInsert(
                                [
                                    'profile_id' => $profileId,
                                    'month'      => $monthFormatted
                                ],
                                [
                                    'settlement' => $settlementAmount,
                                    'fetched_at' => now(),
                                ]
                            );
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Data saved successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("[TikTok Finance API] Save failed for {$profileId}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }
}
