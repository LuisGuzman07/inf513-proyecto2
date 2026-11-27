<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('label', 120);
            $table->string('brand', 40)->default('Visa');
            $table->string('last4', 4);
            $table->unsignedTinyInteger('exp_month');
            $table->unsignedSmallInteger('exp_year');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('payment_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('name', 150);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('bob');
            $table->string('frequency', 30)->default('mensual');
            $table->unsignedInteger('installments')->default(1);
            $table->unsignedInteger('completed_installments')->default(0);
            $table->string('status', 30)->default('active')->index();
            $table->date('next_due_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_plans');
        Schema::dropIfExists('payment_methods');
    }
};
