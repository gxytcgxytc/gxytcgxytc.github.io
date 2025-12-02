import { useCallback, useState, useEffect } from "react";
import poolsData from '../pools.json';
import { _getNextAvailableMaps } from "../utils";
import { ruleDescriptions } from "../constances";

// 统一的地图项接口
export interface MapItem {
  id: string;
  mod: string;
  isStriked: boolean;
  isPicked: boolean;
  pickOrder?: number;
  team?: 'blue' | 'red' | 'all';
}

// 扩展的比赛配置接口，包含所有需要的选项
export interface MatchConfig {
  poolType: "Ro16" | "QF" | "SF" | "F" | "GF";
  classType: string;
  setType: string[]; // 修改为string[]以匹配utils.ts中的使用方式
  boNumber: number;
  currentPick: number;
  restrictedMod?: string; // 用于Class B Set 2规则
  teamPickCounts?: Record<string, Record<string, number>>; // 用于跟踪各队伍的pick情况
  lostMods?: string[]; // 用于Class C Set 2规则
  winningMods?: string[]; // 用于Class C Set 2规则
}

// 统一的比赛历史接口
export interface MatchHistory {
  mapId: string;
  team: 'blue' | 'red' | 'all';
  order: number;
  mod: string;
}

const defaultConfig: MatchConfig = {
  poolType: 'Ro16',
  classType: 'Class C',
  setType: ['Class C', 'c-set3'], // 默认为c-set3
  boNumber: 9,
  currentPick: 0,
  teamPickCounts: {
    blue: {},
    red: {}
  },
  lostMods: [],
  winningMods: []
};

export default (config: MatchConfig = defaultConfig) => {
  // 初始化图池
  const [mapPool, setMapPool] = useState<MapItem[]>([]);

  // 比赛历史
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);

  // 已Strike的图
  const [strikedMaps, setStrikedMaps] = useState<MapItem[]>([]);

  // Bo数量
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
  const handleStrikeMap = useCallback((mapId: string, team: 'blue' | 'red' | 'all') => {
    const targetMap = mapPool.find(map => map.id === mapId);
    if (!targetMap) return;

    setMapPool(prev => prev.map(map =>
      map.id === mapId ? { ...map, isStriked: !map.isStriked } : map
    ));

    // 如果地图被strike，添加到strikedMaps
    if (!targetMap.isStriked) {
      setStrikedMaps(prev => [...prev, {
        id: mapId,
        mod: targetMap.mod,
        team,
        isStriked: true,
        isPicked: false
      }]);
    } else {
      // 如果取消strike，从strikedMaps中移除
      setStrikedMaps(prev => prev.filter(map => map.id !== mapId));
    }
  }, [mapPool]);

  // 选择图
  const handlePickMap = useCallback((mapId: string, team: 'blue' | 'red' | 'all') => {
    const targetMap = mapPool.find(map => map.id === mapId);
    if (!targetMap) return;

    const newOrder = matchHistory.length + 1;

    setMapPool(prev => prev.map(map =>
      map.id === mapId ? {
        ...map,
        isPicked: true,
        pickOrder: newOrder,
        team
      } : map
    ));

    setMatchHistory(prev => [...prev, {
      mapId,
      team,
      order: newOrder,
      mod: targetMap.mod
    }]);

    // 更新teamPickCounts
    if (!config.teamPickCounts) {
      config.teamPickCounts = {
        blue: {},
        red: {}
      };
    }

    if (!config.teamPickCounts[team]) {
      config.teamPickCounts[team] = {};
    }

    config.teamPickCounts[team][targetMap.mod] =
      (config.teamPickCounts[team][targetMap.mod] || 0) + 1;

  }, [mapPool, matchHistory, config]);

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

  // 自动处理starter maps的strike逻辑
  useEffect(() => {
    // 如果已有matchHistory，则不处理
    if (matchHistory.length > 0) return;

    const starterMaps = mapPool.filter(map => map.id.startsWith('S'));
    const unStrikedStarterMaps = starterMaps.filter(map => !map.isStriked);

    // 当只剩一张未strike的starter map时，自动pick
    if (unStrikedStarterMaps.length === 1) {
      handlePickMap(unStrikedStarterMaps[0].id, 'all');
    }
  }, [mapPool, matchHistory.length, handlePickMap]);

  // 重置流程到指定地图
  const resetToMap = useCallback((mapId: string) => {
    const mapIndex = matchHistory.findIndex(item => item.mapId === mapId);
    if (mapIndex === -1) return;
    const ruleBreak = localStorage.getItem('ruleBreak');
    if (mapIndex + 1 < parseInt(ruleBreak || '0')) {
      localStorage.setItem('ruleBreak', '');
    };
    // 重置matchHistory
    const newMatchHistory = matchHistory.slice(0, mapIndex);
    setMatchHistory(newMatchHistory);

    // 重置mapPool状态
    setMapPool(prev => prev.map(map => {
      // 找出需要重置的地图
      const resetMaps = matchHistory.slice(mapIndex);
      const needsReset = resetMaps.some(item => item.mapId === map.id);

      if (needsReset) {
        return {
          ...map,
          isPicked: false,
          pickOrder: undefined,
          team: undefined
        };
      }

      // 如果是重置到第一步，清除所有strike状态
      if (mapIndex === 0) {
        return {
          ...map,
          isStriked: false
        };
      }

      return map;
    }));

    // 如果是重置到第一步，清除strikedMaps
    if (mapIndex === 0) {
      setStrikedMaps([]);
    }
  }, [matchHistory]);

  return {
    mapPool,
    matchHistory,
    setMatchHistory,
    strikedMaps,
    strikeMap: handleStrikeMap,
    pickMap: handlePickMap,
    availableMaps: getAvailableMaps(),
    getNextAvailableMaps: (team: 'all' | 'red' | 'blue') =>
      _getNextAvailableMaps(mapPool, matchHistory, strikedMaps, config, team),
    lastPickedMap: getLastPickedMap(),
    resetToMap,
    bo,
    desc: ruleDescriptions[config.setType?.[1]],
  };
};