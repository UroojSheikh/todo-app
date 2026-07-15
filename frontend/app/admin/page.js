"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData(token) {
    try {
      const [pendingRes, usersRes] = await Promise.all([
        fetch("http://localhost:5000/superuser/pending", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("http://localhost:5000/superuser/users", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);

      const pendingData = await pendingRes.json();
      const usersData = await usersRes.json();

      if (pendingRes.ok) setPendingUsers(pendingData);
      if (usersRes.ok) setAllUsers(usersData);
    } catch (err) {
      setError("Could not load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "SUPERUSER") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
    fetchData(token);
  }, []);

  async function handleApprove(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/superuser/approve/" + id, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        fetchData(token);
      }
    } catch (err) {
      setError("Could not approve user");
    }
  }

  async function handleReject(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/superuser/reject/" + id, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        fetchData(token);
      }
    } catch (err) {
      setError("Could not reject user");
    }
  }

  async function handleDeleteUser(id) {
    const token = localStorage.getItem("token");
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/superuser/users/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (res.ok) {
        fetchData(token);
      } else {
        setError(data.message || "Could not delete user");
      }
    } catch (err) {
      setError("Could not delete user");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin/login");
  }

  function statusBadge(status) {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return (
      <span className={"text-xs px-2 py-1 rounded-full font-medium " + colors[status]}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Superuser Dashboard</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-4 border border-red-100">
            {error}
          </p>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-md mb-8 border border-indigo-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Pending Requests{" "}
            {pendingUsers.length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                {pendingUsers.length}
              </span>
            )}
          </h2>

          {pendingUsers.length === 0 && (
            <p className="text-gray-500 text-sm">No pending requests.</p>
          )}

          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border border-indigo-100 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="bg-emerald-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-emerald-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    className="bg-rose-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-rose-600 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-md border border-indigo-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">All Users</h2>
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border-b border-gray-100 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{u.role}</span>
                  {statusBadge(u.status)}
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-full font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}