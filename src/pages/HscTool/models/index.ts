import { useCallback, useState } from "react"

export default () => {
  // map配置
  const [config, setConfig] = useState<any>(() => {
    try {
      const _ = JSON.parse(localStorage.getItem("hsc-config") || 'null')
      return _ || undefined
    } catch (e) {
      console.log('未找到缓存')
      return undefined;

    }
  })
  const handleSetConfig = useCallback((value: any) => {
    localStorage.setItem("hsc-config", JSON.stringify(value))
    setConfig(value);
  }, [])
  return { config, setConfig: handleSetConfig }
}