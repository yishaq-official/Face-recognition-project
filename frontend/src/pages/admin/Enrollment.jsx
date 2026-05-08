// /frontend/src/pages/admin/Enrollment.jsx
import { useState } from 'react';
import {
  Upload, Camera, CheckCircle, Fingerprint, ShieldCheck, XOctagon,
  User, Dna, Briefcase, Shield, ChevronRight, ChevronLeft, Lock
} from 'lucide-react';
import { authFetch, API_BASE } from '../../utils/authUtils';

// ─── Static option lists ────────────────────────────────────────────────────
const BLOOD_TYPES    = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const EYE_COLORS     = ['Brown','Black','Hazel','Green','Blue','Gray','Amber'];
const CLEARANCE_OPTS = ['UNCLASSIFIED','SECRET','TOP SECRET','TOP SECRET // SCI'];
const DEPARTMENTS    = [
  'Cyber Operations','Signals Intelligence','Counter-Intelligence',
  'Human Intelligence','Technical Surveillance','Cryptanalysis',
  'Critical Infrastructure Protection','Internal Security','Executive Protection',
];
const RANKS = [
  'Analyst I','Analyst II','Senior Analyst',
  'Officer','Senior Officer','Chief Officer',
  'Director','Deputy Director','Director General',
];
const ACCESS_ZONE_OPTS = ['ZONE-A','ZONE-B','ZONE-C','ZONE-D','ZONE-CYBER','ZONE-SIGINT','ZONE-EXEC'];

// ─── Step definitions ───────────────────────────────────────────────────────
const STEPS = [
  { id: 'identity',  label: 'Identity',     icon: User      },
  { id: 'physical',  label: 'Physical',     icon: Dna       },
  { id: 'service',   label: 'Service',      icon: Briefcase },
  { id: 'clearance', label: 'Clearance',    icon: Shield    },
  { id: 'biometric', label: 'Biometric',    icon: Fingerprint },
];

const initialForm = () => ({
  // identity
  firstName:     '',
  lastName:      '',
  employeeId:    `INSA-${Math.floor(Math.random() * 90000) + 10000}`,
  sex:           'Male',
  dateOfBirth:   '',

  // physical
  bloodType:     'O+',
  heightCm:      '',
  weightKg:      '',
  eyeColor:      'Brown',
  distinguishingMarks: '',

  // service
  rank:             '',
  jobTitle:         '',
  department:       DEPARTMENTS[0],
  unit:             '',
  postingLocation:  'Addis Ababa HQ',
  dateJoinedService:'',
  accessZones:      [],

  // clearance
  clearance: 'UNCLASSIFIED',
});

export default function Enrollment() {
  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState(initialForm);
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status,     setStatus]     = useState('idle');   // idle | enrolling | success | error
  const [message,    setMessage]    = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleZone = (zone) => {
    setForm(f => ({
      ...f,
      accessZones: f.accessZones.includes(zone)
        ? f.accessZones.filter(z => z !== zone)
        : [...f.accessZones, zone],
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleEnrollment = async () => {
    if (!file) { setStatus('error'); setMessage('An official ID photo must be uploaded.'); return; }
    setStatus('enrolling');
    setMessage('Initiating biometric verification protocol...');

    const personnelData = {
      employee_id: form.employeeId,
      name: { first: form.firstName, last: form.lastName },
      personal: {
        sex:                  form.sex,
        date_of_birth:        form.dateOfBirth,
        blood_type:           form.bloodType,
        height_cm:            parseInt(form.heightCm) || 0,
        weight_kg:            parseInt(form.weightKg) || 0,
        eye_color:            form.eyeColor,
        distinguishing_marks: form.distinguishingMarks,
      },
      service: {
        rank:              form.rank,
        job_title:         form.jobTitle,
        department:        form.department,
        unit:              form.unit,
        posting_location:  form.postingLocation,
        date_joined_service: form.dateJoinedService,
        access_zones:      form.accessZones,
      },
      position: { clearance_level: form.clearance },
    };

    const payload = new FormData();
    payload.append('id_photo', file);
    payload.append('personnel_data', JSON.stringify(personnelData));

    try {
      const res  = await authFetch(`${API_BASE}/api/verify_and_enroll`, { method: 'POST', body: payload });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setForm(initialForm());
        setFile(null);
        setPreviewUrl(null);
        setStep(0);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Connection Error: ${err.message}`);
    }
  };

  const dismiss = () => { setStatus('idle'); setMessage(''); };

  const canAdvance = () => {
    if (step === 0) return form.firstName && form.lastName && form.dateOfBirth;
    if (step === 2) return form.rank && form.jobTitle && form.unit;
    if (step === 4) return !!file;
    return true;
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: '#a0ffb0', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Result modal ─────────────────────────────────────────────────── */}
      {(status === 'success' || status === 'error') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(1,5,2,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: '#020a04', border: `2px solid ${status === 'success' ? '#1aff5a' : '#ff3a3a'}`,
            boxShadow: `0 0 40px ${status === 'success' ? 'rgba(26,255,90,0.15)' : 'rgba(255,58,58,0.15)'}`,
            padding: '40px', borderRadius: '8px', maxWidth: '480px', width: '90%', textAlign: 'center',
          }}>
            {status === 'success'
              ? <ShieldCheck size={60} style={{ color: '#1aff5a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #1aff5a)' }} />
              : <XOctagon   size={60} style={{ color: '#ff3a3a', margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px #ff3a3a)' }} />}
            <h2 style={{ fontSize: '22px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px', color: status === 'success' ? '#a0ffb0' : '#ff9999' }}>
              {status === 'success' ? 'ENROLLMENT VERIFIED' : 'SECURITY ALERT'}
            </h2>
            <p style={{ fontSize: '13px', lineHeight: '1.7', color: status === 'success' ? '#3aff6a' : '#ff4a4a', letterSpacing: '0.08em', marginBottom: '28px' }}>{message}</p>
            <button onClick={dismiss} style={modalBtnStyle(status === 'success')}>ACKNOWLEDGE</button>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #1aff5a22', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={subLabel}>INSA — INFORMATION NETWORK SECURITY AGENCY // NODE-7</p>
          <h1 style={{ fontSize: '28px', fontWeight: 300, letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', margin: '4px 0' }}>
            Personnel Enrollment
          </h1>
          <p style={{ ...subLabel, marginTop: 0 }}>Biometric Registration &amp; Live Verification Required</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', letterSpacing: '0.2em', color: '#1aff5a', padding: '5px 12px', border: '1px solid rgba(26,255,90,0.35)', borderRadius: '4px', background: 'rgba(26,255,90,0.04)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff3a3a', display: 'inline-block', boxShadow: '0 0 6px #ff3a3a', animation: 'blink 1.2s infinite' }} />
          LIVE
        </div>
      </header>

      {/* ── Step indicator ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1aff5a22' }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active   = i === step;
          const complete = i < step;
          return (
            <div key={s.id} style={{
              flex: 1, padding: '10px 8px', textAlign: 'center',
              background: active ? 'rgba(26,255,90,0.1)' : complete ? 'rgba(26,255,90,0.04)' : 'transparent',
              borderRight: i < STEPS.length - 1 ? '1px solid #1aff5a22' : 'none',
              cursor: complete ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }} onClick={() => complete && setStep(i)}>
              <Icon size={16} style={{ margin: '0 auto 4px', color: active ? '#1aff5a' : complete ? '#3aff6a88' : '#3aff6a33', display: 'block' }} />
              <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: active ? '#1aff5a' : complete ? '#3aff6a66' : '#3aff6a33', textTransform: 'uppercase' }}>{s.label}</div>
              {complete && <div style={{ width: '16px', height: '1px', background: '#1aff5a44', margin: '4px auto 0' }} />}
            </div>
          );
        })}
      </div>

      {/* ── Main grid: form + live feed ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

        {/* LEFT — form panel */}
        <div style={panel}>
          <PanelHeader left={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`} right={`FORM-INSA-${step + 1}A`} />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── STEP 0: Identity ── */}
            {step === 0 && <>
              <Row>
                <Field label="First Name">
                  <input style={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                </Field>
                <Field label="Last Name">
                  <input style={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
                </Field>
              </Row>
              <Row>
                <Field label="Agent ID (Auto)">
                  <input style={{ ...inp, color: '#3aff6a44', cursor: 'not-allowed' }} value={form.employeeId} readOnly />
                </Field>
                <Field label="Sex">
                  <select style={inp} value={form.sex} onChange={e => set('sex', e.target.value)}>
                    {['Male','Female','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </Row>
              <Field label="Date of Birth">
                <input style={inp} type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
              </Field>
            </>}

            {/* ── STEP 1: Physical Description ── */}
            {step === 1 && <>
              <Row>
                <Field label="Blood Type">
                  <select style={inp} value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                    {BLOOD_TYPES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Eye Color">
                  <select style={inp} value={form.eyeColor} onChange={e => set('eyeColor', e.target.value)}>
                    {EYE_COLORS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Height (cm)">
                  <input style={inp} type="number" min="100" max="250" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} placeholder="e.g. 175" />
                </Field>
                <Field label="Weight (kg)">
                  <input style={inp} type="number" min="30" max="200" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} placeholder="e.g. 72" />
                </Field>
              </Row>
              <Field label="Distinguishing Marks / Notes">
                <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={form.distinguishingMarks} onChange={e => set('distinguishingMarks', e.target.value)} placeholder="Scars, tattoos, birthmarks — or 'None'" />
              </Field>
            </>}

            {/* ── STEP 2: Service & Assignment ── */}
            {step === 2 && <>
              <Row>
                <Field label="Rank">
                  <select style={inp} value={form.rank} onChange={e => set('rank', e.target.value)}>
                    <option value="">— Select —</option>
                    {RANKS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Job Title">
                  <input style={inp} value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. Cyber Intelligence Analyst" />
                </Field>
              </Row>
              <Row>
                <Field label="Department">
                  <select style={inp} value={form.department} onChange={e => set('department', e.target.value)}>
                    {DEPARTMENTS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Unit Designation">
                  <input style={inp} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g. SIGINT-ET-04" />
                </Field>
              </Row>
              <Row>
                <Field label="Posting Location">
                  <input style={inp} value={form.postingLocation} onChange={e => set('postingLocation', e.target.value)} placeholder="e.g. Addis Ababa HQ" />
                </Field>
                <Field label="Date Joined Service">
                  <input style={inp} type="date" value={form.dateJoinedService} onChange={e => set('dateJoinedService', e.target.value)} />
                </Field>
              </Row>
            </>}

            {/* ── STEP 3: Clearance & Access Zones ── */}
            {step === 3 && <>
              <Field label="Clearance Level">
                <select style={inp} value={form.clearance} onChange={e => set('clearance', e.target.value)}>
                  {CLEARANCE_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Access Zones — select all that apply">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {ACCESS_ZONE_OPTS.map(zone => {
                    const on = form.accessZones.includes(zone);
                    return (
                      <button key={zone} type="button" onClick={() => toggleZone(zone)} style={{
                        padding: '6px 12px', fontSize: '10px', letterSpacing: '0.15em',
                        fontFamily: "'Courier New', monospace", cursor: 'pointer', borderRadius: '3px',
                        border: `1px solid ${on ? '#1aff5a' : '#1aff5a33'}`,
                        background: on ? 'rgba(26,255,90,0.12)' : 'transparent',
                        color: on ? '#1aff5a' : '#3aff6a55',
                        transition: 'all 0.15s',
                      }}>
                        {on && <CheckCircle size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                        {zone}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Live clearance badge preview */}
              {form.clearance && (
                <div style={{ marginTop: '4px', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px dashed #1aff5a22', borderRadius: '4px' }}>
                  <p style={subLabel}>Preview</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={14} color={clearanceColor(form.clearance)} />
                    <span style={{
                      fontSize: '11px', letterSpacing: '0.12em', fontWeight: 'bold',
                      color: clearanceColor(form.clearance),
                      padding: '4px 10px', border: `1px solid ${clearanceColor(form.clearance)}66`,
                      background: `${clearanceColor(form.clearance)}11`, borderRadius: '3px',
                    }}>{form.clearance}</span>
                  </div>
                </div>
              )}
            </>}

            {/* ── STEP 4: Biometric Upload + Submit ── */}
            {step === 4 && <>
              <Field label="Official ID Photo Reference">
                <div style={{
                  border: '1px dashed #1aff5a44', borderRadius: '6px', padding: file ? '14px' : '28px 14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(2,10,4,0.5)', position: 'relative', cursor: 'pointer', minHeight: '100px',
                }}>
                  <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 5 }} />
                  {previewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                      <div style={{ width: '64px', height: '80px', border: '1px solid #1aff5a66', borderRadius: '3px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) contrast(1.2)' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#1aff5a', animation: 'scan 2s infinite linear' }} />
                      </div>
                      <div>
                        <p style={{ color: '#a0ffb0', fontSize: '12px', marginBottom: '4px' }}>{file.name}</p>
                        <p style={{ fontSize: '10px', color: '#1aff5a', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.12em' }}>
                          <CheckCircle size={11} /> HASH VERIFIED
                        </p>
                        <p style={{ fontSize: '9px', color: '#3aff6a44', marginTop: '5px' }}>CLICK TO REPLACE</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                      <Upload size={28} style={{ margin: '0 auto 10px', color: '#3aff6a44', display: 'block' }} />
                      <p style={{ color: '#3aff6a66', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Click or drag ID photo here</p>
                      <p style={{ fontSize: '9px', color: '#3aff6a33', marginTop: '4px' }}>JPEG / PNG ACCEPTED</p>
                    </div>
                  )}
                </div>
              </Field>

              {/* Summary card */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1aff5a22', borderRadius: '4px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={subLabel}>Enrollment Summary</p>
                {[
                  ['Agent',      `${form.firstName} ${form.lastName}`],
                  ['ID',         form.employeeId],
                  ['Rank',       form.rank || '—'],
                  ['Department', form.department],
                  ['Clearance',  form.clearance],
                  ['Zones',      form.accessZones.join(', ') || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid #1aff5a11', paddingBottom: '4px' }}>
                    <span style={{ color: '#3aff6a55', letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ color: '#a0ffb0' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleEnrollment} disabled={status === 'enrolling' || !file} style={{
                width: '100%', background: '#1aff5a', color: '#010502', border: 'none', borderRadius: '4px',
                padding: '14px', fontFamily: "'Courier New', monospace", fontSize: '12px',
                letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 'bold',
                cursor: (status === 'enrolling' || !file) ? 'not-allowed' : 'pointer',
                opacity: (status === 'enrolling' || !file) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}>
                {status === 'enrolling'
                  ? <><Fingerprint size={16} style={{ animation: 'pulse 1s infinite' }} /> Verifying Live Subject...</>
                  : 'Initiate Verification & Enroll'}
              </button>
            </>}

            {/* ── Navigation buttons ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={navBtn(false, step === 0)}>
                <ChevronLeft size={14} /> BACK
              </button>
              {step < STEPS.length - 1 && (
                <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={navBtn(true, !canAdvance())}>
                  NEXT <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — live feed */}
        <div style={{ ...panel, display: 'flex', flexDirection: 'column' }}>
          <PanelHeader left={<><Camera size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Live Verification Feed</>} right={<FrameCounter />} />
          <div style={{ flex: 1, background: '#010502', position: 'relative', minHeight: '280px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={`${API_BASE}/video_feed`} alt="Live Scanner"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'grayscale(1) contrast(1.2)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.04) 4px)', pointerEvents: 'none' }} />
            {status === 'enrolling' && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#ffe066', boxShadow: '0 0 16px #ffe066', animation: 'scanFast 1.5s infinite linear', zIndex: 10 }} />
            )}
            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: 10, left: 10, width: '20px', height: '20px', borderTop: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: '20px', height: '20px', borderTop: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: '20px', height: '20px', borderBottom: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: '20px', height: '20px', borderBottom: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' }} />
            {/* Reticle */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: status === 'enrolling' ? 'spin 2s linear infinite' : 'none' }}>
                <circle cx="30" cy="30" r="26" stroke={status === 'enrolling' ? '#ffe066' : 'rgba(26,255,90,0.5)'} strokeWidth="1" strokeDasharray="4 6" />
                <circle cx="30" cy="30" r="3" fill={status === 'enrolling' ? '#ffe066' : 'rgba(26,255,90,0.8)'} />
              </svg>
            </div>
            <div style={{ position: 'absolute', bottom: '14px', left: '14px', fontSize: '9px', letterSpacing: '0.15em', color: '#1aff5a55' }}>FACIAL RECOGNITION ACTIVE</div>
          </div>

          <div style={{ padding: '14px 18px', background: 'rgba(2,10,4,0.9)', borderTop: '1px solid #1aff5a1a', minHeight: '90px', fontSize: '11px', lineHeight: 2, color: '#3aff6a55' }}>
            <div>// INSA BIOMETRIC NODE-7 — READY</div>
            <div>// STEP: {STEPS[step].label.toUpperCase()}</div>
            {status === 'enrolling' && (
              <div style={{ color: '#ffe066', animation: 'pulse 1s infinite' }}>
                // Extracting features from ID photo...<br />
                // Comparing 128-point matrices...
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scan     { 0%{top:0} 50%{top:100%} 100%{top:0} }
        @keyframes scanFast { 0%{top:0} 50%{top:100%} 100%{top:0} }
        @keyframes spin     { 100%{transform:rotate(360deg)} }
        select option { background:#030805; color:#a0ffb0; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(90deg); cursor:pointer; }
      `}</style>
    </div>
  );
}

// ─── Shared style helpers ────────────────────────────────────────────────────
const subLabel = { fontSize: '9px', letterSpacing: '0.3em', color: '#3aff6a55', textTransform: 'uppercase', marginBottom: '4px', marginTop: 0 };
const panel    = { background: '#030805', border: '1px solid #1aff5a22', borderRadius: '8px', overflow: 'hidden' };
const inp      = { width: '100%', background: 'rgba(2,10,4,0.6)', border: '1px solid #1aff5a33', borderRadius: '4px', padding: '10px 12px', color: '#a0ffb0', fontFamily: "'Courier New', monospace", fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

const clearanceColor = (lvl) => {
  if (lvl?.includes('SCI')) return '#ff3a3a';
  if (lvl?.includes('TOP')) return '#ffe066';
  if (lvl === 'SECRET')     return '#60ffaa';
  return '#3aff6a88';
};

const navBtn = (primary, disabled) => ({
  padding: '8px 18px', fontFamily: "'Courier New', monospace", fontSize: '10px',
  letterSpacing: '0.2em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
  borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px',
  opacity: disabled ? 0.3 : 1, transition: 'all 0.15s',
  background: primary ? 'rgba(26,255,90,0.08)' : 'transparent',
  border: `1px solid ${primary ? '#1aff5a44' : '#1aff5a22'}`,
  color: primary ? '#1aff5a' : '#3aff6a66',
});

const modalBtnStyle = (success) => ({
  background: success ? 'rgba(26,255,90,0.1)' : 'rgba(255,58,58,0.1)',
  border: `1px solid ${success ? '#1aff5a' : '#ff3a3a'}`,
  color: success ? '#1aff5a' : '#ff3a3a',
  padding: '10px 28px', fontFamily: "'Courier New', monospace", fontSize: '12px',
  letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px',
});

function PanelHeader({ left, right }) {
  return (
    <div style={{ background: 'rgba(2,10,4,0.8)', borderBottom: '1px solid #1aff5a1a', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#3aff6a77', textTransform: 'uppercase' }}>{left}</span>
      <span style={{ fontSize: '9px', color: '#3aff6a33', letterSpacing: '0.2em' }}>{right}</span>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a66', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function FrameCounter() {
  const [f, setF] = useState(0);
  useEffect(() => { const id = setInterval(() => setF(n => (n + 1) % 10000), 33); return () => clearInterval(id); }, []);
  return <span style={{ fontSize: '9px', color: '#3aff6a44', letterSpacing: '0.15em' }}>FRAME {String(f).padStart(4,'0')}</span>;
}