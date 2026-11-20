import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

export default function CreateCampaign() {
    const [name, setName] = useState("");
    const [alias, setAlias] = useState("");
    const [countries, setCountries] = useState("US, GB, CA");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const country_codes = countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

        try {
            const res = await fetch(`${API_BASE}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, alias, country_codes }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to create campaign");
            }

            const data = await res.json();
            navigate(`/campaigns/${data.campaign.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
        <h2>Create Keitaro Campaign</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
        Campaign Name:
        <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My New Campaign"
        style={{ width: "100%", padding: 8 }}
        />
        </label>

        <label>
        ID / Alias:
        <input
        type="text"
        required
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="my-campaign-alias"
        style={{ width: "100%", padding: 8 }}
        />
        </label>

        <label>
        Country Codes (comma-separated, redirects to google.com):
        <input
        type="text"
        required
        value={countries}
        onChange={(e) => setCountries(e.target.value)}
        placeholder="US, CA, DE"
        style={{ width: "100%", padding: 8 }}
        />
        </label>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
        {loading ? "Creating..." : "Create Campaign"}
        </button>
        </form>
        </div>
    );
}
