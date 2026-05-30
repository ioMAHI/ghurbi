const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { nowTimestamp } from '@/lib/formatDate';
import { pushToOutbox, isOnline } from '@/lib/offlineSync';
import { toast } from 'sonner';

function getUserDisplay(email, allUsers) {
  const u = allUsers.find(u => u.email === email);
  return u?.nickname || u?.full_name || email.split('@')[0];
}

export default function AddExpenseDialog({ open, onOpenChange, tour, user, isManager, allUsers }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payerAmounts, setPayerAmounts] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTotalAmount('');
      const initial = {};
      tour.members?.forEach(m => { initial[m] = ''; });
      setPayerAmounts(initial);
    }
  }, [open, tour.members]);

  const total = parseFloat(totalAmount) || 0;
  const payerSum = Object.values(payerAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const isValid = title.trim() && total > 0 && Math.abs(payerSum - total) < 0.01 && payerSum > 0;

  const handleSubmit = async () => {
    setSaving(true);
    const payers = Object.entries(payerAmounts)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([email, v]) => ({ email, amount: parseFloat(v) }));

    const expenseData = {
      tour_id: tour.id,
      title: title.trim(),
      total_amount: total,
      payers,
      logged_by: user.email,
      status: 'approved',
      timestamp: nowTimestamp(),
    };

    if (isOnline()) {
      await db.entities.Expense.create(expenseData);
      // Update tour total_cost
      await db.entities.Tour.update(tour.id, {
        total_cost: (tour.total_cost || 0) + total,
        status: tour.status === 'upcoming' ? 'active' : tour.status,
      });
    } else {
      pushToOutbox({ type: 'expense', data: expenseData, tourId: tour.id, addToTotal: total });
      toast.info('Saved offline — will sync when online');
    }

    queryClient.invalidateQueries({ queryKey: ['expenses', tour.id] });
    queryClient.invalidateQueries({ queryKey: ['tour', tour.id] });
    queryClient.invalidateQueries({ queryKey: ['tours'] });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bus fare" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Total Amount (৳)</Label>
            <Input
              type="number"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              placeholder="0"
              className="mt-1 font-mono text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Who Paid?</Label>
            <p className="text-[10px] text-muted-foreground">Enter each payer's share. Must equal total.</p>
            {tour.members?.map(email => (
              <div key={email} className="flex items-center gap-2">
                <span className="text-xs font-medium flex-1 truncate">{getUserDisplay(email, allUsers)}</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    value={payerAmounts[email] || ''}
                    onChange={e => setPayerAmounts(prev => ({ ...prev, [email]: e.target.value }))}
                    className="pl-6 h-9 text-sm font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
            <div className={`flex justify-between text-xs font-bold px-1 pt-1 ${Math.abs(payerSum - total) < 0.01 ? 'text-chart-1' : 'text-destructive'}`}>
              <span>Sum: ৳{payerSum.toLocaleString()}</span>
              <span>{total > 0 ? (Math.abs(payerSum - total) < 0.01 ? '✓ Matches' : `Off by ৳${Math.abs(payerSum - total).toLocaleString()}`) : ''}</span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!isValid || saving} className="w-full font-semibold">
            {saving ? 'Saving...' : 'Log Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}