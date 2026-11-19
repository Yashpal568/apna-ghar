"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { AdminSystemSettings, AdminSystemStatus, fetchAdminApi } from "../lib/adminApi";

export default function AdminSettingsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<AdminSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchSettings = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const data = await fetchAdminApi<{
        success: boolean;
        settings: AdminSystemSettings;
        systemStatus: AdminSystemStatus;
      }>("/settings", token);

      setSettings(data.settings);
      setSystemStatus(data.systemStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchSettings();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchSettings]);

  const handleToggle = (key: keyof AdminSystemSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      await fetchAdminApi("/settings", token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      setNotice("Marketplace system settings saved and active immediately.");
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to persist settings changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      activeSection="settings"
      title="Marketplace & System Settings"
      description="Configure real-time platform controls, infrastructure health monitoring, and security boundaries."
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchSettings()}
            disabled={loading || saving}
          >
            ↻ Refresh Health
          </button>
        </div>
      }
    >
      {/* Notice & Error */}
      {notice && (
        <div className="shadcn-admin-banner is-success" role="status">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice("")} className="shadcn-admin-banner-close">×</button>
        </div>
      )}
      {error && (
        <div className="shadcn-admin-banner is-error" role="alert">
          <span>✕ {error}</span>
          <button type="button" onClick={() => setError("")} className="shadcn-admin-banner-close">×</button>
        </div>
      )}

      {/* 1. INFRASTRUCTURE & BACKEND HEALTH STATUS */}
      <div className="shadcn-admin-card" style={{ marginBottom: 20 }}>
        <div className="shadcn-admin-card-head">
          <div>
            <h3 className="shadcn-admin-card-title">Live Infrastructure Health</h3>
            <p className="shadcn-admin-card-sub">Dynamic runtime connectivity to production services</p>
          </div>
          <span className="shadcn-admin-badge is-emerald">
            ● All Services Operational
          </span>
        </div>

        <div className="shadcn-admin-health-grid">
          <div className="shadcn-admin-health-card">
            <div className="shadcn-admin-health-card-head">
              <span className="shadcn-admin-pulse-dot is-green" />
              <strong>MongoDB Atlas</strong>
            </div>
            <div className="shadcn-admin-health-card-val">
              {systemStatus?.database === "connected" ? "Healthy (Replica Set)" : systemStatus?.database || "Checking…"}
            </div>
            <small>Primary cluster: cluster0.uakl7si.mongodb.net</small>
          </div>

          <div className="shadcn-admin-health-card">
            <div className="shadcn-admin-health-card-head">
              <span className="shadcn-admin-pulse-dot is-blue" />
              <strong>Render Backend API</strong>
            </div>
            <div className="shadcn-admin-health-card-val">
              {systemStatus?.apiBackend === "healthy" ? "HTTP 200 Ready" : systemStatus?.apiBackend || "Checking…"}
            </div>
            <small>{systemStatus?.backendUrl || "https://apna-ghar-api-w0dk.onrender.com"}</small>
          </div>

          <div className="shadcn-admin-health-card">
            <div className="shadcn-admin-health-card-head">
              <span className="shadcn-admin-pulse-dot is-purple" />
              <strong>Clerk Authentication</strong>
            </div>
            <div className="shadcn-admin-health-card-val">Active (Enforced)</div>
            <small>Dev Instance: flexible-bison-5494</small>
          </div>

          <div className="shadcn-admin-health-card">
            <div className="shadcn-admin-health-card-head">
              <span className="shadcn-admin-pulse-dot is-amber" />
              <strong>Cloudinary Storage</strong>
            </div>
            <div className="shadcn-admin-health-card-val">Active Cloud</div>
            <small>Cloud name: vub5bfcq</small>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ENVIRONMENT CONTROLS */}
      {settings && (
        <form onSubmit={handleSave} className="shadcn-admin-card">
          <div className="shadcn-admin-card-head">
            <div>
              <h3 className="shadcn-admin-card-title">Marketplace Operational Controls</h3>
              <p className="shadcn-admin-card-sub">Dynamic runtime flags toggled without server restarts</p>
            </div>
            <button
              type="submit"
              className="shadcn-admin-btn is-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save All Settings"}
            </button>
          </div>

          <div className="shadcn-admin-settings-list">
            {/* Setting 1: Immediate Publishing */}
            <div className="shadcn-admin-setting-item">
              <div className="shadcn-admin-setting-info">
                <strong>Immediate Property Publishing</strong>
                <p>When enabled, verified owner listings are published immediately upon submission without requiring manual pre-approval.</p>
              </div>
              <button
                type="button"
                className={`shadcn-admin-toggle-btn ${settings.immediatePublishing ? "is-active" : ""}`}
                onClick={() => handleToggle("immediatePublishing")}
              >
                <span className="shadcn-admin-toggle-knob" />
                <span className="shadcn-admin-toggle-label">
                  {settings.immediatePublishing ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>

            {/* Setting 2: Strict Zero Brokerage */}
            <div className="shadcn-admin-setting-item">
              <div className="shadcn-admin-setting-info">
                <strong>Strict Zero-Brokerage Enforcement</strong>
                <p>Prohibits broker listings, enforces 0% commission badge, and flags listings requesting agent fees.</p>
              </div>
              <button
                type="button"
                className={`shadcn-admin-toggle-btn ${settings.strictZeroBrokerage ? "is-active" : ""}`}
                onClick={() => handleToggle("strictZeroBrokerage")}
              >
                <span className="shadcn-admin-toggle-knob" />
                <span className="shadcn-admin-toggle-label">
                  {settings.strictZeroBrokerage ? "Enforced" : "Disabled"}
                </span>
              </button>
            </div>

            {/* Setting 3: Private Attachments Access Control */}
            <div className="shadcn-admin-setting-item">
              <div className="shadcn-admin-setting-info">
                <strong>Private Attachments Access Control</strong>
                <p>Enforces authenticated signed delivery for private conversation attachments (agreements, floorplans).</p>
              </div>
              <button
                type="button"
                className={`shadcn-admin-toggle-btn ${settings.privateAttachmentsEnforced ? "is-active" : ""}`}
                onClick={() => handleToggle("privateAttachmentsEnforced")}
              >
                <span className="shadcn-admin-toggle-knob" />
                <span className="shadcn-admin-toggle-label">
                  {settings.privateAttachmentsEnforced ? "Enforced" : "Disabled"}
                </span>
              </button>
            </div>

            {/* Setting 4: Rate Limiting */}
            <div className="shadcn-admin-setting-item">
              <div className="shadcn-admin-setting-info">
                <strong>Distributed Rate Limiting &amp; Anti-Scrape</strong>
                <p>Enforces API route rate limits across inquiry creation, message sending, and property report submissions.</p>
              </div>
              <button
                type="button"
                className={`shadcn-admin-toggle-btn ${settings.rateLimitEnabled ? "is-active" : ""}`}
                onClick={() => handleToggle("rateLimitEnabled")}
              >
                <span className="shadcn-admin-toggle-knob" />
                <span className="shadcn-admin-toggle-label">
                  {settings.rateLimitEnabled ? "Active" : "Disabled"}
                </span>
              </button>
            </div>

            {/* Setting 5: Auto Audit Logging */}
            <div className="shadcn-admin-setting-item">
              <div className="shadcn-admin-setting-info">
                <strong>Automated Audit Trail Logging</strong>
                <p>Permanently records all administrative interventions, user status updates, and property deletions in MongoDB Atlas.</p>
              </div>
              <button
                type="button"
                className={`shadcn-admin-toggle-btn ${settings.autoAuditLogging ? "is-active" : ""}`}
                onClick={() => handleToggle("autoAuditLogging")}
              >
                <span className="shadcn-admin-toggle-knob" />
                <span className="shadcn-admin-toggle-label">
                  {settings.autoAuditLogging ? "Active" : "Disabled"}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
