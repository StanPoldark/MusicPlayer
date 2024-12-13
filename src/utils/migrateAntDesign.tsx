import React, { forwardRef, ReactNode, ComponentProps } from 'react';
import { ConfigProvider } from 'antd';

// 迁移工具：将 Ant Design 组件包装在 ConfigProvider 中以确保兼容性
export function migrateAntDesignComponents() {
  return {
    // 包装任何 Ant Design 组件，并为 React 19 提供兼容处理
    wrapWithCompatibility: (Component: React.ComponentType<any>) =>
      forwardRef<any, ComponentProps<typeof Component>>((props, ref) => (
        <ConfigProvider>
          <Component {...props} ref={ref} />
        </ConfigProvider>
      )),
    
    // 处理安全的 ref 访问，确保 React 19 的兼容性
    safeRefAccess: (elementRef: React.RefObject<HTMLElement>) => {
      if (elementRef.current) {
        return elementRef.current; // 安全的访问 ref
      }
      return null;
    }
  };
}
