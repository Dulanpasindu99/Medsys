'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportPanel,
  ViewportScrollBody,
  ViewportTabs,
} from '../components/ui/ViewportLayout';
import { type InventoryItemView, toString, useInventoryBoard } from './inventory/hooks/useInventoryBoard';

const UNIT_OPTIONS = ['tablet', 'capsule', 'ml', 'vial', 'kit', 'bottle', 'piece'];
const PACKAGE_OPTIONS = ['box', 'pack', 'bottle', 'strip', 'unit'];
const DOSAGE_FORM_OPTIONS = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'kit', 'dressing', 'other'];
const ROUTE_OPTIONS = ['oral', 'topical', 'iv', 'im', 'nasal', 'ophthalmic', 'other'];
const SUBCATEGORY_OPTIONS = ['tablet', 'capsule', 'syrup', 'injection', 'medical kit', 'consumable', 'dressing', 'test item', 'equipment support', 'other'];

function badgeClass(tone: 'slate' | 'amber' | 'rose' | 'emerald' | 'sky' = 'slate') {
  if (tone === 'amber') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (tone === 'rose') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (tone === 'emerald') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (tone === 'sky') return 'bg-sky-50 text-sky-700 ring-sky-100';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function MetricCard({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  tone?: 'slate' | 'amber' | 'rose' | 'emerald' | 'sky';
}) {
  return (
    <div className={`rounded-3xl px-4 py-4 ring-1 ${badgeClass(tone)} bg-white/85`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {hint ? <p className="text-[0.78rem] leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ItemSignals({ item }: { item: InventoryItemView }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        item.stockStatus === 'in_stock'
          ? badgeClass('emerald')
          : item.stockStatus === 'low_stock' || item.stockStatus === 'near_expiry'
            ? badgeClass('amber')
            : badgeClass('rose')
      }`}>
        {item.stockStatus.replace(/_/g, ' ')}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass(item.isActive ? 'emerald' : 'slate')}`}>
        {item.isActive ? 'Active' : 'Inactive'}
      </span>
      {item.lowStock ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('amber')}`}>Low stock</span> : null}
      {item.stockoutRisk ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('rose')}`}>Stockout risk</span> : null}
    </div>
  );
}

function InventoryTable({
  items,
  selectedItemId,
  onSelect,
  onEdit,
}: {
  items: InventoryItemView[];
  selectedItemId: number | null;
  onSelect: (id: number | null) => void;
  onEdit: (item: InventoryItemView) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
      <table className="min-w-[1120px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {['SKU', 'Name', 'Category', 'Unit', 'Package', 'Supplier', 'Stock', 'Reorder', 'Lead Time', 'Signals', 'Actions'].map((label) => (
              <th key={label} className="px-4 py-3 font-semibold">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={String(item.id ?? item.name)} className={item.id === selectedItemId ? 'bg-sky-50/70' : 'border-b border-slate-50'}>
              <td className="px-4 py-3 font-semibold text-slate-700">{item.sku}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.brandName === 'N/A' ? 'Brand not set' : item.brandName}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{item.category}</td>
              <td className="px-4 py-3 text-slate-700">{item.unit}</td>
              <td className="px-4 py-3 text-slate-700">{item.packageUnit} - {item.packageSize}</td>
              <td className="px-4 py-3 text-slate-700">{item.supplierName === 'N/A' ? 'Not set' : item.supplierName}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{item.stock}</td>
              <td className="px-4 py-3 text-slate-700">{item.reorderLevel}</td>
              <td className="px-4 py-3 text-slate-700">{item.leadTimeDays}d</td>
              <td className="px-4 py-3"><ItemSignals item={item} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => onSelect(item.id)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Movements</button>
                  <button type="button" onClick={() => onEdit(item)} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Edit</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryItemModal({
  open,
  isEditingItem,
  canWriteInventory,
  createState,
  itemForm,
  updateItemForm,
  onClose,
  onReset,
  onSave,
}: {
  open: boolean;
  isEditingItem: boolean;
  canWriteInventory: boolean;
  createState: { status: string };
  itemForm: ReturnType<typeof useInventoryBoard>['itemForm'];
  updateItemForm: ReturnType<typeof useInventoryBoard>['updateItemForm'];
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none';
  const helperFieldClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.92rem] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400';
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setShowAdvanced(isEditingItem);
  }, [isEditingItem, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/75 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close inventory item modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {isEditingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {isEditingItem ? 'Update item details' : 'Create item in a simple flow'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Start with only the essentials. Open advanced settings only when you really need them.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          <div className="space-y-4">
            <div className="rounded-[28px] bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 ring-1 ring-sky-100">
              <FieldLabel title="Block 1: Item Details" hint="What is this item? Keep this part short and clear." />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className={helperFieldClass} value={itemForm.name} onChange={(e) => updateItemForm('name', e.target.value)} disabled={!canWriteInventory} placeholder="Paracetamol 500mg" />
                <input className={helperFieldClass} value={itemForm.genericName} onChange={(e) => updateItemForm('genericName', e.target.value)} disabled={!canWriteInventory} placeholder="Paracetamol" />
                <input className={helperFieldClass} value={itemForm.brandName} onChange={(e) => updateItemForm('brandName', e.target.value)} disabled={!canWriteInventory} placeholder="Panadol" />
                <select className={helperFieldClass} value={itemForm.category} onChange={(e) => updateItemForm('category', e.target.value as typeof itemForm.category)} disabled={!canWriteInventory}>
                  <option value="medicine">Medicine</option>
                  <option value="consumable">Consumable</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
                <select className={helperFieldClass} value={itemForm.subcategory} onChange={(e) => updateItemForm('subcategory', e.target.value)} disabled={!canWriteInventory}>
                  <option value="">Subcategory</option>
                  {SUBCATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select className={helperFieldClass} value={itemForm.dosageForm} onChange={(e) => updateItemForm('dosageForm', e.target.value)} disabled={!canWriteInventory}>
                  <option value="">Dosage form</option>
                  {DOSAGE_FORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input className={helperFieldClass} value={itemForm.strength} onChange={(e) => updateItemForm('strength', e.target.value)} disabled={!canWriteInventory} placeholder="500mg" />
                <select className={helperFieldClass} value={itemForm.unit} onChange={(e) => updateItemForm('unit', e.target.value)} disabled={!canWriteInventory}>
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 ring-1 ring-emerald-100">
              <FieldLabel title="Block 2: Stock Details" hint="How much do you have now, and when should it be reordered?" />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className={helperFieldClass} value={itemForm.stock} onChange={(e) => updateItemForm('stock', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="200" />
                <input className={helperFieldClass} value={itemForm.reorderLevel} onChange={(e) => updateItemForm('reorderLevel', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="50" />
                <select className={helperFieldClass} value={itemForm.packageUnit} onChange={(e) => updateItemForm('packageUnit', e.target.value)} disabled={!canWriteInventory}>
                  {PACKAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input className={helperFieldClass} value={itemForm.packageSize} onChange={(e) => updateItemForm('packageSize', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="100" />
                <input className={helperFieldClass} value={itemForm.batchNo} onChange={(e) => updateItemForm('batchNo', e.target.value)} disabled={!canWriteInventory} placeholder="B-001" />
                <input className={helperFieldClass} value={itemForm.expiryDate} onChange={(e) => updateItemForm('expiryDate', e.target.value)} disabled={!canWriteInventory} type="date" />
                <input className={`${helperFieldClass} md:col-span-2`} value={itemForm.storageLocation} onChange={(e) => updateItemForm('storageLocation', e.target.value)} disabled={!canWriteInventory} placeholder="Shelf A" />
              </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 ring-1 ring-violet-100">
              <FieldLabel title="Block 3: Clinical Usage" hint="Tell the system how doctors use this item in practice." />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <select className={helperFieldClass} value={itemForm.prescriptionType} onChange={(e) => updateItemForm('prescriptionType', e.target.value as typeof itemForm.prescriptionType)} disabled={!canWriteInventory}>
                  <option value="">Clinical / outside / both</option>
                  <option value="clinical">Clinical</option>
                  <option value="outside">Outside</option>
                  <option value="both">Both</option>
                </select>
                <select className={helperFieldClass} value={itemForm.route} onChange={(e) => updateItemForm('route', e.target.value)} disabled={!canWriteInventory}>
                  <option value="">Route</option>
                  {ROUTE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.directDispenseAllowed} onChange={(e) => updateItemForm('directDispenseAllowed', e.target.checked)} disabled={!canWriteInventory} />Direct dispense allowed</label>
                <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.requiresPrescription} onChange={(e) => updateItemForm('requiresPrescription', e.target.checked)} disabled={!canWriteInventory} />Requires prescription</label>
                <textarea className={`${helperFieldClass} min-h-[88px] md:col-span-2`} value={itemForm.notes} onChange={(e) => updateItemForm('notes', e.target.value)} disabled={!canWriteInventory} placeholder="Fast-moving clinic stock item" />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Advanced Settings</p>
                  <p className="mt-1 text-sm text-slate-600">Optional details for admin correction, supplier setup, and special item flags.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {showAdvanced ? 'Hide' : 'Show'}
                </span>
              </button>
              {showAdvanced ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input className={helperFieldClass} value={itemForm.sku} onChange={(e) => updateItemForm('sku', e.target.value)} disabled={!canWriteInventory} placeholder="PCM-500" />
                  <input className={helperFieldClass} value={itemForm.supplierName} onChange={(e) => updateItemForm('supplierName', e.target.value)} disabled={!canWriteInventory} placeholder="ABC Pharma" />
                  <input className={helperFieldClass} value={itemForm.description} onChange={(e) => updateItemForm('description', e.target.value)} disabled={!canWriteInventory} placeholder="Common fever medication" />
                  <input className={helperFieldClass} value={itemForm.leadTimeDays} onChange={(e) => updateItemForm('leadTimeDays', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="7" />
                  <input className={helperFieldClass} value={itemForm.minStockLevel} onChange={(e) => updateItemForm('minStockLevel', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="40" />
                  <input className={helperFieldClass} value={itemForm.maxStockLevel} onChange={(e) => updateItemForm('maxStockLevel', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canWriteInventory} placeholder="500" />
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.isAntibiotic} onChange={(e) => updateItemForm('isAntibiotic', e.target.checked)} disabled={!canWriteInventory} />Antibiotic</label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.isControlled} onChange={(e) => updateItemForm('isControlled', e.target.checked)} disabled={!canWriteInventory} />Controlled item</label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.isPediatricSafe} onChange={(e) => updateItemForm('isPediatricSafe', e.target.checked)} disabled={!canWriteInventory} />Pediatric safe</label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700"><input type="checkbox" checked={itemForm.clinicUseOnly} onChange={(e) => updateItemForm('clinicUseOnly', e.target.checked)} disabled={!canWriteInventory} />Clinic use only</label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700 md:col-span-2">
                    <input type="checkbox" checked={itemForm.isActive} onChange={(e) => updateItemForm('isActive', e.target.checked)} disabled={!canWriteInventory} />
                    Item is active
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 sm:px-7">
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              New item
            </button>
            <button type="button" onClick={onSave} disabled={!canWriteInventory || createState.status === 'pending'} className="ios-button-primary rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70">
              {createState.status === 'pending' ? (isEditingItem ? 'Updating item...' : 'Creating item...') : isEditingItem ? 'Update inventory item' : 'Add inventory item'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function InventorySection() {
  const {
    activeTab,
    setActiveTab,
    items,
    filteredItems,
    inventorySummary,
    alertSummary,
    lowStockItems,
    stockoutRiskItems,
    topMovingItems,
    recommendedReorders,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    movements,
    movementLoadState,
    alertsLoadState,
    alertsWarningMessage,
    canWriteInventory,
    writeDisabledReason,
    canPostMovement,
    movementActionDisabledReason,
    inventorySearch,
    setInventorySearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    alertDays,
    setAlertDays,
    itemForm,
    updateItemForm,
    movementForm,
    updateMovementForm,
    isEditingItem,
    startCreateItem,
    startEditItem,
    loadState,
    createState,
    createFeedback,
    movementFeedback,
    refresh,
    handleSaveItem,
    handleSubmitMovement,
    handleQuickMovement,
  } = useInventoryBoard();

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none';

  useEffect(() => {
    if (createState.status === 'success') {
      setIsItemModalOpen(false);
    }
  }, [createState.status]);

  const openCreateModal = () => {
    startCreateItem();
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: InventoryItemView) => {
    startEditItem(item);
    setIsItemModalOpen(true);
  };

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="gap-5 overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <ViewportHeader
            eyebrow="Inventory"
            title="Inventory Control Center"
            description="Use stock master records, movement history, and alerts as one connected inventory workflow."
            actions={<button type="button" onClick={refresh} className="ios-button-primary rounded-2xl px-4 py-2 text-xs">Refresh inventory</button>}
          />

          {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
          {createFeedback ? <AsyncNotice tone={createFeedback.tone} message={createFeedback.message} /> : null}
          {movementFeedback ? <AsyncNotice tone={movementFeedback.tone} message={movementFeedback.message} /> : null}
          {!canWriteInventory && writeDisabledReason ? <AsyncNotice tone="warning" message={writeDisabledReason} /> : null}
          {alertsWarningMessage ? <AsyncNotice tone="warning" message={alertsWarningMessage} /> : null}
          {!canPostMovement && movementActionDisabledReason && activeTab === 'movements' ? <AsyncNotice tone="warning" message={movementActionDisabledReason} /> : null}

          <ViewportPanel>
            <ViewportTabs
              tabs={[
                { key: 'overview', label: 'Overview', active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
                { key: 'inventory', label: 'Inventory', active: activeTab === 'inventory', onClick: () => setActiveTab('inventory') },
                { key: 'movements', label: 'Movements', active: activeTab === 'movements', onClick: () => setActiveTab('movements') },
                { key: 'alerts', label: 'Alerts', active: activeTab === 'alerts', onClick: () => setActiveTab('alerts') },
              ]}
            />
          </ViewportPanel>

          {activeTab === 'overview' ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <MetricCard label="Items" value={inventorySummary.totalItems} />
                <MetricCard label="Active" value={inventorySummary.activeCount} tone="emerald" />
                <MetricCard label="Units" value={inventorySummary.totalUnits} tone="sky" />
                <MetricCard label="Low Stock" value={alertSummary.lowStockCount} tone="amber" />
                <MetricCard label="Risk" value={alertSummary.stockoutRiskCount} tone="rose" />
                <MetricCard label="Reorders" value={alertSummary.recommendedReorderCount} tone="emerald" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <ViewportPanel>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Recommended Reorders</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">Reorder dashboard</h2>
                      {alertsWarningMessage ? (
                        <p className="mt-1 text-sm text-amber-700">
                          Recommendations are temporarily unavailable. Showing fallback stock data only.
                        </p>
                      ) : null}
                    </div>
                    <select className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800" value={alertDays} onChange={(e) => setAlertDays(Number(e.target.value))}>
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                    </select>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {['Item', 'Current', 'Reorder', 'Avg/day', 'Days Left', 'Recommended'].map((label) => (
                            <th key={label} className="px-2 py-2 font-semibold">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recommendedReorders.slice(0, 8).map((row, index) => (
                          <tr key={`${row.itemName}-${index}`} className="border-b border-slate-50">
                            <td className="px-2 py-3 font-semibold text-slate-900">{row.itemName}</td>
                            <td className="px-2 py-3">{row.currentStock}</td>
                            <td className="px-2 py-3">{row.reorderLevel}</td>
                            <td className="px-2 py-3">{row.averageDailyUsage}</td>
                            <td className="px-2 py-3">{row.projectedDaysRemaining}</td>
                            <td className="px-2 py-3 font-semibold text-slate-900">{row.recommendedReorderQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!recommendedReorders.length && alertsLoadState.status !== 'loading' ? <p className="px-2 py-4 text-sm text-slate-500">No reorder recommendations for this range.</p> : null}
                  </div>
                </ViewportPanel>

                <div className="grid gap-5">
                  <ViewportPanel>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Low Stock Items</p>
                    <div className="mt-4 space-y-2">
                      {lowStockItems.slice(0, 5).map((item) => (
                        <div key={String(item.id ?? item.name)} className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100">
                          <div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">Current {item.stock} - reorder {item.reorderLevel}</p></div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('amber')}`}>Low stock</span>
                        </div>
                      ))}
                      {!lowStockItems.length && alertsLoadState.status !== 'loading' ? <p className="text-sm text-slate-500">No low stock items.</p> : null}
                    </div>
                  </ViewportPanel>
                  <ViewportPanel>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Top Moving Items</p>
                    <div className="mt-4 space-y-2">
                      {topMovingItems.slice(0, 5).map((item) => (
                        <div key={String(item.id ?? item.name)} className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100">
                          <div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.category}</p></div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('sky')}`}>{item.stock}</span>
                        </div>
                      ))}
                      {!topMovingItems.length && alertsLoadState.status !== 'loading' ? <p className="text-sm text-slate-500">No movement insights returned yet.</p> : null}
                    </div>
                  </ViewportPanel>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'inventory' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <ViewportPanel className="flex min-h-0 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Inventory Master List</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">Stock table</h2>
                  </div>
                  <button type="button" onClick={openCreateModal} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Add item</button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px]">
                  <input value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none" placeholder="Search SKU, name, brand, supplier" />
                  <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    <option value="medicine">Medicine</option>
                    <option value="consumable">Consumable</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                  <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <ViewportScrollBody className="mt-4 min-h-0 flex-1">
                  {loadState.status === 'loading' ? (
                    <AsyncStatePanel eyebrow="Loading" title="Loading inventory items" description="Stock levels and inventory records are being synchronized." tone="loading" />
                  ) : loadState.status === 'empty' ? (
                    <AsyncStatePanel eyebrow="Empty" title="No inventory items yet" description="Create the first stock item to start tracking inventory movements." tone="empty" />
                  ) : (
                    <InventoryTable items={filteredItems} selectedItemId={selectedItemId} onSelect={(id) => { setSelectedItemId(id); setActiveTab('movements'); }} onEdit={openEditModal} />
                  )}
                </ViewportScrollBody>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === 'movements' ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <ViewportPanel>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Stock Movement Screen</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedItem ? selectedItem.name : 'Select an inventory item'}</h2>
                {selectedItem ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MetricCard label="Current Stock" value={selectedItem.stock} tone="sky" />
                    <MetricCard label="Reorder Level" value={selectedItem.reorderLevel} tone="amber" />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Pick an item from the inventory tab to post stock in, stock out, or adjustments.</p>
                )}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select className={fieldClass} value={movementForm.type} onChange={(e) => updateMovementForm('type', e.target.value as typeof movementForm.type)} disabled={!canPostMovement}>
                    <option value="in">Stock In</option>
                    <option value="out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                  <input className={fieldClass} value={movementForm.quantity} onChange={(e) => updateMovementForm('quantity', e.target.value.replace(/[^0-9]/g, ''))} disabled={!canPostMovement} placeholder="Quantity" />
                  <select className={fieldClass} value={movementForm.reason} onChange={(e) => updateMovementForm('reason', e.target.value as typeof movementForm.reason)} disabled={!canPostMovement}>
                    <option value="purchase">Purchase</option>
                    <option value="dispense">Dispense</option>
                    <option value="damage">Damage</option>
                    <option value="expired">Expired</option>
                    <option value="return">Return</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="manual">Manual</option>
                  </select>
                  <input className={fieldClass} value={movementForm.note} onChange={(e) => updateMovementForm('note', e.target.value)} disabled={!canPostMovement} placeholder="Note" />
                  <input className={fieldClass} value={movementForm.referenceType} onChange={(e) => updateMovementForm('referenceType', e.target.value)} disabled={!canPostMovement} placeholder="Reference type" />
                  <input className={fieldClass} value={movementForm.referenceId} onChange={(e) => updateMovementForm('referenceId', e.target.value)} disabled={!canPostMovement} placeholder="Reference id" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={handleSubmitMovement} disabled={!canPostMovement} className="ios-button-primary rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70">Post movement</button>
                  <button type="button" onClick={() => void handleQuickMovement('in')} disabled={!canPostMovement} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">Quick stock in</button>
                  <button type="button" onClick={() => void handleQuickMovement('out')} disabled={!canPostMovement} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">Quick stock out</button>
                </div>
              </ViewportPanel>

              <ViewportPanel className="flex min-h-0 flex-col">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Movement History</p>
                <ViewportScrollBody className="mt-4">
                  {movementLoadState.status === 'loading' ? (
                    <AsyncStatePanel eyebrow="Loading" title="Loading movement history" description="Inventory movements are being synchronized." tone="loading" />
                  ) : movements.length ? (
                    <div className="space-y-2">
                      {movements.map((movement, index) => (
                        <div key={String(movement.id ?? index)} className="rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">{movement.type} - {movement.reason}</p>
                              <p className="text-xs text-slate-500">{movement.referenceType || movement.referenceId ? `${movement.referenceType || 'Ref'} ${movement.referenceId || ''}` : toString(movement.note, 'No note')}</p>
                            </div>
                            <p className="text-lg font-bold text-slate-900">{movement.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No movement history yet.</p>
                  )}
                </ViewportScrollBody>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === 'alerts' ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Low Stock" value={alertSummary.lowStockCount} tone="amber" />
                <MetricCard label="Stockout Risk" value={alertSummary.stockoutRiskCount} tone="rose" />
                <MetricCard label="Fast Moving" value={alertSummary.fastMovingCount} tone="sky" />
                <MetricCard label="Reorder Items" value={alertSummary.recommendedReorderCount} tone="emerald" />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <ViewportPanel>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Stockout Risk Items</p>
                  {alertsWarningMessage ? <p className="mt-1 text-sm text-amber-700">Risk alerts are temporarily unavailable.</p> : null}
                  <div className="mt-4 space-y-2">
                    {stockoutRiskItems.slice(0, 8).map((item) => (
                      <div key={String(item.id ?? item.name)} className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100">
                        <div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.stock} on hand - reorder {item.reorderLevel}</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('rose')}`}>Risk</span>
                      </div>
                    ))}
                  </div>
                </ViewportPanel>
                <ViewportPanel>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Recommended Reorder Quantities</p>
                  {alertsWarningMessage ? <p className="mt-1 text-sm text-amber-700">Reorder suggestions are temporarily unavailable.</p> : null}
                  <div className="mt-4 space-y-2">
                    {recommendedReorders.slice(0, 8).map((row, index) => (
                      <div key={`${row.itemName}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100">
                        <div><p className="font-semibold text-slate-900">{row.itemName}</p><p className="text-xs text-slate-500">{row.currentStock} on hand - {row.projectedDaysRemaining} days left</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass('emerald')}`}>{row.recommendedReorderQty}</span>
                      </div>
                    ))}
                  </div>
                </ViewportPanel>
              </div>
            </div>
          ) : null}
        </ViewportBody>
      </ViewportFrame>
      <InventoryItemModal
        open={isItemModalOpen}
        isEditingItem={isEditingItem}
        canWriteInventory={canWriteInventory}
        createState={createState}
        itemForm={itemForm}
        updateItemForm={updateItemForm}
        onClose={() => setIsItemModalOpen(false)}
        onReset={openCreateModal}
        onSave={handleSaveItem}
      />
    </ViewportPage>
  );
}
