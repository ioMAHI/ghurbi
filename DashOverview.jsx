const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import FinancialCards from './FinancialCards';
import BalanceChart from './BalanceChart';
import ExpenseList from './ExpenseList';
import AddExpenseDialog from './AddExpenseDialog';
import TourActions from './TourActions';
import PendingCorrections from './PendingCorrections';

export default function DashOverview({ tour, user, isManager, isClosed }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', tour.id],
    queryFn: () => db.entities.Expense.filter({ tour_id: tour.id }, '-created_date', 200),
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements', tour.id],
    queryFn: () => db.entities.Settlement.filter({ tour_id: tour.id }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => db.entities.User.list('-created_date', 200),
  });

  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const pendingExpenses = expenses.filter(e => e.status === 'pending_correction');
  const totalCost = approvedExpenses.reduce((s, e) => s + (e.total_amount || 0), 0);
  const memberCount = tour.members?.length || 1;
  const perPerson = totalCost / memberCount;

  // Calculate each member's total paid
  const paidMap = {};
  tour.members?.forEach(m => { paidMap[m] = 0; });
  approvedExpenses.forEach(e => {
    e.payers?.forEach(p => {
      paidMap[p.email] = (paidMap[p.email] || 0) + (p.amount || 0);
    });
  });

  // Add settlements
  const settledMap = {};
  settlements.forEach(s => {
    settledMap[s.member_email] = (settledMap[s.member_email] || 0) + (s.amount || 0);
  });

  // Check system balance
  const totalPaid = Object.values(paidMap).reduce((a, b) => a + b, 0);
  const totalSettled = Object.values(settledMap).reduce((a, b) => a + b, 0);
  const systemImbalance = Math.abs(totalPaid + totalSettled - totalCost) > 0.5 && totalCost > 0;

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {systemImbalance && (
        <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ System Imbalance Detected!
        </div>
      )}

      <FinancialCards totalCost={totalCost} perPerson={perPerson} />

      <BalanceChart
        members={tour.members || []}
        paidMap={paidMap}
        settledMap={settledMap}
        perPerson={perPerson}
        allUsers={allUsers}
        tour={tour}
        isManager={isManager}
        isClosed={isClosed}
      />

      {isManager && pendingExpenses.length > 0 && (
        <PendingCorrections expenses={pendingExpenses} tourId={tour.id} />
      )}

      <ExpenseList expenses={approvedExpenses} allUsers={allUsers} />

      <TourActions tour={tour} user={user} isManager={isManager} isClosed={isClosed} />

      {!isClosed && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40">
          <Button onClick={() => setExpenseOpen(true)} className="h-12 px-8 rounded-full font-bold shadow-lg gap-2">
            <Plus className="w-5 h-5" /> Add Expense
          </Button>
        </div>
      )}

      <AddExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        tour={tour}
        user={user}
        isManager={isManager}
        allUsers={allUsers}
      />
    </div>
  );
}