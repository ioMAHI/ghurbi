import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, ChevronRight } from 'lucide-react';

export default function TourCard({ tour }) {
  const statusColors = {
    active: 'bg-chart-1 text-white',
    upcoming: 'bg-primary text-primary-foreground',
    closed: 'bg-muted text-muted-foreground',
  };

  return (
    <Link to={`/tour/${tour.id}`}>
      <Card className="p-4 border border-border hover:border-primary/40 transition-colors active:scale-[0.98]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-[10px] px-2 py-0 ${statusColors[tour.status]}`}>
                {tour.status === 'active' ? 'Current' : tour.status === 'upcoming' ? 'Upcoming' : 'Closed'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm truncate">{tour.name}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tour.destination}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tour.members?.length || 0}
              </span>
              {tour.total_cost > 0 && (
                <span className="font-medium text-foreground">৳{tour.total_cost.toLocaleString()}</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}