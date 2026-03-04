import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // 'up', 'down', 'neutral'
  icon: Icon,
  format = 'number', // 'number', 'currency', 'percentage', 'duration'
  suffix = '',
  prefix = ''
}) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    if (format === 'duration') {
      const minutes = Math.floor(val / 60);
      const seconds = Math.floor(val % 60);
      return `${minutes}m ${seconds}s`;
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  const getTrendIcon = () => {
    if (changeType === 'up') return <TrendingUp className="h-4 w-4" />;
    if (changeType === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (changeType === 'up') return 'text-emerald-400';
    if (changeType === 'down') return 'text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="glass-card-hover" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold font-['Outfit']" data-testid="kpi-value">
              {prefix}{formatValue(value)}{suffix}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{change > 0 ? '+' : ''}{change}% from last period</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
