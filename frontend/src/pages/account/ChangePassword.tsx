import React, { useState } from 'react';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { changePassword } from '@/lib/api';

const ChangePassword: React.FC = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!current || !next || !confirm) {
      setError('All fields are required');
      return;
    }
    if (next !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword({ current_password: current, new_password: next });
      setSuccess('Password updated successfully');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-md">
      <h1 className="text-xl font-semibold mb-4">Change Password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="current" className="block text-sm mb-1 text-muted-foreground">Current Password</label>
          <PasswordInput id="current" value={current} onChange={(e) => setCurrent(e.currentTarget.value)} placeholder="••••••••" />
        </div>
        <div>
          <label htmlFor="new" className="block text-sm mb-1 text-muted-foreground">New Password</label>
          <PasswordInput id="new" value={next} onChange={(e) => setNext(e.currentTarget.value)} placeholder="••••••••" />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm mb-1 text-muted-foreground">Confirm New Password</label>
          <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} placeholder="••••••••" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {success && <p role="alert" className="text-sm text-green-600">{success}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Saving…' : 'Save Password'}</Button>
      </form>
    </div>
  );
};

export default ChangePassword;

