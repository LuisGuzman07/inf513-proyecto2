<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\ServiceCandidate;
use App\Models\ServiceRequest;
use App\Models\TalentRegistration;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GlobalSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        if (mb_strlen($query) < 2) {
            return response()->json([
                'data' => [
                    'query' => $query,
                    'groups' => [],
                    'total' => 0,
                ],
            ]);
        }

        $pattern = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query).'%';
        /** @var User|null $user */
        $user = $request->user() ?? Auth::guard('web')->user();
        if ($user && ! $user->isAccountActive()) {
            $user = null;
        }

        $groups = [];

        // 1. Contenido público (siempre disponible)
        $publicPages = [
            ['title' => 'Inicio · Portal UAGRM', 'subtitle' => 'Página principal del sistema de selección', 'url' => '/'],
            ['title' => 'Banco público de candidatos', 'subtitle' => 'Consulta perfiles anónimos de postulantes', 'url' => '/banco-candidatos'],
            ['title' => 'Solicitar servicio empresarial', 'subtitle' => 'Registro público de requerimiento de personal', 'url' => '/servicios/solicitud'],
            ['title' => 'Consultar solicitud empresarial', 'subtitle' => 'Seguimiento mediante folio y código', 'url' => '/servicios/consulta'],
            ['title' => 'Servicios para empresas', 'subtitle' => 'Información institucional para organizaciones', 'url' => '/servicios-empresariales'],
        ];

        $lowerQuery = mb_strtolower($query);
        $publicMatches = array_values(array_map(
            fn ($p) => ['id' => $p['url'], 'title' => $p['title'], 'subtitle' => $p['subtitle'], 'url' => $p['url']],
            array_filter($publicPages, fn ($p) => str_contains(mb_strtolower($p['title'].' '.$p['subtitle']), $lowerQuery))
        ));

        $publicCandidates = TalentRegistration::query()
            ->whereNotNull('candidate_code')
            ->whereNotIn('status', ['draft', 'legacy_internal'])
            ->where(function ($q) use ($pattern) {
                $q->where('candidate_code', 'ilike', $pattern)
                    ->orWhere('career', 'ilike', $pattern)
                    ->orWhere('faculty', 'ilike', $pattern);
            })
            ->limit(5)
            ->get(['id', 'candidate_code', 'career', 'faculty']);

        foreach ($publicCandidates as $cand) {
            $publicMatches[] = [
                'id' => 'pub-'.$cand->id,
                'title' => "Postulante {$cand->candidate_code}",
                'subtitle' => trim(($cand->career ?? '').' · '.($cand->faculty ?? ''), ' ·'),
                'url' => '/banco-candidatos',
            ];
        }

        if ($publicMatches !== []) {
            $groups[] = [
                'key' => 'publico',
                'label' => 'Contenido público',
                'items' => array_slice($publicMatches, 0, 8),
            ];
        }

        if ($user) {
            $activeCompanyIds = $user->companyUsers()
                ->whereHas('company', fn ($q) => $q->where('status', 'active'))
                ->pluck('company_id')
                ->all();

            // 2. Talento y expedientes
            $canReview = $user->hasPermission('talento.revision.gestionar');
            $canOwnTalent = $user->hasPermission('talento.inscripcion.gestionar');

            if ($canReview || $canOwnTalent) {
                $talentQuery = TalentRegistration::query()
                    ->with('person:id,full_name,university_registration')
                    ->where(function ($q) use ($pattern) {
                        $q->where('career', 'ilike', $pattern)
                            ->orWhere('faculty', 'ilike', $pattern)
                            ->orWhere('candidate_code', 'ilike', $pattern)
                            ->orWhereHas('person', function ($pq) use ($pattern) {
                                $pq->where('full_name', 'ilike', $pattern)
                                    ->orWhere('university_registration', 'ilike', $pattern);
                            });
                    });

                if (! $canReview) {
                    $talentQuery->where('holder_user_id', $user->id);
                }

                $talentItems = $talentQuery->limit(6)->get()->map(function (TalentRegistration $reg) use ($canReview) {
                    $name = $reg->person?->full_name ?: ($reg->candidate_code ?: 'Expediente');

                    return [
                        'id' => $reg->id,
                        'title' => $name,
                        'subtitle' => trim(($reg->career ?? '').' · Estado: '.$reg->status, ' ·'),
                        'url' => $canReview
                            ? "/personal/inscripciones/{$reg->id}"
                            : "/portal/inscripciones/{$reg->id}",
                    ];
                })->values()->all();

                if ($talentItems !== []) {
                    $groups[] = [
                        'key' => 'talento',
                        'label' => 'Talento y expedientes',
                        'items' => $talentItems,
                    ];
                }
            }

            // 3. Empresas, solicitudes, cargos y candidatos
            $canManageServices = $user->hasPermission('servicios.gestionar');
            $canCompanyServices = $user->hasPermission('empresa.servicios.consultar') && $activeCompanyIds !== [];

            if ($canManageServices || $canCompanyServices) {
                $companyQuery = Company::query()->where('name', 'ilike', $pattern);
                if (! $canManageServices) {
                    $companyQuery->whereIn('id', $activeCompanyIds)->where('status', 'active');
                }
                $companyItems = $companyQuery->limit(5)->get()->map(fn (Company $c) => [
                    'id' => $c->id,
                    'title' => $c->name,
                    'subtitle' => 'Empresa · '.$c->status,
                    'url' => $canManageServices ? '/personal/servicios' : '/empresa/servicios',
                ])->values()->all();

                if ($companyItems !== []) {
                    $groups[] = [
                        'key' => 'empresas',
                        'label' => 'Empresas',
                        'items' => $companyItems,
                    ];
                }

                $reqQuery = ServiceRequest::query()->where(function ($q) use ($pattern) {
                    $q->where('position_title', 'ilike', $pattern)
                        ->orWhere('company_name', 'ilike', $pattern)
                        ->orWhere('location', 'ilike', $pattern);
                });
                if (! $canManageServices) {
                    $reqQuery->whereIn('company_id', $activeCompanyIds);
                }
                $reqItems = $reqQuery->limit(6)->get()->map(fn (ServiceRequest $sr) => [
                    'id' => $sr->id,
                    'title' => $sr->position_title ?: 'Solicitud empresarial',
                    'subtitle' => trim(($sr->company_name ?? '').' · '.$sr->status, ' ·'),
                    'url' => $canManageServices ? "/personal/servicios/{$sr->id}" : "/empresa/servicios/{$sr->id}",
                ])->values()->all();

                if ($reqItems !== []) {
                    $groups[] = [
                        'key' => 'solicitudes',
                        'label' => 'Solicitudes y cargos',
                        'items' => $reqItems,
                    ];
                }

                $candQuery = ServiceCandidate::query()
                    ->with('serviceRequest:id,position_title,company_id')
                    ->where(function ($q) use ($pattern) {
                        $q->where('full_name', 'ilike', $pattern)
                            ->orWhere('contact_email', 'ilike', $pattern);
                    });
                if (! $canManageServices) {
                    $candQuery->whereHas('serviceRequest', fn ($sq) => $sq->whereIn('company_id', $activeCompanyIds));
                }
                $candItems = $candQuery->limit(5)->get()->map(fn (ServiceCandidate $sc) => [
                    'id' => $sc->id,
                    'title' => $sc->full_name,
                    'subtitle' => $sc->serviceRequest?->position_title ?? 'Candidato en proceso',
                    'url' => $canManageServices
                        ? "/personal/servicios/{$sc->service_request_id}"
                        : "/empresa/servicios/{$sc->service_request_id}",
                ])->values()->all();

                if ($candItems !== []) {
                    $groups[] = [
                        'key' => 'candidatos',
                        'label' => 'Candidatos',
                        'items' => $candItems,
                    ];
                }
            }
        }

        $total = array_sum(array_map(fn ($g) => count($g['items']), $groups));

        return response()->json([
            'data' => [
                'query' => $query,
                'groups' => $groups,
                'total' => $total,
            ],
        ]);
    }
}
