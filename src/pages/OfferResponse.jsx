import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OfferResponse() {
  const urlParams = new URLSearchParams(window.location.search);
  const tryoutId = urlParams.get('tryout');
  const [response, setResponse] = useState(null);

  const { data: tryout, isLoading } = useQuery({
    queryKey: ['tryout', tryoutId],
    queryFn: async () => {
      if (!tryoutId) return null;
      const tryouts = await base44.entities.PlayerTryout.filter({ id: tryoutId });
      return tryouts[0];
    },
    enabled: !!tryoutId
  });

  const { data: player } = useQuery({
    queryKey: ['player', tryout?.player_id],
    queryFn: async () => {
      if (!tryout?.player_id) return null;
      const players = await base44.entities.Player.filter({ id: tryout.player_id });
      return players[0];
    },
    enabled: !!tryout?.player_id
  });

  const respondMutation = useMutation({
    mutationFn: async (status) => {
      await base44.entities.PlayerTryout.update(tryoutId, {
        next_season_status: status
      });

      // If accepted, remove from tryout pool
      if (status === 'Accepted Offer') {
        try {
          const poolEntries = await base44.entities.TryoutPool.filter({ player_id: tryout.player_id });
          if (poolEntries && poolEntries.length > 0) {
            await base44.entities.TryoutPool.delete(poolEntries[0].id);
          }
        } catch (error) {
          console.error('Error removing from pool:', error);
        }
      }
    },
    onSuccess: (_, status) => {
      setResponse(status);
      toast.success(status === 'Accepted Offer' ? 'Offer accepted!' : 'Response recorded');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h2>
            <p className="text-slate-600">This offer link is not valid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (response) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Response Recorded
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            {response === 'Accepted Offer' ? (
              <>
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Congratulations!</h2>
                <p className="text-slate-600 mb-4">
                  You have accepted the offer for <strong>{player?.full_name}</strong> to join <strong>{tryout.next_year_team}</strong>.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left">
                  <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
                  <ol className="text-sm text-slate-700 space-y-1">
                    <li>1. You will receive registration information via email</li>
                    <li>2. Complete the registration forms</li>
                    <li>3. Pay team fees</li>
                    <li>4. Order team uniform</li>
                  </ol>
                </div>
              </>
            ) : response === 'Rejected Offer' ? (
              <>
                <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Offer Declined</h2>
                <p className="text-slate-600">
                  Your response has been recorded. We appreciate your consideration.
                </p>
              </>
            ) : (
              <>
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Response Recorded</h2>
                <p className="text-slate-600">
                  We have recorded that you are still considering the offer. Take your time!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadyResponded = tryout.next_season_status && 
    tryout.next_season_status !== 'Offer Sent' && 
    tryout.next_season_status !== 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
          <CardTitle className="text-2xl">Team Offer for {player?.full_name || tryout.player_name}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {alreadyResponded ? (
            <div className="text-center">
              <Badge className="mb-4 text-lg px-4 py-2 bg-blue-500 text-white">
                Current Status: {tryout.next_season_status}
              </Badge>
              <p className="text-slate-600">You have already responded to this offer.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border-2 border-emerald-200">
                <h3 className="font-bold text-xl text-slate-900 mb-2">
                  {tryout.next_year_team}
                </h3>
                <div className="flex gap-2">
                  {player?.age_group && <Badge className="bg-purple-600 text-white">{player.age_group}</Badge>}
                  {player?.primary_position && <Badge className="bg-blue-600 text-white">{player.primary_position}</Badge>}
                </div>
              </div>

              <p className="text-slate-700 mb-6 leading-relaxed">
                We are pleased to offer <strong>{player?.full_name || tryout.player_name}</strong> a position 
                on the <strong>{tryout.next_year_team}</strong> team for the upcoming season.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-8">
                <h4 className="font-bold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>✓ Accept the offer to reserve your spot</li>
                  <li>✓ Complete registration and payment</li>
                  <li>✓ Receive team information and schedule</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <Button
                  onClick={() => respondMutation.mutate('Accepted Offer')}
                  disabled={respondMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Accept Offer
                </Button>
                <Button
                  onClick={() => respondMutation.mutate('Considering Offer')}
                  disabled={respondMutation.isPending}
                  variant="outline"
                  className="w-full h-12"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Still Considering
                </Button>
                <Button
                  onClick={() => respondMutation.mutate('Rejected Offer')}
                  disabled={respondMutation.isPending}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12"
                >
                  <X className="w-5 h-5 mr-2" />
                  Decline Offer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}