"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, ArrowRightLeft, RefreshCw, Mail, Phone, ChevronDown, ChevronUp, Search, Plus, Trash2, Send, ExternalLink, CheckCircle2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import type { Product } from "@/lib/types";

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

export default function AdminPrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState<Record<string, PrescriptionRecommendation[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch("/api/prescriptions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
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
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Prescriptions ({items.length})</h1>
      <p className="mb-6 text-sm text-muted">Manage upload, transfer, and refill requests.</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
          No prescription requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
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
                                    <p className="text-[10px] text-muted">${rec.price.toFixed(2)}</p>
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
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                              <input
                                type="text"
                                placeholder="Search products to recommend..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-border pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
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
                                        <p className="text-[10px] text-muted">${product.price.toFixed(2)}</p>
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
    </div>
  );
}
