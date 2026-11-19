"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { AdminCategoryRecord, fetchAdminApi } from "../lib/adminApi";

export default function AdminCategoriesPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Edit category modal
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRecord | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token required.");

      const data = await fetchAdminApi<AdminCategoryRecord[]>("/categories", token);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchCategories();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchCategories]);

  const toggleCategoryStatus = async (key: string, currentActive: boolean) => {
    setError("");
    setNotice("");
    try {
      const token = await getToken();
      await fetchAdminApi(`/categories/${encodeURIComponent(key)}/toggle`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      setNotice(`Category "${key}" set to ${!currentActive ? "Active" : "Inactive"}.`);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not toggle category status.");
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
      await fetchAdminApi(`/categories/${encodeURIComponent(editingCategory.key)}`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          icon: editIcon.trim(),
          sortOrder: Number(editSortOrder),
        }),
      });

      setNotice(`Category "${editingCategory.key}" updated successfully.`);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <AdminShell
      activeSection="categories"
      title="Property Categories Taxonomy"
      description="Manage marketplace property classifications, category icons, display sorting, and active visibility."
      actions={
        <div className="shadcn-admin-action-row">
          <button
            type="button"
            className="shadcn-admin-btn is-outline"
            onClick={() => void fetchCategories()}
            disabled={loading}
          >
            ↻ Refresh
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

      {/* CATEGORIES CARD */}
      <div className="shadcn-admin-card">
        <div className="shadcn-admin-table-wrap">
          <table className="shadcn-admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>System Key</th>
                <th>Sort Order</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="shadcn-admin-table-empty">
                    Loading categories from MongoDB…
                  </td>
                </tr>
              ) : !categories.length ? (
                <tr>
                  <td colSpan={5} className="shadcn-admin-table-empty">
                    No categories registered in database.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.key}>
                    <td>
                      <div className="shadcn-admin-category-cell">
                        <span className="shadcn-admin-category-icon-box">
                          {cat.icon || "⌂"}
                        </span>
                        <div className="shadcn-admin-category-info">
                          <strong className="shadcn-admin-cell-title">{cat.label}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="shadcn-admin-code-id">{cat.key}</code>
                    </td>
                    <td>
                      <span className="shadcn-admin-cell-text">#{cat.sortOrder}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`shadcn-admin-toggle-btn ${cat.active ? "is-active" : ""}`}
                        onClick={() => void toggleCategoryStatus(cat.key, cat.active)}
                        aria-label={`Toggle ${cat.label} active status`}
                      >
                        <span className="shadcn-admin-toggle-knob" />
                        <span className="shadcn-admin-toggle-label">
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="shadcn-admin-table-actions">
                        <button
                          type="button"
                          className="shadcn-admin-btn is-xs is-outline"
                          onClick={() => {
                            setEditingCategory(cat);
                            setEditLabel(cat.label);
                            setEditIcon(cat.icon || "");
                            setEditSortOrder(cat.sortOrder || 0);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingCategory && (
        <div className="shadcn-admin-modal-backdrop">
          <div className="shadcn-admin-modal-dialog">
            <div className="shadcn-admin-modal-head">
              <h3>Edit Category: {editingCategory.label}</h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="shadcn-admin-modal-close">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="shadcn-admin-modal-body">
              <div className="shadcn-admin-field">
                <label htmlFor="edit-cat-label">Display Label:</label>
                <input
                  id="edit-cat-label"
                  type="text"
                  className="shadcn-admin-input"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  required
                />
              </div>

              <div className="shadcn-admin-field">
                <label htmlFor="edit-cat-icon">Icon / Emoji:</label>
                <input
                  id="edit-cat-icon"
                  type="text"
                  className="shadcn-admin-input"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="e.g. 🏢, 🏡, 📐"
                />
              </div>

              <div className="shadcn-admin-field">
                <label htmlFor="edit-cat-order">Sort Order (Lower appears first):</label>
                <input
                  id="edit-cat-order"
                  type="number"
                  className="shadcn-admin-input"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Number(e.target.value))}
                  required
                />
              </div>

              <div className="shadcn-admin-modal-actions">
                <button
                  type="button"
                  className="shadcn-admin-btn is-ghost"
                  onClick={() => setEditingCategory(null)}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shadcn-admin-btn is-primary"
                  disabled={submittingEdit || !editLabel.trim()}
                >
                  {submittingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
