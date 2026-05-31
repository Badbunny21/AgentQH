import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="logo">
          Agent<span>HQ</span>
        </Link>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/privacy">Privacy</Link>
          <a href="mailto:support@agenthq.app">Support</a>
        </nav>
        <a href="#download" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
          Get the app
        </a>
      </div>
    </header>
  );
}
