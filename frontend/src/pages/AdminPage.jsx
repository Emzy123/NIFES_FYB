import { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard.jsx";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  const login = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";
    const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { "x-admin-password": password } });
    setAuthed(res.ok);
  };

  if (!authed) {
    return (
      <main className="admin-shell">
        <h1>Admin Login</h1>
        <p className="admin-login-hint">Use the same password as <code>ADMIN_PASSWORD</code> in the backend <code>.env</code>.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
        />
        <button type="button" onClick={login}>
          Unlock dashboard
        </button>
      </main>
    );
  }

  return <AdminDashboard password={password} onLogout={() => setAuthed(false)} />;
}
