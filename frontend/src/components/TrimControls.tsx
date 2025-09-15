import React from 'react';

interface TrimData {
  startTime: number;
  endTime: number;
  duration: number;
}

interface TrimControlsProps {
  trimData: TrimData;
  onTrimChange: (startTime: number, endTime: number, duration: number) => void;
}

const TrimControls: React.FC<TrimControlsProps> = ({ trimData, onTrimChange }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleStartTimeChange = (value: number) => {
    const newStartTime = value;
    if (newStartTime >= trimData.endTime) {
      const newEndTime = Math.min(newStartTime + 1, trimData.duration);
      onTrimChange(newStartTime, newEndTime, trimData.duration);
    } else {
      onTrimChange(newStartTime, trimData.endTime, trimData.duration);
    }
  };

  const handleEndTimeChange = (value: number) => {
    const newEndTime = value;
    if (newEndTime <= trimData.startTime) {
      const newStartTime = Math.max(newEndTime - 1, 0);
      onTrimChange(newStartTime, newEndTime, trimData.duration);
    } else {
      onTrimChange(trimData.startTime, newEndTime, trimData.duration);
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline Visualization */}
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 opacity-60"
            style={{
              marginLeft: `${(trimData.startTime / trimData.duration) * 100}%`,
              width: `${((trimData.endTime - trimData.startTime) / trimData.duration) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0:00</span>
          <span>{formatTime(trimData.duration)}</span>
        </div>
      </div>

      {/* Start Time Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Time: {formatTime(trimData.startTime)}
        </label>
        <input
          type="range"
          min="0"
          max={trimData.duration}
          step="0.1"
          value={trimData.startTime}
          onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      {/* End Time Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Time: {formatTime(trimData.endTime)}
        </label>
        <input
          type="range"
          min="0"
          max={trimData.duration}
          step="0.1"
          value={trimData.endTime}
          onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Duration Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Selected Duration:</span>
            <span className="font-medium">{formatTime(trimData.endTime - trimData.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Original Duration:</span>
            <span>{formatTime(trimData.duration)}</span>
          </div>
          <div className="flex justify-between">
            <span>Percentage:</span>
            <span className="font-medium">
              {Math.round(((trimData.endTime - trimData.startTime) / trimData.duration) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimControls;