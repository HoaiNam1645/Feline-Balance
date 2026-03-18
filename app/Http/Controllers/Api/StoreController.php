<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Store;
use App\Models\PaymentHistory;
use App\Models\TeamFinance;
use App\Models\User;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $query = Store::with(['user', 'user.team']);

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('account_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('team_id')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('team_finance_id', $request->team_id);
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('no_payment_history') && $request->boolean('no_payment_history')) {
            $query->doesntHave('paymentHistories');
        }

        $perPage = $request->input('per_page', 15);
        $stores = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Get teams and users for filter dropdowns
        $teams = TeamFinance::select('id', 'name')->get();
        $users = User::select('id', 'name', 'email')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stores' => $stores,
                'teams' => $teams,
                'users' => $users,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'account_no' => 'required|string|max:255',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string',
        ]);

        $store = Store::create($request->only(['name', 'account_no', 'user_id', 'status']));

        return response()->json([
            'success' => true,
            'data' => $store->load(['user', 'user.team']),
        ], 201);
    }

    public function show($id)
    {
        $store = Store::with(['user', 'user.team'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $store,
        ]);
    }

    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'account_no' => 'sometimes|string|max:255',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string',
        ]);

        $store->update($request->only(['name', 'account_no', 'user_id', 'status']));

        return response()->json([
            'success' => true,
            'data' => $store->load(['user', 'user.team']),
        ]);
    }

    public function destroy($id)
    {
        $store = Store::findOrFail($id);

        // Also delete payment histories
        PaymentHistory::where('store_id', $store->id)->delete();

        $store->delete();

        return response()->json([
            'success' => true,
            'message' => 'Store deleted successfully',
        ]);
    }

    public function paymentHistory(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $query = PaymentHistory::where('store_id', $store->id);

        if ($request->filled('date_from')) {
            $query->where('transaction_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('transaction_date', '<=', $request->date_to);
        }

        $perPage = $request->input('per_page', 10);
        $history = $query->orderBy('transaction_date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'store' => $store,
                'history' => $history,
            ],
        ]);
    }

    /**
     * Normalize an account number:
     * - Convert scientific notation (3E+13, 3.00000009273568E+13) to full number string
     * - Remove dots/periods
     * - Trim whitespace
     */
    private function normalizeAccountNo($raw)
    {
        if (empty($raw)) return '';

        $raw = trim($raw);

        // Handle scientific notation like 3E+13, 3.00000009273568E+13
        if (preg_match('/^[\d.]+[eE][+\-]?\d+$/', $raw)) {
            // Use bc or sprintf to prevent floating point precision loss
            $number = sprintf('%.0f', (float) $raw);
            return $number;
        }

        // Remove dots from account number (e.g. "3000.0000.9273.568" => "30000009273568")
        $cleaned = str_replace('.', '', $raw);

        return $cleaned;
    }

    /**
     * Import CSV file with transaction history.
     * CSV structure (PingPong format):
     *   Rows 1-9: metadata (Account Statement, Client Name, etc.)
     *   Row 10: Header row (Time, Currency, Amount, TransactionId, Account No., Fee, Rate, Net, Type, From/To, Status, Note)
     *   Row 11+: Data rows
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        // Read all lines
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if (empty($lines)) {
            return response()->json([
                'success' => false,
                'message' => 'File is empty',
            ], 422);
        }

        // Find the header row by looking for "Time" in the first column
        $headerIndex = null;
        $headerMap = [];

        for ($i = 0; $i < min(count($lines), 20); $i++) {
            $cols = str_getcsv($lines[$i]);
            $firstCol = strtolower(trim($cols[0] ?? ''));

            if ($firstCol === 'time') {
                $headerIndex = $i;
                // Build a map: column_name => index
                foreach ($cols as $idx => $colName) {
                    $headerMap[strtolower(trim($colName))] = $idx;
                }
                break;
            }
        }

        if ($headerIndex === null) {
            return response()->json([
                'success' => false,
                'message' => 'Could not find header row (looking for "Time" column). Please check the CSV format.',
            ], 422);
        }

        // Required columns
        $requiredCols = ['time', 'account no.'];
        foreach ($requiredCols as $col) {
            if (!isset($headerMap[$col])) {
                return response()->json([
                    'success' => false,
                    'message' => "Missing required column: \"{$col}\" in header row.",
                ], 422);
            }
        }

        // Preload all stores and index by normalized account_no for fast lookup
        $stores = Store::all();
        $storeMap = []; // normalized_account_no => Store model
        foreach ($stores as $store) {
            $normalized = $this->normalizeAccountNo($store->account_no);
            $storeMap[$normalized] = $store;
        }

        // Parse data rows
        $dataRows = array_slice($lines, $headerIndex + 1);
        $imported = 0;
        $skipped = 0;
        $notMatched = 0;
        $duplicated = 0;
        $matchedStores = [];
        $unmatchedAccounts = [];
        $storeImportCounts = [];

        foreach ($dataRows as $line) {
            $cols = str_getcsv($line);

            // Skip empty rows
            if (empty(array_filter($cols))) continue;

            // Get column values safely
            $getValue = function ($colName) use ($cols, $headerMap) {
                $idx = $headerMap[$colName] ?? null;
                return ($idx !== null && isset($cols[$idx])) ? trim($cols[$idx]) : null;
            };

            $rawAccountNo = $getValue('account no.');
            $normalizedCsvAccount = $this->normalizeAccountNo($rawAccountNo);

            // Try to find matching store
            $matchedStore = $storeMap[$normalizedCsvAccount] ?? null;

            if (!$matchedStore) {
                $notMatched++;
                if (!in_array($normalizedCsvAccount, $unmatchedAccounts) && !empty($normalizedCsvAccount)) {
                    $unmatchedAccounts[] = $normalizedCsvAccount;
                }
                continue;
            }

            // Parse transaction date (format: "10/31/25 14:25" or "MM/DD/YY HH:mm")
            $rawTime = $getValue('time');
            $transactionDate = null;
            if ($rawTime) {
                try {
                    $transactionDate = \Carbon\Carbon::parse($rawTime);
                } catch (\Exception $e) {
                    // Try manual parsing for "MM/DD/YY HH:mm" format
                    $parsed = date_create_from_format('m/d/y H:i', $rawTime);
                    if ($parsed) {
                        $transactionDate = \Carbon\Carbon::instance($parsed);
                    }
                }
            }

            $transactionId = $getValue('transactionid');

            // Check for duplicate by transaction_id
            if ($transactionId) {
                $exists = PaymentHistory::where('transaction_id', $transactionId)
                    ->where('store_id', $matchedStore->id)
                    ->exists();
                if ($exists) {
                    $duplicated++;
                    continue;
                }
            }

            // Parse amount (remove any currency symbols, commas)
            $rawAmount = $getValue('amount');
            $amount = $rawAmount ? (float) str_replace([',', ' '], '', $rawAmount) : null;

            $rawFee = $getValue('fee');
            $fee = $rawFee ? (float) str_replace([',', ' '], '', $rawFee) : null;

            $rawRate = $getValue('rate');
            $rate = $rawRate ? (float) str_replace([',', ' '], '', $rawRate) : null;

            $rawNet = $getValue('net');
            // Net might contain currency code appended (e.g. "1.91USD")
            $net = null;
            if ($rawNet) {
                $netNumeric = preg_replace('/[^0-9.\-]/', '', $rawNet);
                $net = $netNumeric ? (float) $netNumeric : null;
            }

            PaymentHistory::create([
                'store_id' => $matchedStore->id,
                'transaction_date' => $transactionDate,
                'currency' => $getValue('currency'),
                'amount' => $amount,
                'transaction_id' => $transactionId,
                'account_no' => $rawAccountNo,
                'fee' => $fee,
                'rate' => $rate,
                'net' => $net,
                'type' => $getValue('type'),
                'from_to' => $getValue('from/to'),
                'status' => $getValue('status'),
                'description' => $getValue('note'),
            ]);

            $imported++;

            // Track per-store import count
            if (!isset($storeImportCounts[$matchedStore->id])) {
                $storeImportCounts[$matchedStore->id] = 0;
            }
            $storeImportCounts[$matchedStore->id]++;

            if (!in_array($matchedStore->id, $matchedStores)) {
                $matchedStores[] = $matchedStore->id;
            }
        }

        // Update store totals and build detailed results
        $affectedStoreDetails = [];
        foreach ($matchedStores as $storeId) {
            $store = Store::find($storeId);
            if ($store) {
                $store->total_payments = PaymentHistory::where('store_id', $storeId)->count();
                $store->total_amount = PaymentHistory::where('store_id', $storeId)->sum('amount');
                $lastPayment = PaymentHistory::where('store_id', $storeId)
                    ->orderBy('transaction_date', 'desc')
                    ->first();
                $store->last_payment_date = $lastPayment?->transaction_date;
                $store->save();

                $affectedStoreDetails[] = [
                    'id' => $store->id,
                    'name' => $store->name,
                    'account_no' => $store->account_no,
                    'new_transactions' => $storeImportCounts[$storeId] ?? 0,
                    'total_payments' => $store->total_payments,
                    'total_amount' => $store->total_amount,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Import completed.",
            'data' => [
                'imported' => $imported,
                'duplicated' => $duplicated,
                'not_matched' => $notMatched,
                'skipped' => $skipped,
                'unmatched_accounts' => array_slice($unmatchedAccounts, 0, 10),
                'unmatched_total' => count($unmatchedAccounts),
                'stores_affected' => count($matchedStores),
                'affected_stores' => $affectedStoreDetails,
            ],
        ]);
    }

    /**
     * Import Stores from CSV/Excel
     * Columns required: SellerName, AccountNo, Store, Status
     */
    public function importStores(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240', // max 10MB
        ]);

        $file = $request->file('file');

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray(null, true, true, true);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to read file: ' . $e->getMessage()
            ], 422);
        }

        if (empty($rows)) {
            return response()->json(['success' => false, 'message' => 'Empty file'], 422);
        }

        $header = array_shift($rows);
        $headerMap = [];
        foreach ($header as $col => $val) {
            $headerMap[strtolower(trim($val ?? ''))] = $col;
        }

        $required = ['sellername', 'accountno', 'store', 'status'];
        foreach ($required as $req) {
            if (!isset($headerMap[$req])) {
                return response()->json([
                    'success' => false,
                    'message' => "Missing required column: {$req} in header row."
                ], 422);
            }
        }

        $imported = 0;
        $updated = 0;
        $failed = 0;

        foreach ($rows as $index => $row) {
            if (empty(array_filter($row))) continue;

            $sellerName = trim($row[$headerMap['sellername']] ?? '');
            $accountNoRaw = trim($row[$headerMap['accountno']] ?? '');
            $storeName = trim($row[$headerMap['store']] ?? '');
            $statusRaw = trim($row[$headerMap['status']] ?? '');

            if (empty($accountNoRaw) || empty($storeName)) {
                $failed++;
                continue;
            }

            // Normalise AccountNo (handles 2E+13 properly -> 20000000000000)
            $accountNo = $this->normalizeAccountNo($accountNoRaw);

            // Wait! The user instruction explicitly said: "Lưu ý xử lý 2E+13 cho AccountNo"
            // If the CSV contains exactly the string "2E+13", and normalizeAccountNo parses it to 20000000000000, 
            // but wait, IF they meant that "2E+13" is actually string literally "2E+13"?
            // If the raw from array is scientific notation and normalizeAccountNo handles it, perfect.

            $user = User::where('username', $sellerName)->first();
            $status = strtolower($statusRaw) === 'inactive' ? 'inactive' : 'active';

            $store = Store::where('account_no', $accountNo)->first();
            if ($store) {
                $store->update([
                    'name' => $storeName,
                    'user_id' => $user ? $user->id : $store->user_id,
                    'status' => $status
                ]);
                $updated++;
            } else {
                Store::create([
                    'name' => $storeName,
                    'account_no' => $accountNo,
                    'user_id' => $user ? $user->id : null,
                    'status' => $status
                ]);
                $imported++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Imported successfully.',
            'data' => [
                'imported' => $imported,
                'updated' => $updated,
                'failed' => $failed,
            ]
        ]);
    }
}
