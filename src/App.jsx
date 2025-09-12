import React, { useState, useEffect, useRef } from 'react';
import DashboardView from './DashboardView';
import StationView from './StationView';
import './index.css';

function App() {
  const [layout, setLayout] = useState(null);
  const [fullscreenMode, setFullscreenMode] = useState('dashboard');
  const [trains, setTrains] = useState([]);
  
  const requestRef = useRef();
  const lastTimeRef = useRef(0);

  useEffect(() => {
    fetch('/layout.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setLayout(data);
        setTrains(data.trains || []);
      })
      .catch(error => {
        console.error("Error loading or parsing layout.json:", error);
      });
  }, []);

  const animate = (time) => {
    if(layout) {
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        if (deltaTime > 0) {
            setTrains(prevTrains => prevTrains.map(train => {
                const station = layout.stations[train.stationCode];
                if (!station) return train;
                const track = station.tracks.find(t => t.id === train.trackId);
                if (!track) return train;

                let newPositionRatio = train.positionRatio + train.speed * (deltaTime / 100);
                if (newPositionRatio > 1) newPositionRatio = 0;
                if (newPositionRatio < 0) newPositionRatio = 1;

                return { ...train, positionRatio: newPositionRatio };
            }));
        }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [layout]);

  if (!layout) {
    return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading Railway Network Data...</div>;
  }

  const renderView = () => {
    if (fullscreenMode === 'dashboard') {
      return <DashboardView layout={layout} setFullscreen={setFullscreenMode} occupiedBlocks={layout.occupiedBlocks} trains={trains} />;
    }
    
    const stationData = layout.stations[fullscreenMode];
    return (
      <StationView
        stationData={{...stationData, code: fullscreenMode}}
        generalSettings={layout.general}
        isFullscreen={true}
        onFullscreenClick={() => setFullscreenMode('dashboard')}
        occupiedBlocks={layout.occupiedBlocks.filter(b => b.stationCode === fullscreenMode)}
        trains={trains.filter(t => t.stationCode === fullscreenMode)}
      />
    );
  };

  return <div className="app-container">{renderView()}</div>;
}

export default App;