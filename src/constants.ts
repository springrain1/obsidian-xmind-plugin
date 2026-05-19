export const MM_VIEW_TYPE = 'mindmap';
export const MD_VIEW_TYPE = 'markdown';

export const FRONT_MATTER_REGEX = /^(---)[\s\S]+?^(---)[\s\S]+?/m;

export const frontMatterKey = 'mindmap-plugin';


export const basicFrontmatter = [
  "---",
  "",
  `${frontMatterKey}: basic`,
  "",
  "---",
  "",
  "",
].join("\n");

// 检测文件是否为思维导图的正则表达式，包括两种情况：带YAML和不带YAML
export const MM_DETECTION_REGEX = [
  // 带有mindmap-plugin: basic的YAML前置元数据
  new RegExp(`---[\\s\\S]*?${frontMatterKey}\\s*:\\s*basic[\\s\\S]*?---`),
  // 不带前置元数据的情况，直接从文件开头开始检测是否是思维导图格式
  /^\s*#\s+.+\s*$/m  // 以#开头的行作为根节点
];

