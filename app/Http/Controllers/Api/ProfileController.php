<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\FetchLog;
use App\Models\TwoFaLog;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;

use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use App\Services\ProfileService;
use Exception;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['team_id', 'status', 'search', 'year', 'page', 'per_page']);

            $result = $this->profileService->getProfiles($filters);

            return response()->json([
                'code'       => HttpCode::SUCCESS,
                'status'     => true,
                'success'    => true, // retained for frontend compatibility
                'message'    => ResponseMessage::PROFILES_FETCHED,
                'data'       => $result['data'],
                'summary'    => $result['summary'],
                'year'       => $result['year'],
                'pagination' => $result['pagination'],
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
                'data'    => null,
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'status' => 'nullable|in:active,die'
            ]);

            $data = $request->all();
            $profile = $this->profileService->updateProfile($id, $data);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => ResponseMessage::PROFILE_UPDATED,
                'data'    => $profile,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $statusCode = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $statusCode,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
                'data'    => null,
            ], $statusCode);
        }
    }

    public function logs(Request $request, string $id): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);

            // Lấy từ bảng fetch_logs
            $logs = \Illuminate\Support\Facades\DB::table('fetch_logs')
                ->where('profile_id', $id)
                ->orderBy('fetched_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'data'    => $logs,
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

    public function get2faCode(string $id): JsonResponse
    {
        try {
            $profile = Profile::findOrFail($id);
            $user = auth()->user();
            $userRole = $user?->role?->name ?? 'unknown';

            if (empty($profile->fa_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profile does not have a 2FA code.',
                ], 400);
            }

            // Make request to 2fa.live
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'accept' => '*/*',
                'accept-language' => 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'cache-control' => 'no-cache',
                'pragma' => 'no-cache',
                'sec-ch-ua-mobile' => '?0',
                'sec-ch-ua-platform' => '"macOS"',
                'sec-fetch-dest' => 'empty',
                'sec-fetch-mode' => 'cors',
                'sec-fetch-site' => 'same-origin',
                'x-requested-with' => 'XMLHttpRequest',
            ])->get('https://2fa.live/tok/' . $profile->fa_code);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['token'])) {
                    // Log successful 2FA usage
                    TwoFaLog::create([
                        'user_id'      => $user?->id,
                        'user_name'    => $user?->name ?? 'Unknown',
                        'user_role'    => $userRole,
                        'profile_id'   => $profile->id,
                        'profile_name' => $profile->profile_name ?? null,
                        'action'       => 'get_2fa_code',
                        'success'      => true,
                    ]);

                    return response()->json([
                        'code'    => HttpCode::SUCCESS,
                        'success' => true,
                        'data' => [
                            'code' => $data['token']
                        ]
                    ], HttpCode::SUCCESS);
                }
            }

            // Log failed 2FA attempt
            TwoFaLog::create([
                'user_id'      => $user?->id,
                'user_name'    => $user?->name ?? 'Unknown',
                'user_role'    => $userRole,
                'profile_id'   => $profile->id,
                'profile_name' => $profile->profile_name ?? null,
                'action'       => 'get_2fa_code',
                'success'      => false,
            ]);

            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to retrieve 2FA code from service.',
            ], HttpCode::INTERNAL_SERVER_ERROR);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get 2FA usage logs with pagination and filters.
     */
    public function twoFaLogs(Request $request): JsonResponse
    {
        try {
            $query = TwoFaLog::query();

            // Sorting
            $sortDir = $request->query('sort', 'desc');
            $query->orderBy('created_at', $sortDir);

            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('user_name', 'like', "%{$search}%")
                        ->orWhere('profile_name', 'like', "%{$search}%");
                });
            }

            if ($request->filled('user_role')) {
                $query->where('user_role', $request->query('user_role'));
            }

            if ($request->filled('status')) {
                $status = $request->query('status') === 'success' ? 1 : 0;
                $query->where('success', $status);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->query('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->query('date_to'));
            }

            $perPage = $request->query('per_page', 20);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching 2FA logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get 2FA logs for a specific profile.
     */
    public function profileTwoFaLogs(Request $request, $id): JsonResponse
    {
        try {
            // Find the profile name to filter logs
            $profile = \App\Models\Profile::find($id);
            if (!$profile) {
                return response()->json(['success' => false, 'message' => 'Profile not found'], 404);
            }

            $query = TwoFaLog::query()->where('profile_id', $profile->id);

            $sortDir = $request->query('sort', 'desc');
            $query->orderBy('created_at', $sortDir);

            if ($request->filled('user_role')) {
                $query->where('user_role', $request->query('user_role'));
            }

            if ($request->filled('status')) {
                $status = $request->query('status') === 'success' ? 1 : 0;
                $query->where('success', $status);
            }

            $perPage = $request->query('per_page', 20);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching profile 2FA logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import CSV or XLSX to update seller_name and bank_full for profiles.
     * CSV columns: SellerName | AccountNo | Store
     * Match logic: last 4 digits of AccountNo == bank_last4 AND Store == profile_name
     * If bank_last4 doesn't match AccountNo last 4 → log to fetch_logs as bank_changed
     */
    public function importSellerCsv(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
            ]);

            $file = $request->file('file');
            $path = $file->getRealPath();

            $spreadsheet = IOFactory::load($path);
            $worksheet = $spreadsheet->getActiveSheet();

            $rows = $worksheet->toArray(null, true, true, false);

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'File is empty or has no data rows.',
                ], 400);
            }

            // Parse header
            $headerRow = array_shift($rows);
            $headers = array_map(fn($h) => strtolower(trim((string)$h)), $headerRow);

            $sellerNameIdx = array_search('sellername', $headers);
            $accountNoIdx = array_search('accountno', $headers);
            $storeIdx = array_search('store', $headers);
            $statusIdx = array_search('status', $headers);
            $faCodeIdx = array_search('2facode', $headers);

            // Fallback: try with spaces/variations
            if ($sellerNameIdx === false) $sellerNameIdx = array_search('seller_name', $headers);
            if ($sellerNameIdx === false) $sellerNameIdx = array_search('seller name', $headers);
            if ($accountNoIdx === false) $accountNoIdx = array_search('account_no', $headers);
            if ($accountNoIdx === false) $accountNoIdx = array_search('account no', $headers);
            if ($accountNoIdx === false) $accountNoIdx = array_search('account no.', $headers);
            if ($faCodeIdx === false) $faCodeIdx = array_search('fa_code', $headers);
            if ($faCodeIdx === false) $faCodeIdx = array_search('2fa code', $headers);

            if ($sellerNameIdx === false || $accountNoIdx === false || $storeIdx === false || $statusIdx === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'CSV must contain columns: SellerName, AccountNo, Store, Status. Found: ' . implode(', ', $headers),
                ], 400);
            }

            // Load all profiles for matching
            $profiles = Profile::all();

            $matched = 0;
            $bankChanged = 0;
            $notMatched = 0;
            $skipped = 0;
            $results = []; // detailed per-row results
            $bankChangeAlerts = [];

            foreach ($rows as $row) {
                // If the row is empty or all elements are empty
                if (empty(array_filter($row))) {
                    $skipped++;
                    continue;
                }

                $cols = array_values($row);
                $sellerName = trim($cols[$sellerNameIdx] ?? '');
                $accountNo = trim($cols[$accountNoIdx] ?? '');
                $store = trim($cols[$storeIdx] ?? '');
                $status = trim($cols[$statusIdx] ?? '');
                $faCode = $faCodeIdx !== false ? trim($cols[$faCodeIdx] ?? '') : '';

                if (empty($accountNo) || empty($store)) {
                    $skipped++;
                    continue;
                }

                // Handle scientific notation like 2E+13, 3.00000009273568E+13
                if (preg_match('/^[\d.]+[eE][+\-]?\d+$/', $accountNo)) {
                    $accountNo = sprintf('%.0f', (float) $accountNo);
                }

                // Get last 4 digits of AccountNo
                $accountLast4 = substr(preg_replace('/[^0-9]/', '', $accountNo), -4);

                // Find matching profile: profile_name matches store
                $matchedProfile = null;
                $normalizedStore = preg_replace('/\s+/', ' ', $store);

                foreach ($profiles as $profile) {
                    $normalizedProfileName = preg_replace('/\s+/', ' ', trim($profile->profile_name));
                    if (strcasecmp($normalizedProfileName, $normalizedStore) === 0) {
                        $matchedProfile = $profile;
                        break;
                    }
                }

                if (!$matchedProfile) {
                    $notMatched++;
                    $results[] = [
                        'store' => $store,
                        'seller_name' => $sellerName,
                        'account_no' => $accountNo,
                        'status' => 'not_matched',
                        'reason' => 'No profile found with name "' . $store . '"',
                    ];
                    continue;
                }

                // Check if bank_last4 matches
                $bankMatches = $matchedProfile->bank_last4 === $accountLast4;

                if (!$bankMatches && !empty($matchedProfile->bank_last4)) {
                    // Log bank change alert
                    $bankChanged++;

                    FetchLog::create([
                        'profile_id' => $matchedProfile->id,
                        'status' => 'bank_changed',
                        'error_message' => sprintf(
                            'Warning: Bank changed! Old bank: %s, New bank: %s. Seller: %s',
                            $matchedProfile->bank_last4,
                            $accountNo,
                            $sellerName
                        ),
                    ]);

                    $bankChangeAlerts[] = [
                        'profile_name' => $matchedProfile->profile_name,
                        'profile_id' => $matchedProfile->id,
                        'old_bank' => $matchedProfile->bank_last4,
                        'new_bank' => $accountLast4,
                        'full_account' => $accountNo,
                    ];
                }

                // Update profile
                $matchedProfile->seller_name = $sellerName;
                $matchedProfile->bank_full = $accountNo;

                if (!empty($status)) {
                    $lStatus = strtolower($status);
                    if (in_array($lStatus, ['active', 'die'])) {
                        $matchedProfile->status = $lStatus;
                    }
                }

                if (!empty($faCode)) {
                    $matchedProfile->fa_code = $faCode;
                }

                $matchedProfile->save();

                $matched++;
                $results[] = [
                    'store' => $store,
                    'seller_name' => $sellerName,
                    'account_no' => $accountNo,
                    'profile_id' => $matchedProfile->id,
                    'status' => $bankMatches ? 'updated' : 'updated_bank_changed',
                    'bank_match' => $bankMatches,
                    'old_bank_last4' => $matchedProfile->bank_last4,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => "Import completed. {$matched} matched, {$notMatched} not matched, {$bankChanged} bank changes detected.",
                'data' => [
                    'matched' => $matched,
                    'not_matched' => $notMatched,
                    'bank_changed' => $bankChanged,
                    'skipped' => $skipped,
                    'total_rows' => count($rows) + 1, // original rows including header
                    'results' => $results,
                    'bank_change_alerts' => $bankChangeAlerts,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
