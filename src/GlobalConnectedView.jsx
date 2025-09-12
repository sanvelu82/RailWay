import React from 'react';
import { Stage, Layer, Line, Text, Rect } from 'react-konva';

const GlobalConnectedView = ({ layout, setFullscreen }) => {
  const stationPositions = {};
  const stationCodes = Object.keys(layout.stations);
  const canvasWidth = window.innerWidth * 0.9;
  
  stationCodes.forEach((code, index) => {
    stationPositions[code] = {
      x: 100 + index * (canvasWidth / (stationCodes.length -1)),
      y: window.innerHeight / 2,
    };
  });

  return (
    <div className="global-connected-view">
      <button className="back-button" onClick={() => setFullscreen('dashboard')}>
        Back to Dashboard
      </button>
      <Stage width={window.innerWidth} height={window.innerHeight} draggable>
        <Layer>
          {/* Draw Trunk Lines */}
          {layout.trunkLines.map((line, index) => {
            const fromPos = stationPositions[line.from];
            const toPos = stationPositions[line.to];
            if (!fromPos || !toPos) return null;
            return <Line key={index} points={[fromPos.x, fromPos.y, toPos.x, toPos.y]} stroke={layout.general.trackColor} strokeWidth={5} />;
          })}
          {/* Draw Station Nodes */}
          {Object.entries(stationPositions).map(([code, pos]) => (
            <React.Fragment key={code}>
              <Rect x={pos.x - 40} y={pos.y - 20} width={80} height={40} fill="#333" stroke="#888" cornerRadius={5} />
              <Text text={code} x={pos.x - 15} y={pos.y - 8} fill={layout.general.labelColor} fontSize={18} />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default GlobalConnectedView;