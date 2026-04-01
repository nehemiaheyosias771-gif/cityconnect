// src/pages/MapPage.jsx — Live issue map with Firestore + Socket.io
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { subscribeToIssues, subscribeToComments } from '../services/firebase';
import { issuesAPI } from '../services/api';
import { joinIssueRoom, onEvent } from '../services/socket';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const CAT_COLORS = { water: '#3B9EFF', waste: '#7DC559', road: '#F59E0B', power: '#8B5CF6', infrastructure: '#00C97B' };
const CAT_CLASS = { water: 'cw', waste: 'cwa', road: 'cr', power: 'cp', infrastructure: 'ci' };
const STATUS_LABEL = { open: 'Open', progress: 'In progress', resolved: 'Resolved' };
const ADDIS_CENTER = [9.0148, 38.7636];

const makeIcon = (cat, selected = false) => L.divIcon({
  className: '',
  html: `<div style="width:${selected ? 16 : 12}px;height:${selected ? 16 : 12}px;border-radius:50%;background:${CAT_COLORS[cat] || '#00C97B'};border:2px solid rgba(255,255,255,${selected ? 1 : 0.7});box-shadow:0 0 ${selected ? 14 : 8}px ${CAT_COLORS[cat] || '#00C97B'}88;transition:all .2s"></div>`,
  iconSize: [selected ? 16 : 12, selected ? 16 : 12],
  iconAnchor: [selected ? 8 : 6, selected ? 8 : 6],
});

function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.flyTo([lat, lng], 15, { duration: 0.9 }); }, [lat, lng]);
  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'water', location: '', description: '', lat: '', lng: '', notifyEmail: true, notifySMS: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const commentEndRef = useRef(null);

  // Subscribe to Firestore issues in real-time
  useEffect(() => {
    const unsub = subscribeToIssues(setIssues);
    return unsub;
  }, []);

  // Subscribe to comments when an issue is selected
  useEffect(() => {
    if (!selected) return;
    joinIssueRoom(selected.id);
    const unsub = subscribeToComments(selected.id, setComments);
    return unsub;
  }, [selected?.id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const filtered = issues.filter(i =>
    (catFilter === 'all' || i.category === catFilter) &&
    (statusFilter === 'all' || i.status === statusFilter)
  );

  const selectIssue = (issue) => {
    setSelected(issue);
    setFlyTo({ lat: issue.lat, lng: issue.lng });
  };

  const handleVote = async (issue) => {
    try {
      await issuesAPI.vote(issue.id);
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !selected) return;
    try {
      await issuesAPI.addComment(selected.id, commentText.trim());
      setCommentText('');
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.location || !form.description) return;
    setSubmitting(true);
    try {
      // Use Addis Ababa center with small random offset if no coords given
      const lat = parseFloat(form.lat) || (ADDIS_CENTER[0] + (Math.random() - 0.5) * 0.04);
      const lng = parseFloat(form.lng) || (ADDIS_CENTER[1] + (Math.random() - 0.5) * 0.04);
      await issuesAPI.create({ ...form, lat, lng });
      setSubmitOk(true);
      setTimeout(() => { setShowModal(false); setSubmitOk(false); setForm({ title: '', category: 'water', location: '', description: '', lat: '', lng: '', notifyEmail: true, notifySMS: false }); }, 1600);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const s = { // shared styles
    btn: (active) => ({ padding: '4px 10px', border: `1px solid ${active ? 'rgba(0,201,123,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius: 20, fontSize: 11, color: active ? '#00C97B' : '#8A9888', cursor: 'pointer', background: active ? 'rgba(0,201,123,.1)' : 'transparent', transition: 'all .14s' }),
    card: (sel) => ({ background: sel ? 'rgba(0,201,123,.06)' : '#1A1F18', border: `1px solid ${sel ? 'rgba(0,201,123,.35)' : 'rgba(255,255,255,.06)'}`, borderRadius: 14, padding: 11, marginBottom: 7, cursor: 'pointer', transition: 'all .16s' }),
    label: (color) => ({ padding: '2px 7px', borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', background: `${color}22`, color }),
    input: { width: '100%', padding: '8px 11px', background: '#1A1F18', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, fontSize: 12, color: '#E8EDE5', fontFamily: 'inherit', outline: 'none', marginTop: 4 },
  };

  const heroImg = selected
    ? `https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80&sig=${selected.id}`
    : 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: '100%', overflow: 'hidden' }}>

      {/* MAP */}
      <div style={{ position: 'relative' }}>
        <MapContainer center={ADDIS_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} />}
          {filtered.map(issue => (
            <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={makeIcon(issue.category, selected?.id === issue.id)} eventHandlers={{ click: () => selectIssue(issue) }}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: 12, minWidth: 160 }}>
                  <b>{issue.title}</b><br />
                  <span style={{ color: '#666' }}>{issue.location} · {STATUS_LABEL[issue.status]}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Category filter overlay */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'water', 'waste', 'road', 'power'].map(c => (
            <button key={c} style={{ ...s.btn(catFilter === c), backdropFilter: 'blur(10px)', background: catFilter === c ? 'rgba(0,201,123,.12)' : 'rgba(10,13,9,.8)' }} onClick={() => setCatFilter(c)}>
              {c === 'all' ? 'All' : { water: '💧 Water', waste: '♻️ Waste', road: '🛣️ Road', power: '⚡ Power' }[c]}
            </button>
          ))}
        </div>

        {/* Issue photo panel */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 500, width: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', background: '#161A13' }}>
          <img src={heroImg} alt="Addis Ababa" style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '7px 9px', fontSize: 10, color: '#6A786A', lineHeight: 1.4 }}>
            <b style={{ display: 'block', color: '#8A9888', fontSize: 11, marginBottom: 1 }}>{selected ? selected.location : 'Addis Ababa'}</b>
            {selected ? selected.title?.substring(0, 40) + '…' : 'Select an issue to focus'}
          </div>
        </div>

        {/* Bottom stat strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 500, background: 'rgba(10,13,9,.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,.05)', padding: '9px 16px', display: 'flex', gap: 20, alignItems: 'center' }}>
          {[{ n: issues.length, l: 'Total', c: '#00C97B' }, { n: issues.filter(i => i.status === 'open').length, l: 'Open', c: '#FF4D4D' }, { n: issues.filter(i => i.status === 'progress').length, l: 'In progress', c: '#F59E0B' }, { n: issues.filter(i => i.status === 'resolved').length, l: 'Resolved', c: '#00C97B' }].map(stat => (
            <div key={stat.l}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: stat.c }}>{stat.n}</div>
              <div style={{ fontSize: 9, color: '#3A473A', textTransform: 'uppercase', letterSpacing: '.6px' }}>{stat.l}</div>
            </div>
          ))}
          <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', padding: '6px 16px', background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0A0D09', cursor: 'pointer' }}>+ Report issue</button>
        </div>
      </div>

      {/* ISSUE PANEL */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', background: '#111410', overflow: 'hidden' }}>
        <div style={{ padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700 }}>Reported issues</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {['all', 'open', 'progress', 'resolved'].map(s2 => (
              <button key={s2} onClick={() => setStatusFilter(s2)} style={s.btn(statusFilter === s2)}>{s2 === 'all' ? 'All' : s2 === 'progress' ? 'In progress' : s2.charAt(0).toUpperCase() + s2.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#3A473A', fontSize: 12 }}>No issues match your filter</div>}
          {filtered.map(issue => (
            <div key={issue.id} style={s.card(selected?.id === issue.id)} onClick={() => selectIssue(issue)}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 7 }}>
                <span style={s.label(CAT_COLORS[issue.category] || '#00C97B')}>{issue.category}</span>
                <span style={{ ...s.label(issue.status === 'open' ? '#FF4D4D' : issue.status === 'resolved' ? '#00C97B' : '#F59E0B'), marginLeft: 'auto' }}>
                  {STATUS_LABEL[issue.status]}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{issue.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#3A473A' }}>
                <span>{issue.location}</span>
                <button onClick={(e) => { e.stopPropagation(); handleVote(issue); }} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, cursor: 'pointer', background: 'transparent', color: '#6A786A', fontSize: 10, marginLeft: 'auto' }}>
                  ▲ {issue.votes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', maxHeight: 190, overflowY: 'auto', background: '#0A0D09' }}>
          <div style={{ padding: '8px 12px 4px', fontSize: 9, color: '#3A473A', textTransform: 'uppercase', letterSpacing: '.8px', display: 'flex', justifyContent: 'space-between' }}>
            Comments
            <span style={{ color: '#6A786A', textTransform: 'none', letterSpacing: 0 }}>{selected ? selected.title?.substring(0, 28) + '…' : '— select an issue'}</span>
          </div>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 7, padding: '0 12px 8px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#00C97B22', color: '#00C97B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                {(c.name || 'U').charAt(0)}
              </div>
              <div style={{ background: '#1A1F18', border: '1px solid rgba(255,255,255,.05)', borderRadius: '0 8px 8px 8px', padding: '7px 9px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#8A9888', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#E8EDE5', lineHeight: 1.4 }}>{c.text}</div>
              </div>
            </div>
          ))}
          <div ref={commentEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 7, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,.05)', background: '#111410', flexShrink: 0 }}>
          <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} placeholder="Add a comment…" style={{ flex: 1, background: '#1A1F18', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#E8EDE5', outline: 'none' }} />
          <button onClick={handleComment} style={{ padding: '7px 12px', background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#0A0D09', cursor: 'pointer' }}>↑</button>
        </div>
      </div>

      {/* REPORT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#161A13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 24, width: 'min(460px, 92vw)', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800 }}>Report a city issue</span>
              <button onClick={() => setShowModal(false)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: '#1A1F18', cursor: 'pointer', color: '#6A786A', fontSize: 14 }}>✕</button>
            </div>
            {submitOk && <div style={{ background: 'rgba(0,201,123,.1)', border: '1px solid rgba(0,201,123,.3)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#00C97B', marginBottom: 12 }}>Issue reported! It's now live on the map and the city authority has been notified by email.</div>}
            {[['Title', 'title', 'text', 'Brief description of the problem'], ['Location / Sub-city', 'location', 'text', 'e.g. Bole Woreda 3, near Friendship Hotel…'], ['Description', 'description', 'textarea', 'What is happening? Since when? How severe?']].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</label>
                {type === 'textarea'
                  ? <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} rows={3} style={{ ...s.input, resize: 'vertical' }} />
                  : <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={s.input} />}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#6A786A', textTransform: 'uppercase', letterSpacing: '.6px' }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...s.input }}>
                {['water', 'waste', 'road', 'power', 'infrastructure'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
              {[['notifyEmail', '📧 Notify me by email'], ['notifySMS', '📱 Notify me by SMS']].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8A9888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ width: 'auto', padding: 0 }} />
                  {label}
                </label>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 12, background: '#00C97B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#0A0D09', cursor: 'pointer', opacity: submitting ? .6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
