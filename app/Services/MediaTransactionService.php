<?php

namespace App\Services;

use App\Models\MediaTransaction;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MediaTransactionService
{
    /**
     * Get media transactions with pagination and filters.
     */
    public function getMediaTransactions(array $filters): array
    {
        $query = MediaTransaction::query();

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (!empty($filters['bank'])) {
            $query->where('bank', $filters['bank']);
        }

        if (!empty($filters['expense_type'])) {
            $query->where('expense_type', $filters['expense_type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where('transaction_code', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['year'])) {
            $query->whereYear('transaction_date', $filters['year']);
        }

        if (!empty($filters['month'])) {
            $query->whereMonth('transaction_date', $filters['month']);
        }

        // Summary (before pagination)
        $summaryQuery = clone $query;
        $totalAmount = $summaryQuery->sum('amount');
        $totalCount = (clone $summaryQuery)->count();
        $totalPending = (clone $summaryQuery)->where('status', 'pending')->count();
        $totalComplete = (clone $summaryQuery)->where('status', 'complete')->count();

        $perPage = $filters['per_page'] ?? 15;
        $paginator = $query->with('company')->latest('transaction_date')->paginate($perPage);

        // Page totals
        $pageItems = collect($paginator->items());
        $pageAmount = $pageItems->sum('amount');

        // Map company name
        $items = $pageItems->map(function ($item) {
            $arr = $item->toArray();
            $arr['company_name'] = $item->company?->name ?? null;
            return $arr;
        });

        return [
            'data' => $items->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
            'summary' => [
                'total_count'    => $totalCount,
                'total_amount'   => round($totalAmount, 2),
                'total_pending'  => $totalPending,
                'total_complete' => $totalComplete,
                'page_amount'    => round($pageAmount, 2),
            ],
        ];
    }

    public function createMediaTransaction(array $data): MediaTransaction
    {
        return MediaTransaction::create($data);
    }

    public function updateMediaTransaction(int $id, array $data): MediaTransaction
    {
        $record = MediaTransaction::find($id);
        if (!$record) {
            throw new \Exception('Media transaction not found', 404);
        }

        $fillableData = collect($data)->only([
            'company_id',
            'expense_type',
            'image',
            'transaction_code',
            'bank',
            'transaction_date',
            'amount',
            'status',
            'note',
        ])->toArray();

        // If image changed, delete the old one from B2
        if (array_key_exists('image', $fillableData) && $fillableData['image'] !== $record->image) {
            $this->deleteOldImageIfB2($record->image);
        }

        $record->update($fillableData);
        return $record;
    }

    public function deleteMediaTransaction(int $id): bool
    {
        $record = MediaTransaction::find($id);
        if (!$record) {
            throw new \Exception('Media transaction not found', 404);
        }

        $this->deleteOldImageIfB2($record->image);
        return $record->delete();
    }

    private function deleteOldImageIfB2(?string $url): void
    {
        if (!$url) {
            return;
        }

        if (str_contains($url, 'image_media/')) {
            $parts = explode('image_media/', $url);
            if (count($parts) > 1) {
                $filename = 'image_media/' . end($parts);
                try {
                    Storage::disk('b2')->delete($filename);
                    Log::info("Deleted old media image from B2", ['file' => $filename]);
                } catch (\Exception $e) {
                    Log::error("Failed to delete media image from B2", [
                        'file' => $filename,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
}
