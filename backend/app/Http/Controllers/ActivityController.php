<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Http\Requests\ActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Services\ActivityService;
use App\Services\AIDocumentExtractionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 10);
        $allowed = [10, 25, 50, 100];
        if (!in_array($perPage, $allowed, true)) {
            $perPage = 10;
        }

        $activities = $this->activityService->getPaginatedActivities($request->all(), $perPage);

        $vendorOptions = [];
        if ($request->filled('project_id')) {
            $vendorOptions = $this->activityService->getVendorOptions((int) $request->project_id);
        }

        return ActivityResource::collection($activities)->additional([
            'message' => 'Activities retrieved successfully',
            'vendor_options' => $vendorOptions,
            'form_dependencies' => $this->activityService->getFormDependencies()
        ]);
    }

    public function store(ActivityRequest $request)
    {
        $validated = $request->validated();

        if ($request->input('action') === 'extract') {
            try {
                $document = $request->file('document');
                $projectId = $request->input('project_id') ? (int) $request->input('project_id') : null;

                $extractedData = $this->aiService->extract($document, $projectId);

                return response()->json([
                    'message' => 'Document extracted successfully',
                    'data' => $extractedData,
                ]);
            } catch (\Exception $e) {
                Log::error('AI Extraction Error: ' . $e->getMessage(), [
                    'exception' => $e,
                ]);
                return response()->json([
                    'message' => 'Failed to extract document',
                    'error' => 'Gagal memproses dokumen via AI. Silakan coba beberapa saat lagi atau hubungi administrator.',
                ], 500);
            }
        }

        $files = $request->file('attachments', []);
        $names = $request->input('attachment_names', []);
        $descs = $request->input('attachment_descriptions', []);

        $activity = $this->activityService->createActivity($validated, $files, $names, $descs);

        return response()->json([
            'message' => 'Activity created successfully',
            'data' => new ActivityResource($activity),
        ], 201);
    }

    public function show(Activity $activity)
    {
        try {
            $this->activityService->getActivityDetail($activity);

            return (new ActivityResource($activity))->additional([
                'message' => 'Activity retrieved successfully',
                'form_dependencies' => $this->activityService->getFormDependencies()
            ]);
        } catch (\Exception $e) {
            Log::error('Error showing activity: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return response()->json([
                'message' => 'Failed to retrieve activity',
                'error' => 'Gagal mengambil data aktivitas. Silakan coba beberapa saat lagi.',
            ], 500);
        }
    }

    public function update(ActivityRequest $request, Activity $activity)
    {
        $validated = $request->validated();

        $files         = $request->file('attachments', []);
        $names         = $request->input('attachment_names', []);
        $descs         = $request->input('attachment_descriptions', []);
        $removedIds    = $request->input('removed_existing_ids', []);
        $existingIds   = $request->input('existing_attachment_ids', []);
        $existingNames = $request->input('existing_attachment_names', []);
        $existingDescs = $request->input('existing_attachment_descriptions', []);

        $activity = $this->activityService->updateActivity(
            $activity, $validated, $files, $names, $descs,
            $removedIds, $existingIds, $existingNames, $existingDescs
        );

        return response()->json([
            'message' => 'Activity updated successfully',
            'data' => new ActivityResource($activity),
        ]);
    }

    public function destroy(Activity $activity)
    {
        $this->activityService->deleteActivity($activity);

        return response()->json([
            'message' => 'Activity deleted successfully'
        ]);
    }

    public function __construct(
        protected ActivityService $activityService,
        protected AIDocumentExtractionService $aiService
    ) {
        $this->middleware('permission:activity-view')->only(['index', 'show']);
        $this->middleware('permission:activity-create')->only(['store']);
        $this->middleware('permission:activity-update')->only(['update']);
        $this->middleware('permission:activity-delete')->only(['destroy']);
    }
}
