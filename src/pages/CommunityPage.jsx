// src/pages/CommunityPage.jsx — Community board + live chat
import { useState, useEffect, useRef } from 'react';
import { subscribeToChatRoom } from '../services/firebase';
import { communityAPI } from '../services/api';
import { joinRoom, sendMessage } from '../services/socket';
import { useAuth } from '../context/AuthContext';

const ROOMS = [
  { id: 'general', label: 'General', color: '#00C97B' },
  { id: 'bole', label: 'Bole', color: '#3B9EFF' },
  { id: 'kirkos', label: 'Kirkos', color: '#F59E0B' },
  { id: 'yeka', label: 'Yeka', color: '#7DC559' },
  { id: 'alerts', label: 'Alerts 🔴', color: '#FF4D4D' },
];

const SEED_POSTS = {
  seeking: [
    { id: 's1', userName: 'Yonas T.', role: 'Student · Bole', title: 'Math tutor needed — grade 10', description: 'Looking for a patient tutor for algebra and geometry, 3 days/week. Can meet in Bole or online. Willing to pay a modest fee.', tags: ['Tutoring', 'Math'], connected: false, color: '#3B9EFF' },
    { id: 's2', userName: 'Fana G.', role: 'Community · Kirkos', title: 'Elderly neighbor needs weekly grocery help', description: 'My neighbor (age 78) needs weekly grocery assistance near Merkato. Any volunteer passing by would help tremendously.', tags: ['Errands', 'Elderly care'], connected: true, color: '#F59E0B' },
    { id: 's3', userName: 'Biruk M.', role: 'Student · Kazanchis', title: 'English conversation practice partner', description: 'Preparing for university entrance exam. Need fluent English speaker to practice with 2×/week, evenings preferred.', tags: ['Language', 'English'], connected: false, color: '#8B5CF6' },
  ],
  offering: [
    { id: 'o1', userName: 'Sara T.', role: 'Teacher · Gerji', title: 'Free English lessons — Saturday mornings', description: 'Secondary school English teacher offering free group lessons every Saturday 9–11am at Gerji community hall. Open to all ages.', tags: ['Teaching', 'English', 'Free'], connected: false, color: '#00C97B' },
    { id: 'o2', userName: 'Hailu W.', role: 'Licensed plumber · Kirkos', title: 'Plumbing volunteer — weekends', description: 'Volunteering plumbing skills weekends for low-income families. You bring materials, I bring tools and expertise.', tags: ['Plumbing', 'Volunteer'], connected: false, color: '#FF8080' },
  ],
  events: [
    { id: 'e1', userName: 'Community', role: 'All welcome', title: 'Bole river cleanup day', description: 'Cleanup along Bole river banks. Tools and refreshments provided. Bring gloves if available.', tags: ['Environment', 'Community'], connected: false, color: '#00C97B', date: 'Apr 12', dateColor: '#00C97B' },
    { id: 'e2', userName: 'Kirkos Youth Office', role: 'Youth 15–30', title: 'Youth skills fair — Kirkos', description: 'Meet mentors, explore vocational training, sign up for workshops. Free entry.', tags: ['Youth', 'Skills'], connected: false, color: '#8B5CF6', date: 'Apr 19', dateColor: '#8B5CF6' },
  ],
};

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('seeking');
  const [posts, setPosts] = useState(SEED_POSTS);
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'seeking', description: '', category: '', notifyEmail: true, notifySMS: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const msgEndRef = useRef(null);

  // Subscribe to live chat room
  useEffect(() => {
    joinRoom(room);
    const unsub = subscribeToChatRoom(room, (msgs) => {
      // Merge live msgs with any seed messages already there
      setMessages(msgs.length > 0 ? msgs : getSeedMessages(room));
    });
    return unsub;
  }, [room]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSeedMessages = (r) => ({
    general: [
      { id: 'g1', name: 'Abebe B.', text: 'Has anyone noticed the water pressure issues in Bole?', timestamp: new Date(Date.now() - 600000).toISOString(), color: '#00C97B', me: false },
      { id: 'g2', name: 'Liya K.', text: 'Yes! Reported on CitiConnect — 89 upvotes already.', timestamp: new Date(Date.now() - 480000).toISOString(), color: '#3B9EFF', me: false },
      { id: 'g3', name: 'You', text: 'We should coordinate a visit to the water authority.', timestamp: new Date(Date.now() - 120000).toISOString(), color: '#8B5CF6', me: true },
    ],
    bole: [{ id: 'b1', name: 'Tigist A.', text: 'Bole pothole near Friendship Hotel is getting worse!', timestamp: new Date(Date.now() - 300000).toISOString(), color: '#F59E0B', me: false }],
    kirkos: [{ id: 'k1', name: 'Samuel D.', text: 'Kirkos clinic open Saturday for free checkups — spread the word.', timestamp: new Date(Date.now() - 1200000).toISOString(), color: '#00C97B', me: false }],
    yeka: [{ id: 'y1', name: 'Mekdes H.', text: 'Yeka community cleanup this weekend — join us at 8am!', timestamp: new Date(Date.now() - 2700000).toISOString(), color: '#7DC559', me: false }],
    alerts: [
      { id: 'a1', name: 'System', text: '⚠ 12 suspicious login attempts blocked from 41.251.x.x — IPs logged, admin emailed.', timestamp: new Date(Date.now() - 5400000).toISOString(), color: '#FF4D4D', me: false },
      { id: 'a2', name: 'System', text: 'Unusual API scraping detected — rate limiting applied. SMS sent to admin.', timestamp: new Date(Date.now() - 10800000).toISOString(), color: '#FF4D4D', me: false },
    ],
  }[r] || []);

  const handleSend = () => {
    if (!chatText.trim()) return;
    // Optimistic UI update
    const msg = { id: Date.now().toString(), name: profile?.name || 'You', text: chatText.trim(), timestamp: new Date().toISOString(), color: '#8B5CF6', me: true };
    setMessages(m => [...m, msg]);
    sendMessage(room, chatText.trim()); // Real-time via Socket.io
    setChatText('');
  };

  const handleConnect = (tabKey, id) => {
    setPosts(p => ({
      ...p,
      [tabKey]: p[tabKey].map(post => post.id === id ? { ...post, connected: !post.connected } : post),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      await communityAPI.create(form);
      setSubmitOk(true);
      setTimeout(() => { setShowModal(false); setSubmitOk(false); setForm({ title: '', type: 'seeking', description: '', category: '', notifyEmail: true, notifySMS: false }); }, 1600);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const inp = { width: '100%', padding: '8px 11px', background: '#1A1F18', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, fontSize: 12, color: '#E8EDE5', fontFamily: 'inherit', outline: 'none', marginTop: 4 };
  const formatTime = (ts) => { const d = new Date(ts); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: '100%', overflow: 'hidden' }}>

      {/* COMMUNITY BOARD */}
      <div style={{ overflowY: 'auto', padding: 18 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 3 }}>Community board</div>
        <div style={{ fontSize: 12, color: '#6A786A', marginBottom: 14 }}>Connect with neighbors, teachers, volunteers & more across Addis Ababa</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setShowModal(true)} style={{ padding: '6px 16px', background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0A0D09', cursor: 'pointer' }}>+ Post a need</button>
          <button onClick={() => alert('SMS alerts enabled for your area!')} style={{ padding: '6px 14px', background: 'rgba(0,201,123,.08)', border: '1px solid rgba(0,201,123,.25)', borderRadius: 8, fontSize: 12, color: '#00C97B', cursor: 'pointer' }}>📱 SMS alerts</button>
          <button onClick={() => alert('Daily email digest scheduled at 8am!')} style={{ padding: '6px 14px', background: 'rgba(0,201,123,.08)', border: '1px solid rgba(0,201,123,.25)', borderRadius: 8, fontSize: 12, color: '#00C97B', cursor: 'pointer' }}>📧 Email digest</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,.05)', marginBottom: 14 }}>
          {[['seeking', 'Seeking help'], ['offering', 'Offering help'], ['events', 'Events']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 16px', fontSize: 12, cursor: 'pointer', color: tab === id ? '#00C97B' : '#6A786A', borderBottom: `2px solid ${tab === id ? '#00C97B' : 'transparent'}`, marginBottom: -1, background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? '#00C97B' : 'transparent'}`, fontWeight: tab === id ? 500 : 400 }}>{label}</button>
          ))}
        </div>

        {/* Posts */}
        {(posts[tab] || []).map(post => (
          <div key={post.id} style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              {post.date && <div style={{ padding: '2px 8px', background: `${post.dateColor}18`, border: `1px solid ${post.dateColor}44`, borderRadius: 20, fontSize: 10, fontWeight: 600, color: post.dateColor, flexShrink: 0 }}>{post.date}</div>}
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${post.color}18`, color: post.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{post.userName.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>{post.title}</div>
                <div style={{ fontSize: 10, color: '#3A473A', marginTop: 2 }}>{post.userName} · {post.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6A786A', lineHeight: 1.6, marginBottom: 10 }}>{post.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {post.tags.map(t => <span key={t} style={{ padding: '2px 7px', background: '#272D24', borderRadius: 20, fontSize: 10, color: '#4A574A' }}>{t}</span>)}
              <button onClick={() => handleConnect(tab, post.id)} style={{ marginLeft: 'auto', padding: '5px 14px', border: `1px solid ${post.connected ? 'rgba(0,201,123,.4)' : 'rgba(0,201,123,.25)'}`, borderRadius: 8, fontSize: 11, fontWeight: 500, color: '#00C97B', background: post.connected ? 'rgba(0,201,123,.1)' : 'transparent', cursor: 'pointer' }}>
                {post.connected ? (tab === 'events' ? 'Joined ✓' : 'Connected ✓') : (tab === 'events' ? 'Join' : 'Connect')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LIVE CHAT */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', background: '#111410', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Community chat</div>
          <div style={{ fontSize: 10, color: '#3A473A' }}>Real-time · powered by Firebase</div>
        </div>

        {/* Rooms */}
        <div style={{ display: 'flex', gap: 4, overflow: 'auto', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => setRoom(r.id)} style={{ flexShrink: 0, padding: '3px 10px', border: `1px solid ${room === r.id ? r.color + '55' : 'rgba(255,255,255,.07)'}`, borderRadius: 20, fontSize: 11, color: room === r.id ? r.color : '#6A786A', background: room === r.id ? `${r.color}12` : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: room === r.id ? r.color : '#3A473A' }} />
              {r.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.me ? 'row-reverse' : 'row', gap: 7, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${msg.color}22`, color: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                {(msg.name || 'U').charAt(0)}
              </div>
              <div style={{ maxWidth: 190, ...(msg.me ? { alignItems: 'flex-end', display: 'flex', flexDirection: 'column' } : {}) }}>
                {!msg.me && <div style={{ fontSize: 9, color: '#3A473A', marginBottom: 2 }}>{msg.name}</div>}
                <div style={{ padding: '7px 10px', borderRadius: msg.me ? '8px 0 8px 8px' : '0 8px 8px 8px', fontSize: 11, lineHeight: 1.5, background: msg.me ? 'rgba(0,201,123,.1)' : '#1A1F18', border: `1px solid ${msg.me ? 'rgba(0,201,123,.25)' : 'rgba(255,255,255,.05)'}`, color: '#E8EDE5' }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 9, color: '#3A473A', marginTop: 2 }}>{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        {/* Email/SMS toggle row */}
        <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,.05)', background: '#0A0D09', fontSize: 10, color: '#3A473A', display: 'flex', alignItems: 'center', gap: 8 }}>
          📧 <span style={{ color: '#00C97B', cursor: 'pointer' }}>Email urgent msgs</span>
          &nbsp;&nbsp;📱 <span style={{ color: '#00C97B', cursor: 'pointer' }}>SMS on</span>
        </div>

        {/* Chat input */}
        <div style={{ display: 'flex', gap: 7, padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,.05)', background: '#0A0D09', flexShrink: 0 }}>
          <input value={chatText} onChange={e => setChatText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Message the community…" style={{ flex: 1, background: '#1A1F18', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#E8EDE5', outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={handleSend} style={{ width: 32, height: 32, background: '#00C97B', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>↑</button>
        </div>
      </div>

      {/* POST MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#161A13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 24, width: 'min(440px, 92vw)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>Post to community board</span>
              <button onClick={() => setShowModal(false)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: '#1A1F18', cursor: 'pointer', color: '#6A786A', fontSize: 14 }}>✕</button>
            </div>
            {submitOk && <div style={{ background: 'rgba(0,201,123,.1)', border: '1px solid rgba(0,201,123,.3)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#00C97B', marginBottom: 12 }}>Posted! The community will be notified.</div>}
            {[['Title', 'title', 'text', 'What do you need or offer?'], ['Category / skill', 'category', 'text', 'e.g. Tutoring, Plumbing, Healthcare…'], ['Details', 'description', 'textarea', 'Give enough context so people can help…']].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</label>
                {type === 'textarea'
                  ? <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} rows={3} style={{ ...inp, resize: 'vertical' }} />
                  : <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={inp} />}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                <option value="seeking">Seeking help</option>
                <option value="offering">Offering help</option>
                <option value="event">Organizing an event</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {[['notifyEmail', '📧 Notify by email'], ['notifySMS', '📱 Notify by SMS']].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8A9888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ width: 'auto', padding: 0 }} />
                  {label}
                </label>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 12, background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#0A0D09', cursor: 'pointer', opacity: submitting ? .6 : 1 }}>
              {submitting ? 'Posting…' : 'Post to board'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
