import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

const sections: Record<string, { title: string; eyebrow: string; description: string; columns: string[] }> = {
  plans: {
    title: "Plans & Entitlements",
    eyebrow: "MONETIZATION",
    description: "Launch policy: All users receive 100% Free access. Billing gateways and paid boosts remain disabled for the initial launch.",
    columns: ["Plan Tier", "Price", "Entitlements", "Billing Status", "Launch Availability"],
  },
  settings: {
    title: "Marketplace Settings",
    eyebrow: "CONFIGURATION",
    description: "Operational parameters, theme presets, verification modes, and environment limits for the marketplace backend.",
    columns: ["Setting Key", "Current Value", "Target Scope", "Status"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const resolved = await params;
  return { title: `${sections[resolved?.section]?.title ?? "Admin workspace"} | Apna Ghar` };
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const resolved = await params;
  const sectionKey = resolved?.section || "plans";
  const section = sections[sectionKey] ?? sections.plans;
  const isPlans = sectionKey === "plans";

  return (
    <main className="admin-page">
      <AdminNav activeSection={sectionKey as any} />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">{section.eyebrow}</p>
            <h1>{section.title}</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
          </div>
        </header>

        <div className="admin-policy-note" style={{ marginBottom: 20 }}>
          <b>{isPlans ? "Zero-Cost Free Launch Policy" : "System Configuration Scope"}</b>
          <p>{section.description}</p>
        </div>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>{section.title}</h2>
              <p>{isPlans ? "Active Launch Tiers" : "Active Environment Controls"}</p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {section.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isPlans ? (
                  <tr>
                    <td style={{ padding: "12px", fontSize: 11, fontWeight: 700 }}>Free Community Tier</td>
                    <td style={{ padding: "12px", fontSize: 11 }}>₹0 / month</td>
                    <td style={{ padding: "12px", fontSize: 11 }}>Unlimited Search, Favorites, Messaging, Listing CRUD</td>
                    <td style={{ padding: "12px", fontSize: 11 }}>
                      <span className="report-status report-status-resolved">Disabled (Free Launch)</span>
                    </td>
                    <td style={{ padding: "12px", fontSize: 11 }}>
                      <span className="report-status report-status-active">Active Everywhere</span>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td style={{ padding: "12px", fontSize: 11, fontWeight: 700 }}>
                        <code>IMMEDIATE_PUBLISHING</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11 }}>true</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>Properties Domain</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>
                        <span className="report-status report-status-active">Enforced</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px", fontSize: 11, fontWeight: 700 }}>
                        <code>CLERK_DEV_INSTANCE</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11 }}>Active</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>Identity Provider</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>
                        <span className="report-status report-status-active">Enforced</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px", fontSize: 11, fontWeight: 700 }}>
                        <code>PAYMENTS_DISABLED</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11 }}>true</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>Checkout & Subscriptions</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>
                        <span className="report-status report-status-active">Enforced</span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="admin-footer">
          <Link href="/admin">← Back to Overview</Link>
        </footer>
      </section>
    </main>
  );
}
