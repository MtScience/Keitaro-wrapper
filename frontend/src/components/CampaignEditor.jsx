import React, { useState } from "react";
import { useParams } from "react-router-dom";
import StreamEditor from "./StreamEditor";
import { API_BASE } from "../config";

export default function CampaignEditor() {
    const { campaignId } = useParams();
    const [streams, setStreams] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Loaded manually by clicking a button
    const handleLoadStreams = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/campaigns/${campaignId}/streams`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to load streams");
            }
            const data = await res.json();
            setStreams(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 850, margin: "0 auto", padding: 20 }}>
        <h2>Edit Campaign #{campaignId}</h2>

        <button onClick={handleLoadStreams} disabled={loading} style={{ padding: "10px 18px", marginBottom: 20 }}>
        {loading ? "Loading Streams..." : "Load Campaign Streams"}
        </button>

        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

        {streams &&
            streams.map((stream) => (
                <StreamEditor key={stream.id} campaignId={campaignId} stream={stream} />
            ))}
            </div>
    );
}
