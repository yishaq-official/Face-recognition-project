import { useState, useEffect } from 'react';
import { Upload, Camera, AlertTriangle, CheckCircle, Fingerprint, ShieldCheck, XOctagon } from 'lucide-react';

export default function Enrollment() {
  const [formData, setFormData] = useState(() => ({
    firstName: '',
    lastName: '',
    employeeId: `AGS-${Math.floor(Math.random() * 9000) + 1000}`,
    clearance: 'UNCLASSIFIED'
  }));
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, enrolling, success, error
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEnrollment = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('A verified ID photo must be uploaded.');
      return;
    }
    setStatus('enrolling');
    setMessage('Initiating Live Verification Protocol...');

    const personnelData = {
      name: { first: formData.firstName, last: formData.lastName },
      employee_id: formData.employeeId,
      position: { clearance_level: formData.clearance }
    };

    const payload = new FormData();
    payload.append('id_photo', file);
    payload.append('personnel_data', JSON.stringify(personnelData));

    try {
      console.log("[SYSTEM] Payload sent to Security Server...");
      const response = await fetch('http://localhost:5000/api/verify_and_enroll', {
        method: 'POST',
        body: payload,
      });
      
      console.log(`[SYSTEM] Raw response received: ${response.status}`);
      const data = await response.json();
      console.log("[SYSTEM] Data parsed:", data);
      
      if (response.ok) {
        console.log("[SYSTEM] Triggering Success Modal!");
        setStatus('success');
        setMessage(data.message);
        // Reset the form in the background
        setFormData({ ...formData, firstName: '', lastName: '', employeeId: `AGS-${Math.floor(Math.random() * 9000) + 1000}` });
        setFile(null);
      } else {
        console.log("[SYSTEM] Triggering Error Modal!");
        setStatus('error');
        setMessage(data.message || 'Verification failed.');
      }
    } catch (err) {
      console.error("[CRITICAL FETCH ERROR]:", err);
      setStatus('error');
      setMessage(`Connection Error: ${err.message}`);
    }
  };

  // Function to dismiss the modal and get ready for the next person
  const dismissModal = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div style={{ fontFamily: 'monospace', width: '100%', boxSizing: 'border-box', color: '#a0ffb0', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>

      {/* =========================================
          THE FULL-SCREEN ALERT MODAL
      ========================================= */}
      {(status === 'success' || status === 'error') && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(1, 5, 2, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#020a04',
            border: `2px solid ${status === 'success' ? '#1aff5a' : '#ff3a3a'}`,
            boxShadow: `0 0 40px ${status === 'success' ? 'rgba(26,255,90,0.2)' : 'rgba(255,58,58,0.2)'}`,
            padding: '40px', borderRadius: '8px', maxWidth: '500px', width: '90%', textAlign: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Modal Scanlines */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 4px)' }} />
            
            {status === 'success' ? (
              <ShieldCheck size={64} style={{ color: '#1aff5a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #1aff5a)' }} />
            ) : (
              <XOctagon size={64} style={{ color: '#ff3a3a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #ff3a3a)' }} />
            )}

            <h2 style={{ 
              fontSize: '24px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px',
              color: status === 'success' ? '#a0ffb0' : '#ff9999',
              textShadow: `0 0 10px ${status === 'success' ? 'rgba(160,255,176,0.5)' : 'rgba(255,153,153,0.5)'}`
            }}>
              {status === 'success' ? 'ENROLLMENT VERIFIED' : 'SECURITY ALERT'}
            </h2>
            
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: status === 'success' ? '#3aff6a' : '#ff4a4a', letterSpacing: '0.1em', marginBottom: '30px', position: 'relative', zIndex: 10 }}>
              {message}
            </p>

            <button onClick={dismissModal} style={{
              background: status === 'success' ? 'rgba(26,255,90,0.1)' : 'rgba(255,58,58,0.1)',
              border: `1px solid ${status === 'success' ? '#1aff5a' : '#ff3a3a'}`,
              color: status === 'success' ? '#1aff5a' : '#ff3a3a',
              padding: '12px 30px', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.2em',
              textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', position: 'relative', zIndex: 10,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.background = status === 'success' ? '#1aff5a' : '#ff3a3a';
              e.target.style.color = '#000';
            }}
            onMouseLeave={e => {
              e.target.style.background = status === 'success' ? 'rgba(26,255,90,0.1)' : 'rgba(255,58,58,0.1)';
              e.target.style.color = status === 'success' ? '#1aff5a' : '#ff3a3a';
            }}>
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #1aff5a33', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#3aff6a88', marginBottom: '6px', textTransform: 'uppercase' }}>ARGUS SECURITY SYSTEMS // NODE-7</p>
          <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(160, 255, 176, 0.2)' }}>Personnel Enrollment</h1>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#3aff6a66', marginTop: '6px', textTransform: 'uppercase' }}>Biometric Registration &amp; Live Verification Required</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', letterSpacing: '0.2em', color: '#1aff5a', padding: '4px 12px', borderRadius: '4px', background: 'rgba(26, 255, 90, 0.05)', border: '1px solid rgba(26, 255, 90, 0.4)', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(26, 255, 90, 0.1) inset' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3a3a', display: 'inline-block', animation: 'blink 1.2s infinite', boxShadow: '0 0 8px #ff3a3a' }} />
            LIVE
          </div>
          <ClockDisplay />
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>

        {/* LEFT: FORM */}
        <form onSubmit={handleEnrollment} style={{ background: '#030805', border: '1px solid #1aff5a33', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 20px rgba(26, 255, 90, 0.03)' }}>
          <div style={{ background: 'rgba(2, 10, 4, 0.8)', borderBottom: '1px solid #1aff5a22', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#3aff6a99', textTransform: 'uppercase' }}>Subject Data Entry</span>
            <span style={{ fontSize: '10px', color: '#3aff6a44', letterSpacing: '0.2em' }}>FORM-7A</span>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange}
                  style={inputStyle} onFocus={e => {e.target.style.borderColor = '#1aff5a'; e.target.style.boxShadow = '0 0 8px rgba(26,255,90,0.2)';}} onBlur={e => {e.target.style.borderColor = '#1aff5a44'; e.target.style.boxShadow = 'none';}} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange}
                  style={inputStyle} onFocus={e => {e.target.style.borderColor = '#1aff5a'; e.target.style.boxShadow = '0 0 8px rgba(26,255,90,0.2)';}} onBlur={e => {e.target.style.borderColor = '#1aff5a44'; e.target.style.boxShadow = 'none';}} />
              </div>
            </div>

            {/* ID / Clearance Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Agent ID (Auto-Gen)</label>
                <input type="text" name="employeeId" readOnly value={formData.employeeId}
                  style={{ ...inputStyle, color: '#3aff6a55', cursor: 'not-allowed', borderColor: '#1aff5a22', background: 'rgba(1, 10, 3, 0.5)' }} />
              </div>
              <div>
                <label style={labelStyle}>Clearance Level</label>
                <select name="clearance" value={formData.clearance} onChange={handleInputChange} style={inputStyle}>
                  <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                  <option value="SECRET">SECRET</option>
                  <option value="TOP SECRET">TOP SECRET</option>
                  <option value="TOP SECRET // SCI">TOP SECRET // SCI</option>
                </select>
              </div>
            </div>

            {/* Upload Zone */}
            <div>
              <label style={labelStyle}>Official ID Photo Reference</label>
              <div style={{ border: '1px dashed #1aff5a55', borderRadius: '6px', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 10, 4, 0.6)', position: 'relative', cursor: 'pointer', minHeight: '110px', transition: 'all 0.3s' }}
                onMouseEnter={e => {e.currentTarget.style.borderColor = '#1aff5a'; e.currentTarget.style.background = 'rgba(2, 10, 4, 0.9)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(26,255,90,0.05) inset';}} onMouseLeave={e => {e.currentTarget.style.borderColor = '#1aff5a55'; e.currentTarget.style.background = 'rgba(2, 10, 4, 0.6)'; e.currentTarget.style.boxShadow = 'none';}}>
                <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                {file ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle style={{ margin: '0 auto 8px', color: '#1aff5a', display: 'block', filter: 'drop-shadow(0 0 5px rgba(26,255,90,0.5))' }} size={32} />
                    <p style={{ color: '#a0ffb0', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.1em' }}>{file.name}</p>
                    <p style={{ fontSize: '10px', color: '#3aff6a77', marginTop: '4px', letterSpacing: '0.15em' }}>READY FOR VERIFICATION</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <Upload style={{ margin: '0 auto 12px', color: '#3aff6a66', display: 'block' }} size={32} />
                    <p style={{ color: '#3aff6a88', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Click or drag ID photo here</p>
                    <p style={{ fontSize: '10px', color: '#3aff6a44', marginTop: '6px', letterSpacing: '0.15em' }}>JPEG / PNG ACCEPTED</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={status === 'enrolling'} style={{
              width: '100%', background: '#1aff5a', color: '#010502', border: 'none', borderRadius: '4px',
              padding: '16px', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.25em',
              textTransform: 'uppercase', fontWeight: 'bold', cursor: status === 'enrolling' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              opacity: status === 'enrolling' ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 0 15px rgba(26, 255, 90, 0.2)'
            }}
              onMouseEnter={e => { if (status !== 'enrolling') { e.target.style.background = '#60ffaa'; e.target.style.boxShadow = '0 0 25px rgba(26, 255, 90, 0.4)'; } }}
              onMouseLeave={e => { e.target.style.background = '#1aff5a'; e.target.style.boxShadow = '0 0 15px rgba(26, 255, 90, 0.2)'; }}>
              {status === 'enrolling'
                ? <><Fingerprint size={18} style={{ animation: 'pulse 1s infinite' }} /> Verifying Live Subject...</>
                : 'Initiate Verification & Enroll'}
            </button>
          </div>
        </form>

        {/* RIGHT: LIVE FEED */}
        <div style={{ background: '#030805', border: '1px solid #1aff5a33', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 20px rgba(26, 255, 90, 0.03)' }}>
          <div style={{ background: 'rgba(2, 10, 4, 0.8)', borderBottom: '1px solid #1aff5a22', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#3aff6a99', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={14} color="#3aff6a99" /> Live Verification Feed
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FrameCounter />
              <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ff3a3a', opacity: 0.75, animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span style={{ position: 'relative', borderRadius: '50%', width: '8px', height: '8px', background: '#ff3a3a' }} />
              </span>
            </div>
          </div>

          {/* Video Area */}
          <div style={{ flex: 1, background: '#010502', position: 'relative', minHeight: '320px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="http://localhost:5000/video_feed" alt="Live Scanner"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'grayscale(1) contrast(1.2)' }} />
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1aff5a" strokeWidth="1" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.05) 4px)' }} />
            
            {/* Reticle */}
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              {[['0,0','top:0,left:0','borderTopWidth:2px,borderLeftWidth:2px'],
                ['0,0','top:0,right:0','borderTopWidth:2px,borderRightWidth:2px'],
                ['0,0','bottom:0,left:0','borderBottomWidth:2px,borderLeftWidth:2px'],
                ['0,0','bottom:0,right:0','borderBottomWidth:2px,borderRightWidth:2px']].map((_, i) => {
                  const pos = [{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }][i];
                  const borders = [{ borderTop: '2px solid rgba(26,255,90,0.8)', borderLeft: '2px solid rgba(26,255,90,0.8)' }, { borderTop: '2px solid rgba(26,255,90,0.8)', borderRight: '2px solid rgba(26,255,90,0.8)' }, { borderBottom: '2px solid rgba(26,255,90,0.8)', borderLeft: '2px solid rgba(26,255,90,0.8)' }, { borderBottom: '2px solid rgba(26,255,90,0.8)', borderRight: '2px solid rgba(26,255,90,0.8)' }][i];
                  return <div key={i} style={{ position: 'absolute', width: '25px', height: '25px', filter: 'drop-shadow(0 0 3px #1aff5a)', ...pos, ...borders }} />;
                })}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <circle cx="25" cy="25" r="22" stroke="rgba(26,255,90,0.6)" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="25" cy="25" r="2.5" fill="rgba(26,255,90,0.8)" />
                  <line x1="25" y1="10" x2="25" y2="18" stroke="rgba(26,255,90,0.8)" strokeWidth="1" />
                  <line x1="25" y1="32" x2="25" y2="40" stroke="rgba(26,255,90,0.8)" strokeWidth="1" />
                  <line x1="10" y1="25" x2="18" y2="25" stroke="rgba(26,255,90,0.8)" strokeWidth="1" />
                  <line x1="32" y1="25" x2="40" y2="25" stroke="rgba(26,255,90,0.8)" strokeWidth="1" />
                </svg>
              </div>
              <div style={{ position: 'absolute', bottom: '-24px', left: 0, right: 0, textAlign: 'center', fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a88' }}>AWAITING SUBJECT</div>
            </div>
            
            <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a88' }}>RES 1920x1080</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a88', marginTop: '4px' }}>FPS 30.00</div>
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', textAlign: 'right' }}>
              <HudClock />
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a88', marginTop: '4px' }}>CAM-01</div>
            </div>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', fontSize: '9px', letterSpacing: '0.15em', color: '#1aff5a66' }}>FACIAL RECOGNITION ACTIVE</div>
          </div>

          {/* Console Output */}
          <div style={{ padding: '16px 20px', background: 'rgba(2, 10, 4, 0.9)', borderTop: '1px solid #1aff5a22', minHeight: '120px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.8 }}>
            <p style={{ color: '#3aff6a55' }}>// SYSTEM READY</p>
            <p style={{ color: '#3aff6a55' }}>// AWAITING SUBJECT POSITIONING...</p>
            {status === 'enrolling' && (
              <p style={{ color: '#ffe066', animation: 'pulse 1s infinite' }}>
                // Extracting features from ID photo...<br />
                // Capturing live frame...<br />
                // Comparing 128-point matrices...
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 0.75; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        select option { background: #030805; color: #a0ffb0; }
      `}</style>
    </div>
  );
}

// --- Helper sub-components ---

const labelStyle = {
  display: 'block', fontSize: '10px', letterSpacing: '0.25em',
  color: '#3aff6a88', textTransform: 'uppercase', marginBottom: '8px'
};

const inputStyle = {
  width: '100%', background: 'rgba(2, 10, 4, 0.6)', border: '1px solid #1aff5a44',
  borderRadius: '4px', padding: '12px 14px', color: '#a0ffb0',
  fontFamily: 'monospace', fontSize: '14px', outline: 'none',
  transition: 'all 0.3s', boxSizing: 'border-box'
};

function ClockDisplay() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = v => String(v).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#3aff6a66' }}>{time}</div>;
}

function HudClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = v => String(v).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a88' }}>{time}</div>;
}

function FrameCounter() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 10000), 33);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontSize: '10px', color: '#3aff6a66', letterSpacing: '0.15em' }}>FRAME: {String(frame).padStart(4, '0')}</span>;
}