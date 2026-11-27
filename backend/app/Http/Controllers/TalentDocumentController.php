<?php

namespace App\Http\Controllers;

use App\Models\RegistrationDocument;
use App\Models\TalentRegistration;
use App\Support\TalentWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class TalentDocumentController extends Controller
{
    public function store(Request $request, string $id): JsonResponse
    {
        $registration = TalentRegistration::where('holder_user_id', $request->user()->id)->findOrFail($id);
        Gate::authorize('update', $registration);
        $input = TalentWorkflow::input($request, ['version' => ['required', 'integer', 'min:1'], 'type' => ['required', Rule::in(RegistrationDocument::TYPES)], 'file' => ['required', 'file', 'max:10240']]);
        $file = $request->file('file');
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file->getPathname());
        $extensions = ['application/pdf' => ['pdf'], 'image/jpeg' => ['jpg', 'jpeg'], 'image/png' => ['png']];
        $extension = strtolower($file->getClientOriginalExtension());
        if (! in_array($extension, $extensions[$mime] ?? [], true) || ($input['type'] === 'fotografia' && $mime === 'application/pdf')) {
            throw ValidationException::withMessages(['file' => 'El archivo debe ser PDF, JPEG o PNG con extensión coherente; fotografía solo JPEG/PNG.']);
        }
        $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $name = preg_replace('/[^\pL\pN._ -]/u', '_', $name);
        $name = mb_substr(trim($name, '. '), 0, 190);
        if ($name === '') {
            $name = 'documento.'.$extension;
        }
        $path = 'talent/'.$id.'/'.Str::uuid().'.'.$extension;
        $disk = Storage::disk('talent_private');
        try {
            $document = DB::transaction(function () use ($request, $id, $input, $file, $mime, $name, $path, $disk) {
                $registration = TalentRegistration::where('holder_user_id', $request->user()->id)->lockForUpdate()->findOrFail($id);
                Gate::authorize('update', $registration);
                TalentWorkflow::editable($registration);
                TalentWorkflow::version($registration, (int) $input['version']);
                if (! $disk->putFileAs(dirname($path), $file, basename($path))) {
                    throw new \RuntimeException('Private storage failed.');
                }
                $document = $registration->documents()->create(['type' => $input['type'], 'version' => 1 + (int) $registration->documents()->where('type', $input['type'])->max('version'), 'path' => $path, 'original_name' => $name, 'mime' => $mime, 'size' => $file->getSize(), 'actor_id' => $request->user()->id]);
                TalentWorkflow::event($registration, $request->user()->id, 'document_uploaded', ['document' => ['before' => null, 'after' => $document->metadata()]]);

                return [$document, $registration->version];
            });
        } catch (Throwable $exception) {
            $disk->delete($path);
            throw $exception;
        }

        return response()->json(['data' => ['document' => $document[0]->metadata(), 'registration_version' => $document[1]]], 201);
    }

    public function download(Request $request, string $id, string $documentId): StreamedResponse
    {
        $registration = TalentRegistration::findOrFail($id);
        abort_unless(Gate::allows('view', $registration), 404);
        $document = $registration->documents()->findOrFail($documentId);
        abort_unless(Storage::disk('talent_private')->exists($document->path), 404);

        return Storage::disk('talent_private')->download($document->path, $document->original_name, ['Content-Type' => $document->mime, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
