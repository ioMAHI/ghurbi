import React from 'react';
import { Card } from '@/components/ui/card';
import { formatTimestamp } from '@/lib/formatDate';

function getUserDisplay(email, allUsers) {
  const u = allUsers.find(u => u.email === email);
  return u?.nickname || u?.full_name || email.split('@')[0];
}

export default function ExpenseList({ expenses, allUsers }) {
  if (!expenses.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expenses</h3>
      {expenses.map(exp => (
        <Card key={exp.id} className="p-3 border border-border">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{exp.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimestamp(exp.timestamp || exp.created_date)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {exp.payers?.map((p, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground">
                    {getUserDisplay(p.email, allUsers)}: <span className="font-mono font-medium text-foreground">৳{p.amount?.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
            <span className="text-sm font-bold font-mono flex-shrink-0">৳{exp.total_amount?.toLocaleString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}