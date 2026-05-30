const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function EditProfileDialog({ open, onOpenChange }) {
  const { user, checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && open) {
      setNickname(user.nickname || user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
      setDriveLink('');
    }
  }, [user, open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
  };

  const handleDriveLink = () => {
    if (driveLink.trim()) {
      setAvatarUrl(driveLink.trim());
      setDriveLink('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await db.auth.updateMe({
      nickname: nickname.trim(),
      phone: phone.trim(),
      avatar_url: avatarUrl,
    });
    if (checkUserAuth) await checkUserAuth();
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    setSaving(false);
    onOpenChange(false);
  };

  const initials = (user?.full_name || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-20 h-20 border-2 border-border">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-lg bg-secondary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2 w-full">
              <label className="flex-1">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="w-full gap-1" asChild>
                  <span><Upload className="w-3 h-3" /> Upload</span>
                </Button>
              </label>
            </div>
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Google Drive image link"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="text-sm h-9"
              />
              <Button variant="outline" size="sm" onClick={handleDriveLink} disabled={!driveLink.trim()}>
                Set
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Nickname</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Phone (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="+880..." />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full font-semibold">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}