<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\PaymentTransaction;
use App\Models\StripeEvent;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $webhookSecret = (string) config('services.stripe.webhook_secret');
        if ($webhookSecret === '') {
            return response()->json(['message' => 'Webhook de Stripe no configurado.'], 503);
        }

        $payload = $request->getContent();
        $sigHeader = (string) $request->header('Stripe-Signature', '');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (UnexpectedValueException|SignatureVerificationException) {
            AuditLogger::log($request, 'stripe.webhook_invalid_signature', 'denied', 'donation', null);

            return response()->json(['message' => 'Firma de webhook inválida.'], 400);
        }

        // Idempotencia: si el evento ya fue procesado, responder 200 sin duplicar
        if (StripeEvent::query()->where('event_id', $event->id)->exists()) {
            return response()->json(['received' => true, 'duplicate' => true]);
        }

        DB::transaction(function () use ($event, $request) {
            StripeEvent::query()->create([
                'event_id' => $event->id,
                'event_type' => $event->type,
                'processed_at' => now(),
            ]);

            $object = $event->data->object;
            $donation = $this->resolveDonation($event->type, $object);

            if (! $donation) {
                return;
            }

            if ($event->type === 'checkout.session.completed') {
                if (($object->payment_status ?? null) === 'paid') {
                    $this->markDonationStatus($request, $donation, 'confirmed', $object->payment_intent ?? null, $event->id, $event->type);
                }
            } elseif ($event->type === 'checkout.session.expired') {
                if ($donation->status === 'pending') {
                    $this->markDonationStatus($request, $donation, 'cancelled', null, $event->id, $event->type);
                }
            } elseif ($event->type === 'payment_intent.succeeded') {
                $this->markDonationStatus($request, $donation, 'confirmed', $object->id ?? null, $event->id, $event->type);
            } elseif ($event->type === 'payment_intent.payment_failed') {
                if ($donation->status === 'pending') {
                    $this->markDonationStatus($request, $donation, 'rejected', $object->id ?? null, $event->id, $event->type);
                }
            } elseif ($event->type === 'charge.refunded') {
                $this->markDonationStatus($request, $donation, 'refunded', $object->payment_intent ?? null, $event->id, $event->type);
            }
        });

        return response()->json(['received' => true]);
    }

    private function resolveDonation(string $type, object $object): ?Donation
    {
        $donationId = $object->metadata->donation_id ?? null;
        if ($donationId) {
            $found = Donation::query()->find($donationId);
            if ($found) {
                return $found;
            }
        }

        if (str_starts_with($type, 'checkout.session.') && ! empty($object->id)) {
            return Donation::query()->where('stripe_checkout_session_id', $object->id)->first();
        }

        $intentId = $object->payment_intent ?? ($type === 'payment_intent.succeeded' || $type === 'payment_intent.payment_failed' ? ($object->id ?? null) : null);
        if ($intentId) {
            return Donation::query()->where('stripe_payment_intent_id', $intentId)->first();
        }

        return null;
    }

    private function markDonationStatus(
        Request $request,
        Donation $donation,
        string $status,
        ?string $paymentIntentId,
        string $eventId,
        string $eventType
    ): void {
        $donation->status = $status;
        if ($paymentIntentId) {
            $donation->stripe_payment_intent_id = $paymentIntentId;
        }
        if ($status === 'confirmed' && ! $donation->confirmed_at) {
            $donation->confirmed_at = now();
        }
        $donation->save();

        PaymentTransaction::query()->create([
            'donation_id' => $donation->id,
            'provider' => 'stripe',
            'provider_reference' => $paymentIntentId ?? $eventId,
            'status' => $status,
            'amount' => $donation->amount,
            'currency' => $donation->currency,
            'payload_summary' => [
                'stripe_event_id' => $eventId,
                'stripe_event_type' => $eventType,
            ],
        ]);

        AuditLogger::log(
            $request,
            "donation.{$status}",
            $status === 'rejected' ? 'failed' : 'success',
            'donation',
            $donation->id,
            ['company_id' => $donation->company_id, 'stripe_event' => $eventType],
            $donation->user_id
        );
    }
}
