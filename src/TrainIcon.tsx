import React from 'react';
import { Group, Path } from 'react-konva';

const TrainIcon = ({ x, y, rotation, color }) => {
  return (
    <Group x={x} y={y} rotation={rotation} offsetX={16} offsetY={6}>
      <Path
        data="M29.5,10H2.5C1.1,10,0,8.9,0,7.5v-5C0,1.1,1.1,0,2.5,0h27C30.9,0,32,1.1,32,2.5v5C32,8.9,30.9,10,29.5,10z M2.5,1C1.7,1,1,1.7,1,2.5v5C1,9.3,1.7,10,2.5,10h27c0.8,0,1.5-0.7,1.5-1.5v-5C31,1.7,30.3,1,29.5,1H2.5z M4,8C3.4,8,3,7.6,3,7s0.4-1,1-1s1,0.4,1,1S4.6,8,4,8z M28,8c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S28.6,8,28,8z M6,5h2v2H6V5z M25,3h-2V2h2V3z M22,3h-2V2h2V3z"
        fill={color}
        scale={{ x: 0.8, y: 0.8 }}
      />
    </Group>
  );
};

export default TrainIcon;