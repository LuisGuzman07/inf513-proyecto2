<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_curricula', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->unique()->constrained('talent_registrations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // 1. Datos del puesto y generales
            $table->string('target_position', 200)->nullable();
            $table->date('application_date')->nullable();
            $table->string('identity_card', 64)->nullable();
            $table->string('birth_date_and_age', 128)->nullable();
            $table->string('contact_phone', 100)->nullable();
            $table->string('contact_email', 254)->nullable();
            $table->text('address')->nullable();
            $table->string('expected_salary', 100)->nullable();
            $table->string('incorporation_availability', 100)->nullable();

            // 2. Formación académica y conocimientos técnicos
            $table->jsonb('education_levels')->nullable();
            $table->text('technical_knowledge')->nullable();
            $table->text('languages')->nullable();
            $table->jsonb('courses')->nullable();

            // 3. Historial laboral / Experiencia (Empleo 1, Empleo 2...)
            $table->jsonb('work_experiences')->nullable();

            // 4. Condiciones y disponibilidad laboral
            $table->string('work_modality', 64)->nullable();
            $table->string('schedule_availability', 64)->nullable();
            $table->string('travel_availability', 64)->nullable();
            $table->string('driver_license', 128)->nullable();
            $table->text('relatives_in_company')->nullable();

            // 5. Declaración y autorización
            $table->boolean('declaration_accepted')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_curricula');
    }
};
