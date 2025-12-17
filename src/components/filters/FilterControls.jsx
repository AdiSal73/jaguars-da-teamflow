import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function FilterControls({
  search,
  onSearchChange,
  filters = [],
  onFilterChange,
  onResetFilters,
  showBirthdayFilters = false,
  birthdayFrom,
  birthdayTo,
  onBirthdayFromChange,
  onBirthdayToChange,
  className = ''
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={onResetFilters}
          title="Reset all filters"
          className="h-10 w-10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filters.map((filter, idx) => (
            <div key={idx}>
              {filter.label && <Label className="text-xs text-slate-600 mb-1">{filter.label}</Label>}
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {showBirthdayFilters && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-600 mb-1">Birthday From</Label>
            <Input
              type="date"
              value={birthdayFrom}
              onChange={(e) => onBirthdayFromChange(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">Birthday To</Label>
            <Input
              type="date"
              value={birthdayTo}
              onChange={(e) => onBirthdayToChange(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      )}
    </div>
  );
}