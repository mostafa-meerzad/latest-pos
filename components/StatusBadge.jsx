const STATUS_STYLES = {
  ACTIVE: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  DELIVERED: "bg-green-100 text-green-700",

  INACTIVE: "bg-gray-100 text-gray-600",
  inactive: "bg-gray-100 text-gray-600",

  PENDING: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",

  FAILED: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  canceled: "bg-red-100 text-red-700",
  CANCELED: "bg-red-100 text-red-700",
  DELETED: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status?.toLowerCase() ?? "—"}
    </span>
  );
}
