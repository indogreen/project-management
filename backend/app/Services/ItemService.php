<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Item;
use App\Models\ItemAttachment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ItemService
{
    public function getPaginatedItems(array $filters, int $perPage): LengthAwarePaginator
    {
        return Item::query()
            ->with(['category', 'inventories.warehouse', 'itemAttachments'])
            ->when($filters['category_id'] ?? null, fn ($query, $categoryId) => $query->where('category_id', $categoryId))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $like = "%{$search}%";

                $query->where(function ($q) use ($like) {
                    $q->where('name', 'like', $like)
                        ->orWhere('sku', 'like', $like);
                });
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function createItem(array $data, array $files = [], array $names = [], array $descs = []): Item
    {
        return DB::transaction(function () use ($data, $files, $names, $descs) {
            $item = Item::create($data);

            $this->handleNewAttachments($item, $files, $names, $descs);

            return $item->load(['category', 'inventories.warehouse', 'itemAttachments']);
        });
    }

    public function getItemDetail(Item $item): Item
    {
        return $item->load(['category', 'inventories.warehouse', 'itemAttachments']);
    }

    public function updateItem(
        Item $item,
        array $data,
        array $files = [],
        array $names = [],
        array $descs = [],
        array $removedIds = [],
        array $existingIds = [],
        array $existingNames = [],
        array $existingDescs = []
    ): Item {
        return DB::transaction(function () use (
            $item, $data, $files, $names, $descs,
            $removedIds, $existingIds, $existingNames, $existingDescs
        ) {
            if (!empty($removedIds)) {
                $this->removeAttachments($item->id, $removedIds);
            }

            $item->update($data);

            $this->updateExistingAttachments($item->id, $existingIds, $existingNames, $existingDescs);
            $this->handleNewAttachments($item, $files, $names, $descs);

            return $item->load(['category', 'inventories.warehouse', 'itemAttachments']);
        });
    }

    public function deleteItem(Item $item): void
    {
        if (
            $item->inventories()->exists()
            || $item->stockMovements()->exists()
            || $item->projectMaterials()->exists()
        ) {
            throw ValidationException::withMessages([
                'item' => 'Item cannot be deleted because it already has inventory or stock history.',
            ]);
        }

        // Hapus file fisik dari storage sebelum delete record
        foreach ($item->itemAttachments as $att) {
            if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                Storage::disk('public')->delete($att->file_path);
            }
        }

        $item->delete();
    }

    private function handleNewAttachments(Item $item, array $files, array $names, array $descs): void
    {
        foreach ($files as $i => $file) {
            if (!$file) continue;

            $path = $file->store('attachments/items/' . $item->id, 'public');
            $displayName = $names[$i] ?? $file->getClientOriginalName();
            $desc = $descs[$i] ?? null;

            $item->itemAttachments()->create([
                'name'        => $displayName,
                'description' => $desc,
                'file_path'   => $path,
                'mime'        => $file->getMimeType() ?? 'application/octet-stream',
                'size'        => $file->getSize(),
            ]);
        }
    }

    private function removeAttachments(int $itemId, array $removedIds): void
    {
        $toDelete = ItemAttachment::whereIn('id', $removedIds)
            ->where('item_id', $itemId)
            ->get();

        foreach ($toDelete as $att) {
            if ($att->file_path && Storage::disk('public')->exists($att->file_path)) {
                Storage::disk('public')->delete($att->file_path);
            }
            $att->delete();
        }
    }

    private function updateExistingAttachments(int $itemId, array $existingIds, array $existingNames, array $existingDescs): void
    {
        $existingIds   = array_values($existingIds);
        $existingNames = array_values($existingNames);
        $existingDescs = array_values($existingDescs);

        foreach ($existingIds as $i => $attId) {
            $att = ItemAttachment::where('id', $attId)
                ->where('item_id', $itemId)
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
