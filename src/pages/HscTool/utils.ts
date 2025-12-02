import { MapItem, MatchConfig, MatchHistory } from './hooks/useMatchProcess';

/**
 * 获取可用的地图列表
 */
export const getAvailableMaps = (mapPool: MapItem[]): MapItem[] => {
  return mapPool.filter(map => !map.isPicked);
};

/**
 * 获取上一次选择的地图
 */
export const getLastPickedMap = (
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  team: 'all' | 'red' | 'blue',
): MapItem | null => {
  const teamHistory = matchHistory.filter(history => history.team === team);
  if (teamHistory.length === 0) return null;
  const lastHistory = teamHistory[teamHistory.length - 1];
  return mapPool.find(map => map.id === lastHistory.mapId && map.team === team) || null;
};

/**
 * Class A Set 1 Classic规则：连续两次pick不能为同一mod（NM除外）
 */
export const applyClassASet1Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  team: 'all' | 'red' | 'blue',
): MapItem[] => {

  if (matchHistory.length === 0) return availableMaps;

  const lastPickedMap = getLastPickedMap(matchHistory, mapPool, team);
  if (!lastPickedMap || lastPickedMap.mod === 'NM' || lastPickedMap.team === 'all') return availableMaps;

  // 过滤掉与上一次相同mod的地图（NM除外）
  const filteredMaps = availableMaps.filter(map =>
    map.mod !== 'TB' && map.mod !== lastPickedMap.mod || map.mod === 'NM'
  );
  const TB = mapPool.find(map => map.mod === 'TB') as MapItem;
  // 如果过滤后没有可选地图，则返回原始可用地图
  return filteredMaps.length > 0 ? filteredMaps.concat([TB]) : availableMaps;
};

/**
 * Class A Set 2 aequilibrium规则
 */
export const applyClassASet2Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[]
): MapItem[] => {
  const pickedMaps = matchHistory.map(history =>
    mapPool.find(map => map.id === history.mapId)
  ).filter(Boolean).filter((map) => (map as MapItem).mod !== 'TB') as MapItem[];

  const tbpicked = mapPool.find(map => map.mod === 'TB' && map.isPicked);
  const TB = mapPool.find(map => map.mod === 'TB') as MapItem;
  // 只考虑前5次pick（不含TB）
  const firstFivePicks = pickedMaps.slice(0, 5);

  // 检查前5次pick是否包含所有五个mod
  const modsInFirstFive = new Set(firstFivePicks.map(map => map.mod));
  const hasAllMods = modsInFirstFive.size >= 5 &&
    modsInFirstFive.has('NM') &&
    modsInFirstFive.has('HD') &&
    modsInFirstFive.has('HR') &&
    modsInFirstFive.has('DT') &&
    modsInFirstFive.has('FM');

  if (hasAllMods && pickedMaps.length >= 5) {
    // 按前5次pick的mod顺序选择
    const modSequence = firstFivePicks.map(map => map.mod);
    const nextModIndex = pickedMaps.length % 5;
    const requiredMod = modSequence[nextModIndex];
    const filteredMaps = availableMaps.filter(map => map.mod === requiredMod);
    // 检测pick是否遵循原顺序 用history遍历检查是否有mod跳变
    let followsOrder = true;
    for (let i = 0; i < pickedMaps.length; i++) {
      if (modSequence[i % 5] !== pickedMaps[i].mod) {
        followsOrder = false;
        break;
      }
    }

    if (filteredMaps.length > 0 && followsOrder) {
      return filteredMaps.concat(tbpicked ? [] : [TB]);
    }
    return availableMaps;
  }
  if (pickedMaps.length >= 5) {
    // 计算各mod剩余谱面数量
    const modCounts: Record<string, number> = {};
    availableMaps.filter(map => map.mod !== 'TB').forEach(map => {
      modCounts[map.mod] = (modCounts[map.mod] || 0) + 1;
    });

    // 找出剩余谱面最多的mod
    let maxCount = 0;
    let maxMods: string[] = [];
    Object.entries(modCounts).forEach(([mod, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxMods = [mod];
      } else if (count === maxCount) {
        maxMods.push(mod);
      }
    });

    return availableMaps.filter(map => maxMods.includes(map.mod)).concat(tbpicked ? [] : [TB]);;
  }

  return availableMaps;
};

/**
 * Class A Set 3 Swap规则
 */
export const applyClassASet3Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  strikedMaps: MapItem[],
  team: 'all' | 'red' | 'blue',
): MapItem[] => {
  // 获取当前队伍的pick历史
  if (matchHistory.length === 0) return availableMaps;
  const lastMapId = parseInt(matchHistory[matchHistory.length - 1].mapId.replace(/[^0-9]/g, ''));
  const secondLastMapId = parseInt(matchHistory[matchHistory.length - 2]?.mapId.replace(/[^0-9]/g, ''));
  const teamPickedMaps = matchHistory
    .filter(history => history.team === team)
    .map(history => mapPool.find(map => map.id === history.mapId))
    .filter(Boolean) as MapItem[];
  // 规则1：第一次pick必须和对方第一次Strike的谱面mod相同
  if (teamPickedMaps.length === 0 && strikedMaps.length > 0) {
    // 确定对方队伍
    const opponentTeam = team === 'red' ? 'blue' : 'red';

    // 找到对方第一次Strike的谱面
    const opponentFirstStrikedMap = strikedMaps.find(map =>
      map.team === opponentTeam
    );

    if (opponentFirstStrikedMap) {
      let filteredMaps = availableMaps.filter(map =>
        map.mod === opponentFirstStrikedMap.mod
      );
      // 这里也要考虑图号的逻辑
      if (lastMapId > secondLastMapId) {
        filteredMaps = filteredMaps.filter(map => {
          const mapIdNum = parseInt(map.id.replace(/[^0-9]/g, ''));
          return mapIdNum < lastMapId;
        });
      }
      return filteredMaps.length > 0 ? filteredMaps : availableMaps;
    }
  }


  if (matchHistory.length >= 1) {

    if (lastMapId > secondLastMapId) {
      // 上一次pick图号大于前一次，本次应小于上一次
      const filteredMaps = availableMaps.filter(map => {
        const mapIdNum = parseInt(map.id.replace(/[^0-9]/g, ''));
        return mapIdNum < lastMapId;
      });
      return filteredMaps.length > 0 ? filteredMaps : availableMaps;
    } else {
      return availableMaps;
    }
  }

  return availableMaps;
};

/**
 * Class B Set 1 Fibonacci规则
 */
export const applyClassBSet1Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[]
): MapItem[] => {
  const pickedMaps = matchHistory.map(history =>
    mapPool.find(map => map.id === history.mapId)
  ).filter(Boolean) as MapItem[];

  // 需要至少两次pick才能应用Fibonacci规则
  if (pickedMaps.length >= 2) {
    const getMapNumber = (mapId: string): number => {
      if (mapId === 'TB') return 1;
      const num = parseInt(mapId.replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const lastMapNum = getMapNumber(pickedMaps[pickedMaps.length - 1].id);
    const secondLastMapNum = getMapNumber(pickedMaps[pickedMaps.length - 2].id);
    const expectedNum = lastMapNum + secondLastMapNum;

    // 查找符合Fibonacci规则的地图
    const fibonacciMaps = availableMaps.filter(map => {
      const mapNum = getMapNumber(map.id);
      return mapNum === expectedNum;
    });

    // 如果有符合规则的地图，返回这些地图
    if (fibonacciMaps.length > 0) {
      return fibonacciMaps;
    }
  }

  return availableMaps;
};

/**
 * Class B Set 2 Artifact规则
 * 注意：此规则需要额外的状态来跟踪Strike和值以及指定的mod
 * 这里简化实现，实际使用时需要在MatchConfig中添加相应的状态
 */
export const applyClassBSet2Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  strikedMaps: string[],
  config: MatchConfig & { restrictedMod?: string; teamPickCounts?: Record<string, Record<string, number>> }
): MapItem[] => {
  // 这里简化实现，实际需要更复杂的逻辑来跟踪Strike和值、指定的mod等
  // 假设config中包含了restrictedMod和teamPickCounts信息

  if (config.restrictedMod) {
    const currentTeam = matchHistory.length % 2 === 0 ? 'blue' : 'red';
    const teamPicks = config.teamPickCounts?.[currentTeam] || {};
    const teamPickCount = Object.values(teamPicks).reduce((sum, count) => sum + count, 0);

    if (teamPickCount < 3) {
      // 前3次pick不能选择被限制的mod
      const filteredMaps = availableMaps.filter(map => map.mod !== config.restrictedMod);
      return filteredMaps.length > 0 ? filteredMaps : availableMaps;
    } else if (teamPickCount >= 3 && teamPickCount <= 4) {
      // 第4、5次pick必须选择被限制的mod
      const filteredMaps = availableMaps.filter(map => map.mod === config.restrictedMod);
      return filteredMaps.length > 0 ? filteredMaps : availableMaps;
    }
  }

  return availableMaps;
};

/**
 * Class B Set 3 par et impar规则
 * 规则2失效的情况没考虑队伍, 需要使用者自行判断
 */
export const applyClassBSet3Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  config: MatchConfig,
  team: 'red' | 'blue' | 'all',
): MapItem[] => {
  if (matchHistory.length === 0) return availableMaps

  // 规则1：pick的奇偶性与pick次数相反 按照每个队伍自己的pick次数来定
  const currentPickNumber = matchHistory.filter(item => item.team === team).length + 1;
  const isEvenPick = currentPickNumber % 2 === 0;

  // 根据pick次数过滤图号奇偶性
  const parityFilteredMaps = availableMaps.filter(map => {
    if (map.id === 'TB') return true;
    const mapNum = parseInt(map.id.replace(/[^0-9]/g, ''));
    const isEvenMapNum = mapNum % 2 === 0;
    // 第奇数次pick必须为偶数图号，第偶数次pick必须为奇数图号
    return isEvenPick ? !isEvenMapNum : isEvenMapNum;
  });

  if (parityFilteredMaps.filter(map => map.mod !== 'TB').length === 0) return availableMaps;


  const ruleBreak = localStorage.getItem('ruleBreak');
  if (parseInt(ruleBreak || '0') >= matchHistory.length + 1) return parityFilteredMaps;

  // 规则2：根据行列式奇偶性选择mod
  // 计算矩阵行列式
  const starterCount = mapPool.filter(map => map.id.startsWith('S') && !map.isPicked).length;
  const counterpickCount = mapPool.filter(map => map.id.startsWith('C') && !map.isPicked).length;
  const boNumber = config.boNumber;

  const modCounts = {
    NM: availableMaps.filter(map => map.mod === 'NM').length,
    HD: availableMaps.filter(map => map.mod === 'HD').length,
    HR: availableMaps.filter(map => map.mod === 'HR').length,
    DT: availableMaps.filter(map => map.mod === 'DT').length,
    FM: availableMaps.filter(map => map.mod === 'FM' || map.mod === 'TB').length
  };

  // 计算3x3矩阵的行列式
  // [m, n, k; a, b, c; d, e, x]
  const matrix = [
    [starterCount, counterpickCount, boNumber],
    [modCounts.NM, modCounts.HD, modCounts.HR],
    [modCounts.DT, modCounts.FM, matchHistory.length + 1]
  ];

  const determinant =
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

  const isOddDeterminant = determinant % 2 !== 0;

  // 根据行列式奇偶性过滤mod
  const finalFilteredMaps = parityFilteredMaps.filter(map => {
    if (map.mod === 'TB') return true;
    if (isOddDeterminant) {
      // 奇数行列式：必须为HD/HR/FM
      return ['HD', 'HR', 'FM'].includes(map.mod);
    } else {
      // 偶数行列式：必须为NM/DT
      return ['NM', 'DT'].includes(map.mod);
    }
  });
  if (finalFilteredMaps.filter(map => map.mod !== 'TB').length <= 0) {
    localStorage.setItem('ruleBreak', `${matchHistory.length + 1}`);
  }
  return finalFilteredMaps.filter(map => map.mod !== 'TB').length > 0 ? finalFilteredMaps : parityFilteredMaps;
};

/**
 * Class C Set 1 Tipping Point规则
 */
export const applyClassCSet1Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[]
): MapItem[] => {
  const pickedMaps = matchHistory.map(history =>
    mapPool.find(map => map.id === history.mapId)
  ).filter(Boolean) as MapItem[];

  // 前6次pick后开始应用规则
  if (pickedMaps.length >= 6) {
    const allMods = ['NM', 'HD', 'HR', 'DT', 'FM'];
    const usedMods = new Set(pickedMaps.slice(0, 6).map(map => map.mod).filter(mod => allMods.includes(mod)));
    const unusedMods = allMods.filter(mod => !usedMods.has(mod));

    if (unusedMods.length > 0) {
      const filteredMaps = availableMaps.filter(map =>
        unusedMods.includes(map.mod) || map.mod === 'TB'
      );
      return filteredMaps.filter(map => map.mod !== 'TB').length > 0 ? filteredMaps : availableMaps;
    }
  }

  return availableMaps;
};

/**
 * Class C Set 2 veritas neglecta规则
 * 1. 如果某一队在某个mod的谱面上落败（NM除外），记录从此时开始直到其对手的下一次选图为止此队落败的这些mod，
 *    其对手的下一个pick必须从这些mod的谱面中产生，除非没有可选的谱面
 * 2. 如果某一队pick了某个mod的谱面并取胜（NM除外），则其对手的下一次pick无法选择此mod的谱面。
 *    这条规则的优先级最高，即当这条规则与第1条冲突时，冲突部分以这条规则为准
 * 未实现
 */
export const applyClassCSet2Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[],
  config: MatchConfig,
  team: 'red' | 'blue' | 'all',
): MapItem[] => {
  // 如果没有历史记录，直接返回所有可用地图
  return availableMaps;
  if (!matchHistory || matchHistory.length === 0) {
  }

  // 确定当前选图者：当前选图者是上一局的输家（上一局的选图者）
  const lastMatch = matchHistory[matchHistory.length - 1];
  const currentPickerTeam = lastMatch.team; // 当前选图者是上一局的选图者（上一局的输家）
  if (currentPickerTeam === team) return availableMaps;
  const lastMod = lastMatch.mod;
  if (lastMod === 'TB') return availableMaps;
  if (lastMod === 'NM') return availableMaps;
  // 按照matchhistory倒序查找, 对手连续选图的所有mod
  const opponentMods: string[] = [];
  // rules2 对手赢的pick不能选
  for (let i = matchHistory.length - 1; i >= 0; i--) {
    const match = matchHistory[i];
    if (match.team !== currentPickerTeam && match.mod !== lastMod) {
      opponentMods.push(match.mod);
    } else {
      break;
    }
  }
  

  // 本队只能选这些mod的谱面
  const filteredMaps = availableMaps.filter(map => opponentMods.includes(map.mod));


};

/**
 * Class C Set 3 Chaos规则
 */
export const applyClassCSet3Rules = (
  availableMaps: MapItem[],
  matchHistory: MatchHistory[],
  mapPool: MapItem[]
): MapItem[] => {
  const lastMap = getLastPickedMap(matchHistory, mapPool);
  if (!lastMap) return availableMaps;

  // 规则1：mod序列相邻选择
  const modSequence = ['NM', 'HD', 'HR', 'DT', 'FM', 'NM'];
  const currentModIndex = modSequence.indexOf(lastMap.mod);

  if (currentModIndex !== -1) {
    const allowedMods = [
      modSequence[(currentModIndex - 1 + modSequence.length) % modSequence.length],
      modSequence[(currentModIndex + 1) % modSequence.length]
    ];

    const rule1Maps = availableMaps.filter(map =>
      allowedMods.includes(map.mod) || map.mod === 'TB'
    );

    // 如果规则1有可用地图，返回这些地图
    if (rule1Maps.length > 0) {
      return rule1Maps;
    }
  }

  // 规则2：环排序中不能选择相邻位置的地图
  // 将剩余可选谱面和上一次pick的谱面按S从小到大到C从小到大排列
  const allRelevantMaps = [...availableMaps, lastMap].sort((a, b) => {
    // S开头的排在前面，按数字升序
    if (a.id.startsWith('S') && b.id.startsWith('S')) {
      return parseInt(a.id.slice(1)) - parseInt(b.id.slice(1));
    }
    // S开头的排在C开头的前面
    if (a.id.startsWith('S')) return -1;
    if (b.id.startsWith('S')) return 1;
    // 都是C开头的，按数字升序
    if (a.id.startsWith('C') && b.id.startsWith('C')) {
      return parseInt(a.id.slice(1)) - parseInt(b.id.slice(1));
    }
    // 处理其他情况
    return a.id.localeCompare(b.id);
  });

  // 找到上一次pick的图在环中的位置
  const lastMapIndex = allRelevantMaps.findIndex(map => map.id === lastMap.id);

  if (lastMapIndex !== -1) {
    // 计算环中相邻的位置
    const prevIndex = (lastMapIndex - 1 + allRelevantMaps.length) % allRelevantMaps.length;
    const nextIndex = (lastMapIndex + 1) % allRelevantMaps.length;

    // 过滤掉相邻的图
    const rule2Maps = availableMaps.filter(map =>
      map.id !== allRelevantMaps[prevIndex].id &&
      map.id !== allRelevantMaps[nextIndex].id
    );

    return rule2Maps;
  }

  return availableMaps;
};

/**
 * 根据当前规则计算下一张可选的地图
 */
export const _getNextAvailableMaps = (
  mapPool: MapItem[],
  matchHistory: MatchHistory[],
  strikedMaps: MapItem[],
  config: MatchConfig & { restrictedMod?: string; teamPickCounts?: Record<string, Record<string, number>>; lostMods?: string[]; winningMods?: string[] },
  team: 'all' | 'red' | 'blue',
): MapItem[] => {
  const availableMaps = getAvailableMaps(mapPool);
  // 根据不同的setType[1]应用相应的规则, setType的数据类型是: [classA, a-set1], setType的可能值 共9种 写9个case
  switch (config.setType?.[1]) {
    case 'a-set1':
      return applyClassASet1Rules(availableMaps, matchHistory, mapPool, team);
    case 'a-set2':
      return applyClassASet2Rules(availableMaps, matchHistory, mapPool);
    case 'a-set3':
      return applyClassASet3Rules(availableMaps, matchHistory, mapPool, strikedMaps, team);
    case 'b-set1':
      return applyClassBSet1Rules(availableMaps, matchHistory, mapPool);
    case 'b-set2':
      return applyClassBSet2Rules(availableMaps, matchHistory, mapPool, strikedMaps, config);
    case 'b-set3':
      return applyClassBSet3Rules(availableMaps, matchHistory, mapPool, config, team);
    case 'c-set1':
      return applyClassCSet1Rules(availableMaps, matchHistory, mapPool);
    case 'c-set2':
      return applyClassCSet2Rules(availableMaps, matchHistory, mapPool, config, team);
    case 'c-set3':
      return applyClassCSet3Rules(availableMaps, matchHistory, mapPool);
    default:
      return availableMaps;
  }
};