import { type StockMovement, type StockMovementType } from '$lib/inventory';
import type { StockMovementAction, StockMovementPayload } from '$lib/services/inventoryService';

export type MovementAction = StockMovementAction;

export type MovementForm = {
  item_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  warehouse_id: string;
  project_id: string;
  quantity: number;
  notes: string;
  occurred_at: string;
  allocated_at: string;
  placement: string;
};

export function emptyMovementForm(): MovementForm {
  return {
    item_id: '',
    source_warehouse_id: '',
    destination_warehouse_id: '',
    warehouse_id: '',
    project_id: '',
    quantity: 1,
    notes: '',
    occurred_at: '',
    allocated_at: '',
    placement: ''
  };
}

export function actionLabel(action: MovementAction): string {
  const labels: Record<MovementAction, string> = {
    inbound: 'Inbound',
    outbound: 'Outbound',
    transfer: 'Transfer',
    'allocate-project': 'Alokasi'
  };
  return labels[action];
}

export function movementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    inbound: 'Masuk',
    outbound: 'Keluar',
    transfer: 'Transfer',
    project_allocation: 'Alokasi'
  };
  return labels[type] ?? type;
}

export function movementBadgeClasses(type: StockMovementType): string {
  const classes: Record<StockMovementType, string> = {
    inbound: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    outbound: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    project_allocation: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
  };
  return classes[type];
}

export function warehouseFlow(movement: StockMovement): string {
  if (movement.type === 'inbound') return movement.destination_warehouse?.name ?? '-';
  if (movement.type === 'outbound' || movement.type === 'project_allocation') {
    return movement.source_warehouse?.name ?? '-';
  }
  return `${movement.source_warehouse?.name ?? '-'} -> ${movement.destination_warehouse?.name ?? '-'}`;
}

export function buildMovementPayload(
  form: MovementForm,
  action: MovementAction
): StockMovementPayload {
  const base = {
    item_id: Number(form.item_id),
    quantity: Number(form.quantity),
    notes: form.notes || undefined
  };

  if (action === 'inbound') {
    return {
      ...base,
      destination_warehouse_id: Number(form.destination_warehouse_id),
      occurred_at: form.occurred_at || undefined,
      placement: form.placement || undefined
    };
  }
  if (action === 'outbound') {
    return {
      ...base,
      source_warehouse_id: Number(form.source_warehouse_id),
      occurred_at: form.occurred_at || undefined
    };
  }
  if (action === 'transfer') {
    return {
      ...base,
      source_warehouse_id: Number(form.source_warehouse_id),
      destination_warehouse_id: Number(form.destination_warehouse_id),
      occurred_at: form.occurred_at || undefined,
      placement: form.placement || undefined
    };
  }
  return {
    ...base,
    project_id: Number(form.project_id),
    warehouse_id: Number(form.warehouse_id),
    allocated_at: form.allocated_at || undefined
  };
}

export type MovementEditForm = {
  quantity: number;
  notes: string;
  occurred_at: string;
};

export function emptyMovementEditForm(): MovementEditForm {
  return {
    quantity: 1,
    notes: '',
    occurred_at: ''
  };
}
