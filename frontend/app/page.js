export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">To-Do App</h1>
        <p className="text-gray-500 mt-2 mb-6">Welcome. Please log in or register.</p>
        <div className="flex gap-3 justify-center">
          <a
            href="/login"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Log In
          </a>
          <a
            href="/register"
            className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}