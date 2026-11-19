"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { AdminPlanRecord, fetchAdminApi } from "../lib/adminApi";

export default function AdminPlansPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [plans, setPlans] = useState<AdminPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [monetizationPolicy, setMonetizationPolicy] = useState<{
    commissionFee: number;
    zeroBrokerageGuarantee: boolean;
    instantAccessForAll: boolean;
  } | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const data = await fetchAdminApi<{
        plans: AdminPlanRecord[];
        monetizationPolicy: { commissionFee: number; zeroBrokerageGuarantee: boolean; instantAccessForAll: boolean };
      }>("/plans", token);

      setPlans(data.plans || []);
      setMonetizationPolicy(data.monetizationPolicy || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monetization plans.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchPlans();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchPlans]);

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const nextStatus = currentStatus === "active" ? "launch_included" : "active";

      await fetchAdminApi("/plans", token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          updates: { status: nextStatus },
        }),
      });

      setNotice(`Plan status updated to "${nextStatus}".`);
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan status.");
    }
  };

  return (
    <AdminShell
      activeSection="plans"
      title="Monetization & Entitlements Architecture"
      description="Launch Policy: 100% Free Zero Brokerage Guaranteed across all tiers. Platform fees and paywalls remain strictly disabled."
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchPlans()}
            disabled={loading}
          >
            ↻ Refresh Plans
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

      {/* POLICY CARD */}
      <div className="shadcn-admin-notice-card is-emerald">
        <div className="shadcn-admin-notice-icon">◇</div>
        <div>
          <h4>Zero Brokerage Guarantee Enforced</h4>
          <p>
            Apna Ghar is fundamentally built to eliminate real estate agent markups. Current platform commission: <strong>₹0 (0%)</strong>. All search, direct buyer-owner messaging, visit scheduling, and property CRUD remain open to the public without paywalls.
          </p>
        </div>
      </div>

      {/* PLANS GRID */}
      <div className="shadcn-admin-plans-grid">
        {loading ? (
          <div className="shadcn-admin-card" style={{ padding: 30, textAlign: "center", gridColumn: "1 / -1" }}>
            <span className="shadcn-admin-empty-sub">Loading live monetization tiers from API…</span>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="shadcn-admin-plan-card">
              <div className="shadcn-admin-plan-head">
                <span className="shadcn-admin-plan-badge">{plan.launchAvailability}</span>
                <h3 className="shadcn-admin-plan-name">{plan.name}</h3>
                <p className="shadcn-admin-plan-tagline">{plan.tagline}</p>
                <div className="shadcn-admin-plan-price">
                  <strong>₹{plan.priceAmount}</strong>
                  <span>/ {plan.billingCycle}</span>
                </div>
              </div>

              <div className="shadcn-admin-plan-body">
                <span className="shadcn-admin-plan-section-title">Included Entitlements:</span>
                <ul className="shadcn-admin-plan-features">
                  {plan.entitlements.map((ent, idx) => (
                    <li key={idx}>
                      <span className="shadcn-admin-check-icon">✓</span>
                      <span>{ent}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shadcn-admin-plan-foot">
                <div className="shadcn-admin-plan-status-row">
                  <span>Current Tier Status:</span>
                  <span className={`shadcn-admin-status-pill is-${plan.status}`}>
                    {plan.status === "active" ? "Active Everywhere" : "Free Launch Included"}
                  </span>
                </div>
                <button
                  type="button"
                  className="shadcn-admin-btn is-outline is-sm"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={() => void togglePlanStatus(plan.id, plan.status)}
                >
                  Toggle Availability Mode
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ENTITLEMENTS MATRIX */}
      <div className="shadcn-admin-card" style={{ marginTop: 24 }}>
        <div className="shadcn-admin-card-head">
          <div>
            <h3 className="shadcn-admin-card-title">Live Entitlement Matrix</h3>
            <p className="shadcn-admin-card-sub">Dynamic capability mappings per user tier</p>
          </div>
        </div>

        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Zero Brokerage</th>
                <th>Instant Chat</th>
                <th>Visit Scheduling</th>
                <th>Verified Badge</th>
                <th>Listing Capacity</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="shadcn-admin-check-icon">✓ Enforced</span>
                  </td>
                  <td>
                    <span className="shadcn-admin-check-icon">✓ Enabled</span>
                  </td>
                  <td>
                    <span className="shadcn-admin-check-icon">✓ Enabled</span>
                  </td>
                  <td>
                    <span className="shadcn-admin-check-icon">✓ Enabled</span>
                  </td>
                  <td>
                    <strong className="shadcn-admin-price-pill">
                      Up to {p.features.maxActiveListings} active
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
