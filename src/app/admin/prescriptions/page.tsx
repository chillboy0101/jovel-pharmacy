"use client";

import { Suspense, useEffect, useState } from "react";
import { FileText, Upload, ArrowRightLeft, RefreshCw, Mail, Phone, ChevronDown, ChevronUp, Search, Plus, Trash2, Send, ExternalLink, CheckCircle2, Package, X } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import type { Product } from "@/lib/types";
import { useSearchParams } from "next/navigation";

type PrescriptionRecommendation = {
  id: string;
  name: string;
  price: number;
  emoji: string;
};

type Prescription = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  fileUrl: string | null;
  notes: string | null;
  currentPharmacy: string | null;
  currentPharmacyPhone: string | null;
  rxNumber: string | null;
  medications: string | null;
  dob: string | null;
  pickup: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

const statusOptions = ["pending", "processing", "reviewed", "recommendation_sent", "ready", "completed"];
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  reviewed: "bg-purple-100 text-purple-700",
  recommendation_sent: "bg-pink-100 text-pink-700",
  ready: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
};

const typeIcons: Record<string, React.ReactNode> = {
  upload: <Upload className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  refill: <RefreshCw className="h-4 w-4" />,
};

function AdminPrescriptionsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState<Record<string, PrescriptionRecommendation[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [browseOpenForId, setBrowseOpenForId] = useState<string | null>(null);
  const [browseCategories, setBrowseCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [browseCat, setBrowseCat] = useState<string>("all");
  const [browseSearch, setBrowseSearch] = useState<string>("");
  const [browseSort, setBrowseSort] = useState<string>("name");
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState<number>(1);
  const browsePageSize = 8;

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    setSearch(q);
    setExpandedId(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPrescriptions(firstLoad = false) {
    if (!firstLoad) setRefreshing(true);
    try {
      const r = await fetch("/api/prescriptions");
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
      const notes: Record<string, string> = {};
      const recs: Record<string, PrescriptionRecommendation[]> = {};

      arr.forEach((p: Prescription) => {
        notes[p.id] = p.adminNotes ?? "";
        // Parse recommendations from adminNotes if it's JSON
        try {
          if (p.adminNotes?.startsWith("{")) {
            const parsed = JSON.parse(p.adminNotes);
            if (parsed.recommendations) {
              recs[p.id] = parsed.recommendations;
              // Update notes to only show the actual text notes if any
              notes[p.id] = parsed.notes || "";
            } else {
              recs[p.id] = [];
            }
          } else {
            recs[p.id] = [];
          }
        } catch {
          recs[p.id] = [];
        }
      });

      setAdminNotes(notes);
      setRecommendations(recs);
    } catch {
      // Keep last good data
    } finally {
      if (firstLoad) setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPrescriptions(true);
    const interval = setInterval(() => {
      loadPrescriptions(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Search products for recommendations
  useEffect(() => {
    if (searchQuery.length < 2) {
      queueMicrotask(() => setSearchResults([]));
      return;
    }
    queueMicrotask(() => setIsSearching(true));
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!browseOpenForId) return;
    if (browseCategories.length > 0) return;

    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setBrowseCategories(
          arr
            .map((c: { id?: unknown; name?: unknown }) => ({
              id: String(c.id ?? ""),
              name: String(c.name ?? ""),
            }))
            .filter((c: { id: string; name: string }) => Boolean(c.id && c.name)),
        );
      })
      .catch(() => {});
  }, [browseOpenForId, browseCategories.length]);

  useEffect(() => {
    if (!browseOpenForId) return;

    setBrowseLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (browseCat && browseCat !== "all") params.set("cat", browseCat);
      if (browseSearch.trim()) params.set("search", browseSearch.trim());
      if (browseSort) params.set("sort", browseSort);
      params.set("limit", "200");

      fetch(`/api/products?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          setBrowseProducts(Array.isArray(data) ? data : []);
          setBrowsePage(1);
        })
        .finally(() => setBrowseLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [browseOpenForId, browseCat, browseSearch, browseSort]);

  async function handleUpdate(id: string, status: string) {
    setUpdatingId(id);
    
    // Combine notes and recommendations into adminNotes JSON
    const payload = {
      status,
      adminNotes: JSON.stringify({
        notes: adminNotes[id] ?? "",
        recommendations: recommendations[id] ?? []
      })
    };

    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
    setUpdatingId(null);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm(
      "⚠️ Permanently delete this prescription?\n\nThis will remove the record and delete the uploaded file (if any). This cannot be undone.",
    );
    if (!confirmed) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        if (expandedId === id) setExpandedId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Network error. Please try again.");
    }

    setUpdatingId(null);
  }

  const addRecommendation = (prescriptionId: string, product: Product) => {
    setRecommendations(prev => {
      const current = prev[prescriptionId] || [];
      if (current.find(r => r.id === product.id)) return prev;
      return {
        ...prev,
        [prescriptionId]: [...current, {
          id: product.id,
          name: product.name,
          price: product.price,
          emoji: product.emoji
        }]
      };
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeRecommendation = (prescriptionId: string, productId: string) => {
    setRecommendations(prev => ({
      ...prev,
      [prescriptionId]: (prev[prescriptionId] || []).filter(r => r.id !== productId)
    }));
  };

  const openBrowse = (prescriptionId: string) => {
    setBrowseOpenForId(prescriptionId);
    setBrowseCat("all");
    setBrowseSearch("");
    setBrowseSort("name");
    setBrowseProducts([]);
    setBrowsePage(1);
  };

  const sendRecommendationLink = async (id: string) => {
    const checkoutUrl = `${window.location.origin}/prescriptions/checkout/${id}`;
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      alert("Checkout link copied to clipboard!\n\n" + checkoutUrl);
      // Update status to recommendation_sent
      handleUpdate(id, "recommendation_sent");
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  if (loading) return <PageLoader text="Loading prescriptions…" />;

  const filteredItems = items
    .filter((p) => {
      const s = search.trim().toLowerCase();
      if (!s) return true;
      return (
        p.name.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.phone.toLowerCase().includes(s) ||
        p.type.toLowerCase().includes(s) ||
        p.status.toLowerCase().includes(s) ||
        (p.notes ?? "").toLowerCase().includes(s) ||
        (p.medications ?? "").toLowerCase().includes(s) ||
        (p.currentPharmacy ?? "").toLowerCase().includes(s) ||
        (p.rxNumber ?? "").toLowerCase().includes(s) ||
        (adminNotes[p.id] ?? "").toLowerCase().includes(s)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Prescriptions ({items.length})
          </h1>
          <p className="text-sm text-muted">
            Manage prescription uploads, transfers, and refills.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => loadPrescriptions(false)}
            disabled={refreshing}
            className="w-full sm:w-auto rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-foreground hover:bg-muted-light disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-base sm:text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No prescription requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-white">
                <div
                  className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-muted-light/40"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] md:text-xs text-muted truncate capitalize">
                      {p.type} request · {new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {p.dob && (
                  <div className="mt-1 px-1 text-[10px] text-muted">
                    <span className="font-semibold">DOB:</span> {new Date(p.dob).toLocaleDateString()}
                  </div>
                )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <select
                      value={p.status}
                      disabled={updatingId === p.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleUpdate(p.id, e.target.value); }}
                      className={`rounded-full border-0 px-3 py-1 text-[10px] md:text-xs font-semibold capitalize outline-none cursor-pointer disabled:opacity-60 ${statusColors[p.status] ?? "bg-muted-light text-muted"}`}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted shrink-0" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Patient Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`mailto:${p.email}`} className="text-primary hover:underline">{p.email}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-muted" />
                            <a href={`tel:${p.phone}`} className="text-foreground/80">{p.phone}</a>
                          </div>
                          {p.currentPharmacy && (
                            <p className="text-xs text-muted">Transfer from: <span className="text-foreground">{p.currentPharmacy}</span></p>
                          )}
                          {p.rxNumber && (
                            <p className="text-xs text-muted">Rx #: <span className="font-mono text-foreground">{p.rxNumber}</span></p>
                          )}
                          {p.medications && (
                            <div className="mt-2 rounded-lg bg-muted-light p-3 text-xs text-foreground/80">
                              <span className="font-semibold">Medications: </span>{p.medications}
                            </div>
                          )}
                          {p.notes && (
                            <div className="mt-2 rounded-lg bg-muted-light p-3 text-xs text-foreground/80">
                              <span className="font-semibold">Notes: </span>{p.notes}
                            </div>
                          )}
                          {p.fileUrl && (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Prescription File
                            </a>
                          )}
                          {p.pickup && (
                            <p className="text-xs text-muted">Pickup: <span className="text-foreground">{p.pickup}</span></p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-6">
                        {/* Admin Notes */}
                        <div>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Pharmacist Notes</h3>
                          <textarea
                            value={adminNotes[p.id] ?? ""}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Add internal notes, instructions…"
                            rows={3}
                            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                          />
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
                            Product Recommendations
                            {recommendations[p.id]?.length > 0 && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {recommendations[p.id].length} items
                              </span>
                            )}
                          </h3>
                          
                          {/* Current Recs */}
                          <div className="mb-3 space-y-2">
                            {(recommendations[p.id] || []).map((rec) => (
                              <div key={rec.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted-light/50 border border-border/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xl shrink-0">{rec.emoji}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{rec.name}</p>
                                    <p className="text-[10px] text-muted">GH₵{rec.price.toFixed(2)}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeRecommendation(p.id, rec.id)}
                                  className="p-1 text-muted hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Search & Add */}
                          <div className="relative">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openBrowse(p.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[10px] font-bold text-foreground hover:bg-muted-light"
                              >
                                <Package className="h-3.5 w-3.5" /> Browse Products
                              </button>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                              <input
                                type="text"
                                placeholder="Search products to recommend..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-border pl-9 pr-4 py-2 text-base sm:text-xs outline-none focus:border-primary"
                              />
                            </div>
                            
                            {searchQuery.length >= 2 && (
                              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-border bg-white shadow-lg p-1">
                                {isSearching ? (
                                  <div className="p-4 text-center text-xs text-muted">Searching...</div>
                                ) : searchResults.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-muted">No products found</div>
                                ) : (
                                  searchResults.map((product) => (
                                    <button
                                      key={product.id}
                                      onClick={() => addRecommendation(p.id, product)}
                                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted-light"
                                    >
                                      <span className="text-xl shrink-0">{product.emoji}</span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                                        <p className="text-[10px] text-muted">GH₵{product.price.toFixed(2)}</p>
                                      </div>
                                      <Plus className="h-3.5 w-3.5 text-primary" />
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => handleUpdate(p.id, p.status)}
                            disabled={updatingId === p.id}
                            className="flex-1 min-w-[120px] rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {updatingId === p.id ? "Saving..." : "Save Changes"}
                          </button>
                          
                          {(recommendations[p.id]?.length > 0) && (
                            <button
                              onClick={() => sendRecommendationLink(p.id)}
                              className="flex-1 min-w-[160px] rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Send Recommendations
                            </button>
                          )}

                          {p.status === "recommendation_sent" && (
                            <a
                              href={`/prescriptions/checkout/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 min-w-[140px] rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted hover:bg-muted-light transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Preview Checkout
                            </a>
                          )}

                          {p.status === "recommendation_sent" && (
                            <a
                              href={`/admin/orders?q=${encodeURIComponent(p.id)}`}
                              className="flex-1 min-w-[140px] rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted-light transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Related Orders
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={updatingId === p.id}
                            className="flex-1 min-w-[120px] rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {browseOpenForId && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBrowseOpenForId(null)}
          />
          <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden border border-border bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(80vh,760px)] sm:w-[min(900px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted-light/30 px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Browse Products</h3>
                <p className="text-xs text-muted">Search and add items to recommendations.</p>
              </div>
              <button
                type="button"
                onClick={() => setBrowseOpenForId(null)}
                className="rounded-lg p-2 text-muted hover:bg-muted-light hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 border-b border-border px-4 py-4 sm:px-5 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Search</label>
                <input
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search by name, brand, description..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base sm:text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Category</label>
                <select
                  value={browseCat}
                  onChange={(e) => setBrowseCat(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base sm:text-sm outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  {browseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Sort</label>
                <select
                  value={browseSort}
                  onChange={(e) => setBrowseSort(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base sm:text-sm outline-none focus:border-primary"
                >
                  <option value="name">Name</option>
                  <option value="price-asc">Price (Low → High)</option>
                  <option value="price-desc">Price (High → Low)</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {browseLoading ? (
                <div className="py-10 text-center text-sm text-muted">Loading products…</div>
              ) : browseProducts.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted">No products found.</div>
              ) : (
                <div className="grid gap-2">
                  {browseProducts
                    .slice((browsePage - 1) * browsePageSize, browsePage * browsePageSize)
                    .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted-light text-2xl">
                          {product.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {product.brand} · Stock: {product.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-foreground">GH₵{product.price.toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!browseOpenForId) return;
                            addRecommendation(browseOpenForId, product);
                          }}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!browseLoading && browseProducts.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-5">
                <p className="text-xs text-muted">
                  Page <span className="font-semibold text-foreground">{browsePage}</span> of{" "}
                  <span className="font-semibold text-foreground">
                    {Math.max(1, Math.ceil(browseProducts.length / browsePageSize))}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                    disabled={browsePage <= 1}
                    className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-foreground hover:bg-muted-light disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBrowsePage((p) =>
                        Math.min(Math.ceil(browseProducts.length / browsePageSize), p + 1),
                      )
                    }
                    disabled={browsePage >= Math.ceil(browseProducts.length / browsePageSize)}
                    className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-foreground hover:bg-muted-light disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPrescriptionsPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading prescriptions…" />}>
      <AdminPrescriptionsContent />
    </Suspense>
  );
}
