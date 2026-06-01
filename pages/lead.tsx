// /pages/login.tsx
import React, { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  // Set default to 'lead' since you're testing lead login
  const [roleChoice, setRoleChoice] = useState<"agent" | "lead">("lead");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  try {
    const { data } = await axios.post("/api/lead-ms/login", {
      email,
      password,
    });

    if (data?.success) {
      console.log("Login successful:", data.user);

      const apiRole = data.role?.trim().toLowerCase();
      const selectedRole = roleChoice?.trim().toLowerCase();

      // Store tokens & user info separately for lead and agent
      if (apiRole === "lead") {
        localStorage.setItem("leadToken", data.token);
        localStorage.setItem("leadUser", JSON.stringify(data.user));
      } else if (apiRole === "agent") {
        localStorage.setItem("agentToken", data.token);
        localStorage.setItem("agentUser", JSON.stringify(data.user));
      }

      localStorage.setItem("role", apiRole);

      // Redirect based on role match
      if (apiRole === "lead" && selectedRole === "lead") {
        console.log("✅ Lead login successful - redirecting");
        window.location.href = "/lead/dashboard";
      } else if (apiRole === "agent" && selectedRole === "agent") {
        console.log("✅ Agent login successful - redirecting");
        window.location.href = "/agent/dashboard";
      } else {
        console.log("❌ Role mismatch:", { apiRole, selectedRole });
        alert(
          `Role mismatch. API returned: ${apiRole}, but you selected: ${selectedRole}`
        );
      }
    } else {
      alert(data?.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login request failed");
  }
}


  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    >
      <h2>Login</h2>

      {/* Make the selection more obvious */}
      <div
        style={{
          margin: "20px 0",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
          Select Login Type:
        </h3>
        <div style={{ margin: "12px 0" }}>
          <label
            style={{
              display: "block",
              margin: "8px 0",
              cursor: "pointer",
              padding: "8px",
              backgroundColor: roleChoice === "agent" ? "#e3f2fd" : "white",
              borderRadius: 4,
            }}
          >
            <input
              type="radio"
              checked={roleChoice === "agent"}
              onChange={() => setRoleChoice("agent")}
              style={{ marginRight: "8px" }}
            />
            <strong>Agent Login</strong>
          </label>

          <label
            style={{
              display: "block",
              margin: "8px 0",
              cursor: "pointer",
              padding: "8px",
              backgroundColor: roleChoice === "lead" ? "#e8f5e8" : "white",
              borderRadius: 4,
            }}
          >
            <input
              type="radio"
              checked={roleChoice === "lead"}
              onChange={() => setRoleChoice("lead")}
              style={{ marginRight: "8px" }}
            />
            <strong>Lead Admin Login</strong>
          </label>
        </div>
        <p style={{ margin: "8px 0", fontSize: "14px", color: "#666" }}>
          Currently selected:{" "}
          <strong>{roleChoice === "lead" ? "Lead Admin" : "Agent"}</strong>
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 8, padding: "8px" }}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: "8px" }}
          required
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Login as {roleChoice === "lead" ? "Lead Admin" : "Agent"}
        </button>
      </form>
    </div>
  );
}
