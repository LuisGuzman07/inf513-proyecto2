<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->string('candidate_code', 32)->nullable()->unique();
        });

        // Backfill existing talent registrations with sequential codes
        $registrations = DB::table('talent_registrations')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'created_at']);

        $seq = 1;
        $currentYear = date('Y');
        foreach ($registrations as $reg) {
            $year = $reg->created_at ? substr($reg->created_at, 0, 4) : $currentYear;
            $code = sprintf('POST-%s-%04d', $year, $seq++);
            DB::table('talent_registrations')->where('id', $reg->id)->update([
                'candidate_code' => $code,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('talent_registrations', function (Blueprint $table) {
            $table->dropColumn('candidate_code');
        });
    }
};
