'use client';
import { useEffect, useRef, useState } from 'react';
import dashjs from 'dashjs';

export default function DashPlayer() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [url, setUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    errors: [],
    networkInfo: {
      downloadBitrate: 0,
      latency: 0,
      bufferLength: 0,
    },
    metadata: {
      duration: 0,
      resolution: '',
      codecs: '',
    },
    qualityLevels: [],
    currentQuality: '',
  });

  useEffect(() => {
    // Cleanup function to destroy player when component unmounts
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const initPlayer = (mpd_url) => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const player = dashjs.MediaPlayer().create();
    playerRef.current = player;

    player.initialize(videoRef.current, mpd_url, true);

    // Set up event listeners for player information
    player.on(dashjs.MediaPlayer.events.ERROR, (error) => {
      setPlayerInfo(prev => ({
        ...prev,
        errors: [...prev.errors, error.error.message]
      }));
    });

    player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, () => {
      const videoQualities = player.getBitrateInfoListFor('video');
      const currentQuality = player.getQualityFor('video');
      setPlayerInfo(prev => ({
        ...prev,
        qualityLevels: videoQualities,
        currentQuality: videoQualities[currentQuality]?.bitrate 
          ? `${Math.round(videoQualities[currentQuality].bitrate / 1000)} Kbps`
          : 'Unknown'
      }));
    });

    player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, () => {
      const duration = player.duration();
      const streamInfo = player.getActiveStream().getStreamInfo();
      setPlayerInfo(prev => ({
        ...prev,
        metadata: {
          duration: Math.round(duration),
          resolution: `${streamInfo.manifestInfo.video?.[0]?.width || 'Unknown'}x${streamInfo.manifestInfo.video?.[0]?.height || 'Unknown'}`,
          codecs: streamInfo.manifestInfo.video?.[0]?.codec || 'Unknown',
        }
      }));
    });

    // Set up periodic stats update
    const statsInterval = setInterval(() => {
      if (player) {
        setPlayerInfo(prev => ({
          ...prev,
          networkInfo: {
            downloadBitrate: Math.round(player.getAverageThroughput('video') / 1000),
            latency: Math.round(player.getCurrentLiveLatency() * 1000),
            bufferLength: Math.round(player.getBufferLength() * 10) / 10
          }
        }));
      }
    }, 1000);

    player.updateSettings({
      streaming: {
        // lowLatencyEnabled: true,
        abr: {
          useDefaultABRRules: true,
          initialBitrate: {
            audio: -1,
            video: -1
          },
          autoSwitchBitrate: {
            audio: true,
            video: true
          }
        }
      }
    });

    setIsPlaying(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      initPlayer(url);
    }
  };

  return (
    <div className="flex gap-4 w-full max-w-6xl mx-auto p-4">
      {/* Left panel - Player */}
      <div className="flex-1 flex flex-col space-y-4 bg-black/50 rounded-lg backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter MPD URL"
          className="flex-1 px-4 py-2 rounded bg-white/10 text-yellow-300 border border-yellow-300/50 focus:outline-none focus:border-yellow-300"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-300 text-red-600 rounded hover:bg-yellow-400"
        >
          Play
        </button>
      </form>

      <div className="w-full aspect-video bg-black/50 rounded overflow-hidden">
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
        />
      </div>

      {isPlaying && (
        <div className="text-sm text-yellow-300">
          Streaming: {url}
        </div>
      )}
      </div>

      {/* Right panel - Info */}
      <div className="w-96 bg-black/50 rounded-lg backdrop-blur-sm p-4 text-yellow-300 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2">视频信息</h3>
          <div className="space-y-1">
            <p>时长: {playerInfo.metadata.duration}秒</p>
            <p>分辨率: {playerInfo.metadata.resolution}</p>
            <p>编码: {playerInfo.metadata.codecs}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2">网络状态</h3>
          <div className="space-y-1">
            <p>下载速率: {playerInfo.networkInfo.downloadBitrate} Kbps</p>
            <p>延迟: {playerInfo.networkInfo.latency} ms</p>
            <p>缓冲区: {playerInfo.networkInfo.bufferLength} 秒</p>
            <p>当前码率: {playerInfo.currentQuality}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2">错误信息</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {playerInfo.errors.length === 0 ? (
              <p className="text-green-400">无错误</p>
            ) : (
              playerInfo.errors.map((error, index) => (
                <p key={index} className="text-red-400 text-sm">{error}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
