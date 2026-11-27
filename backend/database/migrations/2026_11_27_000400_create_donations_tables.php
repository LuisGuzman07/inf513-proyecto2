<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('usd');
            $table->string('status', 30)->default('pending')->index();
            $table->string('description', 255)->nullable();
            $table->string('stripe_checkout_session_id', 255)->nullable()->unique();
            $table->string('stripe_payment_intent_id', 255)->nullable()->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('donation_id')->constrained('donations')->cascadeOnDelete();
            $table->string('provider', 30)->default('stripe');
            $table->string('provider_reference', 255)->nullable()->index();
            $table->string('status', 30);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10);
            $table->json('payload_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('stripe_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 255)->unique();
            $table->string('event_type', 120);
            $table->timestamp('processed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stripe_events');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('donations');
    }
};
