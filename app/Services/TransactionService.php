<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TransactionService
{
    /**
     * Get a list of transactions with pagination and optional filters.
     *
     * @param array $filters
     * @return array
     */
    public function getTransactions(array $filters): array
    {
        $query = Transaction::query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where('transaction_id', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }

        if (!empty($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (!empty($filters['year'])) {
            $query->whereYear('created_at', $filters['year']);
        }

        // Summary from filtered query (before pagination)
        $summaryQuery = clone $query;
        $totalIncome = (clone $summaryQuery)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $summaryQuery)->where('type', 'expense')->sum('amount');
        $totalVendor = (clone $summaryQuery)->whereNotNull('vendor_id')->sum('amount');
        $totalCompany = (clone $summaryQuery)->where('type', 'company_expense')->sum('amount');
        $totalTransactions = $summaryQuery->count();
        $totalAmount = (clone $query)->sum('amount');

        $perPage = $filters['per_page'] ?? 15;
        $paginator = $query->with(['team', 'vendor'])->latest()->paginate($perPage);

        // Page totals
        $pageItems = collect($paginator->items());
        $pageIncome = $pageItems->where('type', 'income')->sum('amount');
        $pageExpense = $pageItems->where('type', 'expense')->sum('amount');
        $pageVendor = $pageItems->whereNotNull('vendor_id')->sum('amount');
        $pageCompany = $pageItems->where('type', 'company_expense')->sum('amount');

        // Append team name and vendor name
        $items = collect($paginator->items())->map(function ($item) {
            $arr = $item->toArray();
            $arr['team_name'] = $item->team?->name ?? null;
            $arr['vendor_name'] = $item->vendor?->name ?? null;
            return $arr;
        });

        return [
            'data'       => $items->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_income'       => round($totalIncome, 2),
                'total_expense'      => round($totalExpense, 2),
                'total_vendor'       => round($totalVendor, 2),
                'total_company'      => round($totalCompany, 2),
                'total_amount'       => round($totalAmount, 2),
                'page_income'        => round($pageIncome, 2),
                'page_expense'       => round($pageExpense, 2),
                'page_vendor'        => round($pageVendor, 2),
                'page_company'       => round($pageCompany, 2),
            ],
        ];
    }

    public function createTransaction(array $data): Transaction
    {
        return Transaction::create($data);
    }

    public function updateTransaction(int $id, array $data): Transaction
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            throw new \Exception('Transaction not found', 404);
        }

        $fillableData = collect($data)->only([
            'transaction_id',
            'type',
            'team_id',
            'payment_method',
            'vendor_id',
            'amount',
            'currency',
            'image',
            'status',
            'note',
        ])->toArray();

        // Check if image is updated, then delete the old one
        if (array_key_exists('image', $fillableData) && $fillableData['image'] !== $transaction->image) {
            $this->deleteOldImageIfB2($transaction->image);
        }

        $transaction->update($fillableData);
        return $transaction;
    }

    public function deleteTransaction(int $id): bool
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            throw new \Exception('Transaction not found', 404);
        }

        // Delete image associated if any
        $this->deleteOldImageIfB2($transaction->image);

        return $transaction->delete();
    }

    private function deleteOldImageIfB2(?string $url): void
    {
        if (!$url) {
            return;
        }

        // If it's a B2 image URL, parse and delete it
        if (str_contains($url, 'image_topup/')) {
            $parts = explode('image_topup/', $url);
            if (count($parts) > 1) {
                $filename = 'image_topup/' . end($parts);
                try {
                    Storage::disk('b2')->delete($filename);
                    Log::info("Deleted old image from B2", ['file' => $filename]);
                } catch (\Exception $e) {
                    Log::error("Failed to delete image from B2", [
                        'file' => $filename,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
    }
}
