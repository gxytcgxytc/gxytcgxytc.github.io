import { Outlet } from "@umijs/max"
import { ConfigProvider } from "antd"

export default () => {


  return <ConfigProvider componentSize="small">
    <Outlet />
  </ConfigProvider>
}