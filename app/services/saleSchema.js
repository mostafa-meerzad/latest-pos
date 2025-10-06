import z from "zod";

export const saleSchema = z.object({
  customerId: z.number().nullable().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  taxAmount: z.number().int().nonnegative().default(0),
  totalAmount: z.number().int().nonnegative(),
  // finalAmount: z.number().int().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().int().nonnegative(),
        discount: z.number().int().nonnegative().default(0),
        subtotal: z.number().int().nonnegative(),
        // frontend extras
        barcode: z.string().optional(),
        name: z.string().optional(),
        tempId: z.string().optional(),
      })
    )
    .nonempty("At least one item is required"),
});