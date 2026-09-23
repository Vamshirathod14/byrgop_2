import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { staffAuth, visitorApi } from '../lib/api.js';
import Field from '../components/Field.jsx';

function fmtDateLong(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const date = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function LoginView({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const data = await visitorApi.staffLogin(email.trim(), password);
      staffAuth.setToken(data.token);
      const me = await visitorApi.staffMe();
      onAuthed(me.admin);
    } catch (error) {
      setErr(error.message);
      staffAuth.clearToken();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="card">
        <h2 className="success-title" style={{ textAlign: 'left', fontSize: 18 }}>
          Event Staff Sign In
        </h2>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 16px' }}>
          Sign in to scan visitor QR codes and mark attendance.
        </p>
        <Field label="Email" required>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="admin@byrgop.com"
          />
        </Field>
        <Field label="Password" required>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        {err && <div className="banner error">{err}</div>}
        <button className="btn btn-blue btn-lg" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
      <p className="footer-note">The check-in flow still requires staff authentication.</p>
    </form>
  );
}

function ScannerView({ cameraOn, cameraBusy, startCamera, onManualSubmit, onLogout, staff }) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState('');

  return (
    <div className="card checkin-scanner">
      <div className="row row-between">
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          {staff ? `Staff: ${staff.name || 'Staff'}` : 'Staff'} ·{' '}
          <button type="button" className="link-button" onClick={onLogout}>
            Log out
          </button>
        </p>
      </div>

      <p className="sub-label">
        Scan the visitor QR code to view their details and mark attendance.
      </p>

      <div className="camera-wrap">
        <div className="camera-frame" id="qr-reader" />
        {!cameraOn && !cameraBusy && (
          <div className="camera-overlay">
            <div className="scan-icon" aria-hidden="true">
              ◉
            </div>
            <button type="button" className="btn btn-blue btn-lg" onClick={startCamera}>
              Start Camera Scan
            </button>
            <button type="button" className="link-button" style={{ marginTop: 12 }} onClick={() => setManualOpen((v) => !v)}>
              {manualOpen ? 'Hide manual entry' : 'Scan failed? Enter code manually'}
            </button>
            {manualOpen && (
              <div style={{ marginTop: 14, textAlign: 'left' }}>
                <Field label="QR token" htmlFor="manual-token">
                  <div className="row">
                    <input
                      id="manual-token"
                      className="input scan-token-input"
                      value={manual}
                      onChange={(e) => setManual(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && manual.trim() && onManualSubmit(manual)}
                      placeholder="Paste the QR token"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button type="button" className="btn btn-blue" style={{ padding: '12px 16px' }} disabled={!manual.trim()} onClick={() => onManualSubmit(manual)}>
                      Look up
                    </button>
                  </div>
                </Field>
              </div>
            )}
          </div>
        )}
        {cameraBusy && (
          <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            Starting camera…
          </p>
        )}
      </div>

      {cameraOn && (
        <p className="text-center muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          Point the camera at the visitor QR code.
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '—'}</div>
    </div>
  );
}

export default function CheckInScreen() {
  const [staff, setStaff] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | resolving | detail | success | error
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [token, setToken] = useState('');
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState(null);
  const [alreadyAt, setAlreadyAt] = useState(null);
  const [attendedAt, setAttendedAt] = useState(null);
  const scannerRef = useRef(null);
  const resolveRef = useRef(null);

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    setCameraBusy(false);
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* camera already released */
      }
    }
  }, []);

  // resolveRef is assigned every render so scanner callbacks (created once)
  // always invoke the latest resolve logic without stale closure issues.
  const resolveToken = async (raw) => {
    const value = (raw || '').trim();
    if (!value) return;
    setPhase('resolving');
    setError(null);
    setMarkError(null);
    setAlreadyAt(null);
    setAttendedAt(null);
    try {
      const data = await visitorApi.qrInfo(value);
      setToken(value);
      setVisitor(data.visitor || data);
      setPhase('detail');
    } catch (err) {
      setVisitor(null);
      setError(err.message);
      setPhase('error');
    }
  };
  resolveRef.current = resolveToken;

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraOn(false);
    const el = document.getElementById('qr-reader');
    if (!el) {
      setCameraBusy(false);
      return;
    }
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (text) => {
          stopCamera();
          resolveRef.current(text);
        },
        () => {}
      );
      setCameraOn(true);
    } catch (e) {
      scannerRef.current = null;
      setCameraOn(false);
      setError(`Camera unavailable: ${e?.message || 'could not start the camera'}`);
    } finally {
      setCameraBusy(false);
    }
  }, [stopCamera]);

  // Auto-start the camera whenever the screen is idle (fresh mount, after
  // login, or after "Scan Next Visitor"). Errors leave phase 'error' so the
  // scanner does not loop.
  useEffect(() => {
    if (!authed || phase !== 'idle' || cameraOn || cameraBusy) return;
    let cancelled = false;
    (async () => {
      await wait(300);
      if (cancelled) return;
      setCameraBusy(true);
      try {
        await startCamera();
      } catch {
        /* handled inside startCamera */
      } finally {
        if (!cancelled) setCameraBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, phase, cameraOn, cameraBusy]);

  // Release the camera whenever this screen unmounts.
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const resetFlow = useCallback(() => {
    stopCamera();
    setToken('');
    setVisitor(null);
    setError(null);
    setMarkError(null);
    setMarking(false);
    setAlreadyAt(null);
    setAttendedAt(null);
    setPhase('idle');
  }, [stopCamera]);

  const handleLogout = () => {
    staffAuth.clearToken();
    stopCamera();
    setStaff(null);
    setAuthed(false);
    setVisitor(null);
    setError(null);
    setMarkError(null);
    setAttendedAt(null);
    setAlreadyAt(null);
    setPhase('idle');
  };

  const markAttendance = async () => {
    if (!visitor || !token) return;
    setMarking(true);
    setMarkError(null);
    setError(null);
    try {
      const data = await visitorApi.markAttendance(token);
      const v = data.visitor || visitor;
      setVisitor(v);
      if (data.status === 'already') {
        setAlreadyAt(data.attendedAt || v.attendedAt);
      } else {
        setAttendedAt(data.attendedAt || v.attendedAt);
        setPhase('success');
        stopCamera();
      }
    } catch (err) {
      if (/already checked in/i.test(err.message)) {
        setAlreadyAt(visitor.attendedAt);
      } else {
        setMarkError(err.message);
      }
    } finally {
      setMarking(false);
    }
  };

  if (!authed) {
    return <LoginView onAuthed={(a) => { setStaff(a); setAuthed(true); }} />;
  }

  if (phase === 'success') {
    return (
      <div className="card text-center attendance-success">
        <div className="success-check ok">✓</div>
        <h2 className="success-title" style={{ fontSize: 22 }}>Attendance Marked</h2>
        <p className="visitor-name-lg">{visitor?.name}</p>
        <p className="muted" style={{ fontSize: 14, margin: '6px 0 0' }}>{fmtDateTime(attendedAt)}</p>
        <button type="button" className="btn btn-primary btn-lg" style={{ marginTop: 22 }} onClick={resetFlow}>
          Scan Next Visitor
        </button>
      </div>
    );
  }

  const isExpired = visitor && (visitor.qrStatus === 'expired' || (visitor.qrExpiresAt && new Date(visitor.qrExpiresAt) < new Date()));
  const isAttended = visitor?.attendanceStatus === 'attended';

  return (
    <>
      {phase === 'idle' && (
        <ScannerView
          cameraOn={cameraOn}
          cameraBusy={cameraBusy}
          startCamera={startCamera}
          onManualSubmit={resolveToken}
          onLogout={handleLogout}
          staff={staff}
        />
      )}

      {phase === 'resolving' && (
        <div className="card text-center">
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Resolving QR code…</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="card">
          {/qr code expired/i.test(error || '') ? (
            <>
              <h3 className="visit-expired-title">QR Code Expired</h3>
              <p className="muted" style={{ fontSize: 13 }}>
                This QR code is outside the event validity window (23 Sep – 1 Oct 2026).
              </p>
            </>
          ) : (
            <div className="banner error">{error}</div>
          )}
          <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={resetFlow}>
            Scan Another QR
          </button>
          <button type="button" className="link-button" style={{ marginTop: 10 }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}

      {phase === 'detail' && visitor && (
        <div className="card visit-detail">
          <h3 className="visit-name">{visitor.name}</h3>

          <div className="detail-grid" style={{ marginTop: 12 }}>
            <Detail label="Visitor Name" value={visitor.name} />
            <Detail label="Phone" value={visitor.phone} />
            <Detail label="Email" value={visitor.email || 'Not provided'} />
            <Detail label="Business" value={visitor.businessName} />
            <Detail label="Category" value={visitor.category} />
            <Detail label="Member" value={visitor.memberName} />
            <Detail label="Company" value={visitor.companyName} />
            <Detail label="QR" value={isExpired ? 'Expired' : 'Valid'} />
          </div>

          <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
            <span className={`pill ${isExpired ? 'pill-red' : 'pill-green'}`}>
              QR: {isExpired ? 'Expired' : 'Valid'}
            </span>
            <span className="muted" style={{ fontSize: 13 }}>
              Expires {fmtDateLong(visitor.qrExpiresAt)}
            </span>
          </div>

          {alreadyAt && (
            <div className="banner" style={{ background: 'var(--blue-50)', color: 'var(--blue-700)', marginTop: 16 }}>
              <strong>Already Checked In</strong>
              <div style={{ fontSize: 13, marginTop: 2 }}>Attended on: {fmtDateTime(alreadyAt)}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                The original attendance record is kept — no overwrite.
              </div>
            </div>
          )}

          {isAttended && !alreadyAt && (
            <div className="banner" style={{ background: 'var(--blue-50)', color: 'var(--blue-700)', marginTop: 16 }}>
              <strong>Already Checked In</strong>
              <div style={{ fontSize: 13, marginTop: 2 }}>Attended on: {fmtDateTime(visitor.attendedAt)}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                No further attendance record is created for this visitor.
              </div>
            </div>
          )}

          {isExpired && (
            <div className="banner error" style={{ marginTop: 16 }}>
              <strong>QR Code Expired</strong>
              <div style={{ fontSize: 13, marginTop: 2 }}>Attendance cannot be marked for an expired QR.</div>
            </div>
          )}

          {markError && <div className="banner error" style={{ marginTop: 16 }}>{markError}</div>}

          {!isExpired && !isAttended && !alreadyAt && (
            <button
              type="button"
              className="btn btn-primary btn-lg btn-mark"
              style={{ marginTop: 18 }}
              disabled={marking}
              onClick={markAttendance}
            >
              {marking ? 'Marking…' : 'Done — Mark Attendance'}
            </button>
          )}

          <div className="text-center" style={{ marginTop: 14 }}>
            <button type="button" className="link-button" onClick={resetFlow}>
              Scan a different QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}