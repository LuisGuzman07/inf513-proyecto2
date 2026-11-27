<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations')->restrictOnDelete();
            $table->foreignUuid('instrument_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->enum('status', ['assigned', 'in_progress', 'submitted'])->default('assigned');
            $table->jsonb('answers');
            $table->timestampTz('submitted_at')->nullable();
            $table->jsonb('raw_result')->nullable();
            $table->timestampsTz();
            $table->unique(['registration_id', 'instrument_version_id'], 'evaluation_registration_instrument_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_assignments');
    }
};
