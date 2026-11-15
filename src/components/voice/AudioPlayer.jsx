import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Download, FastForward } from 'lucide-react';

export const AudioPlayer = ({ src, label = 'Voice Recording' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  if (!src) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-primary-light/60 border border-blue-200/60 rounded-xl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={togglePlay}
          style={{ backgroundColor: '#1769C2', color: '#FFFFFF' }}
          className="w-10 h-10 rounded-xl bg-[#1769C2] hover:bg-[#1358a3] text-white flex items-center justify-center shrink-0 transition-colors touch-target"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-dark mb-1">
            <Volume2 className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <audio
            ref={audioRef}
            src={src}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-8"
            controls
          />
        </div>
      </div>

      {/* Speed & Download Controls */}
      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200/40">
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-blue-200 text-primary-dark hover:bg-blue-50 transition-colors touch-target"
          title="Change playback speed"
          aria-label={`Playback speed: ${playbackRate}x`}
        >
          {playbackRate}x
        </button>

        <a
          href={src}
          download="grievance_voice_note.webm"
          className="p-1.5 rounded-lg bg-white border border-blue-200 text-primary hover:bg-blue-50 transition-colors touch-target flex items-center justify-center"
          title="Download audio recording"
          aria-label="Download audio recording"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
