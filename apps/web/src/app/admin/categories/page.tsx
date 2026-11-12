"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import ThemePicker from "../../components/ThemePicker";

type CategoryItem = {
  key: string;
  label: string;
  icon: string;
  active: boolean;
  sortOrder: number;
};

const api = "/api/v1";

export default function AdminCategoriesPage() {
  const { isSignedIn, getToken } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Edit category modal
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const res = await fetch(`${api}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to load categories.");

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchCategories();
    }
  }, [isSignedIn, fetchCategories]);

  const toggleCategoryStatus = async (key: string, currentActive: boolean) => {
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const res = await fetch(`${api}/admin/categories/${encodeURIComponent(key)}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to toggle category.");

      setNotice(`Category "${key}" set to ${!currentActive ? "Active" : "Inactive"}.`);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not toggle category.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setSubmittingEdit(true);
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      const res = await fetch(`${api}/admin/categories/${encodeURIComponent(editingCategory.key)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          icon: editIcon.trim(),
          sortOrder: Number(editSortOrder),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to update category.");

      setNotice(`Category "${editingCategory.key}" updated successfully.`);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update category.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <main className="admin-page">
      <AdminNav activeSection="categories" />
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">MARKETPLACE TAXONOMY</p>
            <h1>Category Administration</h1>
          </div>
          <div className="admin-top-actions">
            <ThemePicker compact />
            <button className="button button-outline" onClick={() => void fetchCategories()} disabled={loading} style={{ fontSize: 11 }}>
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-warning" role="alert">
            <strong>Error</strong>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="admin-welcome" style={{ minHeight: "auto", padding: 16, marginBottom: 20 }}>
            <div>
              <p className="eyebrow">CHANGE RECORDED</p>
              <h2 style={{ fontSize: 16, margin: 0 }}>{notice}</h2>
            </div>
          </div>
        )}

        <div className="admin-policy-note" style={{ marginBottom: 20 }}>
          <b>Key Compatibility Notice</b>
          <p>
            Category keys (e.g. <code>apartment</code>, <code>plot</code>, <code>villa</code>) are tied to listing records.
            Deactivating a category hides it from homepage filters without destroying existing property data.
          </p>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Configured Categories</h2>
              <p>Manage display names, icon symbols, active state, and sorting order</p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-muted)", fontSize: 11, padding: "30px 0", textAlign: "center" }}>Loading categories...</p>
          ) : !categories.length ? (
            <div className="admin-table-empty">
              <span>⌂</span>
              <b>No categories defined</b>
              <p>Categories will be seeded automatically on API startup.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Key Identifier</th>
                    <th>Display Label</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.key}>
                      <td style={{ padding: "12px", fontSize: 18 }}>{cat.icon}</td>
                      <td style={{ padding: "12px", fontSize: 11, fontWeight: 700 }}>
                        <code>{cat.key}</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11 }}>{cat.label}</td>
                      <td style={{ padding: "12px", fontSize: 11 }}>{cat.sortOrder}</td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <span className={`report-status report-status-${cat.active ? "active" : "dismissed"}`}>
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="button button-outline"
                            style={{ padding: "4px 8px", fontSize: 9 }}
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditLabel(cat.label);
                              setEditIcon(cat.icon);
                              setEditSortOrder(cat.sortOrder);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button-outline"
                            style={{
                              padding: "4px 8px",
                              fontSize: 9,
                              color: cat.active ? "#D97706" : "var(--color-green)",
                              borderColor: cat.active ? "#FCD34D" : "var(--color-green)",
                            }}
                            onClick={() => void toggleCategoryStatus(cat.key, cat.active)}
                          >
                            {cat.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Edit Category */}
        {editingCategory && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                maxWidth: 440,
                width: "100%",
                padding: 24,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>Edit Category</h2>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
                Key: <code>{editingCategory.key}</code> (immutable)
              </p>

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700 }}>
                    Display Label:
                    <input
                      required
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: 8,
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                      }}
                    />
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                      Icon Symbol:
                      <input
                        required
                        type="text"
                        maxLength={8}
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        style={{
                          width: "100%",
                          marginTop: 4,
                          padding: 8,
                          fontSize: 11,
                          borderRadius: 6,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-bg)",
                          color: "var(--color-text)",
                        }}
                      />
                    </label>

                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                      Sort Order:
                      <input
                        required
                        type="number"
                        min={0}
                        max={1000}
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(Number(e.target.value))}
                        style={{
                          width: "100%",
                          marginTop: 4,
                          padding: 8,
                          fontSize: 11,
                          borderRadius: 6,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-bg)",
                          color: "var(--color-text)",
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setEditingCategory(null)}
                    disabled={submittingEdit}
                    style={{ fontSize: 11 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={submittingEdit}
                    style={{ fontSize: 11 }}
                  >
                    {submittingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
