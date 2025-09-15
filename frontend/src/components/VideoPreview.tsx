import React, { useState, useEffect, useRef } from 'react';

interface VideoPreviewProps {
  file: File;
  onTrimChange?: (startTime: number, endTime: number, duration: number) => void;
  showTrimControls?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ file, onTrimChange, showTrimControls = true }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Create object URL for the file
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Cleanup function to revoke the object URL
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
      
      // Notify parent component
      if (onTrimChange) {
        onTrimChange(0, videoDuration, videoDuration);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleStartTimeChange = (value: number) => {
    setStartTime(value);
    if (value >= endTime) {
      const newEndTime = Math.min(value + 1, duration);
      setEndTime(newEndTime);
      if (onTrimChange) {
        onTrimChange(value, newEndTime, duration);
      }
    } else {
      if (onTrimChange) {
        onTrimChange(value, endTime, duration);
      }
    }
  };

  const handleEndTimeChange = (value: number) => {
    setEndTime(value);
    if (value <= startTime) {
      const newStartTime = Math.max(value - 1, 0);
      setStartTime(newStartTime);
      if (onTrimChange) {
        onTrimChange(newStartTime, value, duration);
      }
    } else {
      if (onTrimChange) {
        onTrimChange(startTime, value, duration);
      }
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-4">
      {/* File Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">File Name:</span>
            <p className="text-gray-600 truncate">{file.name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">File Size:</span>
            <p className="text-gray-600">{formatFileSize(file.size)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">File Type:</span>
            <p className="text-gray-600">{file.type}</p>
          </div>
        </div>
      </div>

      {/* Video Preview */}
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          controls
          className="w-full max-h-96 object-contain"
          preload="metadata"
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Trim Controls */}
      {duration > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-800">Trim Video</h3>
          
          {/* Timeline Visualization */}
          <div className="relative">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 opacity-50"
                style={{
                  marginLeft: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`
                }}
              />
              <div 
                className="absolute top-0 w-1 h-2 bg-red-500"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Time Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time: {formatTime(startTime)}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => seekToTime(startTime)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                >
                  Go
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time: {formatTime(endTime)}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => seekToTime(endTime)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* Trim Info */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Selected duration: {formatTime(endTime - startTime)} 
              {duration > 0 && ` (${Math.round(((endTime - startTime) / duration) * 100)}% of original)`}
            </p>
          </div>
        </div>
      )}

      {/* Preview Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Preview your video and set trim points. The conversion will use your selected time range.</p>
      </div>
    </div>
  );
};

export default VideoPreview;