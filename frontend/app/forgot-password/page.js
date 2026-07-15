"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full border border-indigo-200 rounded-lg p-2.5 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setStep(2);
      setLoading(false);
    } catch (err) {
      setError("Could not connect to server");
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess("Password reset! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError("Could not connect to server");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <form
        onSubmit={step === 1 ? handleRequestOtp : handleResetPassword}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm border border-indigo-100"
      >
        <h1 className="text-3xl font-bold mb-1 text-indigo-700">
          {step === 1 ? "Forgot password" : "Reset password"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === 1
            ? "Enter your email to receive a reset code."
            : `Enter the code sent to ${email} and your new password.`}
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

        {step === 1 ? (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={inputClass}
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Please wait..." : step === 1 ? "Send Code" : "Reset Password"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          <a href="/login" className="text-indigo-600 hover:underline">
            Back to login
          </a>
        </p>
      </form>
    </div>
  );
}