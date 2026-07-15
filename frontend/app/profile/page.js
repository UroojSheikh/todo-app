"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", city: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchProfile(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          city: data.city,
          phone: data.phone,
        });
      }
    } catch (err) {
      setError("Could not load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile(token);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not update profile");
        return;
      }

      setProfile(data);
      setSuccess("Profile updated successfully");
      setEditMode(false);

      const storedUser = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, firstName: data.firstName, lastName: data.lastName })
      );
    } catch (err) {
      setError("Could not connect to server");
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-indigo-200 rounded-lg p-2.5 mb-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="min-h-screen bg-indigo-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700">My Profile</h1>
          <button
            onClick={goToDashboard}
            className="text-sm text-indigo-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100">
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

          {!editMode ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-gray-800 font-medium">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-gray-800 font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Date of Birth</p>
                <p className="text-gray-800 font-medium">
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">City</p>
                <p className="text-gray-800 font-medium">{profile.city}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-gray-800 font-medium">{profile.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Account Status</p>
                <p className="text-gray-800 font-medium">{profile.status}</p>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-semibold hover:bg-indigo-700 transition mt-4"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <label className="text-xs text-gray-500 mb-1 block">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className={inputClass}
              />

              <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className={inputClass}
              />

              <label className="text-xs text-gray-500 mb-1 block">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className={inputClass}
              />

              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className={inputClass}
              />

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-lg p-2.5 font-semibold hover:bg-indigo-700 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-lg p-2.5 font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}