import React, { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { API_BASE_URL, FRONTEND_BASE_URL } from '../../config';

const buildInviteLink = (token: string, fallbackLink?: string) => {
  if (!token) return fallbackLink || null;
  return `${FRONTEND_BASE_URL.replace(/\/$/, '')}/register/student?token=${token}`;
};

export function InviteStudents() {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expiresInDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invite link');
      setInviteLink(buildInviteLink(data.token, data.inviteLink));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Invite Students</h1>
        <p className="text-neutral-500">
          Generate a registration link and send it to students. They will open the link in their browser to create their account.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 max-w-xl">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expires">Link expires in (days)</Label>
            <Input
              id="expires"
              type="number"
              min={1}
              max={30}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Math.min(30, Math.max(1, Number(e.target.value) || 7)))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Link2 className="w-4 h-4" />
            {isLoading ? 'Generating...' : 'Generate Invite Link'}
          </Button>
        </form>

        {inviteLink && (
          <div className="mt-6 pt-6 border-t border-neutral-200 space-y-2">
            <Label>Registration link (share this with the student)</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              Student clicks the link → opens in browser → completes registration form → creates account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
