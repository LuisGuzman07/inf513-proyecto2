<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Additive support for a second response type (ordered pair of halves, 0–6).
 *
 * Hábil keeps `single_choice` and its scalar `correct_option` untouched; only its
 * nullability changes so a `two_halves` exercise can live in the same table without
 * inventing a letter key. No existing row is rewritten.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instrument_versions', function (Blueprint $table) {
            $table->string('answer_type', 32)->default('single_choice');
            // Whether the version may be assigned to candidates at all. Hábil stays true.
            $table->boolean('application_ready')->default(true);
            $table->text('application_blocked_reason')->nullable();
        });

        Schema::table('instrument_exercises', function (Blueprint $table) {
            $table->string('response_type', 32)->default('single_choice');
            // Source key for `two_halves`: ordered pair as written, each 0–6.
            $table->unsignedTinyInteger('correct_first')->nullable();
            $table->unsignedTinyInteger('correct_second')->nullable();
            // Reconstruction is the previewable asset; the original is provenance only.
            $table->string('reconstruction_path')->nullable();
            $table->string('reconstruction_sha256', 64)->nullable();
        });

        // `correct_option` becomes nullable so a two-halves exercise has no fabricated letter.
        DB::statement('ALTER TABLE instrument_exercises ALTER COLUMN correct_option DROP NOT NULL');
        // `points` is meaningless for an unscored instrument type; keep the column but allow absence.
        DB::statement('ALTER TABLE instrument_exercises ALTER COLUMN points DROP NOT NULL');

        DB::statement("ALTER TABLE instrument_exercises ADD CONSTRAINT instrument_exercises_response_type_check CHECK (response_type IN ('single_choice', 'two_halves'))");
        DB::statement("ALTER TABLE instrument_versions ADD CONSTRAINT instrument_versions_answer_type_check CHECK (answer_type IN ('single_choice', 'two_halves'))");

        // Exactly one source-authoritative key per exercise, according to its response type.
        // `BETWEEN` alone lets NULL pass in PostgreSQL, so both halves are checked NOT NULL.
        DB::statement(<<<'SQL'
            ALTER TABLE instrument_exercises ADD CONSTRAINT instrument_exercises_answer_shape_check CHECK (
                (response_type = 'single_choice' AND correct_option IS NOT NULL
                    AND correct_first IS NULL AND correct_second IS NULL)
                OR
                (response_type = 'two_halves' AND correct_option IS NULL AND points IS NULL
                    AND correct_first IS NOT NULL AND correct_first BETWEEN 0 AND 6
                    AND correct_second IS NOT NULL AND correct_second BETWEEN 0 AND 6)
            )
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_answer_shape_check');
        DB::statement('ALTER TABLE instrument_versions DROP CONSTRAINT IF EXISTS instrument_versions_answer_type_check');
        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_response_type_check');

        Schema::table('instrument_exercises', function (Blueprint $table) {
            $table->dropColumn(['response_type', 'correct_first', 'correct_second', 'reconstruction_path', 'reconstruction_sha256']);
        });
        Schema::table('instrument_versions', function (Blueprint $table) {
            $table->dropColumn(['answer_type', 'application_ready', 'application_blocked_reason']);
        });
    }
};
