<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name', 200);
            $table->date('birth_date')->nullable();
            $table->string('university_registration', 64)->nullable();
            $table->string('sex', 64)->nullable();
            $table->string('contact_email', 254)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->timestamps();
        });
        Schema::create('talent_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->unsignedInteger('version')->default(1);
            foreach (['faculty', 'career', 'interest_area'] as $field) {
                $table->string($field, 200)->nullable();
            }
            $table->string('declared_ppa', 64)->nullable();
            foreach (['province', 'department', 'country'] as $field) {
                $table->boolean('mobility_'.$field)->nullable();
            }
            $table->timestamps();
            $table->index(['created_by', 'updated_at']);
        });
        Schema::create('registration_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('talent_registrations');
            $table->foreignId('actor_id')->constrained('users');
            $table->string('action', 32);
            $table->unsignedInteger('version');
            $table->json('changes');
            $table->timestamps();
            $table->unique(['registration_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_events');
        Schema::dropIfExists('talent_registrations');
        Schema::dropIfExists('people');
    }
};
