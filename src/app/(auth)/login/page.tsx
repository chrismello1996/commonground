"use client";

import { login } from "../actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <svg width="64" height="56" viewBox="0 0 140 120" fill="none">
              <defs>
                <clipPath id="lGreen"><rect x="8" y="12" width="72" height="56" rx="16"/></clipPath>
              </defs>
              <rect x="8" y="12" width="72" height="56" rx="16" fill="#10b981"/>
              <polygon points="28,68 40,68 24,84" fill="#10b981"/>
              <rect x="52" y="24" width="72" height="56" rx="16" fill="#8B4513"/>
              <polygon points="104,80 92,80 108,96" fill="#8B4513"/>
              <rect x="52" y="24" width="72" height="56" rx="16" fill="#e5e7eb" clipPath="url(#lGreen)"/>
            </svg>
          </div>
          <h1 className="text-4xl font-brand tracking-wide text-brand-gradient">
            CommonGround
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            The open marketplace of ideas.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Sign In</h2>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              formAction={login}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors mt-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-emerald-500 hover:text-emerald-600 font-semibold"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
