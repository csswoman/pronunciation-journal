import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy — English Journal",
  description: "How English Journal handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 20, 2026">
      <p>
        English Journal (also called Pronunciation Journal) is a personal,
        non-commercial web app for practicing English pronunciation, vocabulary,
        and grammar. This policy explains what data the app uses and why.
      </p>

      <h2 className="md-h2">Who operates this app</h2>
      <p>
        English Journal is a personal side project. It is not a company and does
        not sell products or subscriptions. If you have questions, contact{" "}
        <a href="mailto:karlavagraze@gmail.com">karlavagraze@gmail.com</a>.
      </p>

      <h2 className="md-h2">What data we collect</h2>
      <p>Depending on how you use the app, we may store:</p>
      <ul>
        <li>
          <strong>Account information</strong> — if you sign in with Google or
          email, we receive your email address and basic profile details provided
          by the sign-in provider.
        </li>
        <li>
          <strong>Learning progress</strong> — practice history, spaced-repetition
          schedules, course completion, vocabulary lists, and similar study data.
        </li>
        <li>
          <strong>App preferences</strong> — theme, display settings, and other
          choices saved in your browser or account.
        </li>
        <li>
          <strong>Audio you choose to record</strong> — only when you use
          pronunciation practice features that request microphone access.
        </li>
      </ul>

      <h2 className="md-h2">Where data is stored</h2>
      <ul>
        <li>
          <strong>On your device</strong> — much of your progress is saved locally
          in your browser (IndexedDB/local storage) so the app can work offline.
        </li>
        <li>
          <strong>Supabase</strong> — if cloud sync is enabled, account and
          progress data is stored in a Supabase database hosted in the United
          States.
        </li>
        <li>
          <strong>Google Gemini</strong> — when you use AI-powered features, the
          text you submit is sent to Google&apos;s Gemini API to generate practice
          content. We do not use your data to train AI models.
        </li>
      </ul>

      <h2 className="md-h2">What we do not do</h2>
      <ul>
        <li>We do not sell your personal data.</li>
        <li>We do not show ads.</li>
        <li>We do not share your data with marketers.</li>
        <li>We do not use third-party analytics trackers.</li>
      </ul>

      <h2 className="md-h2">Google Sign-In</h2>
      <p>
        If you sign in with Google, Google processes your authentication
        according to{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google&apos;s Privacy Policy
        </a>
        . We only receive the information needed to create and maintain your
        account.
      </p>

      <h2 className="md-h2">Data retention and deletion</h2>
      <p>
        Your learning data is kept while you use the app. You can clear local
        browser data at any time through your browser settings. To request
        deletion of cloud-stored account data, email{" "}
        <a href="mailto:karlavagraze@gmail.com">karlavagraze@gmail.com</a>.
      </p>

      <h2 className="md-h2">Children</h2>
      <p>
        English Journal is not directed at children under 13. We do not knowingly
        collect personal information from children.
      </p>

      <h2 className="md-h2">Changes</h2>
      <p>
        This policy may be updated occasionally. The date at the top of this page
        shows when it was last revised.
      </p>

      <p>
        See also our <a href="/terms">Terms of Service</a>.
      </p>
    </LegalPage>
  );
}
