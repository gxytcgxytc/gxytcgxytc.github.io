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
      },
      {
        value: 'c-set3',
        label: 'Set 3',
      },
    ],
  },

];