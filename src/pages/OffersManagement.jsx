import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Check, X, Clock, Send, Search, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function OffersManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showSetExpirationDialog, setShowSetExpirationDialog] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  // Fetch all tryouts with pending/sent offers
  const { data: tryouts = [], isLoading } = useQuery({
    queryKey: ['tryouts-with-offers'],
    queryFn: () => base44.entities.PlayerTryout.list()
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  // Set expiration mutation
  const setExpirationMutation = useMutation({
    mutationFn: async ({ tryoutId, expirationDate }) => {
      await base44.entities.PlayerTryout.update(tryoutId, {
        offer_expiration_date: expirationDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tryouts-with-offers']);
      setShowSetExpirationDialog(false);
      setSelectedOffer(null);
      setExpirationDate('');
      toast.success('Expiration date set');
    }
  });

  // Resend offer mutation
  const resendOfferMutation = useMutation({
    mutationFn: async ({ playerId, tryoutId }) => {
      const player = players.find(p => p.id === playerId);
      const tryout = tryouts.find(t => t.id === tryoutId);
      
      // Send email notification
      const offerUrl = `${window.location.origin}${createPageUrl('OfferResponse')}?tryoutId=${tryoutId}`;
      
      const expirationText = tryout.offer_expiration_date 
        ? `\n\nThis offer expires on ${moment(tryout.offer_expiration_date).format('MMMM D, YYYY')}.`
        : '';
      
      await base44.integrations.Core.SendEmail({
        to: player.email || player.parent_emails?.[0],
        subject: `Team Offer Reminder - ${tryout.next_year_team}`,
        body: `Hi ${player.full_name},\n\nThis is a reminder about your offer to join ${tryout.next_year_team} for the upcoming season.${expirationText}\n\nPlease respond to your offer: ${offerUrl}\n\nBest regards,\nMichigan Jaguars`
      });
      
      return tryoutId;
    },
    onSuccess: () => {
      toast.success('Offer reminder sent');
      queryClient.invalidateQueries(['tryouts-with-offers']);
    },
    onError: () => toast.error('Failed to send reminder')
  });

  // Filter tryouts with offers
  const offersData = tryouts
    .filter(tryout => tryout.next_year_team && tryout.next_season_status)
    .map(tryout => {
      const player = players.find(p => p.id === tryout.player_id);
      const team = teams.find(t => t.name === tryout.next_year_team);
      const isExpired = tryout.offer_expiration_date && new Date(tryout.offer_expiration_date) < new Date();
      return { ...tryout, player, team, isExpired };
    })
    .filter(offer => {
      const matchesSearch = offer.player?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           offer.next_year_team?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'Expired' && offer.isExpired) ||
                           offer.next_season_status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // Calculate stats
  const stats = {
    total: offersData.length,
    pending: offersData.filter(o => o.next_season_status === 'Offer Sent').length,
    accepted: offersData.filter(o => o.next_season_status === 'Accepted Offer').length,
    rejected: offersData.filter(o => o.next_season_status === 'Rejected Offer').length,
    considering: offersData.filter(o => o.next_season_status === 'Considering Offer').length,
    expired: offersData.filter(o => o.isExpired).length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Accepted Offer': return 'bg-green-500 text-white';
      case 'Rejected Offer': return 'bg-red-500 text-white';
      case 'Considering Offer': return 'bg-yellow-500 text-white';
      case 'Offer Sent': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading offers...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Offers Management</h1>
          <p className="text-slate-600">Track all team offers, player responses, and pending decisions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs text-slate-600">Total Offers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-xs text-slate-600">Pending Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-xs text-slate-600">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.considering}</div>
              <div className="text-xs text-slate-600">Considering</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-slate-600">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by player or team..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Offer Sent">Pending Response</SelectItem>
                  <SelectItem value="Accepted Offer">Accepted</SelectItem>
                  <SelectItem value="Rejected Offer">Rejected</SelectItem>
                  <SelectItem value="Considering Offer">Considering</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expired Offers Alert */}
        {stats.expired > 0 && (
          <Card className="border-2 border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-900">
                    {stats.expired} offer{stats.expired !== 1 ? 's have' : ' has'} expired
                  </div>
                  <div className="text-sm text-red-700">
                    Consider following up with these players or withdrawing the offers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Player</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Team Offered</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Sent Date</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Expires</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offersData.map((offer) => (
                    <tr key={offer.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{offer.player?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{offer.player?.age_group} • {offer.player?.primary_position}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{offer.next_year_team}</div>
                        <div className="text-xs text-slate-500">{offer.team?.league}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(offer.next_season_status)}>
                          {offer.next_season_status === 'Accepted Offer' && <Check className="w-3 h-3 mr-1" />}
                          {offer.next_season_status === 'Rejected Offer' && <X className="w-3 h-3 mr-1" />}
                          {offer.next_season_status === 'Considering Offer' && <Clock className="w-3 h-3 mr-1" />}
                          {offer.next_season_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {moment(offer.updated_date).format('MMM D, YYYY')}
                      </td>
                      <td className="p-3">
                        {offer.offer_expiration_date ? (
                          <div>
                            <div className={`text-sm font-medium ${offer.isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                              {moment(offer.offer_expiration_date).format('MMM D, YYYY')}
                            </div>
                            {offer.isExpired && (
                              <Badge className="bg-red-500 text-white text-xs mt-1">Expired</Badge>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setShowSetExpirationDialog(true);
                            }}
                            className="text-xs"
                          >
                            Set Date
                          </Button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`${createPageUrl('PlayerDashboard')}?id=${offer.player_id}`)}
                          >
                            View
                          </Button>
                          {offer.next_season_status === 'Offer Sent' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => resendOfferMutation.mutate({ playerId: offer.player_id, tryoutId: offer.id })}
                                disabled={resendOfferMutation.isPending}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Remind
                              </Button>
                              {offer.offer_expiration_date && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOffer(offer);
                                    setExpirationDate(offer.offer_expiration_date);
                                    setShowSetExpirationDialog(true);
                                  }}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {offersData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No offers found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Set Expiration Dialog */}
        <Dialog open={showSetExpirationDialog} onOpenChange={setShowSetExpirationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Offer Expiration Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Player: <span className="font-semibold">{selectedOffer?.player?.full_name}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Team: <span className="font-semibold">{selectedOffer?.next_year_team}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Expiration Date</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSetExpirationDialog(false);
                    setSelectedOffer(null);
                    setExpirationDate('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setExpirationMutation.mutate({
                    tryoutId: selectedOffer.id,
                    expirationDate
                  })}
                  disabled={!expirationDate || setExpirationMutation.isPending}
                  className="flex-1"
                >
                  Set Expiration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}