const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 6 }, (_, i) => String(2025 + i));

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CreateTourDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [destination, setDestination] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);

  const tourName = [destination.trim(), month, year].filter(Boolean).join(' ');
  const isValid = destination.trim() && month && year;

  const handleCreate = async () => {
    setSaving(true);
    const code = generateCode();
    await db.entities.Tour.create({
      name: tourName,
      destination: destination.trim(),
      month,
      year,
      join_code: code,
      manager_email: user.email,
      members: [user.email],
      status: 'upcoming',
      start_date: startDate || undefined,
      total_cost: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['tours'] });
    setSaving(false);
    setDestination('');
    setMonth('');
    setYear('');
    setStartDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create Tour</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Destination</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Sajek Valley"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {tourName && (
            <div className="bg-secondary rounded-lg px-3 py-2">
              <span className="text-xs text-muted-foreground">Tour Name: </span>
              <span className="text-sm font-semibold">{tourName}</span>
            </div>
          )}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Start Date (optional)</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleCreate} disabled={!isValid || saving} className="w-full font-semibold">
            {saving ? 'Creating...' : 'Create Tour'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}