import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CommonGround",
  description: "Privacy Policy for CommonGround, the live video debate platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="22" viewBox="0 0 36 28" fill="none">
              <rect x="0" y="2" width="20" height="16" rx="4" fill="#10b981" />
              <polygon points="6,18 10,18 8,22" fill="#10b981" />
              <rect x="14" y="6" width="20" height="16" rx="4" fill="#8B4513" />
              <polygon points="26,22 30,22 28,26" fill="#8B4513" />
            </svg>
            <span className="font-brand text-lg text-brand-gradient">CommonGround</span>
          </Link>
          <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: April 18, 2026</p>

        <div className="prose prose-sm prose-gray max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-gray-600 [&_ul]:mb-4 [&_li]:mb-1">

          <h2>1. Introduction</h2>
          <p>
            CommonGround (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website commongrounddebate.com
            and the CommonGround platform (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our Service. By using the Service,
            you consent to the data practices described in this policy.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          <p>
            <strong>Information you provide directly:</strong> When you create an account, we collect your name, email
            address, and profile information provided through Google OAuth or email registration. You may also provide
            a username, display name, avatar, and bio.
          </p>
          <p>
            <strong>Information collected automatically:</strong> When you use the Service, we automatically collect
            certain information including your IP address, browser type, device information, operating system, referring
            URLs, and information about how you interact with the Service (pages visited, features used, debates joined).
          </p>
          <p>
            <strong>Video and audio data:</strong> When you participate in debates, your video and audio are transmitted
            in real-time to other participants and spectators via our video infrastructure provider (LiveKit). We do not
            record or store video or audio streams by default, but we reserve the right to implement recording for
            moderation purposes with prior notice.
          </p>
          <p>
            <strong>User-generated content:</strong> We collect and store content you create on the Platform, including
            chat messages, debate participation records, votes, and reports.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Create and manage your account</li>
            <li>Match you with other users for debates</li>
            <li>Process reports and enforce our Terms of Service</li>
            <li>Track platform statistics such as debate history, win/loss records, and voting</li>
            <li>Communicate with you about the Service, including updates and security alerts</li>
            <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <p>
            <strong>With other users:</strong> Your username, display name, avatar, ELO rating, debate history, and
            public profile information are visible to other users of the Platform. When you participate in a debate,
            your video, audio, and chat messages are shared with other participants and spectators.
          </p>
          <p>
            <strong>With service providers:</strong> We share information with third-party service providers who assist
            us in operating the Service, including Supabase (database and authentication), LiveKit (video infrastructure),
            Vercel (hosting), and Google (OAuth authentication).
          </p>
          <p>
            <strong>For legal reasons:</strong> We may disclose your information if required to do so by law, in
            response to a court order or subpoena, or if we believe in good faith that disclosure is necessary to
            protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a
            government request.
          </p>
          <p>
            <strong>In connection with a business transfer:</strong> If CommonGround is involved in a merger,
            acquisition, or sale of all or a portion of its assets, your information may be transferred as part of
            that transaction.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your account information for as long as your account is active. If you request account deletion,
            we will delete your personal data within 30 days, except where we are required to retain it for legal
            compliance, dispute resolution, or enforcement of our Terms. Anonymized and aggregated data may be retained
            indefinitely for analytics purposes.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your information against
            unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (TLS/SSL),
            secure authentication (OAuth 2.0), and row-level security on our database. However, no method of
            transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute
            security.
          </p>

          <h2>7. Your Rights and Choices</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request that we correct inaccurate personal data.</li>
            <li><strong>Deletion:</strong> Request that we delete your personal data (subject to legal retention requirements).</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
            <li><strong>Opt-out:</strong> You may opt out of promotional communications at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:privacy@commongrounddebate.com" className="text-emerald-600 hover:underline">
              privacy@commongrounddebate.com
            </a>.
          </p>

          <h2>8. California Privacy Rights (CCPA)</h2>
          <p>
            If you are a California resident, you have the right to know what personal information we collect, request
            deletion of your personal information, and opt out of the sale of your personal information. We do not sell
            your personal information. To exercise your California privacy rights, contact us using the information
            provided below.
          </p>

          <h2>9. Children&rsquo;s Privacy</h2>
          <p>
            CommonGround is not intended for use by anyone under the age of 18. We do not knowingly collect personal
            information from children under 18. If we become aware that we have collected personal information from a
            child under 18, we will take steps to delete that information promptly. If you believe a child under 18
            has provided us with personal information, please contact us immediately.
          </p>

          <h2>10. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to maintain your session, remember your preferences,
            and analyze usage patterns. Essential cookies are required for the Service to function (authentication
            session cookies). You can configure your browser to reject cookies, but this may impact your ability to
            use the Service.
          </p>

          <h2>11. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites or services. We are not responsible for the privacy
            practices of these third parties. We encourage you to review the privacy policies of any third-party
            service you access through the Platform.
          </p>

          <h2>12. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence.
            These countries may have data protection laws that differ from your jurisdiction. By using the Service,
            you consent to the transfer of your information to the United States and other countries where our service
            providers operate.
          </p>

          <h2>13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting
            the updated policy on the Platform with a revised &ldquo;Last updated&rdquo; date. Your continued use
            of the Service after any changes constitutes your acceptance of the updated policy.
          </p>

          <h2>14. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
            <a href="mailto:privacy@commongrounddebate.com" className="text-emerald-600 hover:underline">
              privacy@commongrounddebate.com
            </a>.
          </p>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} CommonGround. All rights reserved.</span>
          <Link href="/terms" className="text-emerald-500 hover:underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
