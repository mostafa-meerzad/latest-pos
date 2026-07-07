"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Save, Trash2 } from "lucide-react";

export default function CartTable({
  items,
  editingId,
  editValues,
  setEditValues,
  totals,
  taxAmount,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteItem,
  openKeyboard,
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Items</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                No items
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={row.tempId}>
                <TableCell>
                  {editingId === row.tempId ? (
                    <Input
                      value={editValues?.name || ""}
                      onChange={(e) =>
                        setEditValues((s) => ({ ...(s || {}), name: e.target.value }))
                      }
                    />
                  ) : (
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-gray-500">{row.barcode}</div>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {editingId === row.tempId ? (
                    <Input
                      onFocus={() => openKeyboard("unitPrice")}
                      onPointerDown={() => openKeyboard("unitPrice")}
                      data-input-type="unitPrice"
                      onKeyDown={(e) => {
                        if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                      }}
                      type="number"
                      step="1"
                      min={0}
                      value={String(editValues?.unitPrice ?? row.unitPrice)}
                      readOnly
                      inputMode="none"
                      onChange={(e) =>
                        setEditValues((s) => ({ ...(s || {}), unitPrice: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    "AFN " + Number(row.unitPrice)
                  )}
                </TableCell>

                <TableCell className="w-28">
                  {editingId === row.tempId ? (
                    <Input
                      onFocus={() => openKeyboard("editQuantity")}
                      onPointerDown={() => openKeyboard("editQuantity")}
                      data-input-type="editQuantity"
                      type="text"
                      inputMode="decimal"
                      min={0}
                      step={editValues?.unit === "kg" ? "0.01" : "1"}
                      value={String(editValues?.quantity ?? row.quantity)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        if (num >= 0) {
                          if (editValues?.unit === "pcs") {
                            if (Number.isInteger(num))
                              setEditValues((s) => ({ ...(s || {}), quantity: num }));
                          } else {
                            setEditValues((s) => ({ ...(s || {}), quantity: num }));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (editValues?.unit === "pcs") {
                          if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                        } else {
                          if (["-", "e", "E"].includes(e.key)) e.preventDefault();
                        }
                      }}
                    />
                  ) : (
                    row.quantity
                  )}
                </TableCell>

                <TableCell>{row.unit || "No unit provided"}</TableCell>

                <TableCell className="w-32">
                  {editingId === row.tempId ? (
                    <Input
                      onFocus={() => openKeyboard("editDiscount")}
                      onPointerDown={() => openKeyboard("editDiscount")}
                      data-input-type="editDiscount"
                      onKeyDown={(e) => {
                        if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                      }}
                      type="number"
                      min={0}
                      step="1"
                      value={String(editValues?.discount ?? row.discount)}
                      readOnly
                      inputMode="none"
                      onChange={(e) =>
                        setEditValues((s) => ({ ...(s || {}), discount: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    "AFN " + Number(row.discount || 0)
                  )}
                </TableCell>

                <TableCell>
                  {editingId === row.tempId
                    ? "AFN " +
                      Math.floor(
                        Number(editValues?.unitPrice || 0) *
                          Number(editValues?.quantity || 0) -
                          Number(editValues?.discount || 0)
                      )
                    : "AFN " + row.subtotal}
                </TableCell>

                <TableCell className="w-36">
                  {editingId === row.tempId ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={onSaveEdit}>
                        <Save className="w-4 h-4" /> Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onStartEdit(row)}>
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteItem(row.tempId)}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-end gap-4">
        <div className="bg-slate-50 p-3 rounded border text-right">
          <div className="text-sm text-gray-600">
            Subtotal: AFN {Math.floor(totals.subtotal)}
          </div>
          <div className="text-sm text-gray-600">
            Discounts: -AFN {Math.floor(totals.discount)}
          </div>
          <div className="text-sm text-gray-600">
            Tax: AFN {Math.floor(Number(taxAmount || 0))}
          </div>
          <div className="text-xl font-semibold mt-1">
            Total: AFN {Math.floor(totals.final + (taxAmount || 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
