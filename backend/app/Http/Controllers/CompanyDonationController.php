<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Donation;
use App\Models\PaymentTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Throwable;

class CompanyDonationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeCompanies = $this->activeCompaniesFor($user->id);
        $stripeKey = (string) config('services.stripe.key');
        $stripeSecret = (string) config('services.stripe.secret');

        if ($activeCompanies->isEmpty()) {
            return response()->json([
                'data' => [
                    'companies' => [],
                    'donations' => [],
                    'stripe_configured' => $stripeSecret !== '' && $stripeKey !== '',
                    'stripe_key' => $stripeKey !== '' ? $stripeKey : null,
                    'currency' => 'BOB',
                ],
            ]);
        }

        $donations = Donation::query()
            ->with(['company:id,name', 'user:id,name,email'])
            ->whereIn('company_id', $activeCompanies->pluck('id'))
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (Donation $d) => $this->serializeDonation($d))
            ->values();

        return response()->json([
            'data' => [
                'companies' => $activeCompanies->map(fn (Company $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                ])->values(),
                'donations' => $donations,
                'stripe_configured' => $stripeSecret !== '' && $stripeKey !== '',
                'stripe_key' => $stripeKey !== '' ? $stripeKey : null,
                'currency' => 'BOB',
            ],
        ]);
    }

    public function show(Request $request, Donation $donation): JsonResponse
    {
        $activeCompanyIds = $this->activeCompaniesFor($request->user()->id)->pluck('id')->all();
        if (! in_array($donation->company_id, $activeCompanyIds, true)) {
            abort(403, 'No tienes acceso a este donativo.');
        }

        $donation->load(['company:id,name', 'user:id,name,email', 'transactions']);

        return response()->json([
            'data' => $this->serializeDonation($donation, true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeCompanyIds = $this->activeCompaniesFor($user->id)->pluck('id')->all();

        if ($activeCompanyIds === []) {
            return response()->json([
                'message' => 'Tu cuenta no está vinculada a ninguna empresa activa.',
            ], 403);
        }

        $validated = $request->validate([
            'company_id' => ['required', 'uuid', Rule::in($activeCompanyIds)],
            'amount' => ['required', 'numeric', 'min:5', 'max:500000'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        $stripeSecret = (string) config('services.stripe.secret');
        if ($stripeSecret === '') {
            return response()->json([
                'message' => 'Stripe no está configurado en el servidor (falta STRIPE_SECRET).',
            ], 503);
        }

        $currency = 'bob';
        $amount = round((float) $validated['amount'], 2);
        $amountCents = (int) round($amount * 100);

        $company = Company::query()->findOrFail($validated['company_id']);

        $donation = DB::transaction(function () use ($company, $user, $amount, $currency, $validated) {
            $donation = Donation::query()->create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'currency' => $currency,
                'status' => 'pending',
                'description' => $validated['description'] ?? 'Donativo institucional UAGRM',
            ]);

            PaymentTransaction::query()->create([
                'donation_id' => $donation->id,
                'provider' => 'stripe',
                'status' => 'pending',
                'amount' => $amount,
                'currency' => $currency,
                'payload_summary' => ['stage' => 'initiated'],
            ]);

            return $donation;
        });

        try {
            Stripe::setApiKey($stripeSecret);

            $intent = PaymentIntent::create([
                'amount' => $amountCents,
                'currency' => $currency,
                'automatic_payment_methods' => [
                    'enabled' => true,
                    'allow_redirects' => 'never',
                ],
                'description' => ($donation->description ?: 'Donativo institucional UAGRM').' — '.$company->name,
                'metadata' => [
                    'donation_id' => $donation->id,
                    'company_id' => $company->id,
                    'user_id' => (string) $user->id,
                ],
            ]);

            $donation->stripe_payment_intent_id = $intent->id;
            $donation->save();

            AuditLogger::log(
                $request,
                'donation.intent_created',
                'success',
                'donation',
                $donation->id,
                ['company_id' => $company->id, 'amount' => $amount, 'currency' => $currency]
            );

            return response()->json([
                'message' => 'Intención de pago creada. Ingresa los datos de tu tarjeta.',
                'data' => [
                    'donation' => $this->serializeDonation($donation->fresh(['company', 'user'])),
                    'client_secret' => $intent->client_secret,
                ],
            ], 201);
        } catch (Throwable $e) {
            $donation->status = 'rejected';
            $donation->save();

            AuditLogger::log(
                $request,
                'donation.intent_failed',
                'failed',
                'donation',
                $donation->id,
                ['company_id' => $company->id, 'error' => substr($e->getMessage(), 0, 200)]
            );

            return response()->json([
                'message' => 'No se pudo iniciar el pago en Stripe: '.$e->getMessage(),
            ], 502);
        }
    }

    public function confirm(Request $request, Donation $donation): JsonResponse
    {
        $activeCompanyIds = $this->activeCompaniesFor($request->user()->id)->pluck('id')->all();
        if (! in_array($donation->company_id, $activeCompanyIds, true)) {
            abort(403, 'No tienes acceso a este donativo.');
        }

        if ($donation->status === 'confirmed') {
            return response()->json([
                'message' => 'Donativo confirmado.',
                'data' => $this->serializeDonation($donation->load(['company', 'user'])),
            ]);
        }

        if (! $donation->stripe_payment_intent_id) {
            return response()->json([
                'message' => 'El donativo no tiene una intención de pago asociada.',
            ], 422);
        }

        $stripeSecret = (string) config('services.stripe.secret');
        if ($stripeSecret === '') {
            return response()->json(['message' => 'Stripe no está configurado.'], 503);
        }

        try {
            Stripe::setApiKey($stripeSecret);
            $intent = PaymentIntent::retrieve($donation->stripe_payment_intent_id);

            if ($intent->status === 'succeeded') {
                DB::transaction(function () use ($request, $donation, $intent) {
                    $donation->status = 'confirmed';
                    $donation->confirmed_at = $donation->confirmed_at ?? now();
                    $donation->save();

                    PaymentTransaction::query()->create([
                        'donation_id' => $donation->id,
                        'provider' => 'stripe',
                        'provider_reference' => $intent->id,
                        'status' => 'confirmed',
                        'amount' => $donation->amount,
                        'currency' => $donation->currency,
                        'payload_summary' => ['source' => 'stripe_intent_verify'],
                    ]);

                    AuditLogger::log(
                        $request,
                        'donation.confirmed',
                        'success',
                        'donation',
                        $donation->id,
                        ['company_id' => $donation->company_id, 'payment_intent' => $intent->id]
                    );
                });
            } elseif ($intent->status === 'canceled') {
                $donation->status = 'cancelled';
                $donation->save();
            }

            return response()->json([
                'message' => $donation->status === 'confirmed'
                    ? 'Donativo confirmado correctamente.'
                    : 'El pago aún está pendiente de confirmación.',
                'data' => $this->serializeDonation($donation->fresh(['company', 'user'])),
            ]);
        } catch (Throwable) {
            return response()->json([
                'message' => 'No se pudo verificar el estado del pago con Stripe.',
            ], 502);
        }
    }

    private function activeCompaniesFor(int $userId)
    {
        return Company::query()
            ->where('status', 'active')
            ->whereHas('companyUsers', fn ($q) => $q->where('user_id', $userId))
            ->orderBy('name')
            ->get();
    }

    private function serializeDonation(Donation $d, bool $withTransactions = false): array
    {
        $payload = [
            'id' => $d->id,
            'company_id' => $d->company_id,
            'company_name' => $d->company?->name,
            'user_id' => $d->user_id,
            'user_name' => $d->user?->name,
            'amount' => (float) $d->amount,
            'currency' => strtoupper($d->currency),
            'status' => $d->status,
            'description' => $d->description,
            'stripe_checkout_session_id' => $d->stripe_checkout_session_id,
            'stripe_payment_intent_id' => $d->stripe_payment_intent_id,
            'confirmed_at' => $d->confirmed_at?->toIso8601String(),
            'created_at' => $d->created_at?->toIso8601String(),
        ];

        if ($withTransactions) {
            $payload['transactions'] = $d->transactions->map(fn (PaymentTransaction $t) => [
                'id' => $t->id,
                'provider' => $t->provider,
                'provider_reference' => $t->provider_reference,
                'status' => $t->status,
                'amount' => (float) $t->amount,
                'currency' => strtoupper($t->currency),
                'created_at' => $t->created_at?->toIso8601String(),
            ])->values()->all();
        }

        return $payload;
    }
}
