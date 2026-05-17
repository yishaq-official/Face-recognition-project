// /frontend/src/pages/admin/MemberList.jsx
import { useState, useEffect } from 'react';
import {
  Users, ShieldAlert, Trash2, Search, CheckCircle,
  Fingerprint, Activity, X, Shield, Cpu, Briefcase,
  MapPin, LayoutGrid, Dna, ChevronRight, Lock, User,
} from 'lucide-react';
import { authFetch, API_BASE } from '../../utils/authUtils';

export default function MemberList() {
  const [members,        setMembers]        = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState(null);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [revokeConfirm,  setRevokeConfirm]  = useState({ isOpen: false, agentId: null, agentName: '' });
  const [revokeStatus,   setRevokeStatus]   = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/members`);
        if (!res.ok) throw new Error('Failed to access security database.');
        const data = await res.json();
        data.sort((a, b) => new Date(b.registered_on) - new Date(a.registered_on));
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMembers();
    return () => { cancelled = true; };
  }, []);

  const initiateRevoke = (id, firstName, lastName) =>
    setRevokeConfirm({ isOpen: true, agentId: id, agentName: `${firstName} ${lastName}` });

  const closeRevokeModal = () => {
    setRevokeConfirm({ isOpen: false, agentId: null, agentName: '' });
    setRevokeStatus({ status: 'idle', message: '' });
  };

  const handleFinalRevocation = async () => {
    setRevokeStatus({ status: 'processing', message: 'Purging biometric data...' });
    try {
      const res  = await authFetch(`${API_BASE}/api/members/${revokeConfirm.agentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setRevokeStatus({ status: 'success', message: data.message });
        setMembers(m => m.filter(x => x.employee_id !== revokeConfirm.agentId));
        if (selectedMember?.employee_id === revokeConfirm.agentId) setSelectedMember(null);
        setTimeout(closeRevokeModal, 1500);
      } else {
        setRevokeStatus({ status: 'error', message: data.message || 'Revocation failed.' });
      }
    } catch {
      setRevokeStatus({ status: 'error', message: 'CRITICAL ERROR: Unable to contact Security Server.' });
    }
  };

  const filtered = members.filter(m =>
    `${m.name?.first} ${m.name?.last}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clsStyle = (lvl) => {
    if (!lvl)                return { color: '#3aff6a88', bg: 'rgba(26,255,90,0.04)',   border: '#1aff5a22' };
    if (lvl.includes('SCI')) return { color: '#ff3a3a',   bg: 'rgba(255,58,58,0.1)',    border: '#ff3a3a' };
    if (lvl.includes('TOP')) return { color: '#ffe066',   bg: 'rgba(255,224,102,0.1)',  border: '#ffe066' };
    if (lvl === 'SECRET')    return { color: '#60ffaa',   bg: 'rgba(96,255,170,0.1)',   border: '#60ffaa' };
    return                          { color: '#3aff6a88', bg: 'rgba(26,255,90,0.04)',   border: '#3aff6a44' };
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: '#a0ffb0', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', width: '100%', boxSizing: 'border-box' }}>

      {/* ── DOSSIER MODAL ─────────────────────────────────────────────── */}
      {selectedMember && (() => {
        const m   = selectedMember;
        const cls = clsStyle(m.position?.clearance_level);
        const svc = m.service   || {};
        const phy = m.personal  || {};
        return (
          <div
            onClick={() => setSelectedMember(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(1,4,2,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out', padding: '24px' }}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#020a04', border: '1px solid #1aff5a44', boxShadow: '0 0 50px rgba(26,255,90,0.08)', borderRadius: '8px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Modal header */}
              <div style={{ background: 'rgba(26,255,90,0.04)', borderBottom: '1px solid #1aff5a22', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={16} color="#1aff5a" />
                  <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase' }}>
                    Official Agent Dossier — {m.employee_id}
                  </span>
                </div>
                <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: '#3aff6a66', cursor: 'pointer', transition: 'color 0.2s', display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff3a3a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#3aff6a66'}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal body */}
              <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>

                {/* LEFT — photo + biometrics */}
                <div style={{ width: '220px', flexShrink: 0, padding: '24px 20px', borderRight: '1px solid #1aff5a11', background: '#010502', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', overflowY: 'auto' }}>
                  {/* Photo */}
                  <div style={{ width: '160px', height: '192px', border: '1px solid #1aff5a55', borderRadius: '4px', position: 'relative', overflow: 'hidden', background: '#020a04' }}>
                    {m.image_url
                      ? <img src={m.image_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.7) contrast(1.2)' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={48} color="#1aff5a" style={{ opacity: 0.2 }} /></div>}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#1aff5a', animation: 'scan 3s linear infinite' }} />
                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', border: '1px solid #1aff5a33', fontSize: '8px', color: '#1aff5a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1aff5a', animation: 'blink 1s infinite' }} /> LIVE
                    </div>
                  </div>

                  {/* Name under photo */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {m.name?.last}, {m.name?.first}
                    </div>
                    <div style={{ fontSize: '10px', color: '#1aff5a', letterSpacing: '0.18em', marginTop: '4px' }}>{m.employee_id}</div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em', color: cls.color, padding: '3px 8px', border: `1px solid ${cls.border}55`, background: cls.bg, borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={9} />{m.position?.clearance_level || 'UNCLASSIFIED'}
                      </span>
                    </div>
                  </div>

                  <Divider />

                  {/* Biometric status */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <StatusRow icon={<Fingerprint size={11} />} label="Biometric Hash" value="VERIFIED" valueColor="#1aff5a" />
                    <StatusRow icon={<Activity size={11} />}    label="System Status"  value={m.status || 'Active'} valueColor="#1aff5a" />
                    <StatusRow icon={<Cpu size={11} />}         label="AI Matrices"    value="LOADED"   valueColor="#60ffaa" />
                  </div>

                  <Divider />

                  {/* Physical description */}
                  {phy.blood_type && <>
                    <SectionLabel icon={<Dna size={11} />} label="Physical Profile" />
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <MiniRow label="Sex"     value={phy.sex            || '—'} />
                      <MiniRow label="DOB"     value={phy.date_of_birth  || '—'} />
                      <MiniRow label="Blood"   value={phy.blood_type     || '—'} />
                      <MiniRow label="Height"  value={phy.height_cm ? `${phy.height_cm} cm` : '—'} />
                      <MiniRow label="Weight"  value={phy.weight_kg ? `${phy.weight_kg} kg` : '—'} />
                      <MiniRow label="Eyes"    value={phy.eye_color      || '—'} />
                      {phy.distinguishing_marks && (
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ fontSize: '8px', color: '#3aff6a33', letterSpacing: '0.15em', marginBottom: '3px', textTransform: 'uppercase' }}>Marks</div>
                          <div style={{ fontSize: '10px', color: '#a0ffb0', lineHeight: 1.5 }}>{phy.distinguishing_marks}</div>
                        </div>
                      )}
                    </div>
                  </>}
                </div>

                {/* RIGHT — full service intel */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.015) 4px)' }} />

                  {/* Service record */}
                  <section>
                    <SectionLabel icon={<Briefcase size={12} />} label="Service Record" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <InfoCard label="Rank"             value={svc.rank             || '—'} />
                      <InfoCard label="Job Title"        value={svc.job_title        || '—'} />
                      <InfoCard label="Department"       value={svc.department       || '—'} span={2} />
                      <InfoCard label="Unit Designation" value={svc.unit             || '—'} />
                      <InfoCard label="Date Joined"      value={svc.date_joined_service || '—'} />
                    </div>
                  </section>

                  {/* Posting */}
                  <section>
                    <SectionLabel icon={<MapPin size={12} />} label="Current Posting" />
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a0f', borderRadius: '4px', padding: '12px 14px' }}>
                      <MapPin size={14} color="#3aff6a44" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#a0ffb0' }}>{svc.posting_location || '—'}</span>
                    </div>
                  </section>

                  {/* Access zones */}
                  <section>
                    <SectionLabel icon={<LayoutGrid size={12} />} label="Authorised Access Zones" />
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {svc.access_zones?.length > 0
                        ? svc.access_zones.map(z => (
                          <span key={z} style={{ fontSize: '10px', letterSpacing: '0.12em', padding: '5px 10px', border: '1px solid #1aff5a44', borderRadius: '3px', background: 'rgba(26,255,90,0.06)', color: '#1aff5a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ChevronRight size={10} />{z}
                          </span>
                        ))
                        : <span style={{ fontSize: '11px', color: '#3aff6a33' }}>No zones assigned</span>}
                    </div>
                  </section>

                  {/* AI engine note */}
                  <section>
                    <SectionLabel icon={<Cpu size={12} />} label="AI Engine Matrices" />
                    <div style={{ marginTop: '10px', background: 'rgba(26,255,90,0.02)', border: '1px solid #1aff5a0f', borderRadius: '4px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '10px', color: '#3aff6a55', lineHeight: 1.7, margin: 0 }}>
                        0x8F9A... [128-DIMENSIONAL ENCODING WITHHELD FOR SECURITY] ...3B2C
                        <br />
                        FACIAL RECOGNITION VECTORS ACTIVELY LOADED IN SENTINEL RAM.
                        SUBJECT AUTHORISED FOR BIOMETRIC SCANNING.
                      </p>
                    </div>
                  </section>

                  {/* Enrolled timestamp */}
                  <div style={{ fontSize: '9px', color: '#3aff6a33', letterSpacing: '0.15em', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #1aff5a0a' }}>
                    ENROLLED: {m.registered_on
                      ? new Date(m.registered_on).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC'
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Modal footer — revoke button */}
              <div style={{ padding: '12px 22px', borderTop: '1px solid #1aff5a11', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button
                  onClick={() => { setSelectedMember(null); initiateRevoke(m.employee_id, m.name?.first, m.name?.last); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', background: 'rgba(255,58,58,0.08)', border: '1px solid #ff3a3a44', color: '#ff3a3a88', borderRadius: '4px', fontFamily: 'inherit', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,58,58,0.15)'; e.currentTarget.style.color = '#ff3a3a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,58,58,0.08)'; e.currentTarget.style.color = '#ff3a3a88'; }}>
                  <Trash2 size={13} /> Revoke Access
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── REVOCATION MODAL ──────────────────────────────────────────── */}
      {revokeConfirm.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#080101', border: '2px solid #ff3a3a', boxShadow: '0 0 50px rgba(255,58,58,0.15)', padding: '40px', borderRadius: '8px', maxWidth: '520px', width: '90%', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,58,58,0.02) 4px)', borderRadius: '8px' }} />

            {revokeStatus.status === 'success'
              ? <CheckCircle size={56} style={{ color: '#1aff5a', margin: '0 auto 18px', filter: 'drop-shadow(0 0 8px #1aff5a)' }} />
              : <ShieldAlert  size={56} style={{ color: '#ff3a3a', margin: '0 auto 18px', filter: 'drop-shadow(0 0 8px #ff3a3a)' }} />}

            <h2 style={{ fontSize: '20px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 14px', color: '#ffcccc' }}>
              Access Revocation Protocol
            </h2>

            {revokeStatus.status === 'idle' && (
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#ff9999', letterSpacing: '0.06em', marginBottom: '28px' }}>
                WARNING: You are initiating a complete biometric purge for{' '}
                <strong style={{ color: '#fff' }}>{revokeConfirm.agentName} ({revokeConfirm.agentId})</strong>.
                This action is permanent. The subject will no longer be recognised by any secure nodes.
              </p>
            )}

            {['processing', 'success', 'error'].includes(revokeStatus.status) && (
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: revokeStatus.status === 'success' ? '#1aff5a' : '#ff4a4a', letterSpacing: '0.06em', marginBottom: '28px', animation: revokeStatus.status === 'processing' ? 'pulse 1s infinite' : 'none' }}>
                // {revokeStatus.message}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {revokeStatus.status === 'idle' && <>
                <button onClick={closeRevokeModal} style={modalBtn(false)}>Cancel</button>
                <button onClick={handleFinalRevocation} style={modalBtn(true)}>Execute Purge</button>
              </>}
              {revokeStatus.status === 'error' && (
                <button onClick={closeRevokeModal} style={modalBtn(false)}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #1aff5a22', paddingBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={subLabel}>FACEGUARD // SENTINEL DEFENSE ACCESS DIRECTORATE</p>
          <h1 style={{ fontSize: '26px', fontWeight: 300, letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', margin: '4px 0' }}>
            Classified Personnel Manifest
          </h1>
          <p style={{ ...subLabel, marginTop: 0 }}>Active Biometric Profiles in Secure Database</p>
        </div>
        <div style={{ background: 'rgba(2,10,4,0.6)', border: '1px solid #1aff5a33', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '9px 14px', gap: '10px', width: '280px' }}>
          <Search size={16} color="#3aff6a66" />
          <input
            type="text" placeholder="Search name or agent ID..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#a0ffb0', fontFamily: 'inherit', fontSize: '13px', outline: 'none', width: '100%' }}
          />
        </div>
      </header>

      {/* ── TABLE ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#030805', border: '1px solid #1aff5a1a', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(2,10,4,0.8)', borderBottom: '1px solid #1aff5a11', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#3aff6a77', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Users size={13} /> Total Agents: {isLoading ? '...' : filtered.length}
          </span>
          <span style={{ fontSize: '9px', color: '#3aff6a33', letterSpacing: '0.15em' }}>QUERY_NODE: SENTINEL-DB-01</span>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a55', fontSize: '12px', letterSpacing: '0.1em' }}>
            <Fingerprint size={28} style={{ animation: 'pulse 1s infinite', margin: '0 auto 14px', display: 'block' }} />
            Accessing encrypted records...
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ff4a4a', fontSize: '12px', letterSpacing: '0.1em' }}>
            <ShieldAlert size={28} style={{ margin: '0 auto 14px', display: 'block' }} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a44', fontSize: '12px', letterSpacing: '0.1em' }}>
            <Users size={28} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
            No agents match query parameter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1aff5a11' }}>
                  <th style={{ ...th, width: '60px' }}>Photo</th>
                  <th style={th}>Full Name</th>
                  <th style={{ ...th, width: '140px' }}>Agent ID</th>
                  <th style={th}>Rank / Dept</th>
                  <th style={th}>Clearance</th>
                  <th style={{ ...th, width: '160px' }}>Enrolled (UTC)</th>
                  <th style={{ ...th, width: '80px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const cls     = clsStyle(m.position?.clearance_level);
                  const joinDate = new Date(m.registered_on);
                  return (
                    <tr key={m._id}
                      onClick={() => setSelectedMember(m)}
                      style={{ borderBottom: '1px solid #1aff5a08', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,255,90,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <td style={td}>
                        <div style={{ width: '40px', height: '48px', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1aff5a1a', background: '#000' }}>
                          {m.image_url
                            ? <img src={m.image_url} alt="ID" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="#1aff5a22" /></div>}
                        </div>
                      </td>
                      <td style={{ ...td, color: '#fff', fontWeight: 'bold' }}>{m.name?.first} {m.name?.last}</td>
                      <td style={{ ...td, color: '#3aff6a', fontFamily: 'monospace' }}>{m.employee_id}</td>
                      <td style={td}>
                        <div style={{ fontSize: '12px', color: '#a0ffb0' }}>{m.service?.rank || '—'}</div>
                        <div style={{ fontSize: '9px', color: '#3aff6a44', marginTop: '2px', letterSpacing: '0.05em' }}>{m.service?.department || '—'}</div>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: '3px', color: cls.color, background: cls.bg, border: `1px solid ${cls.border}` }}>
                          {m.position?.clearance_level || 'UNCLASSIFIED'}
                        </span>
                      </td>
                      <td style={{ ...td, color: '#3aff6a66', fontSize: '11px' }}>
                        {joinDate.getUTCFullYear()}-{String(joinDate.getUTCMonth()+1).padStart(2,'0')}-{String(joinDate.getUTCDate()).padStart(2,'0')}
                        <div style={{ fontSize: '9px', color: '#3aff6a33', marginTop: '2px' }}>
                          {String(joinDate.getUTCHours()).padStart(2,'0')}:{String(joinDate.getUTCMinutes()).padStart(2,'0')} UTC
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button
                          onClick={e => { e.stopPropagation(); initiateRevoke(m.employee_id, m.name?.first, m.name?.last); }}
                          style={{ background: 'rgba(255,58,58,0.08)', border: '1px solid rgba(255,58,58,0.3)', color: '#ff3a3a77', padding: '7px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,58,58,0.18)'; e.currentTarget.style.color = '#ff3a3a'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,58,58,0.08)'; e.currentTarget.style.color = '#ff3a3a77'; }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scan   { 0%{top:0} 50%{top:100%} 100%{top:0} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const subLabel = { fontSize: '9px', letterSpacing: '0.3em', color: '#3aff6a44', textTransform: 'uppercase', margin: 0 };
const th       = { padding: '10px 14px', color: '#3aff6a55', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '9px', fontWeight: 'normal', textAlign: 'left' };
const td       = { padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

const modalBtn = (danger) => ({
  padding: '10px 24px', fontFamily: "'Courier New', monospace", fontSize: '11px',
  letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px',
  background: danger ? '#ff3a3a'              : 'rgba(255,255,255,0.05)',
  border:     danger ? '1px solid #ff3a3a'   : '1px solid rgba(255,255,255,0.15)',
  color:      danger ? '#000'                : '#fff',
  fontWeight: danger ? 'bold'                : 'normal',
});

function Divider() {
  return <div style={{ width: '100%', height: '1px', background: '#1aff5a0f' }} />;
}
function SectionLabel({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '0.2em', color: '#3aff6a44', textTransform: 'uppercase' }}>
      {icon}{label}
    </div>
  );
}
function InfoCard({ label, value, span }) {
  return (
    <div style={{ background: 'rgba(26,255,90,0.02)', border: '1px solid #1aff5a0a', borderRadius: '4px', padding: '10px 12px', gridColumn: span === 2 ? 'span 2' : undefined }}>
      <div style={{ fontSize: '8px', color: '#3aff6a33', letterSpacing: '0.15em', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#a0ffb0', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}
function StatusRow({ icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', borderBottom: '1px solid #1aff5a08', paddingBottom: '6px' }}>
      <span style={{ color: '#3aff6a44', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{icon}{label}</span>
      <span style={{ color: valueColor || '#a0ffb0', letterSpacing: '0.1em' }}>{value}</span>
    </div>
  );
}
function MiniRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', gap: '8px' }}>
      <span style={{ color: '#3aff6a33', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#a0ffb0', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
