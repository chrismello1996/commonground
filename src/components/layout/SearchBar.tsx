"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  users: { id: string; username: string; display_name: string | null; elo: number }[];
  debates: { id: string; topic: string; category: string; status: string }[];
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  const hasResults = results && (results.users.length > 0 || results.debates.length > 0);
  const noResults = results && results.users.length === 0 && results.debates.length === 0;

  return (
    <div ref={wrapperRef} className="relative hidden md:block">
      <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg px-2.5 h-8 min-w-[180px] gap-1.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasResults) setIsOpen(true);
          }}
          placeholder="Search debates, users, topics..."
          className="border-none bg-transparent outline-none text-xs text-gray-900 w-full placeholder:text-gray-400"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-[320px] bg-white rounded-lg border border-gray-200 shadow-lg z-[100] overflow-hidden">
          {hasResults && (
            <>
              {results.users.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
                    Users
                  </p>
                  {results.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/profile/${u.username}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{u.username}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          u.elo >= 1600
                            ? "text-amber-800"
                            : u.elo >= 1400
                              ? "text-gray-500"
                              : "text-orange-700"
                        }`}
                      >
                        {u.elo} ELO
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.debates.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                    Live Debates
                  </p>
                  {results.debates.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => navigate(`/browse/watch/${d.id}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition text-left"
                    >
                      <span className="bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide flex-shrink-0">
                        LIVE
                      </span>
                      <p className="text-xs font-semibold truncate flex-1">{d.topic}</p>
                      <span className="text-[10px] text-gray-400">{d.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {noResults && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
