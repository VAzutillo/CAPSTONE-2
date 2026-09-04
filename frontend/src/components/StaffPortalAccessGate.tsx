import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

/** Injected here so keyframes always load (prebuilt Tailwind index.css omits many utilities). */
const STAFF_PORTAL_STYLES = `
@keyframes staff-portal-aurora-drift {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(-4%, 3%) rotate(4deg) scale(1.09); }
}
@keyframes staff-portal-dots-breathe {
  0%, 100% { opacity: 0.48; }
  50% { opacity: 0.88; }
}
@keyframes staff-portal-shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.staff-portal-shell { position: relative; isolation: isolate; overflow: visible; background-color: #f2f2f6; }
.staff-portal-bg-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.staff-portal-aurora {
  position: absolute;
  inset: -30%;
  opacity: 0.92;
  background:
    radial-gradient(ellipse 72% 52% at 12% 30%, rgba(95, 125, 255, 0.26), transparent 55%),
    radial-gradient(ellipse 68% 50% at 86% 60%, rgba(210, 170, 255, 0.2), transparent 52%),
    radial-gradient(ellipse 52% 44% at 50% 95%, rgba(100, 190, 220, 0.18), transparent 48%);
  animation: staff-portal-aurora-drift 20s ease-in-out infinite alternate;
}
.staff-portal-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.035) 1px, transparent 0);
  background-size: 24px 24px;
  animation: staff-portal-dots-breathe 9s ease-in-out infinite;
}
.staff-portal-shimmer {
  position: absolute;
  inset: 0;
  opacity: 0.7;
  background: linear-gradient(
    118deg,
    transparent 0%,
    transparent 38%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 63%,
    transparent 100%
  );
  background-size: 240% 240%;
  animation: staff-portal-shimmer 14s ease-in-out infinite;
}
.staff-portal-content { position: relative; z-index: 1; }
@media (prefers-reduced-motion: reduce) {
  .staff-portal-aurora,
  .staff-portal-dots,
  .staff-portal-shimmer {
    animation: none !important;
  }
  .staff-portal-dots { opacity: 0.55; }
}
`.trim();

/** Temporary static codes — replace with secure distribution in production. */
export const STAFF_PORTAL_CODES: Record<'admin' | 'program_head' | 'super_admin', string> = {
  admin: '0001',
  program_head: '0002',
  super_admin: '0003',
};

const PORTAL_META: Record<keyof typeof STAFF_PORTAL_CODES, { kicker: string; headline: string; detail: string }> = {
  admin: {
    kicker: 'Faculty access',
    headline: 'Professor portal',
    detail: 'Enter the code you were given to open the sign-in page.',
  },
  program_head: {
    kicker: 'Leadership access',
    headline: 'Program head portal',
    detail: 'Enter the code you were given to open the sign-in page.',
  },
  super_admin: {
    kicker: 'System access',
    headline: 'Administration',
    detail: 'Enter the code you were given to open the sign-in page.',
  },
};

function storageKeys(portal: keyof typeof STAFF_PORTAL_CODES) {
  return {
    granted: `staff_portal_granted_${portal}`,
    fails: `staff_portal_fails_${portal}`,
    locked: `staff_portal_locked_${portal}`,
  };
}

type Props = {
  portal: keyof typeof STAFF_PORTAL_CODES;
  children: React.ReactNode;
};

/** ~25–32% viewport on desktop, full width cap — matches reference proportions */
const COLUMN =
  'w-full max-w-[min(17.5rem,86vw)] sm:max-w-[min(18.5rem,32vw)] lg:max-w-[min(19rem,28vw)]';

const inputBtnClass =
  'h-12 w-full rounded-full border border-[#E0E0E0] bg-white text-center font-mono text-lg font-medium tracking-[0.42em] text-neutral-900 transition-colors placeholder:text-neutral-900 placeholder:opacity-25 focus:border-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/8';

export function StaffPortalAccessGate({ portal, children }: Props) {
  const navigate = useNavigate();
  const keys = storageKeys(portal);
  const correctCode = STAFF_PORTAL_CODES[portal];
  const meta = PORTAL_META[portal];
  const inputRef = useRef<HTMLInputElement>(null);

  const [granted, setGranted] = useState(() => sessionStorage.getItem(keys.granted) === '1');
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(() => Number(sessionStorage.getItem(keys.fails) || '0'));

  useEffect(() => {
    if (sessionStorage.getItem(keys.locked) === '1') {
      toast.error('You are not allowed in that area.');
      navigate('/', { replace: true });
    }
  }, [portal, navigate, keys.locked]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = codeInput.replace(/\D/g, '').slice(0, 4);
    if (normalized !== correctCode) {
      const next = failCount + 1;
      setFailCount(next);
      sessionStorage.setItem(keys.fails, String(next));

      if (next >= 2) {
        sessionStorage.setItem(keys.locked, '1');
        toast.error('You are not allowed in that area.');
        navigate('/', { replace: true });
        return;
      }

      setError('That code does not match.');
      setCodeInput('');
      inputRef.current?.focus();
      return;
    }

    sessionStorage.setItem(keys.granted, '1');
    sessionStorage.removeItem(keys.fails);
    setGranted(true);
    setCodeInput('');
  };

  if (granted) {
    return <>{children}</>;
  }

  return (
    <div className="staff-portal-shell min-h-[100dvh] w-full">
      <style dangerouslySetInnerHTML={{ __html: STAFF_PORTAL_STYLES }} />
      <div className="staff-portal-bg-clip" aria-hidden>
        <div className="staff-portal-aurora" />
        <div className="staff-portal-dots" />
        <div className="staff-portal-shimmer" />
      </div>
      <div className="staff-portal-content flex min-h-[100dvh] w-full items-center justify-center px-5 py-12">
        <div
          className={`${COLUMN} flex flex-col items-center justify-center text-center rounded-2xl`}
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 24,
            paddingTop: 14,
            paddingBottom: 27,
            paddingLeft: 27,
            paddingRight: 27,
            boxShadow:
              '0 2px 4px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.1), 0 20px 44px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          <Lock className="h-6 w-6 mb-[13px] text-black" strokeWidth={1.35} aria-hidden />

          <p className="mt-7 text-[14px] font-normal leading-none text-neutral-900">{meta.kicker}</p>
          <h1 className="mt-2 mb-[22px] text-[1.375rem] font-bold leading-tight tracking-tight text-black sm:text-2xl [box-sizing:content-box]">
            {meta.headline}
          </h1>
          <p className="mt-2 mb-[13px] max-w-[16.5rem] text-[13px] leading-[1.5] text-[#666666]">{meta.detail}</p>

          <form onSubmit={handleVerify} className="mt-9 w-full">
            <div className="flex w-full flex-col gap-2 pt-0">
              <label htmlFor={`access-code-${portal}`} className="sr-only">
                Access code
              </label>
              <input
                ref={inputRef}
                id={`access-code-${portal}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`${inputBtnClass} mb-[14px] px-2 pt-0`}
                aria-invalid={!!error}
                aria-describedby={error ? `code-error-${portal}` : undefined}
              />
              <button
                type="submit"
                className="h-12 w-full mb-4 rounded-full bg-[#050505] text-[15px] font-semibold text-[#f7f7f7] transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.995]"
              >
                Continue
              </button>
            </div>
            {error && (
              <p id={`code-error-${portal}`} className="mt-3 text-[13px] text-[#555555]" role="alert">
                {error}
              </p>
            )}
          </form>

          <p className="mt-[15px] mb-[15px] flex flex-col items-center justify-center pt-0 max-w-[17.5rem] text-[11px] leading-relaxed text-[#888888]">
            After two wrong codes you&apos;ll be returned to the student sign-in for this browser session.
          </p>
        </div>
      </div>
    </div>
  );
}
