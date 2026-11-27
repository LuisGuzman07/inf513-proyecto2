<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_email', 254)->nullable();
            $table->string('event', 80)->index();
            $table->string('resource_type', 80)->nullable()->index();
            $table->string('resource_id', 80)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('result', 30)->default('success')->index();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });

        Schema::create('page_visits', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255)->index();
            $table->string('visitor_key', 120)->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('visited_at')->useCurrent()->index();
            $table->index(['path', 'visitor_key', 'visited_at'], 'page_visits_dedup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_visits');
        Schema::dropIfExists('audit_logs');
    }
};
