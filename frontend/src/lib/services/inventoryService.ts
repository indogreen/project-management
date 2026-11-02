import axiosClient from '$lib/axiosClient';
import {
  normalizeMeta,
  type Category,
  type CategoryType,
  type Item,
  type PaginatedResponse,
  type PaginationMeta,
  type ProjectOption,
  type StockMovement,
  type StockMovementType,
  type Warehouse
} from '$lib/inventory';
import type { ExistingAttachment } from '$lib/types';
import { appendAttachments, appendScalar } from '$lib/utils/form-data';

export type InventoryListResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type CategoryFilterParams = {
  search?: string;
  type?: CategoryType;
  page?: number;
  per_page?: number;
};

export type CategoryForm = {
  name: string;
  type: CategoryType;
};

export type ItemFilterParams = {
  search?: string;
  category_id?: string | number;
  page?: number;
  per_page?: number;
};

export type ItemForm = {
  sku: string;
  category_id: number | '';
  name: string;
  unit: string;
  minimum_stock: number | '';
  attachments?: File[];
  attachment_names?: string[];
  attachment_descriptions?: Array<string | null>;
};

export type ItemEditForm = ItemForm & {
  existing_attachments?: ExistingAttachment[];
  removed_existing_ids?: number[];
};

export type WarehouseFilterParams = {
  search?: string;
  page?: number;
  per_page?: number;
};

export type WarehouseForm = {
  name: string;
  location: string;
};

export type StockMovementFilterParams = {
  type?: StockMovementType;
  item_id?: string | number;
  warehouse_id?: string | number;
  project_id?: string | number;
  page?: number;
  per_page?: number;
};

export type StockMovementAction = 'inbound' | 'outbound' | 'transfer' | 'allocate-project';

export type StockMovementPayload = {
  item_id: number;
  quantity: number;
  notes?: string;
  source_warehouse_id?: number;
  destination_warehouse_id?: number;
  warehouse_id?: number;
  project_id?: number;
  occurred_at?: string;
  allocated_at?: string;
  placement?: string;
};

function listResult<T>(payload: PaginatedResponse<T>): InventoryListResult<T> {
  const data = payload.data ?? [];

  return {
    data,
    meta: normalizeMeta(payload, data.length)
  };
}

/** Fetches category records for the inventory module. */
export async function fetchCategories(
  params: CategoryFilterParams = {}
): Promise<InventoryListResult<Category>> {
  const response = await axiosClient.get<PaginatedResponse<Category>>('/categories', {
    params
  });

  return listResult(response.data);
}

/** Creates a category record. */
export async function createCategory(form: CategoryForm): Promise<Category> {
  const response = await axiosClient.post<{ data: Category }>('/categories', form);
  return response.data.data;
}

/** Updates a category record. */
export async function updateCategory(id: number, form: CategoryForm): Promise<Category> {
  const response = await axiosClient.put<{ data: Category }>(`/categories/${id}`, form);
  return response.data.data;
}

/** Deletes a category record. */
export async function deleteCategory(id: number): Promise<void> {
  await axiosClient.delete(`/categories/${id}`);
}

const MULTIPART_HEADERS = {
  'Content-Type': 'multipart/form-data'
} as const;

export function buildItemFormData(data: ItemForm | ItemEditForm): FormData {
  const fd = new FormData();
  appendScalar(fd, 'sku', data.sku);
  appendScalar(fd, 'category_id', data.category_id);
  appendScalar(fd, 'name', data.name);
  appendScalar(fd, 'unit', data.unit);
  appendScalar(fd, 'minimum_stock', data.minimum_stock);

  appendAttachments(fd, data);
  return fd;
}

/** Fetches item records and their stock summaries. */
export async function fetchItems(
  params: ItemFilterParams = {}
): Promise<InventoryListResult<Item>> {
  const response = await axiosClient.get<PaginatedResponse<Item>>('/items', {
    params
  });

  return listResult(response.data);
}

/** Fetches a single item record. */
export async function fetchItem(id: number): Promise<Item> {
  const response = await axiosClient.get<{ data: Item }>(`/items/${id}`);
  return response.data.data;
}

/** Creates an item record. */
export async function createItem(form: ItemForm): Promise<Item> {
  const formData = buildItemFormData(form);
  const response = await axiosClient.post<{ data: Item }>('/items', formData, {
    headers: MULTIPART_HEADERS
  });
  return response.data.data;
}

/** Updates an item record. */
export async function updateItem(id: number, form: ItemEditForm): Promise<Item> {
  const formData = buildItemFormData(form);
  formData.append('_method', 'PUT');
  const response = await axiosClient.post<{ data: Item }>(`/items/${id}`, formData, {
    headers: MULTIPART_HEADERS
  });
  return response.data.data;
}

/** Deletes an item record. */
export async function deleteItem(id: number): Promise<void> {
  await axiosClient.delete(`/items/${id}`);
}

/** Fetches warehouse records for the inventory module. */
export async function fetchWarehouses(
  params: WarehouseFilterParams = {}
): Promise<InventoryListResult<Warehouse>> {
  const response = await axiosClient.get<PaginatedResponse<Warehouse>>('/warehouses', {
    params
  });

  return listResult(response.data);
}

/** Fetches one warehouse with inventory detail rows. */
export async function fetchWarehouse(id: number): Promise<Warehouse> {
  const response = await axiosClient.get<{ data: Warehouse }>(`/warehouses/${id}`);
  return response.data.data;
}

/** Creates a warehouse record. */
export async function createWarehouse(form: WarehouseForm): Promise<Warehouse> {
  const response = await axiosClient.post<{ data: Warehouse }>('/warehouses', form);
  return response.data.data;
}

/** Updates a warehouse record. */
export async function updateWarehouse(id: number, form: WarehouseForm): Promise<Warehouse> {
  const response = await axiosClient.put<{ data: Warehouse }>(`/warehouses/${id}`, form);
  return response.data.data;
}

/** Deletes a warehouse record. */
export async function deleteWarehouse(id: number): Promise<void> {
  await axiosClient.delete(`/warehouses/${id}`);
}

/** Fetches stock movement ledger rows. */
export async function fetchStockMovements(
  params: StockMovementFilterParams = {}
): Promise<InventoryListResult<StockMovement>> {
  const response = await axiosClient.get<PaginatedResponse<StockMovement>>('/stock-movements', {
    params
  });

  return listResult(response.data);
}

/** Creates a stock movement through the selected action endpoint. */
export async function createStockMovement(
  action: StockMovementAction,
  payload: StockMovementPayload
): Promise<StockMovement> {
  const response = await axiosClient.post<{ data: StockMovement }>(
    `/stock-movements/${action}`,
    payload
  );

  return response.data.data;
}

/** Fetches a single stock movement. */
export async function fetchStockMovement(id: number): Promise<StockMovement> {
  const response = await axiosClient.get<{ data: StockMovement }>(`/stock-movements/${id}`);
  return response.data.data;
}

/** Updates a stock movement. */
export async function updateStockMovement(
  id: number,
  payload: { quantity: number; notes?: string | null; occurred_at?: string | null }
): Promise<StockMovement> {
  const response = await axiosClient.put<{ data: StockMovement }>(
    `/stock-movements/${id}`,
    payload
  );
  return response.data.data;
}

/** Deletes a stock movement. */
export async function deleteStockMovement(id: number): Promise<void> {
  await axiosClient.delete(`/stock-movements/${id}`);
}

/** Fetches lightweight project options for stock movement allocation. */
export async function fetchProjectOptions(): Promise<ProjectOption[]> {
  const response = await axiosClient.get<PaginatedResponse<ProjectOption>>('/projects', {
    params: { per_page: 100 }
  });

  return (response.data.data ?? []).map((project) => ({
    id: project.id,
    name: project.name
  }));
}
