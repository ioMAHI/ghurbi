import React from 'react';
import { Card } from '@/components/ui/card';

export default function FinancialCards({ totalCost, perPerson, memberCount }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="p-3 border border-border text-center">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Cost</p>
        <p className="text-lg font-bold mt-0.5 font-mono">৳{totalCost.toLocaleString()}</p>
      </Card>
      <Card className="p-3 border border-border text-center">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Per Person</p>
        <p className="text-lg font-bold mt-0.5 font-mono">৳{Math.round(perPerson).toLocaleString()}</p>
      </Card>
    </div>
  );
}