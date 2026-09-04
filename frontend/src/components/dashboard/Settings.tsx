import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';

import { API_BASE_URL } from '../../config';

export function Settings({
  canManageMaintenance,
  isMaintenanceMode,
  onToggleMaintenance,
}: {
  canManageMaintenance: boolean;
  isMaintenanceMode: boolean;
  onToggleMaintenance: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">System Configuration</h1>
        <p className="text-neutral-500">Manage global settings, security, and notifications.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic system information and appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="University of Technology" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-neutral-500">
                      Enable dark mode for the admin interface.
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 cursor-pointer ring-2 ring-offset-2 ring-neutral-900"></div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-600 cursor-pointer"></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Save Changes</Button>
              </CardFooter>
            </Card>

            {canManageMaintenance && (
              <Card className="mt-6 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>
                    Temporarily disable access for students and teachers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {isMaintenanceMode ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      Only super admins can access the system.
                    </p>
                  </div>
                  <Switch
                    checked={isMaintenanceMode}
                    onCheckedChange={async (checked) => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ settings: { maintenanceMode: checked } }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to update');
                        onToggleMaintenance(checked);
                      } catch (e) {
                        console.error('Failed to update maintenance mode:', e);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance Settings */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rules</CardTitle>
                <CardDescription>
                  Set thresholds for attendance marking and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Attendance Required (%)</Label>
                  <Input id="threshold" type="number" defaultValue="75" />
                  <p className="text-xs text-neutral-500">Students below this threshold will be flagged.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="late-tolerance">Late Arrival Tolerance (Minutes)</Label>
                  <Input id="late-tolerance" type="number" defaultValue="15" />
                  <p className="text-xs text-neutral-500">Time allowed after class start before marked as Late.</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Proxy Detection</Label>
                    <p className="text-sm text-neutral-500">
                      Automatically flag suspicious check-ins (e.g., same device, quick location jumps).
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Save Rules</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security & Access</CardTitle>
                <CardDescription>
                  Manage login security and password policies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                    <p className="text-sm text-neutral-500">
                      Require 2FA for all admin accounts.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (Days)</Label>
                  <Input id="password-expiry" type="number" defaultValue="90" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Update Security</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
             <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure email and SMS alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Low Attendance Alerts</Label>
                    <p className="text-sm text-neutral-500">
                      Email faculty when class attendance drops below 50%.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Health Reports</Label>
                    <p className="text-sm text-neutral-500">
                      Weekly email summary of system performance.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Critical Alerts</Label>
                    <p className="text-sm text-neutral-500">
                      Send SMS for security breaches or critical errors.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
