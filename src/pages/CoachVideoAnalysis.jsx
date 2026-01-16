import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Upload, Search, Filter, Play, Trash2, Edit3, Eye } from 'lucide-react';
import { toast } from 'sonner';
import VideoUploadDialog from '../components/video/VideoUploadDialog';
import VideoPlayer from '../components/video/VideoPlayer';
import AnnotationPanel from '../components/video/AnnotationPanel';

export default function CoachVideoAnalysis() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list()
  });

  const { data: annotations = [] } = useQuery({
    queryKey: ['annotations', selectedVideo?.id],
    queryFn: () => base44.entities.VideoAnnotation.list(),
    enabled: !!selectedVideo
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list()
  });

  const currentCoach = coaches.find(c => c.email === user?.email);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = !searchTerm || 
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.player_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || v.video_type === filterType;
    const matchesPlayer = filterPlayer === 'all' || v.player_id === filterPlayer;
    return matchesSearch && matchesType && matchesPlayer;
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const videoAnnotations = selectedVideo 
    ? annotations.filter(a => a.video_id === selectedVideo.id)
    : [];

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await base44.entities.Video.delete(videoId);
      toast.success('Video deleted');
      queryClient.invalidateQueries(['videos']);
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Video Analysis Center
        </h1>
        <p className="text-slate-600 mt-2">Upload, analyze, and share training videos with your players</p>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Video Library Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Library ({filteredVideos.length})
                </CardTitle>
                <Button size="sm" onClick={() => setShowUploadDialog(true)} className="bg-gradient-to-r from-emerald-600 to-blue-600">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Match">Match</SelectItem>
                    <SelectItem value="Analysis">Analysis</SelectItem>
                    <SelectItem value="Drill">Drill</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPlayer} onValueChange={setFilterPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {players.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredVideos.map(video => (
                  <Card
                    key={video.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedVideo?.id === video.id
                        ? 'border-2 border-emerald-500 bg-emerald-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">{video.video_type}</Badge>
                          {video.player_name && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{video.player_name}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(video.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredVideos.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No videos found</p>
                    <Button
                      size="sm"
                      onClick={() => setShowUploadDialog(true)}
                      className="mt-3"
                    >
                      Upload First Video
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Player & Analysis */}
        <div className="space-y-6">
          {selectedVideo ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedVideo.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge>{selectedVideo.video_type}</Badge>
                        {selectedVideo.player_name && (
                          <Badge className="bg-blue-500">{selectedVideo.player_name}</Badge>
                        )}
                        <Badge variant="outline">
                          {videoAnnotations.length} annotations
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteVideo(selectedVideo.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedVideo.description && (
                    <p className="text-sm text-slate-600 mt-2">{selectedVideo.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    videoUrl={selectedVideo.file_url}
                    annotations={videoAnnotations}
                    onTimeUpdate={setCurrentTime}
                    showAnnotationTools={true}
                    onAddAnnotation={(time) => {
                      // Trigger annotation panel to add note
                      setCurrentTime(time);
                    }}
                  />
                </CardContent>
              </Card>

              <AnnotationPanel
                videoId={selectedVideo.id}
                annotations={videoAnnotations}
                currentTime={currentTime}
                isCoach={true}
                onUpdate={() => {
                  queryClient.invalidateQueries(['annotations']);
                }}
              />
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center text-slate-400">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
                <p className="text-sm">Select a video from the library to start analyzing</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <VideoUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        coachId={currentCoach?.id}
        onSuccess={() => {
          queryClient.invalidateQueries(['videos']);
        }}
      />
    </div>
  );
}