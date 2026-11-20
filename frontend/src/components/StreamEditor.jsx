import React, { useState } from "react";
import { recalculateShares } from "../utils/shareCalculator";
import { API_BASE } from "../config";

export default function StreamEditor({ campaignId, stream }) {
    const [offers, setOffers] = useState(stream.offers || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownResults, setDropdownResults] = useState([]);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    // Search offer by ID
    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setDropdownResults([]);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/offers/search?q=${encodeURIComponent(val)}`);
            if (res.ok) {
                const data = await res.json();
                setDropdownResults(data);
            }
        } catch (e) {
            console.error("Search failed", e);
        }
    };

    // Add offer from dropdown
    const handleSelectOffer = (selected) => {
        setDropdownResults([]);
        setSearchQuery("");

        const existing = offers.find((o) => o.offer_id === selected.id);
        let updated;

        if (existing) {
            // If it was soft-deleted, restore it
            updated = offers.map((o) =>
            o.offer_id === selected.id ? { ...o, is_deleted: false } : o
            );
        } else {
            updated = [
                ...offers,
                {
                    offer_id: selected.id,
                    offer_name: selected.name,
                    share: 0,
                    is_pinned: false,
                    is_deleted: false,
                },
            ];
        }

        setOffers(recalculateShares(updated));
    };

    // Toggle Remove / Bring back
    const handleToggleDelete = (offerId) => {
        const updated = offers.map((o) =>
        o.offer_id === offerId
        ? { ...o, is_deleted: !o.is_deleted, is_pinned: false }
        : o
        );
        setOffers(recalculateShares(updated));
    };

    // Toggle Pin / Unpin
    const handleTogglePin = (offerId) => {
        const updated = offers.map((o) =>
        o.offer_id === offerId ? { ...o, is_pinned: !o.is_pinned } : o
        );
        setOffers(recalculateShares(updated));
    };

    // Manual share edit (auto-pins the edited offer)
    const handleShareChange = (offerId, newShare) => {
        const parsed = Math.max(0, Math.min(100, Number(newShare) || 0));
        const updated = offers.map((o) =>
        o.offer_id === offerId ? { ...o, share: parsed, is_pinned: true } : o
        );
        setOffers(recalculateShares(updated));
    };

    // Apply changes to Keitaro & local DB
    const handleApply = async () => {
        setSaving(true);
        setStatusMsg("");
        try {
            const res = await fetch(
                `${API_BASE}/campaigns/${campaignId}/streams/${stream.id}/offers`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ offers }),
                }
            );
            if (!res.ok) throw new Error("Failed to apply changes");
            setStatusMsg("Changes applied successfully!");
        } catch (err) {
            setStatusMsg(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 20, borderRadius: 6 }}>
        <h3>
        Stream #{stream.id}: {stream.name} ({stream.schema_type})
        </h3>

        {/* Offer Search Box */}
        <div style={{ position: "relative", marginBottom: 16, maxWidth: 350 }}>
        <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search offer by ID..."
        style={{ width: "100%", padding: 8 }}
        />
        {dropdownResults.length > 0 && (
            <ul
            style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #ccc",
                listStyle: "none",
                margin: 0,
                padding: 0,
                zIndex: 10,
            }}
            >
            {dropdownResults.map((item) => (
                <li
                key={item.id}
                onClick={() => handleSelectOffer(item)}
                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                >
                <strong>#{item.id}</strong> — {item.name}
                </li>
            ))}
            </ul>
        )}
        </div>

        {/* Offers Table or Empty State */}
        {offers.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>Empty stream (no associated offers).</p>
        ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
            <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>ID</th>
            <th style={{ padding: 8 }}>Offer Name</th>
            <th style={{ padding: 8 }}>Share (%)</th>
            <th style={{ padding: 8 }}>Pin</th>
            <th style={{ padding: 8 }}>Action</th>
            </tr>
            </thead>
            <tbody>
            {offers.map((offer) => (
                <tr
                key={offer.offer_id}
                style={{
                    borderBottom: "1px solid #eee",
                    opacity: offer.is_deleted ? 0.55 : 1,
                    background: offer.is_deleted ? "#f9f9f9" : "transparent",
                }}
                >
                <td style={{ padding: 8 }}>{offer.offer_id}</td>
                <td
                style={{
                    padding: 8,
                    textDecoration: offer.is_deleted ? "line-through" : "none",
                }}
                >
                {offer.offer_name}
                </td>
                <td style={{ padding: 8 }}>
                <input
                type="number"
                min="0"
                max="100"
                disabled={offer.is_deleted}
                value={offer.share}
                onChange={(e) => handleShareChange(offer.offer_id, e.target.value)}
                style={{ width: 65, padding: 4 }}
                />
                %
                </td>
                <td style={{ padding: 8 }}>
                <button
                type="button"
                disabled={offer.is_deleted}
                onClick={() => handleTogglePin(offer.offer_id)}
                >
                {offer.is_pinned ? "Unpin" : "Pin"}
                </button>
                </td>
                <td style={{ padding: 8 }}>
                <button type="button" onClick={() => handleToggleDelete(offer.offer_id)}>
                {offer.is_deleted ? "Bring back" : "Remove"}
                </button>
                </td>
                </tr>
            ))}
            </tbody>
            </table>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleApply} disabled={saving} style={{ padding: "8px 16px" }}>
        {saving ? "Applying..." : "Apply Changes"}
        </button>
        {statusMsg && <span>{statusMsg}</span>}
        </div>
        </div>
    );
}
