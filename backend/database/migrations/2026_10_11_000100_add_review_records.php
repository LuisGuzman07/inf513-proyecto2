<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->string('reviewed_ppa', 64)->nullable();
            $table->string('declared_ppa_snapshot', 64)->nullable();
            $table->uuid('historico_document_id');
            $table->unsignedInteger('historico_document_version');
            $table->unsignedInteger('sequence');
            $table->text('observations');
            $table->timestamps();
            $table->unique(['registration_id', 'sequence']);
            $table->index('registration_id');
        });
        Schema::create('cv_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->uuid('cv_document_id')->nullable();
            $table->unsignedInteger('cv_document_version')->nullable();
            $table->boolean('absent')->default(false);
            $table->unsignedInteger('sequence');
            $table->text('observations');
            $table->timestamps();
            $table->unique(['registration_id', 'sequence']);
            $table->index('registration_id');
        });
        Schema::table('registration_observations', function (Blueprint $table) {
            $table->unsignedInteger('event_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('registration_observations', function (Blueprint $table) {
            $table->dropColumn('event_version');
        });
        Schema::dropIfExists('cv_reviews');
        Schema::dropIfExists('academic_reviews');
    }
};
