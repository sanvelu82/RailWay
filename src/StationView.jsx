import React from 'react';
import { Stage, Layer, Line, Text, Rect, Shape, Circle } from 'react-konva';

const StationView = ({ stationData, generalSettings, isFullscreen = false, onFullscreenClick, occupiedBlocks = [], trains = [] }) => {
  const [size, setSize] = React.useState({ width: stationData.width || 600, height: 450 });
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);

  React.useEffect(() => {
    const contentWidth = stationData.width;
    const contentHeight = 450;

    if (isFullscreen) {
      // Define the desired initial zoom level for fullscreen
      const initialFullscreenScale = 1.45;

      const updateSizeAndPosition = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        setSize({ width: newWidth, height: newHeight });

        // Adjust the centering logic to account for the initial scale.
        // This centers the *scaled* content, not the original unscaled content.
        const centerX = (newWidth - contentWidth * initialFullscreenScale) / 2;
        const centerY = (newHeight - contentHeight * initialFullscreenScale) / 2;

        if (stageRef.current) {
          // Imperatively set the position and scale for immediate effect
          stageRef.current.position({ x: centerX, y: centerY });
          stageRef.current.scale({ x: initialFullscreenScale, y: initialFullscreenScale });
          // Update React state to match
          setScale(initialFullscreenScale);
        }
      };

      updateSizeAndPosition();
      window.addEventListener('resize', updateSizeAndPosition);
      
      // Cleanup function to remove the event listener
      return () => window.removeEventListener('resize', updateSizeAndPosition);
    } else {
      // Reset scale and position when exiting fullscreen
      if (stageRef.current) {
        stageRef.current.position({ x: 0, y: 0 });
        stageRef.current.scale({ x: 1, y: 1 });
        setScale(1);
      }
      setSize({ width: contentWidth, height: contentHeight });
    }
  }, [isFullscreen, stationData.width]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  const drawSwitch = (ctx, shape) => {
    const [x1, y1, x2, y2] = shape.getAttr('points');
    const type = shape.getAttr('switchType');
    ctx.beginPath();
    if (type === 'diamond') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(x1, y2);
      ctx.lineTo(x2, y1);
    } else {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeShape(shape);
  };

  const getPointOnLine = (p1, p2, ratio) => ({
    x: p1[0] + (p2[0] - p1[0]) * ratio,
    y: p1[1] + (p2[1] - p1[1]) * ratio,
  });

  return (
    <div className={`station-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="station-header"><h3>{stationData.name} ({stationData.code})</h3></div>
      <button className="fullscreen-button" onClick={onFullscreenClick}>
        {isFullscreen ? 'Exit' : 'FS'}
      </button>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={isFullscreen ? handleWheel : undefined}
        draggable={isFullscreen}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          {/* Platforms */}
          {stationData.platforms?.map(platform => {
            const track = stationData.tracks.find(t => t.id === platform.trackId);
            if (!track) return null;
            return <Rect key={`platform-${track.id}`} x={track.points[0]} y={track.points[1] - 8} width={track.points[2] - track.points[0]} height={16} fill={generalSettings.platformColor} cornerRadius={2} />;
          })}

          {/* Tracks and Buffers */}
          {stationData.tracks.map(track => (
            <React.Fragment key={track.id}>
              <Line points={track.points} stroke={generalSettings.trackColor} strokeWidth={3} lineCap="round" />
              {track.buffer && (
                <Line points={track.buffer === 'east' ? [track.points[2], track.points[3] - 8, track.points[2], track.points[3] + 8] : [track.points[0], track.points[1] - 8, track.points[0], track.points[1] + 8]} stroke={generalSettings.trackColor} strokeWidth={5} lineCap="round" />
              )}
            </React.Fragment>
          ))}

          {/* Switches */}
          {stationData.switches.map(s => (
            <Shape key={s.id} points={s.points} switchType={s.type} sceneFunc={drawSwitch} stroke={generalSettings.trackColor} strokeWidth={3} lineCap="round" />
          ))}

          {/* Labels */}
          {stationData.platformLabels?.map(label => (
            <Text key={label.text} text={label.text} x={label.x} y={label.y} fill={generalSettings.labelColor} fontSize={10} fontStyle="bold" />
          ))}
          {stationData.trackLabels?.map(label => (
            <Text key={label.text} text={label.text} x={label.x} y={label.y} fill={generalSettings.labelColor} fontSize={10} />
          ))}
          {stationData.pointLabels?.map(label => (
            <Text key={label.text} text={label.text} x={label.x} y={label.y} fill={generalSettings.labelColor} fontSize={10} />
          ))}

          {/* Signals */}
          {stationData.signals?.map(signal => {
            const track = stationData.tracks.find(t => t.id === signal.trackId);
            if (!track) return null;
            const pos = getPointOnLine(track.points, [track.points[2], track.points[3]], signal.positionRatio);
            return <Circle key={signal.id} x={pos.x} y={pos.y - 12} radius={4} fill={signal.state === 'danger' ? generalSettings.signalDangerColor : generalSettings.signalClearColor} />;
          })}

          {/* Occupied Blocks */}
          {occupiedBlocks.map(block => {
            const track = stationData.tracks.find(t => t.id === block.trackId);
            if (!track) return null;
            const start = getPointOnLine(track.points, [track.points[2], track.points[3]], block.startRatio);
            const end = getPointOnLine(track.points, [track.points[2], track.points[3]], block.endRatio);
            return <Line key={`${stationData.code}-${block.trackId}`} points={[start.x, start.y, end.x, end.y]} stroke={generalSettings.occupiedColor} strokeWidth={7} />;
          })}

          {/* Trains */}
          {trains.map(train => {
            const track = stationData.tracks.find(t => t.id === train.trackId);
            if (!track) return null;
            const pos = getPointOnLine(track.points, [track.points[2], track.points[3]], train.positionRatio);
            return <Rect key={train.id} x={pos.x - 15} y={pos.y - 4} width={30} height={8} fill={generalSettings.trainColor} cornerRadius={2} />;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default StationView;