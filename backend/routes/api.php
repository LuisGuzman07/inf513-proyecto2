<?php

use App\Http\Controllers\AdminCompanyController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminRbacController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidateCvController;
use App\Http\Controllers\CandidatePoolController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CompanyDirectoryController;
use App\Http\Controllers\CompanyDonationController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InstrumentBankController;
use App\Http\Controllers\PageVisitController;
use App\Http\Controllers\PaymentManagementController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ServiceAccessController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\ServiceRequestStaffController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\TalentDocumentController;
use App\Http\Controllers\TalentReviewController;
use App\Http\Controllers\TalentSubmissionController;
use App\Http\Controllers\UiPreferenceController;
use App\Http\Middleware\EnsurePilotEnabled;
use App\Http\Middleware\RequirePilotSpaSession;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle']);
Route::get('/buscar', [GlobalSearchController::class, 'index'])->middleware(['throttle:60,1']);
Route::post('/visitas', [PageVisitController::class, 'store'])->middleware(['throttle:120,1']);
Route::get('/visitas/resumen', [PageVisitController::class, 'summary'])->middleware(['throttle:120,1']);

Route::post('/auth/login', [AuthController::class, 'login'])->name('login')->middleware([RequirePilotSpaSession::class, 'throttle:5,1']);
Route::post('/auth/register', [AuthController::class, 'register'])->middleware([RequirePilotSpaSession::class, 'throttle:5,1']);
Route::post('/servicios/solicitudes', [ServiceRequestController::class, 'store'])->middleware([RequirePilotSpaSession::class, 'throttle:5,1']);
Route::post('/servicios/consulta', [ServiceRequestController::class, 'consult'])->middleware([RequirePilotSpaSession::class, 'throttle:5,1']);
Route::get('/banco-candidatos', [CandidatePoolController::class, 'index'])->middleware(['throttle:60,1']);
Route::get('/banco-candidatos/{candidateCode}', [CandidatePoolController::class, 'show'])->middleware(['throttle:60,1']);
Route::middleware([RequirePilotSpaSession::class, 'auth:sanctum', EnsurePilotEnabled::class])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/preferencias-ui', [UiPreferenceController::class, 'show']);
    Route::put('/preferencias-ui', [UiPreferenceController::class, 'update']);
    Route::get('/empresa/mis-empresas', [CompanyDirectoryController::class, 'index']);
    Route::middleware('permission:empresa.donativos.gestionar')->group(function () {
        Route::get('/empresa/donativos', [CompanyDonationController::class, 'index']);
        Route::get('/empresa/donativos/{donation}', [CompanyDonationController::class, 'show'])->whereUuid('donation');
        Route::post('/empresa/donativos', [CompanyDonationController::class, 'store']);
        Route::post('/empresa/donativos/{donation}/confirmar', [CompanyDonationController::class, 'confirm'])->whereUuid('donation');

        Route::get('/empresa/metodos-pago', [PaymentManagementController::class, 'methodsIndex']);
        Route::post('/empresa/metodos-pago', [PaymentManagementController::class, 'storeMethod']);
        Route::patch('/empresa/metodos-pago/{paymentMethod}/predeterminado', [PaymentManagementController::class, 'setDefaultMethod'])->whereUuid('paymentMethod');
        Route::delete('/empresa/metodos-pago/{paymentMethod}', [PaymentManagementController::class, 'destroyMethod'])->whereUuid('paymentMethod');

        Route::get('/empresa/planes-pago', [PaymentManagementController::class, 'plansIndex']);
        Route::post('/empresa/planes-pago', [PaymentManagementController::class, 'storePlan']);
        Route::patch('/empresa/planes-pago/{paymentPlan}', [PaymentManagementController::class, 'updatePlanStatus'])->whereUuid('paymentPlan');
    });
    Route::get('/servicios/acceso', [ServiceAccessController::class, 'show']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/catalogo/facultades', [CatalogController::class, 'faculties']);
    Route::get('/catalogo/carreras', [CatalogController::class, 'options']);
    Route::get('/talento/inscripciones', [RegistrationController::class, 'index']);
    Route::post('/talento/inscripciones', [RegistrationController::class, 'store']);
    Route::get('/talento/inscripciones/{id}', [RegistrationController::class, 'show'])->whereUuid('id');
    Route::patch('/talento/inscripciones/{id}', [RegistrationController::class, 'update'])->whereUuid('id');
    Route::get('/talento/inscripciones/{id}/historial', [RegistrationController::class, 'history'])->whereUuid('id');
    Route::post('/talento/inscripciones/{id}/enviar', [TalentSubmissionController::class, 'store'])->whereUuid('id');
    Route::post('/talento/inscripciones/{id}/documentos', [TalentDocumentController::class, 'store'])->whereUuid('id');
    Route::get('/talento/inscripciones/{id}/documentos/{documentId}/descargar', [TalentDocumentController::class, 'download'])->whereUuid(['id', 'documentId']);
    Route::get('/talento/inscripciones/{id}/cv', [CandidateCvController::class, 'show'])->whereUuid('id');
    Route::put('/talento/inscripciones/{id}/cv', [CandidateCvController::class, 'save'])->whereUuid('id');
    Route::get('/talento/inscripciones/{id}/observaciones', [TalentReviewController::class, 'observations'])->whereUuid('id');
    Route::get('/personal/servicios', [ServiceRequestStaffController::class, 'index']);
    Route::post('/personal/servicios', [ServiceRequestStaffController::class, 'store']);
    Route::get('/personal/servicios/{id}', [ServiceRequestStaffController::class, 'show'])->whereUuid('id');
    Route::patch('/personal/servicios/{id}', [ServiceRequestStaffController::class, 'update'])->whereUuid('id');
    Route::put('/personal/servicios/{id}/descripcion', [ServiceRequestStaffController::class, 'updateDescription'])->whereUuid('id');
    Route::post('/personal/servicios/{id}/candidatos', [ServiceRequestStaffController::class, 'storeCandidate'])->whereUuid('id');
    Route::patch('/personal/servicios/{id}/candidatos/{candidate}', [ServiceRequestStaffController::class, 'updateCandidate'])->whereUuid(['id', 'candidate']);
    Route::post('/personal/servicios/{id}/empresa', [ServiceRequestStaffController::class, 'linkCompany'])->whereUuid('id');
    Route::get('/personal/inscripciones', [TalentReviewController::class, 'index']);
    Route::get('/personal/inscripciones/{id}', [TalentReviewController::class, 'show'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/tomar', [TalentReviewController::class, 'claim'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/observaciones', [TalentReviewController::class, 'note'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/solicitar-correccion', [TalentReviewController::class, 'correction'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/concluir-revision', [TalentReviewController::class, 'conclude'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/revision-academica', [TalentReviewController::class, 'academicReview'])->whereUuid('id');
    Route::post('/personal/inscripciones/{id}/revision-cv', [TalentReviewController::class, 'cvReview'])->whereUuid('id');
    Route::get('/personal/inscripciones/{id}/cv', [CandidateCvController::class, 'staffShow'])->whereUuid('id');
    Route::get('/personal/instrumentos', [InstrumentBankController::class, 'index']);
    Route::get('/personal/instrumentos/{version}', [InstrumentBankController::class, 'show'])->whereUuid('version');
    Route::get('/personal/instrumentos/{version}/imagenes/{kind}/{sourceId}', [InstrumentBankController::class, 'image'])->whereUuid('version');
    Route::get('/personal/inscripciones/{registration}/evaluaciones', [EvaluationController::class, 'staffIndex'])->whereUuid('registration');
    Route::post('/personal/inscripciones/{registration}/evaluaciones', [EvaluationController::class, 'assign'])->whereUuid('registration');
    Route::get('/personal/evaluaciones/{assignment}', [EvaluationController::class, 'staffShow'])->whereUuid('assignment');
    Route::get('/talento/evaluaciones', [EvaluationController::class, 'index']);
    Route::post('/talento/evaluaciones/autoasignar-logro', [EvaluationController::class, 'autoAssignMcClelland']);
    Route::get('/talento/evaluaciones/{assignment}', [EvaluationController::class, 'show'])->whereUuid('assignment');
    Route::get('/talento/evaluaciones/{assignment}/imagenes/{sourceId}', [EvaluationController::class, 'image'])->whereUuid('assignment');
    Route::patch('/talento/evaluaciones/{assignment}/respuestas', [EvaluationController::class, 'saveAnswers'])->whereUuid('assignment');
    Route::post('/talento/evaluaciones/{assignment}/enviar', [EvaluationController::class, 'submit'])->whereUuid('assignment');
    Route::get('/personal/banco-candidatos', [CandidatePoolController::class, 'index']);
    Route::get('/personal/banco-candidatos/{candidateCode}', [CandidatePoolController::class, 'show']);

    Route::middleware('permission:servicios.gestionar,admin.usuarios.gestionar')->group(function () {
        Route::get('/personal/empresas', [AdminCompanyController::class, 'index']);
        Route::post('/personal/empresas', [AdminCompanyController::class, 'store']);
        Route::patch('/personal/empresas/{company}', [AdminCompanyController::class, 'update'])->whereUuid('company');
        Route::post('/personal/empresas/{company}/vincular', [AdminCompanyController::class, 'linkUser'])->whereUuid('company');
        Route::patch('/personal/empresas/{company}/usuarios/{companyUser}', [AdminCompanyController::class, 'toggleUserLink'])->whereUuid(['company', 'companyUser']);
    });

    Route::prefix('admin')->group(function () {
        Route::middleware('permission:admin.usuarios.gestionar')->group(function () {
            Route::get('/usuarios', [AdminRbacController::class, 'users']);
            Route::get('/usuarios/{user}', [AdminRbacController::class, 'showUser']);
            Route::patch('/usuarios/{user}/estado', [AdminRbacController::class, 'updateUserStatus']);
            Route::put('/usuarios/{user}/roles', [AdminRbacController::class, 'syncUserRoles']);
        });
        Route::middleware('permission:admin.roles.gestionar')->group(function () {
            Route::get('/roles', [AdminRbacController::class, 'roles']);
            Route::post('/roles', [AdminRbacController::class, 'storeRole']);
            Route::patch('/roles/{role}', [AdminRbacController::class, 'updateRole']);
        });
        Route::middleware('permission:admin.permisos.gestionar')->group(function () {
            Route::get('/permisos', [AdminRbacController::class, 'permissions']);
            Route::post('/permisos', [AdminRbacController::class, 'storePermission']);
            Route::patch('/permisos/{permission}', [AdminRbacController::class, 'updatePermission']);
        });
        Route::middleware('permission:admin.auditoria.ver')->group(function () {
            Route::get('/auditoria', [AuditLogController::class, 'index']);
        });
        Route::middleware('permission:admin.dashboard.ver')->group(function () {
            Route::get('/dashboard', [AdminDashboardController::class, 'show']);
        });
    });
});
