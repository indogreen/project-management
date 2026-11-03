<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Inventory;
use App\Models\Item;
use App\Models\Project;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class WarehouseModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_create_and_update_work_without_slug(): void
    {
        $this->authenticate(['category-create', 'category-update']);

        $response = $this->postJson('/api/categories', [
            'name' => 'Electrical',
            'type' => 'item',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Electrical')
            ->assertJsonPath('data.type', 'item');

        $this->assertArrayNotHasKey('slug', $response->json('data'));

        $categoryId = $response->json('data.id');

        $updateResponse = $this->putJson("/api/categories/{$categoryId}", [
            'name' => 'Electrical Components',
            'type' => 'item',
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.name', 'Electrical Components');

        $this->assertArrayNotHasKey('slug', $updateResponse->json('data'));
    }

    public function test_duplicate_category_names_are_blocked_only_within_the_same_type(): void
    {
        $this->authenticate(['category-create']);

        $this->postJson('/api/categories', [
            'name' => 'Materials',
            'type' => 'item',
        ])->assertCreated();

        $this->postJson('/api/categories', [
            'name' => 'Materials',
            'type' => 'item',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->postJson('/api/categories', [
            'name' => 'Materials',
            'type' => 'project',
        ])->assertCreated();
    }

    public function test_category_delete_is_blocked_when_items_exist(): void
    {
        $this->authenticate(['category-delete']);

        $category = Category::create(['name' => 'Item Category', 'type' => 'item']);
        $this->createItem($category);

        $this->deleteJson("/api/categories/{$category->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_item_create_rejects_non_item_categories(): void
    {
        $this->authenticate(['item-create']);

        $category = Category::create(['name' => 'Project Category', 'type' => 'project']);

        $this->postJson('/api/items', [
            'sku' => 'SKU-PROJECT-CAT',
            'category_id' => $category->id,
            'name' => 'Invalid Category Item',
            'unit' => 'pcs',
            'minimum_stock' => 0,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('category_id');
    }

    public function test_inbound_increases_inventory_and_writes_a_movement(): void
    {
        $this->authenticate(['stock-movement-create']);

        $item = $this->createItem();
        $warehouse = Warehouse::create(['name' => 'Main Warehouse']);

        $this->postJson('/api/stock-movements/inbound', [
            'item_id' => $item->id,
            'destination_warehouse_id' => $warehouse->id,
            'quantity' => 10,
            'notes' => 'Initial stock',
        ])->assertCreated()
            ->assertJsonPath('data.type', 'inbound')
            ->assertJsonPath('data.quantity', 10);

        $this->assertDatabaseHas('inventories', [
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 10,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'type' => 'inbound',
            'item_id' => $item->id,
            'destination_warehouse_id' => $warehouse->id,
            'quantity' => 10,
        ]);
    }

    public function test_outbound_fails_atomically_on_insufficient_stock(): void
    {
        $this->authenticate(['stock-movement-create']);

        $item = $this->createItem();
        $warehouse = Warehouse::create(['name' => 'Main Warehouse']);
        Inventory::create([
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 3,
        ]);

        $this->postJson('/api/stock-movements/outbound', [
            'item_id' => $item->id,
            'source_warehouse_id' => $warehouse->id,
            'quantity' => 5,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');

        $this->assertDatabaseHas('inventories', [
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 3,
        ]);

        $this->assertDatabaseMissing('stock_movements', [
            'type' => 'outbound',
            'item_id' => $item->id,
        ]);
    }

    public function test_transfer_updates_both_warehouses_atomically(): void
    {
        $this->authenticate(['stock-movement-create']);

        $item = $this->createItem();
        $source = Warehouse::create(['name' => 'Source Warehouse']);
        $destination = Warehouse::create(['name' => 'Destination Warehouse']);

        Inventory::create(['item_id' => $item->id, 'warehouse_id' => $source->id, 'quantity' => 10]);
        Inventory::create(['item_id' => $item->id, 'warehouse_id' => $destination->id, 'quantity' => 2]);

        $this->postJson('/api/stock-movements/transfer', [
            'item_id' => $item->id,
            'source_warehouse_id' => $source->id,
            'destination_warehouse_id' => $destination->id,
            'quantity' => 4,
        ])->assertCreated()
            ->assertJsonPath('data.type', 'transfer');

        $this->assertDatabaseHas('inventories', [
            'item_id' => $item->id,
            'warehouse_id' => $source->id,
            'quantity' => 6,
        ]);

        $this->assertDatabaseHas('inventories', [
            'item_id' => $item->id,
            'warehouse_id' => $destination->id,
            'quantity' => 6,
        ]);
    }

    public function test_project_allocation_decrements_inventory_and_creates_allocation_records(): void
    {
        $this->authenticate(['stock-movement-create']);

        $item = $this->createItem();
        $warehouse = Warehouse::create(['name' => 'Main Warehouse']);
        $project = Project::create([
            'name' => 'Solar Project',
            'description' => 'Project used for warehouse module tests.',
            'start_date' => '2026-06-01',
        ]);

        Inventory::create([
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 10,
        ]);

        $this->postJson('/api/stock-movements/allocate-project', [
            'project_id' => $project->id,
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 4,
            'notes' => 'Allocated to installation team',
        ])->assertCreated()
            ->assertJsonPath('data.type', 'project_allocation');

        $this->assertDatabaseHas('inventories', [
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 6,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'type' => 'project_allocation',
            'item_id' => $item->id,
            'project_id' => $project->id,
            'quantity' => 4,
        ]);

        $this->assertDatabaseHas('project_materials', [
            'project_id' => $project->id,
            'item_id' => $item->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 4,
        ]);
    }

    public function test_stock_movement_show_returns_existing_movement(): void
    {
        $this->authenticate(['stock-movement-view']);

        $item = $this->createItem();
        $warehouse = Warehouse::create(['name' => 'Main Warehouse']);
        $movement = StockMovement::create([
            'type' => 'inbound',
            'item_id' => $item->id,
            'destination_warehouse_id' => $warehouse->id,
            'quantity' => 3,
            'occurred_at' => now(),
        ]);

        $this->getJson("/api/stock-movements/{$movement->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $movement->id)
            ->assertJsonPath('data.type', 'inbound');
    }

    public function test_stock_movement_update_and_delete_routes_are_available(): void
    {
        $this->assertTrue(Route::has('stock-movements.update'));
        $this->assertTrue(Route::has('stock-movements.destroy'));
    }

    private function authenticate(array $permissions): User
    {
        $guard = config('auth.defaults.guard', 'api');

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => $guard,
            ]);
        }

        $user = User::factory()->create();
        $user->givePermissionTo($permissions);

        $this->actingAs($user, $guard);

        return $user;
    }

    private function createItem(?Category $category = null): Item
    {
        $category ??= Category::create([
            'name' => 'Default Item Category',
            'type' => 'item',
        ]);

        return Item::create([
            'sku' => 'SKU-'.uniqid(),
            'category_id' => $category->id,
            'name' => 'Solar Panel',
            'unit' => 'pcs',
            'minimum_stock' => 0,
        ]);
    }
}
