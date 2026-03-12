<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransactionService;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Exception;

class TransactionController extends Controller
{
    protected TransactionService $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['type', 'team_id', 'year', 'month', 'date', 'payment_method', 'status', 'search', 'page', 'per_page']);
            $result = $this->transactionService->getTransactions($filters);

            return response()->json([
                'code'       => HttpCode::SUCCESS,
                'status'     => true,
                'success'    => true,
                'message'    => "Transactions fetched successfully.",
                'data'       => $result['data'],
                'pagination' => $result['pagination'],
                'summary'    => $result['summary'],
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

    /**
     * Export transactions to XLSX.
     */
    public function export(Request $request)
    {
        try {
            $filters = $request->only(['type', 'team_id', 'year', 'month', 'date', 'payment_method', 'status', 'search']);
            $records = $this->transactionService->exportTransactions($filters);

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Transactions');

            $headers = [
                'ID',
                'Team',
                'Vendor',
                'Transaction ID',
                'Type',
                'Payment Method',
                'Amount',
                'Currency',
                'Status',
                'Date',
                'Note',
            ];

            $sheet->fromArray($headers, null, 'A1');

            $rowNum = 2;
            foreach ($records as $record) {
                $sheet->fromArray([
                    $record->id,
                    $record->team ? $record->team->name : '',
                    $record->vendor ? $record->vendor->name : '',
                    $record->transaction_id ?? '',
                    $record->type ?? '',
                    $record->payment_method ?? '',
                    $record->amount,
                    $record->currency ?? '',
                    $record->status ?? '',
                    $record->created_at ? $record->created_at->format('Y-m-d H:i') : '',
                    $record->note ?? '',
                ], null, 'A' . $rowNum++);
            }

            // Auto-size columns
            foreach (range('A', 'K') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $fileName = 'topup_' . date('Y_m_d_His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'export');
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'status'  => false,
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            $transaction = $this->transactionService->createTransaction($data);

            return response()->json([
                'code'    => HttpCode::CREATED,
                'status'  => true,
                'success' => true,
                'message' => "Transaction created successfully.",
                'data'    => $transaction,
            ], HttpCode::CREATED);
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

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $data = $request->all();
            $transaction = $this->transactionService->updateTransaction($id, $data);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => "Transaction updated successfully.",
                'data'    => $transaction,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $statusCode = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $statusCode,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
            ], $statusCode);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $this->transactionService->deleteTransaction($id);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => "Transaction deleted successfully.",
                'data'    => null,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $statusCode = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $statusCode,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
            ], $statusCode);
        }
    }
}
