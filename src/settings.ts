import { AISettings } from './services/ai/types/AITypes';

export class MindMapSettings {
    theme:string = 'dark';
    canvasSize:number = 8000;
    background:string = 'transparent';
    fontSize:number = 16;
    headLevel:number = 2;
    layout:string="mindmap";
    layoutDirect:string = 'mindmap'
    color?:string;
    exportMdModel?:string;
    //strokeArray?:string=''
    strokeArray?:any[];
    focusOnMove:boolean;
    // 是否需要YAML前置元数据，默认为false，与原版保持一致
    // 此设置在UI中不显示，但在代码中使用，确保无YAML前置元数据的思维导图文件可以正常工作
    requireFrontMatter:boolean = false;
    
    // AI 服务设置
    ai?: AISettings;
}