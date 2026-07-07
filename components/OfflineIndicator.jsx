"use client";

import { useEffect, useState } from "react";
import useOfflineStore from "@/lib/stores/offlineStore";
import { getMetaValue } from "@/lib/offline/db";

function formatOfflineDuration(since) {
  const ms = Date.now() - new Date(since).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function OfflineIndicator() {
  const { isOffline, pendingCount } = useOfflineStore();
  const [offlineSince, setOfflineSince] = useState(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    async function checkOfflineSince() {
      const since = await getMetaValue("went_offline_at");
      setOfflineSince(since);
    }

    checkOfflineSince();
    const interval = setInterval(checkOfflineSince, 60_000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const isLongOffline =
    isOffline &&
    offlineSince &&
    Date.now() - new Date(offlineSince).getTime() > 24 * 3_600_000;

  let dotColor = "bg-green-500";
  let label = "Online";

  if (isOffline) {
    dotColor = isLongOffline ? "bg-amber-500" : "bg-red-500";
    const duration = offlineSince ? ` ${formatOfflineDuration(offlineSince)}` : "";
    label = `Offline${duration}`;
    if (pendingCount > 0) label += ` · ${pendingCount} queued`;
  } else if (pendingCount > 0) {
    label = `Online · Syncing ${pendingCount}…`;
  }

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium bg-background">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </div>

      {isLongOffline && showBanner && (
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
          <span>
            Device has been offline for more than 24 hours — catalog data may be out of date.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            className="shrink-0 text-amber-600 hover:text-amber-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
