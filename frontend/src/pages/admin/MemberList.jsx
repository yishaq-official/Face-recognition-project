import { useState, useEffect } from 'react';
import { Users, ShieldAlert, Trash2, Search, FileText, CheckCircle, Fingerprint, Activity, X, Shield, Cpu } from 'lucide-react';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for the modals
  const [revokeConfirm, setRevokeConfirm] = useState({ isOpen: false, agentId: null, agentName: '' });
  const [revokeStatus, setRevokeStatus] = useState({ status: 'idle', message: '' });
  const [selectedMember, setSelectedMember] = useState(null); // NEW: Tracks the clicked profile

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/members');
      if (!response.ok) throw new Error('Failed to access security database.');
      const data = await response.json();
      data.sort((a, b) => new Date(b.registered_on) - new Date(a.registered_on));
      setMembers(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const initiateRevoke = (id, firstName, lastName) => {
    setRevokeConfirm({ isOpen: true, agentId: id, agentName: `${firstName} ${lastName}` });
  };

  const closeRevokeModal = () => {
    setRevokeConfirm({ isOpen: false, agentId: null, agentName: '' });
    setRevokeStatus({ status: 'idle', message: '' });
  };

  const handleFinalRevocation = async () => {
    setRevokeStatus({ status: 'processing', message: 'Purging biometric data...' });
    try {
      const response = await fetch(`http://localhost:5000/api/members/${revokeConfirm.agentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        setRevokeStatus({ status: 'success', message: data.message });
        setMembers(members.filter(m => m.employee_id !== revokeConfirm.agentId));
        setTimeout(closeRevokeModal, 1500);
      } else {
        setRevokeStatus({ status: 'error', message: data.message || 'Revocation failed.' });
      }
    } catch (err) {
      setRevokeStatus({ status: 'error', message: 'CRITICAL ERROR: Unable to contact Security Server.' });
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.name.first} ${m.name.last}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClearanceStyle = (level) => {
    switch (level) {
      case 'TOP SECRET // SCI': return { color: '#ff3a3a', bg: 'rgba(255, 58, 58, 0.1)', border: '#ff3a3a' };
      case 'TOP SECRET': return { color: '#ffe066', bg: 'rgba(255, 224, 102, 0.1)', border: '#ffe066' };
      case 'SECRET': return { color: '#60ffaa', bg: 'rgba(96, 255, 170, 0.1)', border: '#60ffaa' };
      default: return { color: '#3aff6a88', bg: 'rgba(26, 255, 90, 0.05)', border: '#3aff6a44' };
    }
  };

  return (
    <div style={{ fontFamily: 'monospace', width: '100%', boxSizing: 'border-box', color: '#a0ffb0', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* =========================================
          AGENT DOSSIER MODAL (NEW PROFILE CARD)
      ========================================= */}
      {selectedMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(1, 4, 2, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setSelectedMember(null)}>
          
          {/* Prevent clicks inside the card from closing the modal */}
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#020a04', border: '1px solid #1aff5a55', boxShadow: '0 0 40px rgba(26,255,90,0.1)', borderRadius: '8px', width: '100%', maxWidth: '800px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'rgba(26, 255, 90, 0.05)', borderBottom: '1px solid #1aff5a33', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={20} color="#1aff5a" />
                <span style={{ fontSize: '14px', letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', fontWeight: 'bold' }}>Official Agent Dossier</span>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: '#3aff6a88', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ff3a3a'} onMouseLeave={e => e.target.style.color = '#3aff6a88'}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0' }}>
              
              {/* Left Column: Photo & Biometrics */}
              <div style={{ padding: '30px', borderRight: '1px solid #1aff5a22', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#010502' }}>
                <div style={{ width: '200px', height: '240px', border: '2px solid #1aff5a88', borderRadius: '4px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 20px rgba(26,255,90,0.1) inset' }}>
                  <img src={selectedMember.image_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.8) contrast(1.2)' }} />
                  {/* Cyber Scanner Overlay */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#1aff5a', boxShadow: '0 0 10px #1aff5a', animation: 'scan 3s infinite linear' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', border: '1px solid #1aff5a', fontSize: '9px', color: '#1aff5a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1aff5a', animation: 'blink 1s infinite' }}/> LIVE
                  </div>
                </div>
                
                <div style={{ marginTop: '24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1aff5a33', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#3aff6a66' }}>BIOMETRIC HASH</span>
                    <span style={{ fontSize: '10px', color: '#1aff5a' }}><Fingerprint size={12} style={{display:'inline', verticalAlign:'middle'}}/> VERIFIED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #1aff5a33', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#3aff6a66' }}>SYSTEM STATUS</span>
                    <span style={{ fontSize: '10px', color: '#1aff5a' }}><Activity size={12} style={{display:'inline', verticalAlign:'middle'}}/> ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Intel */}
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                 <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.02) 4px)' }} />
                
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '32px', fontWeight: '300', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {selectedMember.name.last}, {selectedMember.name.first}
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1aff5a', letterSpacing: '0.2em' }}>{selectedMember.employee_id}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a22', padding: '16px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#3aff6a66', margin: '0 0 8px 0', letterSpacing: '0.1em' }}>CLEARANCE LEVEL</p>
                    {(() => {
                      const cls = getClearanceStyle(selectedMember.position.clearance_level);
                      return (
                        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', padding: '6px 12px', borderRadius: '4px', color: cls.color, background: cls.bg, border: `1px solid ${cls.border}`, display: 'inline-block' }}>
                          {selectedMember.position.clearance_level}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div style={{ background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a22', padding: '16px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#3aff6a66', margin: '0 0 8px 0', letterSpacing: '0.1em' }}>ENROLLMENT DATE (UTC)</p>
                    <p style={{ fontSize: '14px', color: '#a0ffb0', margin: 0, fontFamily: 'monospace' }}>
                      {new Date(selectedMember.registered_on).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a22', padding: '16px', borderRadius: '4px', flex: 1 }}>
                  <p style={{ fontSize: '10px', color: '#3aff6a66', margin: '0 0 8px 0', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={12}/> AI ENGINE MATRICES
                  </p>
                  <p style={{ fontSize: '11px', color: '#3aff6a88', lineHeight: '1.6', wordBreak: 'break-all', opacity: 0.7 }}>
                    0x8F9A... [128-DIMENSIONAL ENCODING WITHHELD FOR SECURITY] ...3B2C
                    <br/><br/>
                    FACIAL RECOGNITION VECTORS ACTIVELY LOADED IN NODE-7 RAM. SUBJECT AUTHORIZED FOR SCANNING.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          STRICT REVOCATION CONFIRMATION MODAL
      ========================================= */}
      {revokeConfirm.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 5, 5, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          {/* ... (Revocation Modal Code remains exactly the same as before) ... */}
          <div style={{ background: '#080101', border: '2px solid #ff3a3a', boxShadow: '0 0 50px rgba(255,58,58,0.2)', padding: '40px', borderRadius: '8px', maxWidth: '550px', width: '90%', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,58,58,0.03) 4px)' }} />
            
            {revokeStatus.status === 'error' ? (
              <ShieldAlert size={64} style={{ color: '#ff3a3a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #ff3a3a)' }} />
            ) : revokeStatus.status === 'success' ? (
              <CheckCircle size={64} style={{ color: '#1aff5a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #1aff5a)' }} />
            ) : (
              <ShieldAlert size={64} style={{ color: '#ff3a3a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #ff3a3a)' }} />
            )}

            <h2 style={{ fontSize: '24px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 16px', color: '#ffcccc', textShadow: '0 0 10px rgba(255,204,204,0.5)' }}>Access Revocation Protocol</h2>
            
            {revokeStatus.status === 'idle' && (
              <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#ff9999', letterSpacing: '0.1em', marginBottom: '30px' }}>
                WARNING: You are initiating a complete biometric purge for <strong style={{ color: '#fff', textShadow: '0 0 5px #fff' }}>{revokeConfirm.agentName} (ID: {revokeConfirm.agentId})</strong>. This action is permanent and logged. The Subject will no longer be recognized by any secure nodes.
              </p>
            )}
            
            {(revokeStatus.status === 'processing' || revokeStatus.status === 'success' || revokeStatus.status === 'error') && (
              <p style={{ fontSize: '15px', lineHeight: '1.6', color: revokeStatus.status === 'success' ? '#1aff5a' : '#ff4a4a', letterSpacing: '0.1em', marginBottom: '30px', animation: revokeStatus.status === 'processing' ? 'pulse 1s infinite' : 'none' }}>
                // {revokeStatus.message}
              </p>
            )}

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {revokeStatus.status === 'idle' && (
                <>
                  <button onClick={closeRevokeModal} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 30px', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
                  <button onClick={handleFinalRevocation} style={{ background: '#ff3a3a', border: '1px solid #ff3a3a', color: '#000', padding: '12px 30px', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', boxShadow: '0 0 15px rgba(255,58,58,0.3)' }}>Execute Purge</button>
                </>
              )}
               {revokeStatus.status === 'error' && (
                 <button onClick={closeRevokeModal} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 30px', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>Close</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #1aff5a33', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#3aff6a88', marginBottom: '6px', textTransform: 'uppercase' }}>ARGUS SECURITY SYSTEMS // NODE-7</p>
          <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(160, 255, 176, 0.2)' }}>Classified Personnel Manifest</h1>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#3aff6a66', marginTop: '6px', textTransform: 'uppercase' }}>Active Biometric Profiles in Secure Database</p>
        </div>
        <div style={{ background: 'rgba(2, 10, 4, 0.6)', border: '1px solid #1aff5a44', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '10px 16px', gap: '12px', width: '300px' }}>
          <Search size={18} color="#3aff6a88" />
          <input type="text" placeholder="Search Agent Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: '#a0ffb0', fontFamily: 'monospace', fontSize: '14px', outline: 'none', width: '100%' }} />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div style={{ background: '#030805', border: '1px solid #1aff5a33', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 20px rgba(26, 255, 90, 0.03)' }}>
        <div style={{ background: 'rgba(2, 10, 4, 0.8)', borderBottom: '1px solid #1aff5a22', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#3aff6a99', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14}/> Total Agents: {isLoading ? '...' : filteredMembers.length}</span>
          <span style={{ fontSize: '10px', color: '#3aff6a44', letterSpacing: '0.2em' }}>QUERY_NODE: AGS-DB-01</span>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a77', fontSize: '13px', letterSpacing: '0.1em' }}><Fingerprint size={32} style={{ animation: 'pulse 1s infinite', margin: '0 auto 15px', display: 'block' }}/> Accessing encrypted records...</div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ff4a4a', fontSize: '13px', letterSpacing: '0.1em' }}><ShieldAlert size={32} style={{ margin: '0 auto 15px', display: 'block' }}/> {error}</div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a77', fontSize: '13px', letterSpacing: '0.1em' }}><FileText size={32} style={{ margin: '0 auto 15px', display: 'block' }}/> No agents match query parameter.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1aff5a22', textAlign: 'left' }}>
                <th style={{ ...thStyle, width: '70px' }}>Photo</th>
                <th style={thStyle}>Full Name</th>
                <th style={{ ...thStyle, width: '130px' }}>Agent ID</th>
                <th style={thStyle}>Clearance</th>
                <th style={{ ...thStyle, width: '180px' }}>Joined (UTC)</th>
                <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const cls = getClearanceStyle(member.position.clearance_level);
                const joinDate = new Date(member.registered_on);
                return (
                  <tr 
                    key={member._id} 
                    className="member-row" 
                    onClick={() => setSelectedMember(member)}
                    style={{ transition: 'background 0.2s', cursor: 'pointer' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1aff5a22', background: '#000' }}>
                        <img src={member.image_url} alt="ID" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)' }} onError={(e) => {e.target.style.display='none'; e.target.parentElement.style.background='#ff3a3a22';}}/>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{member.name.first} {member.name.last}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#3aff6a' }}>{member.employee_id}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '3px', color: cls.color, background: cls.bg, border: `1px solid ${cls.border}` }}>
                        {member.position.clearance_level}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#3aff6a88' }}>
                      {joinDate.getUTCFullYear()}-{String(joinDate.getUTCMonth()+1).padStart(2,'0')}-{String(joinDate.getUTCDate()).padStart(2,'0')} / {String(joinDate.getUTCHours()).padStart(2,'0')}:{String(joinDate.getUTCMinutes()).padStart(2,'0')}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {/* e.stopPropagation() prevents the row click from firing when clicking the trash can */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          initiateRevoke(member.employee_id, member.name.first, member.name.last);
                        }} 
                        style={revokeButtonStyle}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        /* Make the rows light up green when hovering */
        .member-row:hover { background: rgba(26, 255, 90, 0.08); }
      `}</style>
    </div>
  );
}

// --- Specific styles for table elements ---

const thStyle = {
  padding: '14px 20px',
  color: '#3aff6a88',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: '10px',
  fontWeight: 'normal'
};

const tdStyle = {
  padding: '12px 20px',
  borderBottom: '1px solid #1aff5a11',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const revokeButtonStyle = {
  background: 'rgba(255, 58, 58, 0.1)',
  border: '1px solid rgba(255, 58, 58, 0.4)',
  color: '#ff3a3a',
  padding: '8px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};