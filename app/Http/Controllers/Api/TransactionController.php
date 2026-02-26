<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransactionService;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
            $filters = $request->only(['type', 'team_id', 'year', 'payment_method', 'status', 'search', 'page', 'per_page']);
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
