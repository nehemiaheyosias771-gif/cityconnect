// src/pages/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Bar = ({ label, val, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11 }}>
    <div style={{ width: 72, color: '#6A786A', flexShrink: 0 }}>{label}</div>
    <div style={{ flex: 1, height: 5, background: '#272D24', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
    <div style={{ width: 26, textAlign: 'right', color: '#E8EDE5', fontWeight: 500, fontSize: 10 }}>{val}</div>
  </div>
);

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      adminAPI.getAnalytics().then(setAnalytics).catch(console.error);
    }
  }, [profile]);

  const metrics = [
    { label: 'Total reports', value: analytics?.totalIssues ?? 142, color: '#00C97B', delta: '↑ 18% this week', up: true },
    { label: 'Resolution rate', value: `${analytics ? Math.round((analytics.resolvedIssues / analytics.totalIssues) * 100) : 15}%`, color: '#00C97B', delta: '↑ 3% vs last month', up: true },
    { label: 'Active citizens', value: (analytics?.totalUsers ?? 2381).toLocaleString(), color: '#E8EDE5', delta: '↑ 224 new this week', up: true },
    { label: 'Avg. response', value: '3.2d', color: '#F59E0B', delta: '↓ needs improvement', up: false },
  ];

  const s = { card: { background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16 } };

  return (
    <div style={{ overflowY: 'auto', padding: 22, height: '100%' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 3 }}>Impact analytics</div>
      <div style={{ fontSize: 12, color: '#6A786A', marginBottom: 18 }}>Real-time data · Addis Ababa city issues, community & resolution</div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {metrics.map(m => (
          <div key={m.label} style={s.card}>
            <div style={{ fontSize: 9, color: '#3A473A', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, marginTop: 3, color: m.up ? '#00C97B' : '#FF4D4D' }}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={s.card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Reports by category</div>
          <Bar label="Water" val={analytics?.issuesByCategory?.water ?? 54} max={54} color="#3B9EFF" />
          <Bar label="Waste" val={analytics?.issuesByCategory?.waste ?? 31} max={54} color="#7DC559" />
          <Bar label="Road" val={analytics?.issuesByCategory?.road ?? 28} max={54} color="#F59E0B" />
          <Bar label="Power" val={analytics?.issuesByCategory?.power ?? 17} max={54} color="#8B5CF6" />
          <Bar label="Infra" val={analytics?.issuesByCategory?.infrastructure ?? 12} max={54} color="#00C97B" />
        </div>
        <div style={s.card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Hotspot sub-cities</div>
          <Bar label="Bole" val={41} max={41} color="#FF4D4D" />
          <Bar label="Kirkos" val={29} max={41} color="#FF4D4D" />
          <Bar label="Yeka" val={23} max={41} color="#F59E0B" />
          <Bar label="Lideta" val={19} max={41} color="#F59E0B" />
          <Bar label="Addis Ket." val={15} max={41} color="#00C97B" />
          <Bar label="Gulele" val={10} max={41} color="#00C97B" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div style={s.card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Live activity feed</div>
          {[
            { color: '#00C97B', text: 'City authority marked Gerji pipe burst as in progress — repair crew dispatched', time: 'Just now' },
            { color: '#3B9EFF', text: 'New water pressure report in Lideta district — 12 upvotes in 20 minutes', time: '14 min ago' },
            { color: '#7DC559', text: 'Community volunteer team dispatched to Megenagna dump site', time: '1h ago' },
            { color: '#FF4D4D', text: 'Security: 12 brute-force login attempts blocked — email + SMS sent to admin', time: '1.5h ago' },
            { color: '#8B5CF6', text: 'CMC streetlight outage resolved by EEP crew — issue closed', time: '3h ago' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#8A9888', lineHeight: 1.5 }}>{item.text}</div>
                <div style={{ fontSize: 9, color: '#3A473A', marginTop: 2 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...s.card, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>City news</div>
            <img src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=75" alt="Addis Ababa" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
            <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>City council approves major water infrastructure upgrade</div>
            <div style={{ fontSize: 10, color: '#6A786A' }}>Addis Fortune · 2h ago</div>
          </div>
          <div style={s.card}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Notifications</div>
            <div style={{ fontSize: 11, color: '#6A786A', lineHeight: 1.6 }}>
              📧 Daily digest: <span style={{ color: '#00C97B' }}>enabled</span><br />
              📱 SMS urgent alerts: <span style={{ color: '#00C97B' }}>enabled</span><br />
              🔔 In-app: <span style={{ color: '#00C97B' }}>enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// src/pages/TransportPage.jsx
// ─────────────────────────────────────────────────────────────
export function TransportPage() {
  const [filter, setFilter] = useState('all');
  const items = [
    { type: 'bus', icon: '🚌', name: 'Route 7 — Merkato to Bole', route: 'Via Mexico Sq → Meskel Sq → Bole Medhanialem', tags: ['Bus', '6am–9pm', '~45 min'], bg: 'rgba(59,158,255,.1)' },
    { type: 'bus', icon: '🚌', name: 'Route 14 — Piassa to CMC', route: 'Via Arat Kilo → Megenagna → CMC Michael', tags: ['Bus', '6am–8pm', '~55 min'], bg: 'rgba(59,158,255,.1)' },
    { type: 'minibus', icon: '🚐', name: 'Minibus — Kazanchis to Gerji', route: 'Frequent departures · flag from Kazanchis roundabout', tags: ['Minibus', '~20 min', '7 ETB'], bg: 'rgba(245,158,11,.1)' },
    { type: 'minibus', icon: '🚐', name: 'Minibus — Lideta to Sarbet', route: 'Via Mexico Square · high frequency mornings', tags: ['Minibus', '~15 min', '5 ETB'], bg: 'rgba(245,158,11,.1)' },
    { type: 'civic', icon: '💧', name: 'Bole water distribution point', route: 'Woreda 3 · near Bole Michael church · 7am–5pm daily', tags: ['Civic', 'Water', 'Free'], bg: 'rgba(0,201,123,.1)' },
    { type: 'civic', icon: '🏥', name: 'Kazanchis health center', route: 'Behind Total petrol station · Mon–Sat 8am–6pm', tags: ['Healthcare', 'Free primary care'], bg: 'rgba(139,92,246,.1)' },
    { type: 'civic', icon: '📚', name: 'Bole public library', route: 'Woreda 6 · Mon–Fri 9am–7pm · Sat 10am–5pm', tags: ['Education', 'Free', 'Wi-Fi'], bg: 'rgba(255,77,77,.1)' },
  ];
  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: '100%', overflow: 'hidden' }}>
      <div style={{ overflowY: 'auto', padding: 16 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 3 }}>Services & transport</div>
        <div style={{ fontSize: 12, color: '#6A786A', marginBottom: 12 }}>Routes, civic services and public facilities across Addis Ababa</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['bus', '🚌 Bus'], ['minibus', '🚐 Minibus'], ['civic', '🏥 Civic']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '5px 12px', border: `1px solid ${filter === id ? 'rgba(0,201,123,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius: 8, fontSize: 11, color: filter === id ? '#00C97B' : '#6A786A', background: filter === id ? 'rgba(0,201,123,.1)' : 'transparent', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
        {filtered.map((item, i) => (
          <div key={i} style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 12, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#6A786A', marginBottom: 7, lineHeight: 1.4 }}>{item.route}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{item.tags.map(t => <span key={t} style={{ padding: '2px 7px', background: '#272D24', borderRadius: 20, fontSize: 10, color: '#4A574A' }}>{t}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.05)', background: '#1A1F18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#3A473A', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div>Interactive route map</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>Loads with Leaflet in full deployment</div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// src/pages/AdminPage.jsx
// ─────────────────────────────────────────────────────────────
export function AdminPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    adminAPI.getSecurityEvents().then(setEvents).catch(console.error);
    adminAPI.getSecurityStats().then(setStats).catch(console.error);
  }, []);

  const handleResolve = async (id) => {
    await adminAPI.resolveEvent(id);
    setEvents(e => e.map(ev => ev.id === id ? { ...ev, resolved: true } : ev));
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      await adminAPI.broadcastSMS(broadcastMsg);
      alert('SMS broadcast sent successfully!');
      setBroadcastMsg('');
    } catch (e) { alert('Broadcast failed: ' + e.message); }
    setBroadcasting(false);
  };

  return (
    <div style={{ overflowY: 'auto', padding: 22, height: '100%' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 3 }}>Admin panel</div>
      <div style={{ fontSize: 12, color: '#6A786A', marginBottom: 20 }}>Security events, audit log, broadcasts</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[{ label: 'Total events', value: stats?.total ?? '—', color: '#E8EDE5' }, { label: 'Unresolved', value: stats?.unresolved ?? '—', color: '#FF4D4D' }, { label: 'Last 24h', value: stats?.last24h ?? '—', color: '#F59E0B' }, { label: 'Brute force', value: stats?.byType?.BRUTE_FORCE ?? '—', color: '#FF4D4D' }].map(m => (
          <div key={m.label} style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 9, color: '#3A473A', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Security events</div>
          {events.length === 0 && <div style={{ color: '#3A473A', fontSize: 12, textAlign: 'center', padding: 20 }}>No events yet — connect to backend to see live data</div>}
          {events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: ev.resolved ? '#3A473A' : '#FF4D4D', marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ev.resolved ? '#6A786A' : '#FF8888' }}>{ev.type}</div>
                <div style={{ fontSize: 10, color: '#6A786A', marginTop: 1 }}>{ev.ip} · {ev.endpoint} · {new Date(ev.timestamp).toLocaleString()}</div>
              </div>
              {!ev.resolved && <button onClick={() => handleResolve(ev.id)} style={{ padding: '3px 10px', border: '1px solid rgba(0,201,123,.3)', borderRadius: 20, background: 'transparent', color: '#00C97B', fontSize: 10, cursor: 'pointer' }}>Resolve</button>}
            </div>
          ))}
        </div>
        <div>
          <div style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Broadcast SMS alert</div>
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Urgent message to all SMS subscribers…" rows={3} style={{ width: '100%', background: '#0A0D09', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#E8EDE5', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 8 }} />
            <button onClick={handleBroadcast} disabled={broadcasting} style={{ width: '100%', padding: 10, background: '#FF4D4D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: broadcasting ? .6 : 1 }}>
              {broadcasting ? 'Sending…' : '📱 Send to all subscribers'}
            </button>
          </div>
          <div style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Send email digest</div>
            <button onClick={() => adminAPI.sendDigest().then(() => alert('Digest sent!')).catch(console.error)} style={{ width: '100%', padding: 10, background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0A0D09', cursor: 'pointer' }}>📧 Send daily digest to all</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// src/pages/LoginPage.jsx
// ─────────────────────────────────────────────────────────────
import { useState as useS2 } from 'react';
import { loginUser } from '../services/firebase';
import { Link, useNavigate as useNav2 } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useS2('');
  const [password, setPassword] = useS2('');
  const [err, setErr] = useS2('');
  const [loading, setLoading] = useS2(false);
  const nav = useNav2();

  const handle = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await loginUser(email, password); nav('/'); }
    catch (ex) { setErr(ex.message); }
    setLoading(false);
  };

  const inp = { width: '100%', padding: '10px 12px', background: '#1A1F18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#E8EDE5', fontFamily: 'inherit', outline: 'none', marginTop: 4 };
  return (
    <div style={{ height: '100vh', background: '#0A0D09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 380, background: '#161A13', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#00C97B', marginBottom: 4 }}>⬡ CitiConnect</div>
          <div style={{ fontSize: 12, color: '#4A574A' }}>Addis Ababa Smart City Portal</div>
        </div>
        {err && <div style={{ background: 'rgba(255,77,77,.1)', border: '1px solid rgba(255,77,77,.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#FF8888', marginBottom: 14 }}>{err}</div>}
        <form onSubmit={handle}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={inp} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#0A0D09', cursor: 'pointer', opacity: loading ? .6 : 1 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#4A574A' }}>
          No account? <Link to="/register" style={{ color: '#00C97B' }}>Register</Link>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// src/pages/RegisterPage.jsx
// ─────────────────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useS2({ name: '', email: '', password: '', phone: '', role: 'citizen' });
  const [err, setErr] = useS2('');
  const [loading, setLoading] = useS2(false);
  const nav = useNav2();

  const handle = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const { authAPI: aAPI } = await import('../services/api');
      await aAPI.register(form);
      const { loginUser: lu } = await import('../services/firebase');
      await lu(form.email, form.password);
      nav('/');
    } catch (ex) { setErr(ex.message); }
    setLoading(false);
  };

  const inp = { width: '100%', padding: '10px 12px', background: '#1A1F18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13, color: '#E8EDE5', fontFamily: 'inherit', outline: 'none', marginTop: 4 };
  return (
    <div style={{ height: '100vh', background: '#0A0D09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' }}>
      <div style={{ width: 400, background: '#161A13', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 32, margin: '20px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#00C97B', marginBottom: 4 }}>⬡ CitiConnect</div>
          <div style={{ fontSize: 12, color: '#4A574A' }}>Join Addis Ababa's city community</div>
        </div>
        {err && <div style={{ background: 'rgba(255,77,77,.1)', border: '1px solid rgba(255,77,77,.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#FF8888', marginBottom: 14 }}>{err}</div>}
        <form onSubmit={handle}>
          {[['Full name', 'name', 'text', 'Abebe Bekele'], ['Email', 'email', 'email', 'abebe@example.com'], ['Password', 'password', 'password', 'Min 8 chars, 1 uppercase, 1 number'], ['Phone (for SMS alerts)', 'phone', 'tel', '+251 91 234 5678']].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={inp} required={key !== 'phone'} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>I am a</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
              <option value="citizen">Citizen</option>
              <option value="teacher">Teacher</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#0A0D09', cursor: 'pointer', opacity: loading ? .6 : 1 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#4A574A' }}>
          Already registered? <Link to="/login" style={{ color: '#00C97B' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
