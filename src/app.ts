// 运行时配置
import icon from './assets/favicon.png'
import { RunTimeLayoutConfig } from '@umijs/max';
// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  return { name: '@umijs/max' };
}

export const layout: RunTimeLayoutConfig = () => {
  return {
    logo: icon,
    menu: {
      locale: false,
    },
    actionsRender: () => null,
    defaultCollapsed: true,
    breakpoint: false,
    theme: 'light',
    enableDarkTheme: true,
  };
};
