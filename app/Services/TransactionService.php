<?php

namespace App\Services;

use App\Models\Transaction;

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

        // Summary from filtered query (before pagination)
        $summaryQuery = clone $query;
        $totalThu = (clone $summaryQuery)->where('type', 'thu')->sum('amount');
        $totalChi = (clone $summaryQuery)->where('type', 'chi')->sum('amount');
        $totalTransactions = $summaryQuery->count();
        $totalAmount = (clone $query)->sum('amount');

        $perPage = $filters['per_page'] ?? 15;
        $paginator = $query->latest()->paginate($perPage);

        // Page totals
        $pageItems = collect($paginator->items());
        $pageThu = $pageItems->where('type', 'thu')->sum('amount');
        $pageChi = $pageItems->where('type', 'chi')->sum('amount');

        return [
            'data'       => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_thu'          => round($totalThu, 2),
                'total_chi'          => round($totalChi, 2),
                'total_amount'       => round($totalAmount, 2),
                'page_thu'           => round($pageThu, 2),
                'page_chi'           => round($pageChi, 2),
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
            'payment_method',
            'amount',
            'currency',
            'image',
            'status',
        ])->toArray();

        $transaction->update($fillableData);
        return $transaction;
    }

    public function deleteTransaction(int $id): bool
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            throw new \Exception('Transaction not found', 404);
        }
        return $transaction->delete();
    }
}
