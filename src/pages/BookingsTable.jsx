import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Download, Filter } from 'lucide-react';

export default function BookingsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date')
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['bookings'])
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      const matchesCoach = filterCoach === 'all' || booking.coach_id === filterCoach;
      const matchesDate = !filterDate || booking.booking_date === filterDate;
      return matchesSearch && matchesStatus && matchesCoach && matchesDate;
    });
  }, [bookings, searchTerm, filterStatus, filterCoach, filterDate]);

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Coach', 'Player', 'Service', 'Location', 'Status', 'Notes'];
    const rows = filteredBookings.map(b => {
      const location = locations.find(l => l.id === b.location_id);
      return [
        b.booking_date,
        `${b.start_time} - ${b.end_time}`,
        b.coach_name,
        b.player_name,
        b.service_name,
        location?.name || '',
        b.status,
        b.notes || ''
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Bookings</h1>
          <p className="text-slate-600 mt-1">View and manage all scheduled sessions</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by player, coach, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCoach} onValueChange={setFilterCoach}>
              <SelectTrigger>
                <SelectValue placeholder="Coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coaches</SelectItem>
                {coaches.map(coach => (
                  <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Coach</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, idx) => (
                  <tr key={booking.id} className={`border-b hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {formatTimeDisplay(booking.start_time)} - {formatTimeDisplay(booking.end_time)}
                    </td>
                    <td className="px-4 py-3 text-sm">{booking.coach_name}</td>
                    <td className="px-4 py-3 text-sm">{booking.player_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{booking.service_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {locations.find(l => l.id === booking.location_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={booking.status} 
                        onValueChange={(value) => updateBookingMutation.mutate({ id: booking.id, data: { status: value } })}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <Badge className={`${statusColors[booking.status]} text-xs`}>{booking.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {booking.notes && (
                        <span className="text-xs text-slate-500 truncate max-w-[150px] block" title={booking.notes}>
                          {booking.notes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No bookings found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}