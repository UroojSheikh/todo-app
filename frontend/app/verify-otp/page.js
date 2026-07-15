"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Verification failed");
        setLoading(false);
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError("Could not connect to server");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm border border-indigo-100"
      >
        <h1 className="text-3xl font-bold mb-2 text-indigo-700">Verify OTP</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter the code sent to <span className="font-medium text-gray-700">{email}</span>
        </p>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-4 border border-red-100">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-emerald-50 text-emerald-700 text-sm p-2 rounded-lg mb-4 border border-emerald-100">
            {success}
          </p>
        )}

        <input
          type="text"
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          className="w-full border border-indigo-200 rounded-lg p-2.5 mb-4 text-center tracking-widest text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-indigo-50"><p className="text-gray-500">Loading...</p></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}