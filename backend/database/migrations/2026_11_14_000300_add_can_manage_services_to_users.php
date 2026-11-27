<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * S2.5: capacidad explícita y provisional de gestión de servicios empresariales. Es aditiva y
     * nace en false: ninguna cuenta existente recibe una capacidad nueva por esta migración.
     */
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->boolean('can_manage_services')->default(false));
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('can_manage_services'));
    }
};
