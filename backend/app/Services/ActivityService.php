<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityAttachment;
use App\Models\Mitra;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ActivityService
{
    public function createActivity(array $data, array $files = [], array $names = [], array $descs = []): Activity
    {
        // Menggunakan database transaction untuk memastikan data aktivitas dan attachment tersimpan secara atomik
        return DB::transaction(function () use ($data, $files, $names, $descs) {
            $activity = Activity::create($data);

            $this->handleNewAttachments($activity, $files, $names, $descs);

            return $activity->load(['project', 'mitra', 'attachments']);
        });
    }

    public function updateActivity(
        Activity $activity,
        array $data,
        array $files = [],
        array $names = [],
        array $descs = [],
        array $removedIds = [],
        array $existingIds = [],
        array $existingNames = [],
        array $existingDescs = []
    ): Activity {
        return DB::transaction(function () use (
            $activity, $data, $files, $names, $descs,
            $removedIds, $existingIds, $existingNames, $existingDescs
        ) {
            // Menghapus attachment yang ditandai untuk dihapus oleh user dari storage dan database
            if (!empty($removedIds)) {
                $this->removeAttachments($activity->id, $removedIds);
            }
            $activity->update($data);
            
            // Memperbarui nama dan deskripsi attachment lama yang tidak dihapus
            $this->updateExistingAttachments($activity->id, $existingIds, $existingNames, $existingDescs);
            
            // Memproses file attachment baru yang diunggah
            $this->handleNewAttachments($activity, $files, $names, $descs);

            return $activity->load(['project', 'mitra', 'attachments']);
        });
    }

    public function deleteActivity(Activity $activity): void
    {
        // Wajib menghapus file fisik di storage sebelum menghapus record database agar tidak terjadi file sampah (orphaned files)
        foreach ($activity->attachments as $att) {
            if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                Storage::disk('public')->delete($att->file_path);
            }
        }
        $activity->delete();
    }

    public function getPaginatedActivities(array $filters, int $perPage)
    {
        return Activity::with(['project', 'mitra', 'attachments'])
            ->filter($filters)
            ->paginate($perPage);
    }

    public function getActivityDetail(Activity $activity): Activity
    {
        return $activity->load(['project', 'mitra', 'attachments']);
    }

    public function getFormDependencies(): array
    {
        $projects  = \App\Models\Project::all(['id', 'name', 'mitra_id']);
        $customers = Mitra::where('is_customer', true)->get(['id', 'nama']);
        $vendors   = Mitra::where('is_vendor', true)->get(['id', 'nama']);

        return [
            'projects'      => $projects,
            'customers'     => $customers,
            'vendors'       => $vendors,
            'kategori_list' => [
                'Expense Report', 'Invoice', 'Invoice & FP', 'Purchase Order', 'Purchase Requisition', 'Payment', 'Quotation',
                'Faktur Pajak', 'Kasbon', 'Laporan Teknis', 'Surat Masuk', 'Surat Keluar',
                'Kontrak', 'Berita Acara', 'Receive Item', 'Delivery Order', 'Legalitas', 'Other',
            ],
            'jenis_list'    => ['Internal', 'Customer', 'Vendor']
        ];
    }

    public function getVendorOptions(?int $projectId)
    {
        if (!$projectId) {
            return [];
        }

        // Mencari daftar unik mitra (vendor) yang pernah terlibat dalam proyek tertentu
        $vendorIds = Activity::where('project_id', $projectId)
            ->where('jenis', 'Vendor')
            ->whereNotNull('mitra_id')
            ->pluck('mitra_id')
            ->unique()
            ->values();

        return Mitra::whereIn('id', $vendorIds)->get(['id', 'nama']);
    }

    private function handleNewAttachments(Activity $activity, array $files, array $names, array $descs): void
    {
        foreach ($files as $i => $file) {
            if (!$file) continue;

            // Menyimpan file ke storage public dengan format folder yang terorganisir per activity ID
            $path = $file->store('attachments/activities/' . $activity->id, 'public');
            $displayName = $names[$i] ?? $file->getClientOriginalName();
            $desc = $descs[$i] ?? null;

            $activity->attachments()->create([
                'name'        => $displayName,
                'description' => $desc,
                'file_path'   => $path,
                'mime'        => $file->getMimeType() ?? 'application/octet-stream',
                'size'        => $file->getSize(),
            ]);
        }
    }

    private function removeAttachments(int $activityId, array $removedIds): void
    {
        $toDelete = ActivityAttachment::whereIn('id', $removedIds)
            ->where('activity_id', $activityId)
            ->get();

        /** @var ActivityAttachment $att */
        foreach ($toDelete as $att) {
            if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                Storage::disk('public')->delete($att->file_path);
            }
            $att->delete();
        }
    }

    private function updateExistingAttachments(int $activityId, array $existingIds, array $existingNames, array $existingDescs): void
    {
        $existingIds   = array_values($existingIds);
        $existingNames = array_values($existingNames);
        $existingDescs = array_values($existingDescs);
        foreach ($existingIds as $i => $attId) {
            $att = ActivityAttachment::where('id', $attId)
                ->where('activity_id', $activityId)
                ->first();
            if ($att) {
                if (array_key_exists($i, $existingNames)) {
                    $att->name = $existingNames[$i];
                }
                if (array_key_exists($i, $existingDescs)) {
                    $att->description = $existingDescs[$i];
                }
                $att->save();
            }
        }
    }
}
