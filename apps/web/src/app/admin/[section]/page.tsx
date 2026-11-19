import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "../components/AdminShell";

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
    <AdminShell
      activeSection={sectionKey as any}
      title={section.title}
      description={section.description}
      actions={
        <Link href={isPlans ? "/admin/plans" : "/admin/settings"} className="shadcn-admin-btn is-primary">
          Open Dynamic Workspace →
        </Link>
      }
    >
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-card-head">
          <div>
            <h3 className="shadcn-admin-card-title">{section.title}</h3>
            <p className="shadcn-admin-card-sub">
              {isPlans ? "Community Zero-Brokerage Architecture" : "Platform Runtime Configuration"}
            </p>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <p style={{ margin: "0 0 16px", color: "var(--color-muted)", fontSize: 13 }}>
            {section.description}
          </p>
          <Link
            href={isPlans ? "/admin/plans" : "/admin/settings"}
            className="shadcn-admin-btn is-primary"
          >
            Launch Interactive {section.title} Dashboard →
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
