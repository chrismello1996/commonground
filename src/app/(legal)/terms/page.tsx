import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CommonGround",
  description: "Terms of Service for CommonGround, the live video debate platform.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: April 18, 2026</p>

        <div className="prose prose-sm prose-gray max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-gray-600 [&_ul]:mb-4 [&_li]:mb-1">

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using CommonGround (&ldquo;the Platform&rdquo;), operated by CommonGround (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
            you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Platform.
            These Terms constitute a legally binding agreement between you and CommonGround.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years of age to use CommonGround. By creating an account or using the Platform,
            you represent and warrant that you are at least 18 years old. We reserve the right to request proof of age
            at any time and to terminate accounts where the user is found to be under 18. If you are under 18,
            you are strictly prohibited from using this Platform.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use CommonGround, you must create an account using Google OAuth or email registration. You are
            responsible for maintaining the confidentiality of your account credentials and for all activities that
            occur under your account. You agree to provide accurate, current, and complete information during
            registration and to keep your account information up to date. You may not create multiple accounts,
            use another person&rsquo;s account, or transfer your account to anyone else.
          </p>

          <h2>4. Platform Description</h2>
          <p>
            CommonGround is a live video debate platform that matches users with opposing viewpoints for real-time
            video discussions. The Platform includes features for matchmaking, live video streaming, spectating,
            voting, and community-based content moderation. All debates may be viewed by other users as spectators.
          </p>

          <h2>5. Content and Conduct Rules</h2>
          <p>
            CommonGround is built on the principle of free speech and open debate. You are free to express your
            opinions on any topic. However, the following conduct is strictly prohibited:
          </p>
          <ul>
            <li><strong>Nudity and sexual content:</strong> Any display of nudity, sexually explicit content, or sexual
            conduct on camera is strictly prohibited. This is the Platform&rsquo;s primary rule and violations will
            result in immediate suspension or permanent ban.</li>
            <li><strong>Illegal activity:</strong> Using the Platform to engage in, promote, or facilitate any illegal
            activity under applicable law.</li>
            <li><strong>Exploitation of minors:</strong> Any content involving minors in a harmful, exploitative, or
            sexual context will result in immediate permanent ban and may be reported to law enforcement.</li>
            <li><strong>Threats of violence:</strong> Direct, credible threats of physical violence against specific
            individuals.</li>
            <li><strong>Doxxing:</strong> Sharing another person&rsquo;s private personal information (home address,
            phone number, etc.) without their consent.</li>
            <li><strong>Platform manipulation:</strong> Using bots, scripts, or automated tools to manipulate
            matchmaking, voting, or other Platform features.</li>
          </ul>

          <h2>6. Community Moderation and Reporting</h2>
          <p>
            CommonGround uses a community-based moderation system. Users may report other users for violations of
            these Terms. Reports are processed as follows: when a user receives reports from 3 unique users,
            their account is suspended for 24 hours. Reports from 6 unique users result in a 7-day suspension.
            Reports from 9 unique users result in a permanent ban. We reserve the right to modify these thresholds
            and to take additional moderation action at our sole discretion, including immediate permanent bans
            for severe violations.
          </p>

          <h2>7. User-Generated Content</h2>
          <p>
            You retain ownership of any content you create or share on the Platform. However, by using the Platform,
            you grant CommonGround a non-exclusive, worldwide, royalty-free license to use, display, distribute,
            and transmit your content in connection with operating and promoting the Platform. You acknowledge that
            live debates may be viewed by spectators in real-time and that the Platform may retain records of debates
            for moderation purposes.
          </p>

          <h2>8. Assumption of Risk</h2>
          <p>
            You understand that CommonGround connects you with strangers for live video interactions. You acknowledge
            that we cannot control what other users say or do during debates. You assume all risks associated with
            interacting with other users, including but not limited to exposure to content you may find offensive,
            objectionable, or disturbing. You agree to use the Platform at your own risk.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE,
            OR SECURE. WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY CONTENT ON THE PLATFORM.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, COMMONGROUND AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
            AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION
            WITH YOUR USE OF THE PLATFORM, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY
            OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY
            SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO US, IF ANY, IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless CommonGround, its officers, directors, employees, and
            agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
            attorney&rsquo;s fees) arising out of or in any way connected with your access to or use of the Platform,
            your violation of these Terms, or your violation of any third-party rights.
          </p>

          <h2>12. Account Suspension and Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without cause, and with or
            without notice. Reasons for suspension or termination may include, but are not limited to, violations of
            these Terms, reports from other users, fraudulent or illegal activity, or extended inactivity. Upon
            termination, your right to use the Platform ceases immediately.
          </p>

          <h2>13. Modifications to Terms</h2>
          <p>
            We may modify these Terms at any time by posting the revised Terms on the Platform. Your continued use
            of the Platform after any such changes constitutes your acceptance of the new Terms. We encourage you
            to review these Terms periodically. Material changes will be communicated through a notice on the Platform
            or via email.
          </p>

          <h2>14. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United States. Any
            disputes arising from these Terms or your use of the Platform shall be resolved through binding
            arbitration in accordance with the rules of the American Arbitration Association, except where prohibited
            by law. You waive any right to participate in a class action lawsuit or class-wide arbitration against
            CommonGround.
          </p>

          <h2>15. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited
            or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force
            and effect.
          </p>

          <h2>16. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@commongrounddebate.com" className="text-emerald-600 hover:underline">
              legal@commongrounddebate.com
            </a>.
          </p>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} CommonGround. All rights reserved.</span>
          <Link href="/privacy" className="text-emerald-500 hover:underline">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
