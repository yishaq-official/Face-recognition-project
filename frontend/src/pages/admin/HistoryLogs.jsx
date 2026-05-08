// /frontend/src/pages/admin/HistoryLogs.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Search, RefreshCw, Download, Clock,
  Shield, ChevronDown, AlertTriangle, Fingerprint, X,
} from 'lucide-react';
import { authFetch } from '../../utils/authUtils';

const CLEARANCE_OPTS = ['ALL', 'UNCLASSIFIED', 'SECRET', 'TOP SECRET', 'TOP SECRET // SCI'];
const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds

export default function HistoryLogs() {
  const [logs,          setLogs]          = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown,     setCountdown]     = useState(30);

  // Filters
  const [search,    setSearch]    = useState('');
  const [clearance, setClearance] = useState('ALL');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');

  const timerRef     = useRef(null);
  const countdownRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else         setIsRefreshing(true);
    setError(null);

    try {
      const res  = await authFetch('http://localhost:5000/api/logs?limit=100');
      if (!res.ok) throw new Error('Failed to fetch logs from security server.');
      const data = await res.json();
      setLogs(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── Auto-refresh every 30s with countdown ──────────────────────────────
  const startTimers = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? 30 : c - 1));
    }, 1000);

    timerRef.current = setInterval(() => {
      fetchLogs(true);
      setCountdown(30);
    }, AUTO_REFRESH_INTERVAL);
  }, [fetchLogs]);

  useEffect(() => {
    // Defer the initial fetch out of the synchronous effect body
    const t = setTimeout(() => {
      fetchLogs(false);
      setCountdown(30);
      startTimers();
    }, 0);

    return () => {
      clearTimeout(t);
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = () => {
    fetchLogs(true);
    setCountdown(30);
    startTimers();
  };

  // ── Filter logic ───────────────────────────────────────────────────────
  const filtered = logs.filter(log => {
    const fullName = `${log.first_name ?? ''} ${log.last_name ?? ''}`.toLowerCase();
    const id       = (log.employee_id ?? '').toLowerCase();
    const q        = search.toLowerCase();

    if (q && !fullName.includes(q) && !id.includes(q)) return false;
    if (clearance !== 'ALL' && log.clearance !== clearance)  return false;

    if (dateFrom || dateTo) {
      const ts = new Date(log.timestamp);
      if (dateFrom && ts < new Date(dateFrom))              return false;
      if (dateTo   && ts > new Date(dateTo + 'T23:59:59Z')) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearch(''); setClearance('ALL'); setDateFrom(''); setDateTo('');
  };

  const hasFilters = search || clearance !== 'ALL' || dateFrom || dateTo;

  // ── CSV Export ─────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Clearance', 'Timestamp (UTC)'];
    const rows    = filtered.map(l => [
      l.employee_id  ?? '',
      l.first_name   ?? '',
      l.last_name    ?? '',
      l.clearance    ?? '',
      l.timestamp    ?? '',
    ]);

    const csv     = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `INSA_ScanLogs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    total:     logs.length,
    today:     logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    topsecret: logs.filter(l => (l.clearance ?? '').includes('TOP')).length,
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: '#a0ffb0', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #1aff5a22', paddingBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={subLabel}>INSA — INFORMATION NETWORK SECURITY AGENCY // NODE-7</p>
          <h1 style={{ fontSize: '26px', fontWeight: 300, letterSpacing: '0.25em', color: '#a0ffb0', textTransform: 'uppercase', margin: '4px 0' }}>
            System Access Logs
          </h1>
          <p style={{ ...subLabel, marginTop: 0 }}>Biometric Scan Event History — Last 100 Entries</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Last refreshed */}
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#3aff6a44', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={11} />
            {lastRefreshed
              ? `Refreshed ${lastRefreshed.toLocaleTimeString('en-US', { hour12: false })}`
              : 'Loading...'}
            <span style={{ color: '#3aff6a22' }}>· next in {countdown}s</span>
          </div>

          {/* Refresh button */}
          <button onClick={handleManualRefresh} disabled={isRefreshing} style={actionBtn(false)}>
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>

          {/* Export CSV */}
          <button onClick={exportCSV} disabled={filtered.length === 0} style={actionBtn(true)}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </header>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Records Loaded', value: stats.total,     icon: <Activity size={16} />,    color: '#1aff5a' },
          { label: 'Scans Today',           value: stats.today,     icon: <Clock size={16} />,       color: '#60ffaa' },
          { label: 'TOP SECRET Entries',    value: stats.topsecret, icon: <Shield size={16} />,      color: '#ffe066' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#030805', border: '1px solid #1aff5a1a', borderRadius: '6px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ color, opacity: 0.7 }}>{icon}</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color, letterSpacing: '0.05em' }}>{isLoading ? '—' : value}</div>
              <div style={{ fontSize: '9px', color: '#3aff6a44', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#030805', border: '1px solid #1aff5a1a', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(2,10,4,0.8)', borderBottom: '1px solid #1aff5a11', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a66', textTransform: 'uppercase' }}>
            // Filter Controls
          </span>
          {hasFilters && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#ff3a3a88', cursor: 'pointer', fontSize: '9px', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
              <X size={11} /> Clear Filters
            </button>
          )}
        </div>

        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
          {/* Search */}
          <div>
            <label style={filterLabel}>Search by Name or ID</label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#3aff6a44', pointerEvents: 'none' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="e.g. Yishaq or INSA-12345"
                style={{ ...filterInput, paddingLeft: '32px' }}
                onFocus={e  => e.target.style.borderColor = '#1aff5a'}
                onBlur={e   => e.target.style.borderColor = '#1aff5a22'}
              />
            </div>
          </div>

          {/* Clearance */}
          <div>
            <label style={filterLabel}>Clearance Level</label>
            <div style={{ position: 'relative' }}>
              <select value={clearance} onChange={e => setClearance(e.target.value)} style={filterInput}>
                {CLEARANCE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#3aff6a44', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label style={filterLabel}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={filterInput}
              onFocus={e => e.target.style.borderColor = '#1aff5a'}
              onBlur={e  => e.target.style.borderColor = '#1aff5a22'}
            />
          </div>

          {/* Date to */}
          <div>
            <label style={filterLabel}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={filterInput}
              onFocus={e => e.target.style.borderColor = '#1aff5a'}
              onBlur={e  => e.target.style.borderColor = '#1aff5a22'}
            />
          </div>
        </div>

        {/* Filter result count */}
        {hasFilters && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #1aff5a0a', fontSize: '9px', letterSpacing: '0.15em', color: '#3aff6a55' }}>
            Showing {filtered.length} of {logs.length} records
          </div>
        )}
      </div>

      {/* ── LOG TABLE ───────────────────────────────────────────────────── */}
      <div style={{ background: '#030805', border: '1px solid #1aff5a1a', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(2,10,4,0.8)', borderBottom: '1px solid #1aff5a11', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a66', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} /> Scan Event Records
          </span>
          <span style={{ fontSize: '9px', color: '#3aff6a33', letterSpacing: '0.15em' }}>
            {isRefreshing ? <span style={{ color: '#ffe066', animation: 'pulse 1s infinite' }}>// REFRESHING...</span> : `QUERY_NODE: AGS-DB-01`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a55', fontSize: '12px', letterSpacing: '0.1em' }}>
            <Fingerprint size={28} style={{ margin: '0 auto 14px', display: 'block', animation: 'pulse 1s infinite' }} />
            Accessing encrypted records...
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ff4a4a', fontSize: '12px', letterSpacing: '0.1em' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 14px', display: 'block' }} />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#3aff6a33', fontSize: '12px', letterSpacing: '0.1em' }}>
            <Activity size={28} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
            No log entries match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1aff5a11' }}>
                  <th style={{ ...th, width: '40px' }}>#</th>
                  <th style={th}>Agent Name</th>
                  <th style={{ ...th, width: '150px' }}>Employee ID</th>
                  <th style={th}>Clearance</th>
                  <th style={{ ...th, width: '200px' }}>Timestamp (UTC)</th>
                  <th style={{ ...th, width: '90px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const ts  = new Date(log.timestamp);
                  const cls = clearanceStyle(log.clearance);
                  const isNew = i === 0 && isWithinSeconds(ts, 35);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #1aff5a08',
                        background: isNew ? 'rgba(26,255,90,0.05)' : 'transparent',
                        transition: 'background 0.2s',
                        animation: isNew ? 'rowSlide 0.3s ease-out' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,255,90,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(26,255,90,0.05)' : 'transparent'}
                    >
                      <td style={{ ...td, color: '#3aff6a22', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ ...td, color: '#fff', fontWeight: 'bold' }}>
                        {isNew && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#1aff5a', marginRight: '8px', boxShadow: '0 0 4px #1aff5a', animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
                        {log.first_name} {log.last_name}
                      </td>
                      <td style={{ ...td, color: '#3aff6a', fontFamily: 'monospace' }}>{log.employee_id}</td>
                      <td style={td}>
                        <span style={{
                          fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em',
                          padding: '3px 8px', borderRadius: '3px',
                          color: cls.color, background: cls.bg, border: `1px solid ${cls.border}`,
                        }}>
                          {log.clearance || '—'}
                        </span>
                      </td>
                      <td style={{ ...td, color: '#3aff6a77', fontSize: '11px' }}>
                        <div>{formatDate(ts)}</div>
                        <div style={{ fontSize: '10px', color: '#3aff6a44', marginTop: '2px' }}>{formatTime(ts)}</div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#1aff5a', border: '1px solid #1aff5a33', padding: '2px 8px', borderRadius: '2px', letterSpacing: '0.08em' }}>
                          GRANTED
                        </span>
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
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes rowSlide { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        select option { background:#030805; color:#a0ffb0; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(3) hue-rotate(90deg); cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const subLabel    = { fontSize: '9px', letterSpacing: '0.3em', color: '#3aff6a44', textTransform: 'uppercase', margin: 0 };
const filterLabel = { display: 'block', fontSize: '8px', letterSpacing: '0.2em', color: '#3aff6a44', textTransform: 'uppercase', marginBottom: '6px' };
const filterInput = {
  width: '100%', background: 'rgba(2,10,4,0.6)', border: '1px solid #1aff5a22',
  borderRadius: '4px', padding: '8px 10px', color: '#a0ffb0',
  fontFamily: "'Courier New', monospace", fontSize: '12px',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  appearance: 'none', WebkitAppearance: 'none',
};
const th = {
  padding: '10px 14px', color: '#3aff6a55', textTransform: 'uppercase',
  letterSpacing: '0.18em', fontSize: '9px', fontWeight: 'normal', textAlign: 'left',
};
const td = {
  padding: '11px 14px', verticalAlign: 'middle',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

const actionBtn = (primary) => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', borderRadius: '4px',
  fontFamily: "'Courier New', monospace", fontSize: '10px',
  letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
  background: primary ? 'rgba(26,255,90,0.08)' : 'transparent',
  border: `1px solid ${primary ? '#1aff5a44' : '#1aff5a22'}`,
  color: primary ? '#1aff5a' : '#3aff6a66',
  transition: 'all 0.15s',
});

const clearanceStyle = (lvl) => {
  if (!lvl)                  return { color: '#3aff6a55', bg: 'transparent',            border: '#3aff6a22' };
  if (lvl.includes('SCI'))   return { color: '#ff3a3a',   bg: 'rgba(255,58,58,0.08)',   border: '#ff3a3a44' };
  if (lvl.includes('TOP'))   return { color: '#ffe066',   bg: 'rgba(255,224,102,0.08)', border: '#ffe06644' };
  if (lvl === 'SECRET')      return { color: '#60ffaa',   bg: 'rgba(96,255,170,0.08)',  border: '#60ffaa44' };
  return                            { color: '#3aff6a88', bg: 'rgba(26,255,90,0.04)',   border: '#1aff5a22' };
};

const formatDate = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;

const formatTime = (d) =>
  `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} UTC`;

const isWithinSeconds = (date, secs) =>
  (Date.now() - date.getTime()) < secs * 1000;