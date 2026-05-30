const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function JoinTourDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    const tours = await db.entities.Tour.filter({ join_code: code.toUpperCase().trim() });
    if (!tours.length) {
      toast.error('Invalid join code');
      setJoining(false);
      return;
    }
    const tour = tours[0];
    if (tour.members.includes(user.email)) {
      toast.info('You are already a member');
      setJoining(false);
      onOpenChange(false);
      return;
    }
    if (tour.status === 'closed') {
      toast.error('This tour is closed');
      setJoining(false);
      return;
    }
    await db.entities.Tour.update(tour.id, {
      members: [...tour.members, user.email],
    });
    queryClient.invalidateQueries({ queryKey: ['tours'] });
    toast.success(`Joined ${tour.name}!`);
    setCode('');
    setJoining(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Join Tour</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">6-Character Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. A1B2C3"
              className="mt-1 text-center text-lg tracking-widest font-mono font-bold"
              maxLength={6}
            />
          </div>
          <Button onClick={handleJoin} disabled={code.length !== 6 || joining} className="w-full font-semibold">
            {joining ? 'Joining...' : 'Join Tour'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}