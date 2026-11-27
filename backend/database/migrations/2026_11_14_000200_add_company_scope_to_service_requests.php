<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * S2.2: una solicitud pública nace sin empresa (company_id nullable) y sólo una operación de
     * personal la vincula. El historial distingue al responsable empresarial, al personal y al público.
     */
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->foreignUuid('company_id')->nullable()->constrained('companies');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users');
            $table->index(['company_id', 'status']);
        });

        Schema::table('service_request_events', function (Blueprint $table) {
            $table->string('actor_kind', 16)->default('staff');
        });

        // Las altas públicas anteriores no tienen actor con cuenta: se marcan como públicas.
        DB::table('service_request_events')
            ->whereNull('actor_user_id')
            ->where('action', 'submitted')
            ->update(['actor_kind' => 'public']);
    }

    public function down(): void
    {
        Schema::table('service_request_events', function (Blueprint $table) {
            $table->dropColumn('actor_kind');
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'status']);
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
