import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    import: true,
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'My Tools',
  },
  routes: [
    {
      path: '/',
      redirect: '/hsc-s5-tool',
    },
  ],
  npmClient: 'npm',
});

