import React, { useEffect, useState } from "react";
import DashboardView from "./DashboardView";

const Simulation = ({ initialLayout }) => {
  const [trains, setTrains] = useState(initialLayout.trains);
  const [signals, setSignals] = useState(initialLayout.signals);

  // Main animation loop
  useEffect(() => {
    let frameId;

    const tick = () => {
      setTrains((prev) =>
        prev.map((train) => {
          let newPos = train.positionRatio + train.speed;

          if (newPos > 1) {
            const next = findNextStation(initialLayout.trunkLines, train.stationCode);
            if (next) {
              return { ...train, stationCode: next, positionRatio: 0 };
            }
            newPos = 1;
          }

          if (newPos < 0) {
            const prevSt = findPrevStation(initialLayout.trunkLines, train.stationCode);
            if (prevSt) {
              return { ...train, stationCode: prevSt, positionRatio: 1 };
            }
            newPos = 0;
          }

          return { ...train, positionRatio: newPos };
        })
      );

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [initialLayout]);

  // Update signals when trains move
  useEffect(() => {
    const occupied = deriveOccupiedBlocks(trains);
    setSignals((prev) =>
      prev.map((sig) => {
        const blocked = occupied.find(
          (b) =>
            b.stationCode === sig.stationCode &&
            b.trackId === sig.trackId &&
            b.startRatio <= sig.positionRatio &&
            b.endRatio >= sig.positionRatio
        );
        return { ...sig, status: blocked ? "danger" : "clear" };
      })
    );
  }, [trains]);

  return (
    <DashboardView
      layout={initialLayout}
      trains={trains}
      signals={signals}
      occupiedBlocks={deriveOccupiedBlocks(trains)}
      setFullscreen={() => {}}
    />
  );
};

// Helpers
const deriveOccupiedBlocks = (trains) =>
  trains.map((t) => ({
    stationCode: t.stationCode,
    trackId: t.trackId,
    startRatio: Math.max(0, t.positionRatio - 0.05),
    endRatio: Math.min(1, t.positionRatio + 0.05),
  }));

const findNextStation = (lines, current) => {
  for (const line of lines) {
    const idx = line.indexOf(current);
    if (idx !== -1 && idx < line.length - 1) return line[idx + 1];
  }
  return null;
};

const findPrevStation = (lines, current) => {
  for (const line of lines) {
    const idx = line.indexOf(current);
    if (idx > 0) return line[idx - 1];
  }
  return null;
};

export default Simulation;
