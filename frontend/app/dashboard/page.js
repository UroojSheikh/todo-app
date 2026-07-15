"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNewImages, setEditNewImages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchTasks(token);
  }, []);

  async function fetchTasks(token) {
    try {
      const res = await fetch("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      setError("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      images.forEach((img) => {
        formData.append("images", img);
      });

      const res = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not add task");
        return;
      }

      setTasks([data, ...tasks]);
      setTitle("");
      setDescription("");
      setImages([]);
    } catch (err) {
      setError("Could not connect to server");
    }
  }

  async function toggleComplete(task) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(tasks.map((t) => (t.id === task.id ? data : t)));
      }
    } catch (err) {
      setError("Could not update task");
    }
  }

  async function deleteTask(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (err) {
      setError("Could not delete task");
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditNewImages([]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNewImages([]);
  }

  async function saveEdit(taskId) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      let data = await res.json();

      if (editNewImages.length > 0) {
        const formData = new FormData();
        editNewImages.forEach((img) => formData.append("images", img));

        const imgRes = await fetch(`http://localhost:5000/tasks/${taskId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        data = await imgRes.json();
      }

      setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
      setEditingId(null);
      setEditNewImages([]);
    } catch (err) {
      setError("Could not save changes");
    }
  }

  async function removeImage(taskId, imageUrl) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/tasks/${taskId}/images`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
      }
    } catch (err) {
      setError("Could not remove image");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-indigo-200 rounded-lg p-2.5 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="min-h-screen bg-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
        <a href="/profile"
              className="text-sm text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-lg font-medium transition"
            >
              Profile
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>

        <form
          onSubmit={handleAddTask}
          className="bg-white p-5 rounded-2xl shadow-lg mb-6 border border-indigo-100"
        >
          {error && (
            <p className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-3 border border-red-100">
              {error}
            </p>
          )}
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="w-full text-sm text-gray-600 mb-3 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-medium hover:file:bg-indigo-200"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-indigo-700 transition"
          >
            + Add Task
          </button>
        </form>

        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-gray-500 text-center bg-white/60 rounded-xl p-6 border border-indigo-100">
              No tasks yet. Add one above!
            </p>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${
                task.isCompleted ? "border-emerald-400" : "border-indigo-400"
              }`}
            >
              {editingId === task.id ? (
                <div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={inputClass}
                  />

                  {task.imageUrls && task.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {task.imageUrls.map((url, i) => (
                        <div key={i} className="relative">
                          <img
                            src={`http://localhost:5000${url}`}
                            alt={task.title}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeImage(task.id, url)}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-rose-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="text-xs text-gray-500 mb-1 block">
                    Add more images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setEditNewImages(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-600 mb-3 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-medium hover:file:bg-indigo-200"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-100 text-gray-700 rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => toggleComplete(task)}
                      className="mt-1 w-4 h-4 accent-emerald-500"
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          task.isCompleted
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-500">{task.description}</p>
                      )}
                      {task.imageUrls && task.imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={`http://localhost:5000${url}`}
                              alt={task.title}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}