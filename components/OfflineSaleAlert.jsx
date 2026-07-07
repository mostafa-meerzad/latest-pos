"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useOfflineStore from "@/lib/stores/offlineStore";
import { retryFailedSale, voidFailedSale } from "@/lib/offline/sync";

export default function OfflineSaleAlert({ onRetryPopulate }) {
  const { failedSales } = useOfflineStore();

  if (failedSales.length === 0) return null;

  return (
    <div className="space-y-2">
      {failedSales.map((sale) => {
        const { localSaleData, errorMessage, localId } = sale;
        const customer = localSaleData?.customer?.name || "Walk-in Customer";
        const itemCount = localSaleData?.items?.length ?? 0;
        const total = sale.payload?.totalAmount ?? 0;

        return (
          <Card key={localId} className="border-l-4 border-l-red-500">
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">
                      Sale conflict — {customer}, {itemCount} {itemCount === 1 ? "item" : "items"}, AFN {total.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{errorMessage}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (onRetryPopulate && localSaleData) {
                        onRetryPopulate(localSaleData, localId);
                      } else {
                        retryFailedSale(localId);
                      }
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => voidFailedSale(localId)}
                  >
                    Void
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
