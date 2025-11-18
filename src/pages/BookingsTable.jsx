import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BookingsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date')
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['bookings'])
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['bookings'])
  });

  const handleFieldUpdate = (bookingId, field, value) => {
    updateBookingMutation.mutate({ id: bookingId, data: { [field]: value } });
  };

  const filteredBookings = bookings.filter(b => 
    (b.player_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.coach_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Bookings Table</h1>
        <p className="text-slate-600 mt-1">Edit and manage training session bookings</p>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by player or coach name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Input 
                        value={booking.player_name || ''} 
                        onChange={(e) => handleFieldUpdate(booking.id, 'player_name', e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{booking.coach_name}</TableCell>
                    <TableCell>
                      <Input 
                        type="date" 
                        value={booking.date} 
                        onChange={(e) => handleFieldUpdate(booking.id, 'date', e.target.value)}
                        className="w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="time" 
                        value={booking.start_time} 
                        onChange={(e) => handleFieldUpdate(booking.id, 'start_time', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={booking.duration || ''} 
                        onChange={(e) => handleFieldUpdate(booking.id, 'duration', parseInt(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={booking.session_type || ''} 
                        onChange={(e) => handleFieldUpdate(booking.id, 'session_type', e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={booking.status} 
                        onValueChange={(value) => handleFieldUpdate(booking.id, 'status', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="No-show">No-show</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Delete this booking?')) {
                            deleteBookingMutation.mutate(booking.id);
                          }
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}