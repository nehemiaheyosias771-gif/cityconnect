// src/components/Layout.jsx — Shell layout with Topbar, Sidebar, and Outlet
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { onEvent } from '../services/socket';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([
    { id: 1, type: 'security', text: '12 suspicious logins blocked from 41.251.x.x', time: '1h ago', read: false, color: '#FF4D4D' },
    { id: 2, type: 'issue', text: 'New water issue in Gerji — 89 upvotes', time: '2h ago', read: false, color: '#3B9EFF' },
    { id: 3, type: 'community', text: 'Fana G. connected with your community post', time: '3h ago', read: true, color: '#00C97B' },
    { id: 4, type: 'alert', text: 'Bole pipe burst reported — city authority notified', time: '5h ago', read: true, color: '#F59E0B' },
  ]);
  const [showNotif, setShowNotif] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const unread = notifs.filter(n => !n.read).length;

  // Listen for real-time security alerts via socket
  useEffect(() => {
    const unsub = onEvent('security_alert', (alert) => {
      setNotifs(prev => [{ id: Date.now(), type: 'security', text: alert.message, time: 'Just now', read: false, color: '#FF4D4D' }, ...prev]);
    });
    const unsub2 = onEvent('issue_created', (issue) => {
      setNotifs(prev => [{ id: Date.now(), type: 'issue', text: `New: ${issue.title}`, time: 'Just now', read: false, color: '#3B9EFF' }, ...prev]);
    });
    return () => { unsub?.(); unsub2?.(); };
  }, []);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const navItems = [
    { to: '/', icon: '🗺️', label: 'City map', count: 142, exact: true },
    { to: '/community', icon: '🤝', label: 'Community', count: 47 },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { to: '/transport', icon: '🚌', label: 'Services', count: 34 },
    ...(profile?.role === 'admin' ? [{ to: '/admin', icon: '🛡️', label: 'Admin', count: 3 }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A0D09', color: '#E8EDE5', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* Security alert strip */}
      {showAlert && (
        <div style={{ background: 'rgba(255,77,77,0.07)', borderBottom: '1px solid rgba(255,77,77,0.18)', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#FF9090', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D4D', animation: 'blink 1s infinite', flexShrink: 0 }} />
          <b style={{ color: '#FF4D4D' }}>Security alert:</b>&nbsp;12 unusual login attempts blocked from 41.251.x.x — monitoring active
          <button onClick={() => setShowAlert(false)} style={{ marginLeft: 'auto', padding: '2px 10px', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 20, background: 'transparent', color: '#FF9090', fontSize: 11, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* News ticker */}
      <div style={{ background: '#111410', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#00C97B', padding: '2px 8px', border: '1px solid rgba(0,201,123,0.25)', borderRadius: 20, background: 'rgba(0,201,123,0.1)', whiteSpace: 'nowrap' }}>LIVE NEWS</span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', gap: 32, animation: 'ticker 30s linear infinite', width: 'max-content', fontSize: 12, color: '#6A786A' }}>
            {['🇪🇹 Addis Ababa launches new waste management initiative', '💧 Water Authority announces Bole & Kirkos pipe upgrades', '🚌 New rapid bus transit corridor planned for Ring Road', '⚡ EEP to restore streetlight grid across 5 sub-cities', '🏗️ City infrastructure budget increased 23% for FY 2025'].flatMap(t => [t, t]).map((t, i) => (
              <span key={i} style={{ whiteSpace: 'nowrap' }}>{t} &nbsp;&nbsp;&nbsp;</span>
            ))}
          </div>
        </div>
      </div>

      {/* Topbar */}
      <div style={{ height: 52, background: '#111410', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, position: 'relative', zIndex: 200 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#00C97B', display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <div style={{ width: 28, height: 28, background: '#00C97B', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
          CitiConnect
        </div>
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact} style={({ isActive }) => ({
              padding: '5px 13px', borderRadius: 8, border: 'none', background: isActive ? 'rgba(0,201,123,0.12)' : 'transparent',
              color: isActive ? '#00C97B' : '#8A9888', fontSize: 12, cursor: 'pointer', textDecoration: 'none',
              fontWeight: isActive ? 500 : 400, display: 'flex', alignItems: 'center', gap: 5, transition: 'all .14s',
            })}>
              {item.label}
              {item.count && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: '#4A574A' }}>{item.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid rgba(0,201,123,0.22)', borderRadius: 30, fontSize: 11, color: '#00C97B', background: 'rgba(0,201,123,0.08)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C97B', animation: 'blink 1.4s infinite' }} />Live
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotif(!showNotif)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#1A1F18', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#8A9888', position: 'relative' }}>
              🔔
              {unread > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#FF4D4D', border: '1.5px solid #111410' }} />}
            </button>
            {showNotif && (
              <div style={{ position: 'absolute', top: 38, right: 0, width: 290, background: '#161A13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, zIndex: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                  Notifications
                  <button onClick={markAllRead} style={{ fontSize: 10, color: '#00C97B', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                </div>
                {notifs.map(n => (
                  <div key={n.id} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ display: 'flex', gap: 9, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(0,201,123,0.03)', transition: 'background .14s' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.read ? '#2F362B' : n.color, flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#E8EDE5', lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: '#4A574A', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: '#4A574A', display: 'flex', gap: 8 }}>
                  📧 Email digest: <span style={{ color: '#00C97B', cursor: 'pointer', borderBottom: '1px solid rgba(0,201,123,0.3)' }}>Daily · on</span>
                  &nbsp;&nbsp;📱 SMS: <span style={{ color: '#00C97B', cursor: 'pointer', borderBottom: '1px solid rgba(0,201,123,0.3)' }}>Urgent · on</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 30, background: '#1A1F18', cursor: 'pointer' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#00C97B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0A0D09', fontFamily: "'Syne', sans-serif" }}>
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: '#8A9888' }}>{profile?.name || user?.email?.split('@')[0]}</span>
          </div>
          <button onClick={logout} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#4A574A', fontSize: 11, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      {/* Body: sidebar + page content */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ background: '#111410', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '12px 10px', gap: 2, overflowY: 'auto' }}>
          {[{ label: 'Main', items: navItems },
            { label: 'By Category', items: [
              { to: '/?cat=water', icon: '💧', label: 'Water', count: 54, countColor: '#3B9EFF' },
              { to: '/?cat=waste', icon: '♻️', label: 'Waste', count: 31, countColor: '#7DC559' },
              { to: '/?cat=road', icon: '🛣️', label: 'Road', count: 28, countColor: '#F59E0B' },
              { to: '/?cat=power', icon: '⚡', label: 'Power', count: 17, countColor: '#8B5CF6' },
            ]},
            { label: 'Security', items: [
              { icon: '🛡️', label: 'Audit log', count: 3, countColor: '#FF4D4D' },
              { icon: '🔐', label: 'Access control' },
              { icon: '📧', label: 'Email alerts', count: 'on', countColor: '#00C97B' },
            ]},
          ].map(section => (
            <div key={section.label}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#3A473A', padding: '10px 8px 4px' }}>{section.label}</div>
              {section.items.map((item, i) => (
                item.to ? (
                  <NavLink key={i} to={item.to} end={item.exact} style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                    color: isActive ? '#00C97B' : '#8A9888', textDecoration: 'none', fontSize: 12, transition: 'all .14s',
                    background: isActive ? 'rgba(0,201,123,0.1)' : 'transparent', border: isActive ? '1px solid rgba(0,201,123,0.2)' : '1px solid transparent',
                  })}>
                    <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{item.icon}</span>
                    {item.label}
                    {item.count !== undefined && <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.countColor ? `${item.countColor}22` : 'rgba(255,255,255,0.05)', color: item.countColor || '#3A473A' }}>{item.count}</span>}
                  </NavLink>
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', color: '#8A9888', fontSize: 12, border: '1px solid transparent' }}>
                    <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{item.icon}</span>
                    {item.label}
                    {item.count !== undefined && <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.countColor ? `${item.countColor}22` : 'rgba(255,255,255,0.05)', color: item.countColor || '#3A473A' }}>{item.count}</span>}
                  </div>
                )
              ))}
            </div>
          ))}
          {/* Security alert box in sidebar */}
          <div style={{ margin: '8px 2px', padding: '9px 10px', borderRadius: 8, background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.18)', fontSize: 11, color: '#FF8888' }}>
            <b style={{ display: 'block', color: '#FF4D4D', marginBottom: 2, fontSize: 11 }}>⚠ Threat detected</b>
            12 login attempts blocked
          </div>
        </div>

        {/* Page content */}
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes ticker { 0%{transform:translateX(0)}100%{transform:translateX(-50%)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #2F362B; border-radius: 2px; }
        a { color: inherit; }
      `}</style>
    </div>
  );
}
