"use client";

import { useState } from "react";
import { login, signup } from "../actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <svg width="80" height="70" viewBox="0 0 140 120" fill="none">
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
          <p className="text-[13px] text-gray-500 max-w-[380px] mx-auto mt-3 leading-relaxed">
            No censorship. No algorithms deciding what you can say. Just two people, a camera, and the freedom to speak your mind on anything. The audience decides who wins.
          </p>
          <p className="text-[12px] text-emerald-600 font-bold max-w-[380px] mx-auto mt-4 px-4 py-2.5 bg-emerald-500/[0.08] rounded-lg border border-emerald-500/20 leading-relaxed text-center">
            CommonGround is for debate. Keep your clothes on. Everything else is fair game.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
          {/* Tabs */}
          <div className="flex mb-5 bg-gray-200/60 rounded-lg p-0.5">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                mode === "signin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          {mode === "signup" ? (
            <div className="text-center mb-4">
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Join CommonGround</h3>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Create your account with Google. Verification keeps the platform safe for real debate.
              </p>
            </div>
          ) : (
            <div className="text-center mb-4">
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Welcome Back</h3>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Sign in with your verified account to jump back into debate.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </button>

          {/* Shield Badges */}
          <div className="flex items-center justify-center gap-2 mt-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              AI-moderated video
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Verified identity
            </span>
          </div>

          {/* Divider + Email fallback */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {mode === "signin" ? (
            <form className="space-y-3">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Email"
              />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Password"
              />
              <button
                formAction={login}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg transition"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form className="space-y-3">
              <input
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]+$"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Username"
              />
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Email"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Password (6+ characters)"
              />
              <button
                formAction={signup}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg transition"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
            By continuing, you agree to CommonGround&apos;s{" "}
            <a href="#" className="text-emerald-500 hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-emerald-500 hover:underline">Privacy Policy</a>
          </p>
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
