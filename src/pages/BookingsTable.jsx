import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Download, Filter, Edit, Mail } from 'lucide-react';
import { toast } from 'sonner';
import BookingCalendarSync from '../components/booking/BookingCalendarSync';
import EditBookingDialog from '../components/booking/EditBookingDialog';

export default function BookingsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterLeague, setFilterLeague] = useState('all');
  const [editingBooking, setEditingBooking] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-booking_date')
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const currentCoach = (coaches || []).find(c => c.email === user?.email);
  const isAdmin = user?.role === 'admin';

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data, sendCancellationEmail }) => {
      const result = await base44.entities.Booking.update(id, data);
      
      // Send cancellation email if status changed to cancelled
      if (sendCancellationEmail && data.status === 'cancelled') {
        const booking = bookings.find(b => b.id === id);
        const location = locations.find(l => l.id === booking.location_id);
        const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
        
        // Email to client
        if (booking.parent_email) {
          await base44.functions.invoke('sendBookingEmail', {
            to: booking.parent_email,
            subject: `Booking Cancelled - ${booking.service_name}`,
            booking: {
              ...booking,
              location_info: locationInfo
            },
            type: 'cancellation'
          });
        }
        
        // Email to coach
        const coach = coaches.find(c => c.id === booking.coach_id);
        if (coach?.email) {
          await base44.functions.invoke('sendBookingEmail', {
            to: coach.email,
            subject: `Booking Cancelled - ${booking.player_name}`,
            booking: {
              ...booking,
              location_info: locationInfo
            },
            type: 'cancellation'
          });
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking updated successfully');
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast.error(`Failed to update booking: ${error.message}`);
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setEditingBooking(null);
      toast.success('Booking deleted successfully');
    },
    onError: (error) => {
      console.error('Delete booking error:', error);
      toast.error(`Failed to delete booking: ${error.message}`);
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (booking) => {
      const location = locations.find(l => l.id === booking.location_id);
      const locationInfo = location ? `${location.name} - ${location.address}` : 'Location TBD';
      
      if (booking.parent_email) {
        await base44.functions.invoke('sendBookingEmail', {
          to: booking.parent_email,
          subject: `Reminder: Upcoming Session - ${booking.service_name}`,
          booking: {
            ...booking,
            booked_by_name: 'Reminder',
            location_info: locationInfo
          },
          type: 'confirmation_client'
        });
      }
    },
    onSuccess: () => {
      toast.success('Reminder email sent');
    },
    onError: (error) => {
      console.error('Send reminder error:', error);
      toast.error(`Failed to send reminder: ${error.message}`);
    }
  });

  const filteredBookings = useMemo(() => {
    let filtered = bookings || [];
    
    // Coaches only see their own bookings (admins see all)
    if (currentCoach && !isAdmin) {
      filtered = filtered.filter(b => b.coach_id === currentCoach.id);
    }
    
    return filtered.filter(booking => {
      const matchesSearch = 
        booking.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.coach_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      const matchesCoach = filterCoach === 'all' || booking.coach_id === filterCoach;
      const matchesDate = !filterDate || booking.booking_date === filterDate;
      
      // Admin filters
      const coach = (coaches || []).find(c => c.id === booking.coach_id);
      const teamIds = coach?.team_ids || [];
      const coachTeams = (teams || []).filter(t => teamIds.includes(t.id));
      const matchesAgeGroup = filterAgeGroup === 'all' || coachTeams.some(t => t.age_group === filterAgeGroup);
      const matchesBranch = filterBranch === 'all' || coachTeams.some(t => t.branch === filterBranch) || coach?.branch === filterBranch;
      const matchesLeague = filterLeague === 'all' || coachTeams.some(t => t.league === filterLeague);
      
      return matchesSearch && matchesStatus && matchesCoach && matchesDate && matchesAgeGroup && matchesBranch && matchesLeague;
    });
  }, [bookings, searchTerm, filterStatus, filterCoach, filterDate, filterAgeGroup, filterBranch, filterLeague, currentCoach, isAdmin, coaches, teams]);

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
    const rows = (filteredBookings || []).map(b => {
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div className="lg:col-span-2 relative">
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
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
          
          {isAdmin && (
            <div className="grid md:grid-cols-4 gap-4">
              <Select value={filterCoach} onValueChange={setFilterCoach}>
                <SelectTrigger>
                  <SelectValue placeholder="Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches?.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {[...new Set(teams?.map(t => t.age_group).filter(Boolean) || [])].sort().map(ag => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {[...new Set([...teams?.map(t => t.branch) || [], ...coaches?.map(c => c.branch) || []].filter(Boolean))].map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLeague} onValueChange={setFilterLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="League" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {[...new Set(teams?.map(t => t.league).filter(Boolean) || [])].map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                  <th className="px-4 py-3 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredBookings || []).map((booking, idx) => {
                  const coach = (coaches || []).find(c => c.id === booking.coach_id);
                  const location = (locations || []).find(l => l.id === booking.location_id);
                  
                  return (
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
                        {location?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Select 
                          value={booking.status} 
                          onValueChange={(value) => updateBookingMutation.mutate({ 
                            id: booking.id, 
                            data: { status: value },
                            sendCancellationEmail: value === 'cancelled' && booking.status !== 'cancelled'
                          })}
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
                      <td className="px-4 py-3">
                       <div className="flex gap-1">
                         {isAdmin && (
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => setEditingBooking(booking)}
                             className="h-7 px-2"
                           >
                             <Edit className="w-3 h-3" />
                           </Button>
                         )}
                         {booking.parent_email && booking.status === 'confirmed' && (
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => sendReminderMutation.mutate(booking)}
                             className="h-7 px-2"
                           >
                             <Mail className="w-3 h-3" />
                           </Button>
                         )}
                         {booking.status === 'confirmed' && (
                           <BookingCalendarSync booking={booking} coach={coach} location={location} />
                         )}
                       </div>
                      </td>
                    </tr>
                  );
                })}
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

      {editingBooking && (
        <EditBookingDialog
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSave={(id, data) => updateBookingMutation.mutate({ id, data })}
          onDelete={isAdmin ? (id) => deleteBookingMutation.mutate(id) : null}
          locations={locations}
          coaches={coaches}
        />
      )}
    </div>
  );
}