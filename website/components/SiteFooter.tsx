import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <div className="logo" style={{ marginBottom: 8 }}>
            Agent<span style={{ color: 'var(--accent)' }}>HQ</span>
          </div>
          <p className="footer-meta">Mission control for your agent crew</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy policy</Link>
          <a href="mailto:support@agenthq.app">support@agenthq.app</a>
        </div>
      </div>
      <div className="container" style={{ marginTop: 32 }}>
        <p className="footer-meta">© {new Date().getFullYear()} AgentHQ</p>
      </div>
    </footer>
  );
}
