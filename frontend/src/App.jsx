import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import CreateCampaign from "./components/CreateCampaign";
import CampaignEditor from "./components/CampaignEditor";

export default function App() {
    return (
        <BrowserRouter>
        <nav style={{ padding: "12px 20px", borderBottom: "1px solid #ddd", display: "flex", gap: 16 }}>
        <Link to="/create">Create Campaign</Link>
        <Link to="/campaigns/1">Edit Campaign (Example ID 1)</Link>
        </nav>
        <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateCampaign />} />
        <Route path="/campaigns/:campaignId" element={<CampaignEditor />} />
        </Routes>
        </BrowserRouter>
    );
}
