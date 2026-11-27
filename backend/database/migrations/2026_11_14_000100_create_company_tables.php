<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** S2.2: la empresa dueña de solicitudes y cargos, y la vinculación explícita usuario–empresa. */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('legal_name', 200)->nullable();
            $table->string('contact_email', 254);
            $table->string('status', 16)->default('active');
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index('status');
        });

        // Vincular exige una operación administrativa: no hay alta por nombre, correo ni dominio.
        Schema::create('company_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies');
            $table->foreignId('user_id')->constrained('users');
            $table->string('role', 32)->default('hr_manager');
            $table->string('status', 16)->default('active');
            $table->foreignId('linked_by_user_id')->nullable()->constrained('users');
            $table->timestamp('linked_at');
            $table->timestamp('disabled_at')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_users');
        Schema::dropIfExists('companies');
    }
};
