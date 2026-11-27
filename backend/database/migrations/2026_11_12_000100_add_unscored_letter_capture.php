<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Additive support for a letter-capture instrument: one option among a version-defined set,
 * with no source key and no scoring (16 FP forms A/B).
 *
 * Hábil keeps `single_choice` with its key and scoring; Dominós keeps `two_halves`. Text-only
 * instruments have no figure, so the image columns become nullable instead of carrying a fake
 * asset, and the example image becomes optional.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instrument_versions', function (Blueprint $table) {
            // Option labels rendered to the candidate, e.g. ["A","B","C"]. Null means A–H.
            $table->jsonb('option_labels')->nullable();
            // Whether a submission may produce a scored raw result.
            $table->boolean('scoring_enabled')->default(true);
        });

        Schema::table('instrument_exercises', function (Blueprint $table) {
            $table->string('image_path')->nullable()->change();
            $table->string('original_path')->nullable()->change();
            $table->string('image_sha256', 64)->nullable()->change();
            $table->string('original_sha256', 64)->nullable()->change();
            // Text-only items: the stem and its three alternatives live as data, not as an image.
            $table->text('texto')->nullable();
            $table->jsonb('opciones')->nullable();
        });
        Schema::table('instrument_versions', function (Blueprint $table) {
            $table->string('example_image_path')->nullable()->change();
        });

        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_response_type_check');
        DB::statement('ALTER TABLE instrument_versions DROP CONSTRAINT IF EXISTS instrument_versions_answer_type_check');
        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_answer_shape_check');

        DB::statement("ALTER TABLE instrument_exercises ADD CONSTRAINT instrument_exercises_response_type_check CHECK (response_type IN ('single_choice', 'single_choice_unscored', 'two_halves'))");
        DB::statement("ALTER TABLE instrument_versions ADD CONSTRAINT instrument_versions_answer_type_check CHECK (answer_type IN ('single_choice', 'single_choice_unscored', 'two_halves'))");

        // Exactly one source-authoritative key per exercise, according to its response type.
        // An unscored capture exercise has NO key: absence of a key is the point, not a gap.
        DB::statement(<<<'SQL'
            ALTER TABLE instrument_exercises ADD CONSTRAINT instrument_exercises_answer_shape_check CHECK (
                (response_type = 'single_choice' AND correct_option IS NOT NULL
                    AND correct_first IS NULL AND correct_second IS NULL)
                OR
                (response_type = 'single_choice_unscored' AND correct_option IS NULL
                    AND correct_first IS NULL AND correct_second IS NULL AND points IS NULL)
                OR
                (response_type = 'two_halves' AND correct_option IS NULL AND points IS NULL
                    AND correct_first IS NOT NULL AND correct_first BETWEEN 0 AND 6
                    AND correct_second IS NOT NULL AND correct_second BETWEEN 0 AND 6)
            )
        SQL);
    }

    public function down(): void
    {
        if (DB::table('instrument_exercises')->where('response_type', 'single_choice_unscored')->exists()) {
            throw new RuntimeException('Hay ejercicios de captura sin calificación; no se revierte la migración sobre datos vivos.');
        }
        if (DB::table('instrument_exercises')->whereNull('image_path')->exists()) {
            throw new RuntimeException('Hay ejercicios sin imagen; no se restaura la obligatoriedad sobre datos vivos.');
        }

        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_answer_shape_check');
        DB::statement('ALTER TABLE instrument_versions DROP CONSTRAINT IF EXISTS instrument_versions_answer_type_check');
        DB::statement('ALTER TABLE instrument_exercises DROP CONSTRAINT IF EXISTS instrument_exercises_response_type_check');

        DB::statement("ALTER TABLE instrument_exercises ADD CONSTRAINT instrument_exercises_response_type_check CHECK (response_type IN ('single_choice', 'two_halves'))");
        DB::statement("ALTER TABLE instrument_versions ADD CONSTRAINT instrument_versions_answer_type_check CHECK (answer_type IN ('single_choice', 'two_halves'))");
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

        Schema::table('instrument_versions', function (Blueprint $table) {
            $table->dropColumn(['option_labels', 'scoring_enabled']);
        });
        Schema::table('instrument_exercises', function (Blueprint $table) {
            $table->dropColumn(['texto', 'opciones']);
        });
    }
};
