import { DefaultOptionType } from "antd/es/cascader";

const pools = [
  {
    label: 'Ro16',
    value: 'Ro16',
  },

  {
    label: 'QF',
    value: 'QF',
  },
  {
    label: 'SF',
    value: 'SF',
  },
  {
    label: 'F',
    value: 'F',
  },
  {
    label: 'GF',
    value: 'GF',
  }
]

// CLASS A/B/C每个class中都有-SET 1,2,3
export const setOptions: DefaultOptionType[] = [
  {
    value: 'classA',
    label: 'Class A',
    children: [
      {
        value: 'a-set1',
        label: 'Set 1',
      },
      {
        value: 'a-set2',
        label: 'Set 2',
      },
      {
        value: 'a-set3',
        label: 'Set 3',
      },
    ],
  },
  {
    value: 'classB',
    label: 'Class B',
    children: [
      {
        value: 'b-set1',
        label: 'Set 1',
      },
      {
        value: 'b-set2',
        label: 'Set 2',
        disabled: true,
      },
      {
        value: 'b-set3',
        label: 'Set 3',
      },
    ],
  },
  {
    value: 'classC',
    label: 'Class C',
    children: [
      {
        value: 'c-set1',
        label: 'Set 1',
      },
      {
        value: 'c-set2',
        label: 'Set 2',
        disabled: true,
      },
      {
        value: 'c-set3',
        label: 'Set 3',
        disabled: true,
      },
    ],
  },

];
// 按照不同optiontype的value根据rules.txt来条件渲染规则描述
// 在这下面写

// 规则描述对象，用于根据setType的值获取对应的规则描述
export const ruleDescriptions: Record<string, { title: string; description: string }> = {
  // Class A 规则
  'a-set1': {
    title: 'Classic',
    description: '任意一队的连续两次pick（无关中途是否存在对手的pick和Default Pick）不能为同一mod（NM除外），除非没有可选的谱面'
  },
  'a-set2': {
    title: 'aequilibrium',
    description: '1. 若这场比赛的前5次pick（含Default Pick）包含所有五个mod（NM、HD、HR、DT、FM）的谱面，\n则后续的pick必须按前5次pick的mod顺序选择mod，当没有可选的谱面时，此规则失效。\n此规则不影响TB的Default pick，且TB不被视为任何mod的谱面（即在计算顺序时不考虑TB）\n2. 如果这场比赛的前5次pick不满足第1条规则的条件，则在第5次pick后，后续的每次pick必须在pick前剩余谱面数最多的mod中产生（包括NM），此规则对不影响TB的Default pick，TB不被视为任何mod的谱面'
  },
  'a-set3': {
    title: 'Swap',
    description: '1. 比赛双方的第一次pick必须和对方第一次Strike的谱面mod相同，除非没有可选的谱面'
  },

  // Class B 规则
  'b-set1': {
    title: 'Fibonacci',
    description: '如果可能，比赛整体流程的第n+2次pick的图号（eg. S3记为3，C7记为7；特殊地，TB记为1）必须等于第n次pick的图号加上第n+1次的图号。\n此规则不会影响比赛中的Default pick。'
  },
  'b-set2': {
    title: 'Artifact',
    description: '1. 比赛中，在Strike结束后，比赛双方分别将Strike的图号数值相加，\n和值大者须指定一个mod（NM/HD/HR/DT/FM），对方的前3次pick都无法选择此mod的谱面。\n若和值相同，则首次Strike的图号大者算作和值大者\n\n2. 如果和值大者的前3次pick没有出现此mod的谱面，则其第4次和第5次pick必须选择此mod的谱面。\n且其这两次pick的图号之和不得小于其Strike图号之和的2/3（向上取整），若在某一次pick中没有符合此要求的谱面可选，则此次pick由对手指定，且无需受这条规则限制'
  },
  'b-set3': {
    title: 'par et impar',
    description: '1. 比赛双方各自Strike的谱面中，奇数图号数量和偶数图号数量的差值绝对值不可超过1。\n比赛双方各自第奇数次pick的图号必须为偶数，第偶数次pick的图号必须为奇数。\n这条规则的优先级最高，即当这条规则与第2条冲突时，冲突部分以这条规则为准\n2. 若矩阵 [m, n, k; a, b, c; d, e, x] 的行列式为奇数，则这次pick(第x次)的mod必须为HD/HR/FM，否则为NM/DT。\n此规则不会影响比赛中的Default pick。\n当没有可选的谱面时，此规则在该场比赛中永久失效。'
  },

  // Class C 规则
  'c-set1': {
    title: 'Tipping Point',
    description: '若比赛中没有出现某个或某些mod的谱面，\n则从第7次pick以后，两队的pick都只能选择这个或这些mod的谱面，除非没有可选的谱面'
  },
  'c-set2': {
    title: 'veritas neglecta',
    description: '1. 如果某一队在某个mod的谱面上落败（NM除外），记录从此时开始直到其对手的下一次选图为止此队落败的这些mod，\n其对手的下一个pick必须从这些mod的谱面中产生，除非没有可选的谱面\n2. 如果某一队pick了某个mod的谱面并取胜（NM除外），则其对手的下一次pick无法选择此mod的谱面。\n这条规则的优先级最高，即当这条规则与第1条冲突时，冲突部分以这条规则为准'
  },
  'c-set3': {
    title: 'Chaos',
    description: '1. 每一次pick的mod必须与上一次pick的mod在序列[NM, HD, HR, DT, FM, NM]中相邻（环形相邻）。\n当没有可选的谱面时，此规则失效。\n\n2. 当第1条规则失效时，此规则生效。\n每一次pick时，将当前图池中剩余的可选谱面和上一次pick（若上一个pick为Default pick TB，则为上上个pick）的谱面按S从小到大到C从小到大的顺序排列并首尾拼接形成一个环，则每一次pick的谱面不能和上一次pick的谱面在环上处于相邻的位置，若不如此做，则违反此条规则的队伍的下一次pick将由其对手指定。'
  }
};