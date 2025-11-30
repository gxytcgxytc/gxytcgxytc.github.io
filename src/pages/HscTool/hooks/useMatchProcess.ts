import { useCallback, useState, useEffect } from "react";
import poolsData from '../pools.json';
import rulesData from '../rules.txt';
import { useModel } from "@umijs/max";
import { _getNextAvailableMaps } from "../utils";

export interface MapItem {
  id: string;
  mod: string;
  isStriked: boolean;
  isPicked: boolean;
  pickOrder?: number;
  team?: 'blue' | 'red' | 'all';
}

export interface MatchConfig {
  poolType: "Ro16" | "QF" | "SF" | "F" | "GF";
  classType: string;
  setType: string;
  boNumber: number;
  currentPick: number;
}

export interface MatchHistory {
  mapId: string;
  team: 'blue' | 'red' | 'all';
  order: number;
  mod: string;
}

const defaultConfig: MatchConfig = {
  poolType: 'Ro16',
  classType: 'Class C',
  setType: 'Set 3',
  boNumber: 7,
  currentPick: 0
};
export default (config: MatchConfig = defaultConfig) => {
  // 默认配置


  // 初始化图池
  const [mapPool, setMapPool] = useState<MapItem[]>([]);

  // 比赛历史
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);

  // 已Strike的图
  const [strikedMaps, setStrikedMaps] = useState<MapItem[]>([]);

  // Bo
  const [bo, setBo] = useState<number>(9);

  // 初始化图池数据
  useEffect(() => {
    const currentPool = poolsData[config.poolType];
    if (currentPool) {
      const maps: MapItem[] = Object.entries(currentPool.pool).map(([id, mod]) => ({
        id,
        mod: mod as string,
        isStriked: false,
        isPicked: false
      }));
      setMapPool(maps);
      // 重置历史记录
      setMatchHistory([]);
      setStrikedMaps([]);
      setBo(currentPool.size);
    }
  }, [config.poolType]);


  // 标记图为已Strike
  const handleStrikeMap = useCallback((mapId: string) => {
    setMapPool(prev => prev.map(map =>
      map.id === mapId ? { ...map, isStriked: !map.isStriked } : map
    ));

  }, []);

  // 选择图
  const handlePickMap = useCallback((mapId: string, team: 'blue' | 'red' | 'all', mod: string) => {
    const newOrder = config.currentPick + 1;

    setMapPool(prev => prev.map(map =>
      map.id === mapId ? { ...map, isPicked: true, pickOrder: newOrder, team } : map
    ));

    setMatchHistory(prev => [...prev, { mapId, team, order: newOrder, mod }]);

  }, [config.currentPick]);

  // 获取可用的图
  const getAvailableMaps = useCallback(() => {
    return mapPool.filter(map => !map.isPicked);
  }, [mapPool]);

  // 获取上一次pick的图
  const getLastPickedMap = useCallback(() => {
    if (matchHistory.length === 0) return null;
    const lastHistory = matchHistory[matchHistory.length - 1];
    return mapPool.find(map => map.id === lastHistory.mapId);
  }, [matchHistory, mapPool]);

 
  useEffect(() => {
    if (matchHistory.length > 0) return;
    // S中未Strike图只剩一张之后自动pick

    const starterMaps = mapPool.filter(map => map.id.startsWith('S'));
    const unStrikedStarterMaps = starterMaps.filter(map => !map.isStriked);
    const strikedStarterMaps = starterMaps.filter(map => map.isStriked);
    setStrikedMaps(strikedStarterMaps);
    if (unStrikedStarterMaps.length === 1) {
      handlePickMap(unStrikedStarterMaps[0].id, 'all', unStrikedStarterMaps[0].mod);
    }
  }, [mapPool])


  // 重置流程到
  const resetToMap = useCallback((mapId: string) => {
    const mapIndex = matchHistory.findIndex(item => item.mapId === mapId);
    if (mapIndex === -1) return;
    setMatchHistory(prev => prev.slice(0, mapIndex));
    setMapPool(prev => prev.map(map => {
      const resetmaps = matchHistory.slice(mapIndex);
      return resetmaps.some(item => item.mapId === map.id) ? {
        ...map, 
        isPicked: false, 
        pickOrder: 0, 
      } : map
    }).map(map => mapIndex === 0 ? {...map, isStriked: false} : map));
  }, [matchHistory, setMatchHistory, setStrikedMaps, setMapPool]);


  return {
    mapPool,
    matchHistory,
    setMatchHistory,
    strikedMaps,
    strikeMap: handleStrikeMap,
    pickMap: handlePickMap,
    availableMaps: getAvailableMaps(),
    getNextAvailableMaps: (team: 'all' | 'red' | 'blue') => _getNextAvailableMaps(mapPool, matchHistory, strikedMaps, config, team),
    lastPickedMap: getLastPickedMap(),
    resetToMap,
  };
};