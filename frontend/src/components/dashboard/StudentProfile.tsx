import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { API_BASE_URL } from '../../config';

type StudentProfileState = {
  name: string;
  block: string;
  email: string;
};

export function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfileState>({
    name: '',
    block: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      setProfileError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        if (isMounted && data.profile) {
          setProfile({
            name: data.profile.name || '',
            block: data.profile.block || '',
            email: data.profile.email || '',
          });
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profile.name,
          block: profile.block,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.profile) {
        setProfile({
          name: data.profile.name || '',
          block: data.profile.block || '',
          email: data.profile.email || '',
        });
      }

      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordError('Current and new passwords are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile & Security</h1>
        <p className="text-neutral-500">Update your personal details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Keep your name and block/section current.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSubmit}>
          <CardContent className="space-y-4">
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                placeholder="Juan Dela Cruz"
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-block">Block / Section</Label>
              <Input
                id="student-block"
                placeholder="Year 2 - Block 3"
                value={profile.block}
                onChange={(event) => setProfile((prev) => ({ ...prev, block: event.target.value }))}
                disabled={isLoading || isSaving}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password to keep your account secure.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="space-y-4">
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={isUpdatingPassword}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  disabled={isUpdatingPassword}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isUpdatingPassword}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  disabled={isUpdatingPassword}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isUpdatingPassword}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isUpdatingPassword}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
