// 为 CodeMirror 模块提供类型声明，解决编译错误

declare module "@codemirror/state" {
  export class EditorState {
    readonly doc: any;
    field<T>(field: StateField<T>): T;
  }
  
  export class StateField<T> {
    static define<T>(config: {
      create: (state: EditorState) => T;
      update: (value: T, transaction: any) => T;
      provide?: (field: StateField<T>) => any;
    }): StateField<T>;
  }
  
  export class StateEffect<T> {
    static define<T>(spec?: { map?: (value: T, mapping: any) => T }): StateEffect<any>;
    of(value: T): EffectInstance<T>;
    is(effect: EffectInstance<any>): effect is EffectInstance<T>;
  }
  
  export interface EffectInstance<T> {
    value: T;
  }
  
  export interface Range {
    from: number;
    to: number;
  }
  
  export class RangeSet<T> {
    iter(): { from: number; to: number; value: T | null; next(): void };
  }
  
  export interface RangeValue {}
}

declare module "@codemirror/view" {
  import { EditorState, StateEffect } from "@codemirror/state";
  
  export class EditorView {
    state: EditorState;
    dispatch(transaction: any): void;
    dom: HTMLElement;
    posAtDOM(node: Node): number;
    
    static domEventHandlers(handlers: Record<string, (event: Event, view: EditorView) => boolean | void>): any;
  }
  
  export class Decoration {
    static replace(spec: { block?: boolean }): any;
    static set(decorations: any[], sort?: boolean): any;
  }
  
  export const panels: any;
}

declare module "@codemirror/language" {
  import { EditorState } from "@codemirror/state";
  
  export function foldable(state: EditorState, from: number, to: number): { from: number, to: number } | null;
}

// 扩展 Obsidian 插件类型，添加编辑器扩展方法
declare module "obsidian" {
  interface Plugin {
    registerEditorExtension(extension: any): void;
  }
} 