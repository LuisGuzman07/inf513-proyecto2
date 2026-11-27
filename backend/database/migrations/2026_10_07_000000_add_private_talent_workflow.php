<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', fn (Blueprint $table) => $table->string('full_name', 200)->nullable()->change());
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_graduate')->default(false);
            $table->boolean('can_review_talent')->default(false);
            $table->foreignUuid('person_id')->nullable()->constrained('people');
        });
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->foreignId('holder_user_id')->nullable()->unique()->constrained('users');
            $table->foreignId('reviewer_user_id')->nullable()->constrained('users');
            $table->string('status', 32)->default('legacy_internal');
            $table->timestamp('submitted_at')->nullable();
            $table->index(['status', 'reviewer_user_id']);
        });
        Schema::create('registration_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations');
            $table->foreignId('actor_id')->constrained('users');
            $table->string('type', 32);
            $table->unsignedInteger('version');
            $table->string('path');
            $table->string('original_name', 200);
            $table->string('mime', 64);
            $table->unsignedBigInteger('size');
            $table->timestamps();
            $table->unique(['registration_id', 'type', 'version']);
        });
        Schema::create('registration_observations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->string('kind', 32);
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_observations');
        Schema::dropIfExists('registration_documents');
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->dropIndex(['status', 'reviewer_user_id']);
            $table->dropConstrainedForeignId('holder_user_id');
            $table->dropConstrainedForeignId('reviewer_user_id');
            $table->dropColumn(['status', 'submitted_at']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('person_id');
            $table->dropColumn(['is_graduate', 'can_review_talent']);
        });
    }
};
