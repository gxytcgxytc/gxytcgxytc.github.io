import React from 'react';
import { Tag, Button, Row, Col, Card } from 'antd';
import { type MapItem } from '../../../hooks/useMatchProcess';

interface MappoolRenderProps {
  mapPool: MapItem[];
  onMapSelect: (mapId: string, mod: string) => void;
  currentStage: string;
}

export const getModColor = (mod: string): string => {
  const colors: Record<string, string> = {
    NM: 'default',
    HD: 'orange',
    HR: 'red',
    DT: 'blue',
    FM: 'green',
    TB: 'purple',
  };
  return colors[mod] || 'default';
};

export const tagRender = (mapId: string, mod: string) => (
  <Tag color={getModColor(mod)} key={mapId}>{mapId}-{mod}</Tag>
);

const MappoolRender: React.FC<MappoolRenderProps> = ({ mapPool, onMapSelect, currentStage }) => {
  // 根据mod返回颜色


  // 分离Starter (S) 和 Counter (C) 类型的地图
  const starterMaps = mapPool.filter(map => map.id.startsWith('S'));
  const counterMaps = mapPool.filter(map => map.id.startsWith('C'));
  const tbMaps = mapPool.filter(map => map.mod === 'TB');

  // 渲染地图项
  const renderMapItem = (map: MapItem) => {
    const isSelected = map.isPicked;
    const isStriked = map.isStriked;

    return (
      <Button
        key={map.id}
        type="text"
        onClick={() => onMapSelect(map.id, map.mod)}
        style={{
          margin: '4px',
        }}
      >
        {tagRender(map.id, map.mod)}
      </Button>
    );
  };

  return (
    <div>
      {/* Starter Maps (Strike) */}
      Starter:
      <span>
        {starterMaps.map(renderMapItem)}
      </span>
      <br />
      {/* Counter Maps (Counter) */}
      {currentStage === 'pick' && <span>
        Counter:
        {counterMaps.map(renderMapItem)}
      </span>}
      {/* TB Maps (TB) */}
      <br />
      {currentStage === 'pick' && tbMaps.length > 0 && <span>
        TB:
        {tbMaps.map(renderMapItem)}
      </span>}
    </div>
  );
};

export default MappoolRender;