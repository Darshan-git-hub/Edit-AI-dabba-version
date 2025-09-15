import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import VideoPreview from './components/VideoPreview';
import TrimControls from './components/TrimControls';
import VideoMerger from './components/VideoMerger';

interface ConversionResult {
  fileId: string;
  downloadUrl: string;
}

interface TrimData {
  startTime: number;
  endTime: number;
  duration: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedVideo, setConvertedVideo] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [trimData, setTrimData] = useState<TrimData | null>(null);
  const [currentMode, setCurrentMode] = useState<'single' | 'merge'>('single');
  const [isMerging, setIsMerging] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setConvertedVideo(null); // Clear previous conversion
    setTrimData(null); // Clear previous trim data
  };

  const handleTrimChange = (startTime: number, endTime: number, duration: number) => {
    setTrimData({ startTime, endTime, duration });
  };

  const handleConversionComplete = (result: ConversionResult) => {
    setConvertedVideo(result);
    setIsConverting(false);
  };

  const handleConversionStart = () => {
    setIsConverting(true);
    setConvertedVideo(null);
  };

  const handleMergeComplete = (result: ConversionResult) => {
    setConvertedVideo(result);
    setIsMerging(false);
  };

  const handleMergeStart = () => {
    setIsMerging(true);
    setConvertedVideo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Video Editor & Converter
              </h1>
              <p className="text-gray-600 text-sm">
                Upload, trim, convert, and merge your videos with ease
              </p>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentMode('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentMode === 'single'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📹 Single Video
              </button>
              <button
                onClick={() => setCurrentMode('merge')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentMode === 'merge'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔗 Merge Videos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">
          <div className="p-6">
            {currentMode === 'single' ? (
              <>
                <VideoUploader
                  onFileSelected={handleFileSelected}
                  onConversionComplete={handleConversionComplete}
                  onConversionStart={handleConversionStart}
                  isConverting={isConverting}
                  selectedFile={selectedFile}
                  trimData={trimData}
                />
                
                {/* Trim Controls in Sidebar */}
                {selectedFile && trimData && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Trim Controls</h3>
                    <TrimControls 
                      trimData={trimData}
                      onTrimChange={handleTrimChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <VideoMerger
                onMergeComplete={handleMergeComplete}
                onMergeStart={handleMergeStart}
                isMerging={isMerging}
              />
            )}
          </div>
        </div>

        {/* Right Content - Video Preview */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {convertedVideo ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {currentMode === 'merge' ? 'Merged Video' : 'Processed Video'}
                </h2>
                
                <VideoPlayer
                  videoUrl={convertedVideo.downloadUrl}
                  fileId={convertedVideo.fileId}
                />
              </div>
            ) : selectedFile && currentMode === 'single' ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Video Preview
                </h2>
                
                <VideoPreview 
                  file={selectedFile} 
                  onTrimChange={handleTrimChange}
                  showTrimControls={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">
                    {currentMode === 'merge' ? '🎬🔗🎬' : '🎬'}
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    {currentMode === 'merge' ? 'No Videos to Merge' : 'No Video Selected'}
                  </h3>
                  <p>
                    {currentMode === 'merge' 
                      ? 'Add multiple videos from the sidebar to merge them'
                      : 'Upload a video from the sidebar to get started'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;