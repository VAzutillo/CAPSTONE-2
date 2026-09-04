import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Archive, 
  Shield, 
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";

import { API_BASE_URL } from '../../config';

type UserRow = { id: string; name: string; email: string; role: string; roleLabel: string; department: string; status: string; handledBlocks?: string[] };

export function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addRole, setAddRole] = useState('student');
  const [addHandledBlocks, setAddHandledBlocks] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('admin');
  const [editHandledBlocks, setEditHandledBlocks] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      const params = searchTerm ? new URLSearchParams({ search: searchTerm }) : '';
      const res = await fetch(`${API_BASE_URL}/api/admin/users${params ? `?${params}` : ''}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableBlocks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/available-blocks`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.blocks)) {
        setAvailableBlocks(data.blocks);
      }
    } catch (err) {
      console.error('Failed to fetch available blocks:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsers();
    fetchAvailableBlocks();
  }, [searchTerm]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!addEmail.trim() || !addPassword.trim()) {
      setError('Email and password are required');
      return;
    }
    setIsCreating(true);
    try {
      const payload: any = { name: addName.trim(), email: addEmail.trim(), password: addPassword, role: addRole };
      if (addRole === 'admin' && addHandledBlocks.length > 0) {
        payload.handledBlocks = addHandledBlocks;
      }
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setIsAddUserOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('student');
      setAddHandledBlocks([]);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (user: UserRow) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditHandledBlocks(user.handledBlocks || []);
    setIsEditUserOpen(true);
    setError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setIsUpdating(true);
    try {
      const payload: any = { name: editName.trim(), email: editEmail.trim(), role: editRole };
      if (editRole === 'admin') {
        payload.handledBlocks = editHandledBlocks;
      }
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleBlock = (block: string, isAdd: boolean) => {
    if (isAdd) {
      setAddHandledBlocks((prev) => (prev.includes(block) ? prev : [...prev, block]));
    } else {
      setEditHandledBlocks((prev) => (prev.includes(block) ? prev : [...prev, block]));
    }
  };

  const removeBlock = (block: string, isAdd: boolean) => {
    if (isAdd) {
      setAddHandledBlocks((prev) => prev.filter((b) => b !== block));
    } else {
      setEditHandledBlocks((prev) => prev.filter((b) => b !== block));
    }
  };

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
          <p className="text-neutral-500">Manage students, faculty, and staff accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neutral-900 hover:bg-neutral-800 gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new account for a student, faculty member, or admin.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" placeholder="John Doe" className="col-span-3" value={addName} onChange={(e) => setAddName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" placeholder="john@university.edu" className="col-span-3" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password</Label>
                    <div className="col-span-3 space-y-1">
                      <div className="relative">
                        <Input
                          id="password"
                          type={showAddPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          minLength={8}
                          value={addPassword}
                          onChange={(e) => setAddPassword(e.target.value)}
                          required
                          className="pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAddPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                          aria-label={showAddPassword ? 'Hide password' : 'Show password'}
                        >
                          {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Min 8 chars, uppercase, lowercase, number, special char</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <select className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={addRole} onChange={(e) => { setAddRole(e.target.value); if (e.target.value !== 'admin') setAddHandledBlocks([]); }}>
                      <option value="student">Student</option>
                      <option value="admin">Professor</option>
                      <option value="program_head">Program Head</option>
                      <option value="super_admin">Super Admin (Developer)</option>
                    </select>
                  </div>
                  {addRole === 'admin' && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Handled Blocks</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {addHandledBlocks.map((block) => (
                            <Badge key={block} variant="default" className="bg-emerald-100 text-emerald-700">
                              {block}
                              <button
                                type="button"
                                onClick={() => removeBlock(block, true)}
                                className="ml-1 hover:text-emerald-900"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value=""
                          onChange={(e) => {
                            if (e.target.value && !addHandledBlocks.includes(e.target.value)) {
                              toggleBlock(e.target.value, true);
                            }
                            e.target.value = '';
                          }}
                        >
                          <option value="">Select a block...</option>
                          {availableBlocks.filter((b) => !addHandledBlocks.includes(b)).map((block) => (
                            <option key={block} value={block}>{block}</option>
                          ))}
                        </select>
                        <p className="text-xs text-neutral-500">Select blocks this teacher will manage</p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Account'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and assigned blocks.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" placeholder="John Doe" className="col-span-3" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input id="edit-email" type="email" placeholder="john@university.edu" className="col-span-3" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Role</Label>
                <select className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editRole} onChange={(e) => { setEditRole(e.target.value); if (e.target.value !== 'admin') setEditHandledBlocks([]); }}>
                  <option value="student">Student</option>
                  <option value="admin">Professor</option>
                  <option value="program_head">Program Head</option>
                  <option value="super_admin">Super Admin (Developer)</option>
                </select>
              </div>
              {editRole === 'admin' && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Handled Blocks</Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                      {editHandledBlocks.map((block) => (
                        <Badge key={block} variant="default" className="bg-emerald-100 text-emerald-700">
                          {block}
                          <button
                            type="button"
                            onClick={() => removeBlock(block, false)}
                            className="ml-1 hover:text-emerald-900"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !editHandledBlocks.includes(e.target.value)) {
                          toggleBlock(e.target.value, false);
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Select a block...</option>
                      {availableBlocks.filter((b) => !editHandledBlocks.includes(b)).map((block) => (
                        <option key={block} value={block}>{block}</option>
                      ))}
                    </select>
                    <p className="text-xs text-neutral-500">Select blocks this teacher will manage</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Search users..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Handled Blocks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-500 py-8">Loading users...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-500 py-8">No users found.</TableCell>
              </TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.role === 'super_admin' || user.roleLabel === 'Super Admin (Developer)' ? (
                      <Shield className="w-4 h-4 text-purple-600" />
                    ) : user.role === 'program_head' ? (
                      <Shield className="w-4 h-4 text-amber-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-sm">{user.roleLabel || user.role}</span>
                  </div>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  {user.role === 'admin' ? (
                    user.handledBlocks && user.handledBlocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.handledBlocks.slice(0, 2).map((block) => (
                          <Badge key={block} variant="outline" className="text-xs">{block}</Badge>
                        ))}
                        {user.handledBlocks.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{user.handledBlocks.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">None</span>
                    )
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2" onClick={() => handleEditClick(user)}>
                        <Pencil className="w-4 h-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-amber-600 gap-2">
                        <Archive className="w-4 h-4" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
