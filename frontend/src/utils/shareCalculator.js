/**
 * Recalculates shares so all active (non-deleted) offers sum to 100.
 * Pinned offers retain their exact share; remaining percentage is split evenly
 * across unpinned active offers (with remainder distributed +1 to initial items).
 */
export function recalculateShares(offers) {
    const active = offers.filter((o) => !o.is_deleted);
    const pinned = active.filter((o) => o.is_pinned);
    const unpinned = active.filter((o) => !o.is_pinned);

    const pinnedSum = pinned.reduce((acc, o) => acc + Number(o.share || 0), 0);
    const remaining = Math.max(0, 100 - pinnedSum);

    if (unpinned.length === 0) {
        return offers.map((o) => (o.is_deleted ? { ...o, share: 0, is_pinned: false } : o));
    }

    const baseShare = Math.floor(remaining / unpinned.length);
    let remainder = remaining % unpinned.length;

    const unpinnedShares = {};
    unpinned.forEach((o) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        unpinnedShares[o.offer_id] = baseShare + extra;
    });

    return offers.map((o) => {
        if (o.is_deleted) {
            return { ...o, share: 0, is_pinned: false };
        }
        if (o.is_pinned) {
            return o;
        }
        return { ...o, share: unpinnedShares[o.offer_id] };
    });
}
