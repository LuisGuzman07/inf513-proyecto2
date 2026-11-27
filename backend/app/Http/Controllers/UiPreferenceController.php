<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UiPreferenceController extends Controller
{
    public const DEFAULTS = [
        'theme_variant' => 'adultos',
        'color_mode' => 'light',
        'font_scale' => 'normal',
        'high_contrast' => false,
    ];

    public function show(Request $request): JsonResponse
    {
        $prefs = array_merge(self::DEFAULTS, $request->user()->ui_preferences ?? []);

        return response()->json(['data' => $prefs]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme_variant' => ['required', Rule::in(['ninos', 'jovenes', 'adultos'])],
            'color_mode' => ['required', Rule::in(['light', 'dark', 'auto'])],
            'font_scale' => ['required', Rule::in(['small', 'normal', 'large', 'xlarge'])],
            'high_contrast' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->ui_preferences = $validated;
        $user->save();

        return response()->json([
            'message' => 'Preferencias de apariencia guardadas.',
            'data' => $validated,
        ]);
    }
}
