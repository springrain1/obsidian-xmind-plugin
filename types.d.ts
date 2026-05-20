// 基本节点结构
export interface XMindNode {
  title: string;
  children: XMindNode[];
}

// XMind JSON格式
export interface XMindJson {
  rootTopic: {
    title: string;
    children: any;
  };
}

// XMind主题结构
export interface XMindTopic {
  title?: string;
  children?: Record<string, any>;
  notes?: {
    plain?: { content?: string };
    html?: { content?: string };
  };
  markers?: { markerId?: string }[];
}

// XMind内容结构
export interface XMindContent {
  rootTopic?: XMindTopic;
  sheet?: { rootTopic?: XMindTopic }[];
  [key: string]: any; // 允许访问可能的其他键
}

// 插件设置
export interface XMindPluginSettings {
  xmindPath: string;
}

// 声明全局模块以解决导入问题
declare module "*.json" {
  const value: any;
  export default value;
}

// 声明xmind-sdk模块
declare module "xmind-sdk" {
  export function open(filePath: string): any;
  export function save(data: any, filePath: string): Promise<void>;
} 