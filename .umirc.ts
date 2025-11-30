import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: { dark: true },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '你好',
  },
  routes: [
    {
      path: '/',
      redirect: '/HSC5-LB-tool',
    },
    {
      component: 'Layout',
      routes: [
        {
          name: 'HSC5LBMapTool',
          path: '/HSC5-LB-tool',
          component: 'HscTool',
        }
      ]
    }
  ],
  npmClient: 'npm',
});

