import React from 'react';
import Xarrow from 'react-xarrows';

const ActionArrow = ({ startId, endId, color }) => {
  if (!startId || !endId) {
    return null;
  }

  return (
    <Xarrow
      start={startId}
      end={endId}
      startAnchor="middle" /* Connect to the center of the start element */
      endAnchor="middle"   /* Connect to the center of the end element */
      color={color}
      strokeWidth={4}
      headSize={5}
      path="straight"
      showHead={true}
    />
  );
};

export default ActionArrow;
