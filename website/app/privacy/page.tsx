import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — AgentHQ',
  description: 'How AgentHQ collects, uses, and deletes your data.',
};

export default function PrivacyPage() {
  return (
    <article className="container legal-page">
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: May 30, 2026</p>

      <p>
        AgentHQ (&quot;we&quot;, &quot;us&quot;) provides a mobile application that helps you organize and work with AI
        agents. This policy explains what data we collect, how we use it, and your choices.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> — name, email, and authentication credentials when you sign up (via
          Supabase Auth).
        </li>
        <li>
          <strong>Agent &amp; workspace data</strong> — agents you create or import, tasks, memories, workspaces, and
          handoffs you configure in the app.
        </li>
        <li>
          <strong>Messages</strong> — chat content between you and your agents, including messages synced from linked
          Telegram or Discord bots.
        </li>
        <li>
          <strong>Usage data</strong> — AI message counts, task activity, and plan/billing status to enforce limits and
          process subscriptions.
        </li>
        <li>
          <strong>Push tokens</strong> — if you enable notifications, we store a device token to send task and activity
          alerts.
        </li>
        <li>
          <strong>Payment information</strong> — processed by Stripe. We do not store full card numbers on our servers.
        </li>
      </ul>

      <h2>How we use data</h2>
      <ul>
        <li>Provide chat, tasks, memory, and platform integrations you request.</li>
        <li>Send AI prompts to our model providers to generate agent replies (subject to your plan limits).</li>
        <li>Process subscriptions and show your current plan.</li>
        <li>Send optional push notifications about tasks, replies, and handoffs.</li>
        <li>Improve reliability and security of the service.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>We use trusted providers to run AgentHQ, including:</p>
      <ul>
        <li>Supabase (database, authentication, file storage)</li>
        <li>OpenAI (AI chat and memory extraction)</li>
        <li>Stripe (payments)</li>
        <li>Telegram &amp; Discord APIs (when you connect bots)</li>
        <li>Expo (push notification delivery)</li>
      </ul>
      <p>Each provider processes data according to their own privacy policies.</p>

      <h2>Data retention &amp; deletion</h2>
      <p>
        Your data is stored while your account is active. You can export a summary from the You tab in the app. You can
        delete your account permanently from Settings → Privacy or the You tab — this removes your profile, agents,
        messages, tasks, memories, and related data from our systems.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard practices including encrypted connections, row-level security on your data, and server-side
        handling of sensitive tokens (e.g. Telegram bot tokens). No system is 100% secure; use a strong, unique password.
      </p>

      <h2>Children</h2>
      <p>AgentHQ is not intended for users under 13. We do not knowingly collect data from children.</p>

      <h2>Changes</h2>
      <p>
        We may update this policy. We will post the new date at the top of this page. Continued use after changes means
        you accept the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or privacy requests:{' '}
        <a href="mailto:support@agenthq.app" style={{ color: 'var(--accent)' }}>
          support@agenthq.app
        </a>
      </p>
    </article>
  );
}
