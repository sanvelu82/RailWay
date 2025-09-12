import React, { useState, useRef } from 'react';
import { Stage, Layer, Line, Shape } from 'react-konva';
import StationView from './StationView';

const DashboardView = ({ layout, setFullscreen, occupiedBlocks, trains }) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  const getTrackEndPoint = (stationCode, trackId, start = false) => {
    const station = layout.stations[stationCode];
    const track = station.tracks.find(t => t.id === trackId);
    if(!station || !track) return null;
    
    const pointIndex = start ? 0 : 2;
    return {
      x: station.position[0] + track.points[pointIndex],
      y: station.position[1] + track.points[pointIndex + 1]
    };
  };

  return (
    <div
      className="dashboard-view"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      <div className="map-canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
        {Object.entries(layout.stations).map(([stationCode, stationData]) => (
          stationData.name &&
          <div key={stationCode} style={{ position: 'absolute', left: `${stationData.position[0]}px`, top: `${stationData.position[1]}px` }}>
            <StationView
              stationData={{ ...stationData, code: stationCode }}
              generalSettings={layout.general}
              onFullscreenClick={() => setFullscreen(stationCode)}
              occupiedBlocks={occupiedBlocks.filter(b => b.stationCode === stationCode)}
              trains={trains.filter(t => t.stationCode === stationCode)}
            />
          </div>
        ))}
        
        <Stage width={3000} height={2000} style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, pointerEvents: 'none' }}>
           <Layer>
             {layout.trunkLines.map((line, index) => {
                const fromPoint = getTrackEndPoint(line.from, line.fromTrackId);
                const toPoint = getTrackEndPoint(line.to, line.toTrackId, true);
                if(!fromPoint || !toPoint) return null;
                
                if (line.vertical) {
                  const baseRadius = 50; // You can adjust the tightness of the curve
                  const trackSeparation = 30; // Distance between main_up and main_down

                  // This logic correctly determines if a track is on the inside or outside of a turn,
                  // regardless of which direction the turn is.
                  const isLeftTurn = toPoint.x < fromPoint.x;
                  const isUpwardTurn = toPoint.y < fromPoint.y;
                  const isDownTrack = line.fromTrackId.includes('down');
                  
                  let radius;
                  if ((isLeftTurn && isDownTrack) || (!isLeftTurn && !isDownTrack) || (isUpwardTurn && isDownTrack) || (!isUpwardTurn && !isDownTrack)) {
                     // Conditions where this track is on the outside of the curve
                     radius = baseRadius + trackSeparation;
                  } else {
                    // Conditions where this track is on the inside of the curve
                    radius = baseRadius;
                  }

                  // A simpler but less robust way to determine radius for your specific layout
                  // const radius = line.fromTrackId.includes('down') ? baseRadius + trackSeparation : baseRadius;


                  return (
                    <Shape
                      key={index}
                      sceneFunc={(ctx, shape) => {
                        ctx.beginPath();
                        ctx.moveTo(fromPoint.x, fromPoint.y);
                        ctx.arcTo(fromPoint.x, toPoint.y, toPoint.x, toPoint.y, radius);
                        ctx.lineTo(toPoint.x, toPoint.y);
                        ctx.strokeShape(shape);
                      }}
                      stroke={layout.general.trackColor}
                      strokeWidth={5}
                      dash={[10, 5]}
                    />
                  );
                }

                const points = [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y];
                return <Line key={index} points={points} stroke={layout.general.trackColor} strokeWidth={5} dash={[10, 5]}/>
             })}
           </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DashboardView;