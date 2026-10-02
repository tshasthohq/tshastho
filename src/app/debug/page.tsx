"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [storageData, setStorageData] = useState<any>({});
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");
    
    setStorageData({
      userEmail: email,
      userName: name,
      allKeys: Object.keys(localStorage),
    });

    if (email) {
      fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      .then(res => res.json())
      .then(data => setApiResponse(data))
      .catch(err => setApiResponse({ error: String(err) }));
    }
  }, []);

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6 text-yellow-400">🔍 Debug Information</h1>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-green-400 mb-2">📦 Browser localStorage:</h2>
        <pre className="bg-black p-4 rounded-lg overflow-auto">
          {JSON.stringify(storageData, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-blue-400 mb-2">🌐 API Response:</h2>
        <pre className="bg-black p-4 rounded-lg overflow-auto">
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      </div>

      <button 
        onClick={() => { localStorage.clear(); window.location.reload(); }}
        className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
      >
        🗑️ Clear localStorage & Reload
      </button>
    </div>
  );
}
