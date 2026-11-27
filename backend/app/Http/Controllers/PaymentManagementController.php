<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Models\PaymentPlan;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentManagementController extends Controller
{
    public function methodsIndex(Request $request): JsonResponse
    {
        $methods = PaymentMethod::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $methods]);
    }

    public function storeMethod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'brand' => ['required', Rule::in(['Visa', 'Mastercard', 'American Express', 'Otro'])],
            'last4' => ['required', 'digits:4'],
            'exp_month' => ['required', 'integer', 'min:1', 'max:12'],
            'exp_year' => ['required', 'integer', 'min:'.date('Y'), 'max:'.((int) date('Y') + 20)],
            'company_id' => ['nullable', 'uuid', 'exists:companies,id'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $userId = $request->user()->id;
        $isDefault = (bool) ($validated['is_default'] ?? false);

        $method = DB::transaction(function () use ($userId, $validated, $isDefault) {
            if ($isDefault || ! PaymentMethod::query()->where('user_id', $userId)->exists()) {
                PaymentMethod::query()->where('user_id', $userId)->update(['is_default' => false]);
                $isDefault = true;
            }

            return PaymentMethod::query()->create([
                'user_id' => $userId,
                'company_id' => $validated['company_id'] ?? null,
                'label' => $validated['label'],
                'brand' => $validated['brand'],
                'last4' => $validated['last4'],
                'exp_month' => $validated['exp_month'],
                'exp_year' => $validated['exp_year'],
                'is_default' => $isDefault,
            ]);
        });

        AuditLogger::log($request, 'payment_method.created', 'success', 'payment_method', $method->id, ['brand' => $method->brand, 'last4' => $method->last4]);

        return response()->json([
            'message' => 'Método de pago registrado.',
            'data' => $method,
        ], 201);
    }

    public function setDefaultMethod(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        if ($paymentMethod->user_id !== $request->user()->id) {
            abort(403, 'No tienes permiso sobre este método de pago.');
        }

        DB::transaction(function () use ($request, $paymentMethod) {
            PaymentMethod::query()->where('user_id', $request->user()->id)->update(['is_default' => false]);
            $paymentMethod->is_default = true;
            $paymentMethod->save();
        });

        return response()->json([
            'message' => 'Método de pago predeterminado actualizado.',
            'data' => $paymentMethod,
        ]);
    }

    public function destroyMethod(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        if ($paymentMethod->user_id !== $request->user()->id) {
            abort(403, 'No tienes permiso sobre este método de pago.');
        }

        $paymentMethod->delete();
        AuditLogger::log($request, 'payment_method.deleted', 'success', 'payment_method', $paymentMethod->id);

        return response()->json(['message' => 'Método de pago eliminado.']);
    }

    public function plansIndex(Request $request): JsonResponse
    {
        $plans = PaymentPlan::query()
            ->with('company:id,name')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $plans]);
    }

    public function storePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:5', 'max:500000'],
            'frequency' => ['required', Rule::in(PaymentPlan::FREQUENCIES)],
            'installments' => ['required', 'integer', 'min:1', 'max:60'],
            'company_id' => ['nullable', 'uuid', 'exists:companies,id'],
            'next_due_date' => ['nullable', 'date'],
        ]);

        $plan = PaymentPlan::query()->create([
            'user_id' => $request->user()->id,
            'company_id' => $validated['company_id'] ?? null,
            'name' => $validated['name'],
            'amount' => round((float) $validated['amount'], 2),
            'currency' => 'bob',
            'frequency' => $validated['frequency'],
            'installments' => $validated['installments'],
            'completed_installments' => 0,
            'status' => 'active',
            'next_due_date' => $validated['next_due_date'] ?? now()->addMonth()->toDateString(),
        ]);

        $plan->load('company:id,name');
        AuditLogger::log($request, 'payment_plan.created', 'success', 'payment_plan', $plan->id, ['amount' => $plan->amount, 'frequency' => $plan->frequency]);

        return response()->json([
            'message' => 'Plan de pago creado.',
            'data' => $plan,
        ], 201);
    }

    public function updatePlanStatus(Request $request, PaymentPlan $paymentPlan): JsonResponse
    {
        if ($paymentPlan->user_id !== $request->user()->id) {
            abort(403, 'No tienes permiso sobre este plan.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(PaymentPlan::STATUSES)],
        ]);

        $paymentPlan->status = $validated['status'];
        $paymentPlan->save();

        AuditLogger::log($request, 'payment_plan.updated', 'success', 'payment_plan', $paymentPlan->id, ['status' => $paymentPlan->status]);

        return response()->json([
            'message' => 'Estado del plan actualizado.',
            'data' => $paymentPlan->load('company:id,name'),
        ]);
    }
}
