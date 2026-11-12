"use client";

import Link from "next/link";
import ThemePicker from "../../components/ThemePicker";

interface AdminNavProps {
  activeSection: "overview" | "listings" | "users" | "reports" | "categories" | "audit-logs" | "plans" | "settings";
}

export default function AdminNav({ activeSection }: AdminNavProps) {
  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/">
        <span className="brand-name">
          Apna <b>Ghar</b>
        </span>
        <small>ADMIN CONSOLE</small>
      </Link>

      <p className="admin-nav-label">WORKSPACE</p>
      <Link className={`admin-nav-item ${activeSection === "overview" ? "active" : ""}`} href="/admin">
        ◫ Overview
      </Link>
      <Link className={`admin-nav-item ${activeSection === "listings" ? "active" : ""}`} href="/admin/listings">
        ▤ Listings
      </Link>
      <Link className={`admin-nav-item ${activeSection === "users" ? "active" : ""}`} href="/admin/users">
        ♙ Users
      </Link>
      <Link className={`admin-nav-item ${activeSection === "reports" ? "active" : ""}`} href="/admin/reports">
        ⚑ Safety reports
      </Link>
      <Link className={`admin-nav-item ${activeSection === "categories" ? "active" : ""}`} href="/admin/categories">
        ⌂ Categories
      </Link>
      <Link className={`admin-nav-item ${activeSection === "audit-logs" ? "active" : ""}`} href="/admin/audit-logs">
        ⌬ Audit logs
      </Link>

      <p className="admin-nav-label">CONFIGURATION</p>
      <Link className={`admin-nav-item ${activeSection === "plans" ? "active" : ""}`} href="/admin/plans">
        ◇ Plans & entitlements
      </Link>
      <Link className={`admin-nav-item ${activeSection === "settings" ? "active" : ""}`} href="/admin/settings">
        ⚙ Settings
      </Link>

      <div className="admin-sidebar-foot">
        <span className="admin-avatar">AG</span>
        <div>
          <b>Admin session</b>
          <small>Server protected</small>
        </div>
      </div>
    </aside>
  );
}
