<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_faculties', function (Blueprint $table) {
            $table->string('catalog_id', 128)->primary();
            $table->string('name', 200);
            $table->string('group', 32);
            $table->string('official_url', 500)->nullable();
            $table->date('consulted_at')->nullable();
            $table->string('state', 64);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->index(['active', 'name']);
        });
        Schema::create('catalog_career_options', function (Blueprint $table) {
            $table->string('catalog_id', 128)->primary();
            $table->string('faculty_catalog_id', 128)->index();
            $table->string('name', 200);
            $table->json('source_names')->nullable();
            $table->json('admission_refs')->nullable();
            $table->string('evidence', 64)->nullable();
            $table->boolean('needs_review')->default(false);
            $table->json('notes')->nullable();
            $table->string('catalog_version', 64);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->index(['faculty_catalog_id', 'active']);
            $table->index(['active', 'name']);
        });
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->string('faculty_catalog_id', 128)->nullable()->index();
            $table->string('career_catalog_id', 128)->nullable()->index();
            $table->string('catalog_label', 400)->nullable();
            $table->string('catalog_version', 64)->nullable();
            $table->boolean('career_manual')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->dropColumn(['faculty_catalog_id', 'career_catalog_id', 'catalog_label', 'catalog_version', 'career_manual']);
        });
        Schema::dropIfExists('catalog_career_options');
        Schema::dropIfExists('catalog_faculties');
    }
};
