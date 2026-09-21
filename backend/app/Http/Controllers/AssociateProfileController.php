<?php

namespace App\Http\Controllers;

use App\Application\Affiliation\UseCases\FindAssociateByDocumentNumber;
use App\Application\Portal\Contracts\ExportsAssociateProfiles;
use App\Application\Portal\UseCases\ViewAdministrativeAssociateProfile;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Portal\Enums\PortalAuditAction;
use App\Http\Requests\Associates\SearchAssociateProfileRequest;
use App\Models\Associate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssociateProfileController extends Controller
{
    public function search(
        SearchAssociateProfileRequest $request,
        FindAssociateByDocumentNumber $findAssociate,
        ViewAdministrativeAssociateProfile $viewProfile,
        HashesSensitiveData $hasher,
    ): JsonResponse {
        $associate = $findAssociate($request->string('document_number')->toString());

        if (! $associate) {
            return response()->json(['message' => 'No se encontro un asociado para el documento indicado.'], 404);
        }

        return response()->json([
            'data' => $viewProfile($associate, $request->user(), ipHash: $this->ipHash($request, $hasher)),
        ]);
    }

    public function show(
        Request $request,
        Associate $associate,
        ViewAdministrativeAssociateProfile $viewProfile,
        HashesSensitiveData $hasher,
    ): JsonResponse {
        return response()->json([
            'data' => $viewProfile($associate, $request->user(), ipHash: $this->ipHash($request, $hasher)),
        ]);
    }

    public function export(
        Request $request,
        Associate $associate,
        ViewAdministrativeAssociateProfile $viewProfile,
        ExportsAssociateProfiles $exporter,
        HashesSensitiveData $hasher,
    ): Response {
        $profile = $viewProfile(
            $associate,
            $request->user(),
            PortalAuditAction::AssociateProfileExported,
            $this->ipHash($request, $hasher),
        );

        return response($exporter->spreadsheet($profile), 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="ficha-asociado-'.$associate->id.'.xlsx"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function ipHash(Request $request, HashesSensitiveData $hasher): ?string
    {
        return $request->ip() ? $hasher->ip((string) $request->ip()) : null;
    }
}
