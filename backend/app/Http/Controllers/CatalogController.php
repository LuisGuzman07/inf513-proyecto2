<?php

namespace App\Http\Controllers;

use App\Models\CatalogCareerOption;
use App\Models\CatalogFaculty;
use App\Support\CatalogSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function faculties(): JsonResponse
    {
        $faculties = CatalogFaculty::where('active', true)->orderBy('name')->get(['catalog_id', 'name', 'group']);

        return response()->json(['data' => $faculties->map(fn ($faculty) => ['id' => $faculty->catalog_id, 'name' => $faculty->name, 'group' => $faculty->group])]);
    }

    public function options(Request $request): JsonResponse
    {
        $input = $request->validate([
            'faculty_id' => ['sometimes', 'nullable', 'string', 'max:128'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);
        $query = CatalogCareerOption::where('active', true);
        if (($input['faculty_id'] ?? null) !== null && $input['faculty_id'] !== '') {
            $query->where('faculty_catalog_id', $input['faculty_id']);
        }
        $options = $query->orderBy('name')->get();
        $search = CatalogSearch::normalize($input['search'] ?? null);
        if ($search !== '') {
            $options = $options->filter(fn ($option) => str_contains(CatalogSearch::normalize($option->name), $search)
                || collect($option->source_names ?? [])->contains(fn ($name) => str_contains(CatalogSearch::normalize((string) $name), $search)));
        }
        $faculties = CatalogFaculty::where('active', true)->get(['catalog_id', 'name'])->keyBy('catalog_id');

        return response()->json(['data' => $options->map(fn ($option) => [
            'id' => $option->catalog_id,
            'faculty_id' => $option->faculty_catalog_id,
            'faculty_name' => $faculties->get($option->faculty_catalog_id)?->name,
            'name' => $option->name,
            'source_names' => array_values($option->source_names ?? []),
            'needs_review' => (bool) $option->needs_review,
        ])->values()]);
    }
}
