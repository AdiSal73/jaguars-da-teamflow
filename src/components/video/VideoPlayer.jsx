import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, MessageSquare, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VideoPlayer({ 
  videoUrl, 
  annotations = [], 
  onTimeUpdate, 
  onAnnotationClick,
  showAnnotationTools = false,
  onAddAnnotation 
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentAnnotations = annotations.filter(
    a => Math.abs(a.timestamp - currentTime) < 0.5
  );

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-black group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />

        {/* Annotation Markers on Timeline */}
        <div className="absolute bottom-16 left-0 right-0 h-1 bg-transparent pointer-events-none">
          {annotations.map((annotation, idx) => (
            <div
              key={idx}
              className="absolute w-2 h-3 bg-yellow-400 rounded-full cursor-pointer pointer-events-auto"
              style={{ left: `${(annotation.timestamp / duration) * 100}%` }}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = annotation.timestamp;
                }
                onAnnotationClick?.(annotation);
              }}
            />
          ))}
        </div>

        {/* Current Annotations Display */}
        {currentAnnotations.length > 0 && (
          <div className="absolute top-4 left-4 right-4 space-y-2">
            {currentAnnotations.map((annotation, idx) => (
              <Badge
                key={idx}
                className="bg-yellow-400 text-black px-3 py-1 text-sm font-semibold cursor-pointer"
                onClick={() => onAnnotationClick?.(annotation)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                {annotation.content}
              </Badge>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="mb-3"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => skip(-10)} className="text-white hover:bg-white/20">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={togglePlay} className="text-white hover:bg-white/20">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => skip(10)} className="text-white hover:bg-white/20">
                <SkipForward className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {showAnnotationTools && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddAnnotation?.(currentTime)}
                  className="text-white hover:bg-white/20"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Add Note
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/20">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
              <Button size="icon" variant="ghost" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}