<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateAttachment;
use App\Models\Project;
use App\Models\BarangCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CertificateService
{
    public function getPaginatedCertificates(array $filters, int $perPage)
    {
        $query = Certificate::with(['project', 'barangCertificate', 'attachments']);

        $query->filter($filters);

        $sortBy  = $filters['sort_by'] ?? 'created';
        $sortDir = strtolower($filters['sort_dir'] ?? 'desc');
        if (!in_array($sortDir, ['asc','desc'], true)) $sortDir = 'desc';

        if ($sortBy === 'date_of_issue') {
            $query->orderBy('date_of_issue', $sortDir)->orderBy('id', $sortDir);
        } elseif ($sortBy === 'date_of_expired') {
            $query->orderBy('date_of_expired', $sortDir)->orderBy('id', $sortDir);
        } else {
            $query->orderBy('id', $sortDir);
        }

        return $query->paginate($perPage);
    }

    public function getCertificateDetail(Certificate $certificate): Certificate
    {
        return $certificate->load(['project', 'barangCertificate', 'attachments']);
    }

    public function getBarangByProjectId($projectId)
    {
        $project = Project::find($projectId);
        if (!$project) return [];

        return BarangCertificate::where('mitra_id', $project->mitra_id)
            ->select('id', 'name', 'no_seri')
            ->get();
    }

    public function getFormDependencies(Request $request): array
    {
        $projects = Project::select('id', 'name')->get();
        $barangCertificates = BarangCertificate::select('id', 'name', 'no_seri')->get();
        $statuses = ['Belum', 'Tidak Aktif', 'Aktif'];

        $barangOptions = [];
        if ($request->filled('project_id')) {
            $barangOptions = $this->getBarangByProjectId($request->project_id);
        }

        return [
            'projects' => $projects,
            'barang_certificates' => $barangCertificates,
            'statuses' => $statuses,
            'barang_options' => $barangOptions,
        ];
    }

    public function createCertificate(array $validatedData, array $files = [], array $names = [], array $descs = []): Certificate
    {
        return DB::transaction(function () use ($validatedData, $files, $names, $descs) {
            $certificate = Certificate::create($validatedData);

            $this->handleNewAttachments($certificate, $files, $names, $descs);

            return $certificate->load(['project', 'barangCertificate', 'attachments']);
        });
    }

    public function updateCertificate(
        Certificate $certificate, 
        array $validatedData,
        array $removedIds = [],
        array $existingIds = [],
        array $existingNames = [],
        array $existingDescs = [],
        array $files = [], 
        array $names = [], 
        array $descs = []
    ): Certificate {
        return DB::transaction(function () use (
            $certificate, $validatedData, 
            $removedIds, $existingIds, $existingNames, $existingDescs, 
            $files, $names, $descs
        ) {
            if (!empty($removedIds)) {
                $toDelete = CertificateAttachment::whereIn('id', $removedIds)
                    ->where('certificate_id', $certificate->id)
                    ->get();

                /** @var CertificateAttachment $att */
                foreach ($toDelete as $att) {
                    if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                        Storage::disk('public')->delete($att->file_path);
                    }
                    $att->delete();
                }
            }

            $certificate->update($validatedData);

            $existingIdsValues = array_values($existingIds);
            $existingNamesValues = array_values($existingNames);
            $existingDescsValues = array_values($existingDescs);

            foreach ($existingIdsValues as $i => $attId) {
                $att = CertificateAttachment::where('id', $attId)
                    ->where('certificate_id', $certificate->id)
                    ->first();

                if ($att) {
                    if (array_key_exists($i, $existingNamesValues)) {
                        $att->name = $existingNamesValues[$i];
                    }
                    if (array_key_exists($i, $existingDescsValues)) {
                        $att->description = $existingDescsValues[$i];
                    }
                    $att->save();
                }
            }

            $this->handleNewAttachments($certificate, $files, $names, $descs);

            return $certificate->load(['project', 'barangCertificate', 'attachments']);
        });
    }

    public function deleteCertificate(Certificate $certificate): void
    {
        foreach ($certificate->attachments as $att) {
            if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                Storage::disk('public')->delete($att->file_path);
            }
        }
        
        if ($certificate->attachment && Storage::disk('public')->exists($certificate->attachment)) {
            Storage::disk('public')->delete($certificate->attachment);
        }

        $certificate->delete();
    }

    protected function handleNewAttachments(Certificate $certificate, array $files, array $names, array $descs): void
    {
        foreach ($files as $i => $file) {
            if (!$file) continue;

            $path = $file->store('attachments/certificates/' . $certificate->id, 'public');
            $displayName = $names[$i] ?? $file->getClientOriginalName();
            $desc = $descs[$i] ?? null;

            $certificate->attachments()->create([
                'name'        => $displayName,
                'description' => $desc,
                'file_path'   => $path,
                'mime'        => $file->getMimeType() ?? 'application/octet-stream',
                'size'        => $file->getSize(),
            ]);
        }
    }
}
