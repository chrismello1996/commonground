"use client";

import { useState } from "react";
import Link from "next/link";

export default function TakedownPage() {
  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    reportedUsername: "",
    contentType: "intimate_image",
    description: "",
    contentUrl: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [requestId, setRequestId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit request");
        setStatus("error");
        return;
      }

      setRequestId(data.request?.id || "");
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Submitted</h2>
            <p className="text-sm text-gray-500 mb-1">
              Your takedown request has been received and logged.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              We are required by federal law to review and act on this request within <strong className="text-gray-900">48 hours</strong>.
            </p>
            {requestId && (
              <p className="text-xs text-gray-400 mb-6">
                Reference ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{requestId}</code>
              </p>
            )}
            <Link
              href="/"
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition inline-block"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Content Removal Request</h1>
        <p className="text-sm text-gray-500 mb-2">
          Take It Down Act Compliance — Nonconsensual Intimate Image Removal
        </p>
        <p className="text-xs text-gray-400 mb-8">
          Under federal law (the TAKE IT DOWN Act), CommonGround is required to remove nonconsensual intimate
          visual depictions, including deepfakes, within 48 hours of receiving a valid request. Use this form
          to report such content.
        </p>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-xs text-amber-800 font-semibold mb-1">What qualifies for this form?</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Intimate images or videos shared without consent</li>
            <li>• AI-generated deepfake intimate images</li>
            <li>• Recordings of private/intimate moments shared without consent</li>
            <li>• Any sexually explicit content involving a minor</li>
          </ul>
          <p className="text-xs text-amber-600 mt-2">
            For general content violations (harassment, threats, spam), please use the standard{" "}
            <Link href="/browse" className="underline">report function</Link> within debates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reporter Info */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Your Information
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={form.reporterName}
                onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition"
              />
              <input
                type="email"
                placeholder="Your email *"
                required
                value={form.reporterEmail}
                onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition"
              />
            </div>
          </div>

          {/* Reported User */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Reported User (if known)
            </label>
            <input
              type="text"
              placeholder="Username of the person who shared the content"
              value={form.reportedUsername}
              onChange={(e) => setForm({ ...form, reportedUsername: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition"
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Type of Content *
            </label>
            <select
              value={form.contentType}
              onChange={(e) => setForm({ ...form, contentType: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition"
            >
              <option value="intimate_image">Nonconsensual intimate image or video</option>
              <option value="deepfake">AI-generated deepfake</option>
              <option value="nonconsensual_recording">Recording shared without consent</option>
              <option value="other">Other (describe below)</option>
            </select>
          </div>

          {/* Content URL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Link to Content (if available)
            </label>
            <input
              type="url"
              placeholder="https://commongrounddebate.com/..."
              value={form.contentUrl}
              onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              placeholder="Please describe the content, where it appeared, and any other relevant details. Include the date/time if known."
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition resize-none"
            />
          </div>

          {/* Certification */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              By submitting this request, I certify under penalty of perjury that the information provided
              is accurate and that the content described was shared without my consent (or the consent of the
              individual depicted). I understand that false reports may result in account suspension.
            </p>
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit Takedown Request"}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            CommonGround will review this request and take action within 48 hours as required by the TAKE IT DOWN Act.
          </p>
        </form>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="22" viewBox="0 0 36 28" fill="none">
            <rect x="0" y="2" width="20" height="16" rx="4" fill="#10b981" />
            <polygon points="6,18 10,18 8,22" fill="#10b981" />
            <rect x="14" y="6" width="20" height="16" rx="4" fill="#8B4513" />
            <polygon points="26,22 30,22 28,26" fill="#8B4513" />
          </svg>
          <span className="font-brand text-lg text-brand-gradient">CommonGround</span>
        </Link>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
          ← Back
        </Link>
      </div>
    </header>
  );
}
