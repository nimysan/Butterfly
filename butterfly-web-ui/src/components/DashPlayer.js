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
      bandwidthEstimate: 0,
    },
    metadata: {
      duration: 0,
      resolution: '',
      codecs: '',
      type: '',
      mimeType: '',
    },
    qualityLevels: [],
    currentQuality: '',
    stats: {
      droppedFrames: 0,
      fps: 0,
    },
    settings: {
      targetLatency: 3,
      maxDrift: 0.5,
      abrEnabled: true,
      fastSwitchEnabled: true,
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

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
        const dashMetrics = player.getDashMetrics();
        const streamInfo = player.getActiveStream()?.getStreamInfo();
        const stats = player.getMetricsFor('video');
        const bandwidthEstimate = dashMetrics.getBandwidthForRepresentation('video', streamInfo?.currentTime);
        const droppedFrames = stats?.droppedFrames ?? 0;
        const fps = stats?.fps ?? 0;

        setPlayerInfo(prev => ({
          ...prev,
          networkInfo: {
            downloadBitrate: Math.round(player.getAverageThroughput('video') / 1000),
            bandwidthEstimate: Math.round(bandwidthEstimate / 1000),
            latency: Math.round(player.getCurrentLiveLatency() * 1000),
            bufferLength: Math.round(player.getBufferLength() * 10) / 10
          },
          stats: {
            droppedFrames,
            fps: Math.round(fps)
          }
        }));
      }
    }, 1000);

    // Additional event listeners for stream information
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      const streamInfo = player.getActiveStream()?.getStreamInfo();
      const mediaInfo = streamInfo?.manifestInfo?.video?.[0];
      
      setPlayerInfo(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          type: streamInfo?.manifestInfo?.type || 'Unknown',
          mimeType: mediaInfo?.mimeType || 'Unknown',
          resolution: `${mediaInfo?.width || 'Unknown'}x${mediaInfo?.height || 'Unknown'}`,
          codecs: mediaInfo?.codec || 'Unknown',
          duration: Math.round(player.duration())
        }
      }));
    });

    // Quality change monitoring
    player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, () => {
      const videoQualities = player.getBitrateInfoListFor('video');
      setPlayerInfo(prev => ({
        ...prev,
        qualityLevels: videoQualities.map(quality => ({
          width: quality.width,
          height: quality.height,
          bitrate: quality.bitrate,
          label: `${quality.width}x${quality.height} @ ${Math.round(quality.bitrate / 1000)}Kbps`
        }))
      }));
    });

    // Apply initial settings
    player.updateSettings({
      streaming: {
        liveDelay: playerInfo.settings.targetLatency,
        abr: {
          enabled: playerInfo.settings.abrEnabled,
          useDefaultABRRules: true,
          fastSwitchEnabled: playerInfo.settings.fastSwitchEnabled,
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
      <div className="w-[480px] bg-black/50 rounded-lg backdrop-blur-sm p-4 text-yellow-300 space-y-6 overflow-y-auto max-h-[800px]">
        {/* Stream Info */}
        <div>
          <h3 className="text-lg font-bold mb-2">流信息</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium">类型:</p>
              <p>{playerInfo.metadata.type || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">MIME类型:</p>
              <p>{playerInfo.metadata.mimeType || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">时长:</p>
              <p>{playerInfo.metadata.duration} 秒</p>
            </div>
            <div>
              <p className="font-medium">分辨率:</p>
              <p>{playerInfo.metadata.resolution}</p>
            </div>
            <div>
              <p className="font-medium">编码:</p>
              <p>{playerInfo.metadata.codecs}</p>
            </div>
          </div>
        </div>

        {/* Playback Stats */}
        <div>
          <h3 className="text-lg font-bold mb-2">播放状态</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium">下载速率:</p>
              <p>{playerInfo.networkInfo.downloadBitrate} Kbps</p>
            </div>
            <div>
              <p className="font-medium">带宽预估:</p>
              <p>{playerInfo.networkInfo.bandwidthEstimate} Kbps</p>
            </div>
            <div>
              <p className="font-medium">延迟:</p>
              <p>{playerInfo.networkInfo.latency} ms</p>
            </div>
            <div>
              <p className="font-medium">缓冲区:</p>
              <p>{playerInfo.networkInfo.bufferLength} 秒</p>
            </div>
            <div>
              <p className="font-medium">当前码率:</p>
              <p>{playerInfo.currentQuality}</p>
            </div>
            <div>
              <p className="font-medium">帧率:</p>
              <p>{playerInfo.stats.fps} FPS</p>
            </div>
            <div>
              <p className="font-medium">丢帧:</p>
              <p>{playerInfo.stats.droppedFrames}</p>
            </div>
          </div>
        </div>

        {/* Quality Levels */}
        <div>
          <h3 className="text-lg font-bold mb-2">可用质量</h3>
          <div className="space-y-1 text-sm">
            {playerInfo.qualityLevels.map((quality, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{quality.width}x{quality.height}</span>
                <span>{Math.round(quality.bitrate / 1000)} Kbps</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-lg font-bold mb-2 flex items-center gap-2"
          >
            高级设置
            <span className="text-sm">
              {showAdvanced ? '▼' : '▶'}
            </span>
          </button>
          
          {showAdvanced && (
            <div className="space-y-4 text-sm">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={playerInfo.settings.abrEnabled}
                    onChange={(e) => {
                      const newSettings = {
                        ...playerInfo.settings,
                        abrEnabled: e.target.checked
                      };
                      setPlayerInfo(prev => ({
                        ...prev,
                        settings: newSettings
                      }));
                      if (playerRef.current) {
                        playerRef.current.updateSettings({
                          streaming: {
                            abr: {
                              enabled: e.target.checked
                            }
                          }
                        });
                      }
                    }}
                  />
                  启用自适应码率
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={playerInfo.settings.fastSwitchEnabled}
                    onChange={(e) => {
                      const newSettings = {
                        ...playerInfo.settings,
                        fastSwitchEnabled: e.target.checked
                      };
                      setPlayerInfo(prev => ({
                        ...prev,
                        settings: newSettings
                      }));
                      if (playerRef.current) {
                        playerRef.current.updateSettings({
                          streaming: {
                            abr: {
                              fastSwitchEnabled: e.target.checked
                            }
                          }
                        });
                      }
                    }}
                  />
                  快速切换质量
                </label>
              </div>

              <div>
                <label className="block mb-1">目标延迟 (秒)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={playerInfo.settings.targetLatency}
                  onChange={(e) => {
                    const newSettings = {
                      ...playerInfo.settings,
                      targetLatency: parseFloat(e.target.value)
                    };
                    setPlayerInfo(prev => ({
                      ...prev,
                      settings: newSettings
                    }));
                    if (playerRef.current) {
                      playerRef.current.updateSettings({
                        streaming: {
                          liveDelay: parseFloat(e.target.value)
                        }
                      });
                    }
                  }}
                  className="w-full bg-white/10 rounded px-2 py-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Errors */}
        <div>
          <h3 className="text-lg font-bold mb-2">错误信息</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto text-sm">
            {playerInfo.errors.length === 0 ? (
              <p className="text-green-400">无错误</p>
            ) : (
              playerInfo.errors.map((error, index) => (
                <p key={index} className="text-red-400">{error}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
