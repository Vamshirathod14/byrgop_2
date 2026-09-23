import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { safePngName } from '../lib/validate.js';

function useQrDataUrls(tokens) {
  const [map, setMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = {};
      for (const t of tokens) {
        if (cancelled) return;
        try {
          next[t] = await QRCode.toDataURL(t, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 300,
            color: { dark: '#20242c', light: '#ffffff' },
          });
        } catch {
          next[t] = '';
        }
      }
      if (!cancelled) setMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [tokens.join('|')]);

  return map;
}

function downloadQr(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function SuccessScreen({ registration, onDone }) {
  const visitors = registration?.visitors || [];
  const tokens = visitors.map((v) => v.qrToken);
  const qrMap = useQrDataUrls(tokens);

  return (
    <>
      <div className="card text-center">
        <div className="success-check">✓</div>
        <h2 className="success-title">Registration Successful</h2>
        <p className="success-sub">
          {visitors.length} {visitors.length === 1 ? 'visitor' : 'visitors'} registered via{' '}
          <strong>{registration.memberName}</strong> · {registration.companyName}
        </p>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Registration ID: <strong>{registration.registrationId}</strong>
        </p>
      </div>

      <div className="card">
        {visitors.map((v) => {
          const safe = safePngName(v.name);
          const filename = `BYRGOP-Visitor-${safe}.png`;
          const dataUrl = qrMap[v.qrToken];
          return (
            <div key={v.visitorId} className="qr-card" style={{ marginBottom: 14 }}>
              {dataUrl ? (
                <img className="qr" src={dataUrl} alt={`QR code for ${v.name}`} />
              ) : (
                <div className="scan-box">Generating QR…</div>
              )}
              <div className="qr-name">{v.name}</div>
              <p className="qr-meta">
                {v.businessName} · {v.category}
                {v.email ? ' · QR emailed to ' + v.email : ''}
              </p>
              <button
                type="button"
                className="btn btn-blue"
                style={{ padding: '10px 16px', fontSize: 13 }}
                disabled={!dataUrl}
                onClick={() => downloadQr(dataUrl, filename)}
              >
                Download QR
              </button>
            </div>
          );
        })}
      </div>

      <div className="card text-center">
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Please save your QR code(s) — you will need them for check-in at the venue.
          {!visitors.some((v) => v.email) && ' No email was provided, so no QR was sent by mail.'}
        </p>
        <button type="button" className="btn btn-primary btn-lg" onClick={onDone}>
          Register Another Visitor
        </button>
      </div>
    </>
  );
}