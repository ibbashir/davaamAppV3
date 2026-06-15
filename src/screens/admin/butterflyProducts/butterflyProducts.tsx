import React, { useState, useEffect } from "react";
import { getRequest, postRequest, putRequest, deleteRequest } from "@/Apis/Api";
import { Plus, Pencil, Trash2, RefreshCw, X, PlusCircle, MinusCircle, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SiteHeader } from "@/components/admin/site-header";

interface Variant {
  id?: number;
  _key: string;
  name: string;
  price: string;
}

interface ButterflyProduct {
  id: number;
  skin: string;
  variant: unknown;
  created_at: string;
}

interface ParsedProduct extends Omit<ButterflyProduct, "variant"> {
  variants: Variant[];
}

interface ProductFormData {
  skin: string;
  variants: Variant[];
}

let _keyCounter = 0;
const newKey = () => `v-${++_keyCounter}`;

const EMPTY_FORM: ProductFormData = {
  skin: "",
  variants: [{ _key: newKey(), name: "", price: "" }],
};

const parseVariants = (raw: unknown): Variant[] => {
  const items: Omit<Variant, "_key">[] = Array.isArray(raw)
    ? (raw as Omit<Variant, "_key">[])
    : typeof raw === "string" && raw
    ? (() => {
        try {
          const p = JSON.parse(raw);
          return Array.isArray(p) ? p : [];
        } catch {
          return [];
        }
      })()
    : [];
  return items.map((v) => ({ ...v, _key: newKey() }));
};

const normalizeToArray = (data: unknown): ButterflyProduct[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as ButterflyProduct[];
  return [data as ButterflyProduct];
};

// ── Sortable row ──────────────────────────────────────────────────────────────

interface SortableRowProps {
  variant: Variant;
  idx: number;
  showRemove: boolean;
  onChange: (idx: number, field: "name" | "price", value: string) => void;
  onRemove: (idx: number) => void;
}

function SortableVariantRow({ variant, idx, showRemove, onChange, onRemove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: variant._key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>
      <input
        value={variant.name}
        onChange={(e) => onChange(idx, "name", e.target.value)}
        placeholder="Variant name"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        value={variant.price}
        onChange={(e) => onChange(idx, "price", e.target.value)}
        placeholder="Price"
        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
        >
          <MinusCircle size={18} />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ButterflyProducts: React.FC = () => {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ParsedProduct | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRequest<{ success?: boolean; data?: unknown }>(
        "/admin/getButterflyProducts"
      );
      const raw = normalizeToArray(result?.data ?? result);
      setProducts(raw.map((p) => ({ ...p, variants: parseVariants(p.variant) })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ skin: "", variants: [{ _key: newKey(), name: "", price: "" }] });
    setModalOpen(true);
  };

  const openEditModal = (product: ParsedProduct) => {
    setEditingProduct(product);
    setForm({
      skin: product.skin,
      variants: product.variants.length
        ? product.variants.map((v) => ({ ...v, _key: v._key ?? newKey() }))
        : [{ _key: newKey(), name: "", price: "" }],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleVariantChange = (idx: number, field: "name" | "price", value: string) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariantRow = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { _key: newKey(), name: "", price: "" }],
    }));
  };

  const removeVariantRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIdx = prev.variants.findIndex((v) => v._key === active.id);
      const newIdx = prev.variants.findIndex((v) => v._key === over.id);
      return { ...prev, variants: arrayMove(prev.variants, oldIdx, newIdx) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skin.trim()) {
      toast.error("Skin name is required.");
      return;
    }
    const validVariants = form.variants.filter((v) => v.name.trim() && v.price.trim());
    if (validVariants.length === 0) {
      toast.error("At least one variant with name and price is required.");
      return;
    }

    try {
      setSubmitting(true);

      const maxExistingId = validVariants.reduce((max, v) => Math.max(max, v.id ?? 0), 0);
      let nextId = maxExistingId;
      const variantsWithIds = validVariants.map((v) => ({
        id: v.id ?? ++nextId,
        name: v.name.trim(),
        price: v.price,
      }));

      if (editingProduct) {
        await putRequest(`/admin/updateButterflyProducts/${editingProduct.id}`, {
          id: editingProduct.id,
          skin: form.skin.trim(),
          variant: variantsWithIds,
        });
        toast.success("Product updated successfully.");
      } else {
        await postRequest("/admin/addButterflyProduct", {
          skin: form.skin.trim(),
          variant: variantsWithIds,
        });
        toast.success("Product added successfully.");
      }

      closeModal();
      await fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRequest(`/admin/deleteButterflyProduct`, { id });
      toast.success("Product deleted.");
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <>
      <SiteHeader title="Butterfly Products" />

      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage butterfly machine product catalog
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="relative mb-4">
              <div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-sm">Loading products…</p>
          </div>
        ) : products.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 border-dashed">
            <CardContent className="flex flex-col items-center text-muted-foreground pt-6">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 opacity-40" />
              </div>
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Click "Add Product" to get started.</p>
              <Button className="mt-4" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Teal accent bar */}
                  <div className="w-1 self-stretch rounded-full bg-teal-600 flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{product.skin}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                      <span className="mx-1.5">·</span>
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                      className={expandedId === product.id ? "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-50" : ""}
                    >
                      {expandedId === product.id ? "Hide" : "Variants"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(product)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(product.id)} title="Delete"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Variants panel */}
                {expandedId === product.id && product.variants.length > 0 && (
                  <div className="border-t bg-muted/40 px-5 py-4">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Variants
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v, i) => (
                        <Badge key={v._key ?? i} variant="outline" className="gap-2 px-3 py-1.5 text-sm font-normal">
                          {v.name}
                          <span className="font-semibold text-teal-600">
                            Rs {Number(v.price).toLocaleString("en-IN")}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Skin */}
            <div className="space-y-1.5">
              <Label htmlFor="skin">
                Skin name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="skin"
                value={form.skin}
                onChange={(e) => setForm((p) => ({ ...p, skin: e.target.value }))}
                placeholder="e.g. Corporate"
              />
            </div>

            {/* Variants with drag */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Variants <span className="text-destructive">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add row
                </Button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={form.variants.map((v) => v._key)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {form.variants.map((v, idx) => (
                      <SortableVariantRow
                        key={v._key}
                        variant={v}
                        idx={idx}
                        showRemove={form.variants.length > 1}
                        onChange={handleVariantChange}
                        onRemove={removeVariantRow}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <DialogFooter className="pt-2 border-t gap-2">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Saving…" : editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <DialogHeader>
              <DialogTitle>Delete product?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">This action cannot be undone.</p>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ButterflyProducts;
