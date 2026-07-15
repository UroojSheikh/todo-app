"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Block non-superusers from using this login page
      if (data.user.role !== "SUPERUSER") {
        setError("This login is for superusers only.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/admin");
    } catch (err) {
      setError("Could not connect to server");
      setLoading(false);
    }
  }
return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4" suppressHydrationWarning>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm border border-indigo-100"
      >
        <h1 className="text-3xl font-bold mb-1 text-indigo-700">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Log in to see your tasks.</p>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-4 border border-red-100">
            {error}
          </p>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border border-indigo-200 rounded-lg p-2.5 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border border-indigo-200 rounded-lg p-2.5 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
        </p>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Superuser?{" "}
          <a href="/admin/login" className="text-indigo-500 hover:underline">
            Login here
          </a>
        </p>
      </form>
    </div>
  );
}