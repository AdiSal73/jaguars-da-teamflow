import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LocationSelector({ value, onChange, required = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', phone: '', notes: '' });

  const queryClient = useQueryClient();

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const createLocationMutation = useMutation({
    mutationFn: (data) => base44.entities.Location.create(data),
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries(['locations']);
      onChange(newLoc.id);
      setShowCreateDialog(false);
      setNewLocation({ name: '', address: '', phone: '', notes: '' });
    }
  });

  const selectedLocation = locations.find(l => l.id === value);
  const filteredLocations = locations.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={selectedLocation ? `${selectedLocation.name} - ${selectedLocation.address}` : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search or select location..."
            className="pl-9"
          />
        </div>
        
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredLocations.length > 0 ? (
              <div className="p-1">
                {filteredLocations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onChange(loc.id);
                      setShowDropdown(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm"
                  >
                    <div className="font-medium text-slate-900">{loc.name}</div>
                    <div className="text-xs text-slate-600">{loc.address}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-sm text-slate-500 text-center">
                No locations found
              </div>
            )}
            <div className="border-t p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateDialog(true);
                  setShowDropdown(false);
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Location
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
          <div className="font-medium">{selectedLocation.name}</div>
          <div>{selectedLocation.address}</div>
          {selectedLocation.phone && <div>📞 {selectedLocation.phone}</div>}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Location Name *</Label>
              <Input
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                placeholder="e.g., Main Training Facility"
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={newLocation.address}
                onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                value={newLocation.phone}
                onChange={(e) => setNewLocation({...newLocation, phone: e.target.value})}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={newLocation.notes}
                onChange={(e) => setNewLocation({...newLocation, notes: e.target.value})}
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createLocationMutation.mutate(newLocation)}
                disabled={!newLocation.name || !newLocation.address}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Create Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}