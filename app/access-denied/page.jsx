export default function AccessDenied() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 520, padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: "#4b5563", marginBottom: 16 }}>
          You do not have permission to access this page.
        </p>
        <a href="/" style={{ color: "#2563eb" }}>Go back home</a>
      </div>
    </div>
  );
}
