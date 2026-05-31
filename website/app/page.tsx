const PILLARS = [
  {
    eyebrow: '01 / Organized',
    title: 'One home for every agent',
    body: 'Stop hunting through Telegram threads and Discord tabs. Import bots or create in-app agents — all on one roster.',
  },
  {
    eyebrow: '02 / Distinct',
    title: 'Agents that feel like people',
    body: 'Names, roles, avatars, and profiles. A crew you recognize at a glance — not a folder of identical chat boxes.',
  },
  {
    eyebrow: '03 / Visible',
    title: "See what's getting done",
    body: "Task boards, dispatch to Telegram & Discord, activity feed, and handoffs. Know what landed and what's in flight.",
  },
  {
    eyebrow: '04 / Remembered',
    title: 'Memory that sticks',
    body: 'Smart memory suggestions and handoff context. Agents learn what matters — with your approval.',
  },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: '/forever',
    tagline: 'Try the home.',
    popular: false,
    features: [
      { text: '3 agents on roster', included: true },
      { text: '500 AI chat messages / month', included: true },
      { text: 'Task board & workspaces', included: true },
      { text: 'Import from Telegram or Discord', included: true },
      { text: 'Dispatch tasks to platforms', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/mo',
    tagline: 'For real operators.',
    popular: true,
    features: [
      { text: '20 agents on roster', included: true },
      { text: '2,000 AI chat messages / month', included: true },
      { text: 'Dispatch to Telegram & Discord', included: true },
      { text: 'Full memory vault & handoffs', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero container">
        <p className="eyebrow">Mission control for AI operators</p>
        <h1>
          Your agents, <span className="gradient-text">finally in one place</span>
        </h1>
        <p>
          AgentHQ is the home screen for the AI crew you already use — Telegram bots, Discord agents, and in-app
          assistants. Organize, assign work, and see your system flow.
        </p>
        <div className="hero-actions">
          <a href="#download" className="btn-primary">
            Join TestFlight
          </a>
          <a href="#features" className="btn-ghost">
            See how it works
          </a>
        </div>
      </section>

      <section id="features" className="container pillars">
        {PILLARS.map(p => (
          <article key={p.eyebrow} className="card pillar">
            <p className="eyebrow">{p.eyebrow}</p>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </article>
        ))}
      </section>

      <section id="pricing" className="pricing container">
        <h2 className="section-title">Simple pricing</h2>
        <p className="section-sub">Start free. Upgrade when your crew outgrows three agents.</p>
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <article key={plan.id} className={`card plan${plan.popular ? ' popular' : ''}`}>
              {plan.popular && <div className="plan-badge">Most popular</div>}
              <p className="plan-name">{plan.name}</p>
              <p className="plan-price">
                {plan.price}
                <small>{plan.period}</small>
              </p>
              <p className="plan-tagline">{plan.tagline}</p>
              <ul className="plan-features">
                {plan.features.map(f => (
                  <li key={f.text} className={f.included ? '' : 'muted'}>
                    {f.text}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="download" className="container">
        <div className="card cta-band">
          <h2>Ready to run your crew from one home?</h2>
          <p>
            AgentHQ is in private beta on iOS. TestFlight link coming soon — email us to get on the list.
          </p>
          <a href="mailto:support@agenthq.app?subject=TestFlight%20beta" className="btn-primary">
            Request TestFlight access
          </a>
        </div>
      </section>
    </>
  );
}
