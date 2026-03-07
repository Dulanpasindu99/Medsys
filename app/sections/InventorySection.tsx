'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    createInventoryItem,
    createInventoryMovement,
    listInventory,
    listInventoryMovements,
    type ApiClientError,
} from '../lib/api-client';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
    return value && typeof value === 'object' ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
    if (Array.isArray(value)) {
        return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
    const record = asRecord(value);
    if (!record) return [];
    const candidates = [record.data, record.items, record.rows];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
        }
    }
    return [];
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    return null;
}

function toString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

export default function InventorySection() {
    const [items, setItems] = useState<AnyRecord[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [movements, setMovements] = useState<AnyRecord[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('0');
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadInventory = async () => {
        setIsSyncing(true);
        try {
            const response = await listInventory();
            const rows = asArray(response);
            setItems(rows);
            if (rows.length && selectedItemId === null) {
                const firstId = toNumber(rows[0].id ?? rows[0].inventoryId ?? rows[0].inventory_id);
                setSelectedItemId(firstId ?? null);
            }
            setSyncError(null);
        } catch (error) {
            setSyncError((error as ApiClientError)?.message ?? 'Unable to load inventory.');
            setItems([]);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedItemId) {
            setMovements([]);
            return;
        }
        let active = true;
        const loadMovements = async () => {
            try {
                const response = await listInventoryMovements(selectedItemId);
                if (!active) return;
                setMovements(asArray(response));
            } catch {
                if (!active) return;
                setMovements([]);
            }
        };
        loadMovements();
        return () => {
            active = false;
        };
    }, [selectedItemId]);

    const selectedItem = useMemo(
        () => items.find((row) => toNumber(row.id ?? row.inventoryId ?? row.inventory_id) === selectedItemId) ?? null,
        [items, selectedItemId]
    );

    const handleCreateItem = async () => {
        if (!newItemName.trim()) return;
        try {
            await createInventoryItem({
                name: newItemName.trim(),
                category: 'medicine',
                quantity: Number(newItemQty) || 0,
                unit: 'units',
            });
            setNewItemName('');
            setNewItemQty('0');
            await loadInventory();
        } catch (error) {
            setSyncError((error as ApiClientError)?.message ?? 'Failed to create inventory item.');
        }
    };

    const handleQuickMovement = async (type: 'in' | 'out') => {
        if (!selectedItemId) return;
        try {
            await createInventoryMovement(selectedItemId, {
                type,
                quantity: 1,
                note: `Quick ${type} from frontend`,
            });
            const movementResponse = await listInventoryMovements(selectedItemId);
            setMovements(asArray(movementResponse));
            await loadInventory();
        } catch (error) {
            setSyncError((error as ApiClientError)?.message ?? 'Failed to post movement.');
        }
    };

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
                        onClick={loadInventory}
                        className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSyncing}
                    >
                        {isSyncing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </header>

                {syncError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                        {syncError}
                    </p>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Items</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{items.length} records</span>
                        </div>
                        <div className="space-y-2">
                            {items.map((row) => {
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
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
                                    placeholder="Item name"
                                />
                                <input
                                    value={newItemQty}
                                    onChange={(event) => setNewItemQty(event.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
                                    placeholder="Quantity"
                                />
                                <button type="button" onClick={handleCreateItem} className="ios-button-primary w-full text-sm">
                                    Add inventory item
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Movements</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedItem ? `Selected: ${toString(selectedItem.name ?? selectedItem.itemName, 'Item')}` : 'Select an item'}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button type="button" onClick={() => handleQuickMovement('in')} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                    + Stock
                                </button>
                                <button type="button" onClick={() => handleQuickMovement('out')} className="rounded-2xl bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                    - Stock
                                </button>
                            </div>
                            <div className="mt-3 space-y-2">
                                {movements.slice(0, 6).map((movement, index) => (
                                    <div key={index} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                                        {toString(movement.type ?? movement.movementType, 'movement')} • qty {toNumber(movement.quantity) ?? 0}
                                    </div>
                                ))}
                                {!movements.length ? (
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
