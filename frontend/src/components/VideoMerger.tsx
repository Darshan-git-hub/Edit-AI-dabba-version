import React, { useState, useRef } from 'react';
import axios from 'axios';

interface VideoMergerProps {
  onMergeComplete: (result: { fileId: string; downloadUrl: string }) => void;
  onMergeStart: () => void;
  isMerging: boolean;
}

const VideoMerger: React.FC<VideoMergerProps> = ({
  onMergeComplete,
  onMergeStart,
  isMerging
}) => {
  const [videos, setVideos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name} is not a valid video file`);
        return;
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        setError(`${file.name} is too large (max 100MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setVideos(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const moveVideo = (fromIndex: number, toIndex: number) => {
    const newVideos = [...videos];
    const [movedVideo] = newVideos.splice(fromIndex, 1);
    newVideos.splice(toIndex, 0, movedVideo);
    setVideos(newVideos);
  };

  const handleMerge = async () => {
    if (videos.length < 2) {
      setError('Please select at least 2 videos to merge');
      return;
    }

    onMergeStart();
    setError('');

    const formData = new FormData();
    videos.forEach((video, index) => {
      formData.append(`video${index}`, video);
    });
    formData.append('videoCount', videos.length.toString());

    try {
      const response = await axios.post('http://localhost:5000/merge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const downloadUrl = `http://localhost:5000/download/${response.data.file_id}`;
        onMergeComplete({
          fileId: response.data.file_id,
          downloadUrl
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Merge failed. Please try again.');
      onMergeStart(); // Reset merging state
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Video Merger</h2>
        <p className="text-gray-600 text-sm">Combine multiple videos into one</p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">🎬➕🎬</div>
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop videos here, or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Choose Videos
            </button>
          </div>
        </div>
      </div>

      {/* Selected Videos List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">
            Selected Videos ({videos.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {videos.map((video, index) => (
              <div
                key={`${video.name}-${index}`}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {video.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Move Up */}
                  <button
                    onClick={() => index > 0 && moveVideo(index, index - 1)}
                    disabled={index === 0}
                    className={`p-1 rounded ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ⬆️
                  </button>
                  
                  {/* Move Down */}
                  <button
                    onClick={() => index < videos.length - 1 && moveVideo(index, index + 1)}
                    disabled={index === videos.length - 1}
                    className={`p-1 rounded ${
                      index === videos.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ⬇️
                  </button>
                  
                  {/* Remove */}
                  <button
                    onClick={() => removeVideo(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Merge Button */}
      {videos.length >= 2 && (
        <div className="text-center">
          <button
            onClick={handleMerge}
            disabled={isMerging}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              isMerging
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isMerging ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Merging Videos...
              </span>
            ) : (
              `🔗 Merge ${videos.length} Videos`
            )}
          </button>
          
          <p className="text-sm text-gray-600 mt-2">
            Videos will be merged in the order shown above
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoMerger;