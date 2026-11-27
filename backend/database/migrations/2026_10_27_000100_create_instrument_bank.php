<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instrument_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('version_label');
            $table->date('package_date');
            $table->string('manifest_sha256', 64)->unique();
            $table->string('source_review_state');
            $table->text('instructions');
            $table->text('instructions_source_markdown');
            $table->text('example_text');
            $table->string('example_image_path');
            $table->string('storage_prefix');
            $table->jsonb('manifest');
            $table->jsonb('source_file_hashes');
            $table->timestamps();
        });
        Schema::create('instrument_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instrument_version_id')->constrained()->restrictOnDelete();
            $table->string('source_id');
            $table->unsignedSmallInteger('number');
            $table->char('correct_option', 1);
            $table->unsignedSmallInteger('points')->default(1);
            $table->string('image_path');
            $table->string('original_path');
            $table->text('answer_markdown');
            $table->string('image_sha256', 64);
            $table->string('original_sha256', 64);
            $table->string('source_review_state');
            $table->text('review_note');
            $table->timestamps();
            $table->unique(['instrument_version_id', 'source_id']);
            $table->unique(['instrument_version_id', 'number']);
        });
        Schema::create('instrument_conformities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instrument_version_id')->unique()->constrained()->restrictOnDelete();
            $table->string('reviewer_name');
            $table->text('statement');
            $table->timestampTz('recorded_at');
            $table->boolean('institutional_approval')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instrument_conformities');
        Schema::dropIfExists('instrument_exercises');
        Schema::dropIfExists('instrument_versions');
    }
};
