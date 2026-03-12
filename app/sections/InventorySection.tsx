'use client';

import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import { toString, useInventoryBoard } from './inventory/hooks/useInventoryBoard';

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    return null;
}

export default function InventorySection() {
    const {
        items,
        selectedItemId,
        setSelectedItemId,
        selectedItem,
        movements,
        movementLoadState,
        canWriteInventory,
        writeDisabledReason,
        newItemName,
        setNewItemName,
        newItemQty,
        setNewItemQty,
        loadState,
        createState,
        createFeedback,
        movementState,
        movementFeedback,
        refresh,
        handleCreateItem,
        handleQuickMovement,
    } = useInventoryBoard();
    const displayedMovements = selectedItemId ? movements : [];

    return (
        <section id="inventory" className="px-4 py-8 md:px-8">
            <div className="mx-auto space-y-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
                        <h1 className="text-3xl font-bold text-slate-900">Live Stock Board</h1>
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loadState.status === 'loading'}
                    >
                        {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh'}
                    </button>
                </header>

                {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
                {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}
                {createFeedback ? <AsyncNotice tone={createFeedback.tone} message={createFeedback.message} /> : null}
                {movementFeedback ? <AsyncNotice tone={movementFeedback.tone} message={movementFeedback.message} /> : null}
                {!canWriteInventory && writeDisabledReason ? <AsyncNotice tone="warning" message={writeDisabledReason} /> : null}
                {movementLoadState.error ? <AsyncNotice tone="warning" message={movementLoadState.error} /> : null}
                {movementLoadState.notice ? <AsyncNotice tone="warning" message={movementLoadState.notice} /> : null}

                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Items</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{items.length} records</span>
                        </div>
                        <div className="space-y-2">
                            {loadState.status === 'loading' ? (
                                <AsyncStatePanel
                                    eyebrow="Loading"
                                    title="Loading inventory items"
                                    description="Stock levels and inventory records are being synchronized."
                                    tone="loading"
                                />
                            ) : loadState.status === 'error' && !items.length ? (
                                <AsyncStatePanel
                                    eyebrow="Error"
                                    title="Inventory items could not be loaded"
                                    description={loadState.error ?? 'Inventory data is unavailable right now.'}
                                    tone="error"
                                    actionLabel="Retry inventory"
                                    onAction={refresh}
                                />
                            ) : loadState.status === 'empty' ? (
                                <AsyncStatePanel
                                    eyebrow="Empty"
                                    title="No inventory items yet"
                                    description="Create the first stock item to start tracking inventory movements."
                                    tone="empty"
                                />
                            ) : items.map((row) => {
                                const itemId = toNumber(row.id ?? row.inventoryId ?? row.inventory_id);
                                const isActive = itemId !== null && itemId === selectedItemId;
                                return (
                                    <button
                                        type="button"
                                        key={String(itemId ?? toString(row.name))}
                                        onClick={() => setSelectedItemId(itemId)}
                                        className={`w-full rounded-2xl px-4 py-3 text-left ring-1 transition ${isActive
                                                ? 'bg-sky-50 text-sky-800 ring-sky-100'
                                                : 'bg-slate-50 text-slate-700 ring-slate-100 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold">{toString(row.name ?? row.itemName, 'Unnamed item')}</p>
                                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                                                Qty {toNumber(row.quantity ?? row.stock ?? row.available) ?? 0}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                                            {toString(row.category, 'uncategorized')}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Create item</h2>
                            <div className="mt-3 space-y-3">
                                <input
                                    value={newItemName}
                                    onChange={(event) => setNewItemName(event.target.value)}
                                    disabled={!canWriteInventory}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
                                    placeholder="Item name"
                                />
                                <input
                                    value={newItemQty}
                                    onChange={(event) => setNewItemQty(event.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={!canWriteInventory}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
                                    placeholder="Quantity"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateItem}
                                    disabled={createState.status === 'pending' || !canWriteInventory}
                                    className="ios-button-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {createState.status === 'pending' ? 'Adding item...' : 'Add inventory item'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Movements</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedItem ? `Selected: ${toString(selectedItem.name ?? selectedItem.itemName, 'Item')}` : 'Select an item'}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickMovement('in')}
                                    disabled={movementState.status === 'pending' || !canWriteInventory}
                                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    + Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickMovement('out')}
                                    disabled={movementState.status === 'pending' || !canWriteInventory}
                                    className="rounded-2xl bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    - Stock
                                </button>
                            </div>
                            <div className="mt-3 space-y-2">
                                {displayedMovements.slice(0, 6).map((movement, index) => (
                                    <div key={index} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                                        {toString(movement.type ?? movement.movementType, 'movement')} | qty {toNumber(movement.quantity) ?? 0}
                                    </div>
                                ))}
                                {!displayedMovements.length ? (
                                    <p className="text-sm text-slate-500">No movement history yet.</p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
