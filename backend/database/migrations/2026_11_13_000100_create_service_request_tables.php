<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campos de S11-B: el folio es legible y el código de acceso sólo se guarda hasheado.
        Schema::create('service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('folio', 20)->unique();
            $table->string('status', 16)->default('submitted');
            $table->string('company_name', 200);
            $table->string('contact_name', 200);
            $table->string('contact_position', 200);
            $table->string('contact_area', 200);
            $table->string('contact_email', 254);
            $table->string('contact_phone', 50);
            $table->string('position_title', 200);
            $table->unsignedInteger('vacancies');
            $table->string('modality', 16);
            $table->string('workday', 16);
            $table->string('location', 200);
            $table->string('salary_currency', 3)->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->string('payment_scheme', 16);
            $table->text('benefits');
            $table->string('required_education', 200);
            $table->text('required_knowledge');
            $table->string('required_experience', 200);
            $table->jsonb('languages');
            $table->date('deadline');
            $table->string('access_code_hash', 255);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index(['status', 'deadline']);
        });

        // Campos de S11-C, uno por solicitud y cargo.
        Schema::create('job_descriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->unique()->constrained('service_requests');
            $table->string('position_title', 200);
            $table->string('area', 200);
            $table->string('reports_to', 200);
            $table->string('headcount', 100);
            $table->text('objective');
            $table->jsonb('activities');
            $table->string('required_education', 200);
            $table->text('required_knowledge');
            $table->string('required_experience', 200);
            $table->string('work_schedule', 200);
            $table->string('travel', 16);
            $table->text('work_environment');
            $table->timestamps();
        });

        Schema::create('service_candidates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->constrained('service_requests');
            $table->string('full_name', 200);
            $table->string('contact_email', 254)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index('service_request_id');
        });

        Schema::create('service_request_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->constrained('service_requests');
            $table->foreignId('actor_user_id')->nullable()->constrained('users');
            $table->string('action', 32);
            $table->unsignedInteger('version');
            $table->jsonb('changes');
            $table->timestamps();
            $table->unique(['service_request_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_request_events');
        Schema::dropIfExists('service_candidates');
        Schema::dropIfExists('job_descriptions');
        Schema::dropIfExists('service_requests');
    }
};
