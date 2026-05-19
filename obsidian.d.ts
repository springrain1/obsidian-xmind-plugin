// 这个文件用于解决Obsidian类型导入问题
declare module "obsidian" {
  // 基础类型
  export class Plugin {
    app: App;
    manifest: any;
    settings: any;
    
    // 核心方法
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
    loadData(): Promise<any>;
    saveData(data: any): Promise<void>;
    
    // 注册方法
    addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement;
    addStatusBarItem(): HTMLElement;
    addCommand(command: Command): void;
    addSettingTab(tab: SettingTab): void;
    registerView(type: string, viewCreator: ViewCreator): void;
    registerExtensions(extensions: string[], viewType: string): void;
    registerEvent(eventRef: EventRef): void;
    registerDomEvent(el: Element, type: string, callback: (evt: any) => any): void;
    registerInterval(id: number): void;
  }

  export interface Command {
    id: string;
    name: string;
    icon?: string;
    hotkeys?: Hotkey[];
    checkCallback?: (checking: boolean) => boolean | void;
    callback?: () => any;
    editorCallback?: (editor: Editor) => any;
  }

  export interface Hotkey {
    modifiers?: string[];
    key?: string;
  }

  export class PluginSettingTab extends SettingTab {}
  
  export class SettingTab {
    constructor(app: App, plugin: Plugin);
    display(): void;
    hide(): void;
    containerEl: HTMLElement;
  }

  export class Setting {
    constructor(containerEl: HTMLElement);
    setName(name: string): this;
    setDesc(desc: string): this;
    setTooltip(tooltip: string): this;
    setClass(cls: string): this;
    setDisabled(disabled: boolean): this;
    addButton(cb: (button: any) => any): this;
    addText(cb: (text: any) => any): this;
    addToggle(cb: (toggle: any) => any): this;
    addDropdown(cb: (dropdown: any) => any): this;
    addTextArea(cb: (textarea: any) => any): this;
    addSlider(cb: (slider: any) => any): this;
    addMomentFormat(cb: (momentFormat: any) => any): this;
    then(cb: (setting: this) => any): this;
  }

  export class App {
    workspace: Workspace;
    vault: Vault;
  }

  export class Workspace {
    on(name: 'file-menu', callback: (menu: Menu, file: TFile) => any): EventRef;
    on(name: string, callback: (...args: any[]) => any): EventRef;
    trigger(name: string): void;
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    getRightLeaf(active?: boolean): WorkspaceLeaf;
    revealLeaf(leaf: WorkspaceLeaf): void;
    detachLeavesOfType(viewType: string): void;
    getActiveFile(): TFile | null;
  }

  export class Vault {
    adapter: FileSystemAdapter;
    
    // 添加 readBinary 方法的声明
    readBinary(file: TFile): Promise<ArrayBuffer>;
    
    // 添加其他常用方法的声明
    read(file: TFile): Promise<string>;
    create(path: string, data: string): Promise<TFile>;
    modify(file: TFile, data: string): Promise<void>;
    delete(file: TFile): Promise<void>;
  }

  export class FileSystemAdapter {
    getBasePath(): string;
    exists(path: string): Promise<boolean>;
    list(path: string): Promise<any>;
  }

  export class TFile {
    path: string;
    name: string;
    extension: string;
  }

  export class TFolder {
    path: string;
    name: string;
    children: (TFile | TFolder)[];
  }

  export class Menu {
    addItem(cb: (item: MenuItem) => any): void;
  }

  export class MenuItem {
    setTitle(title: string): this;
    setIcon(icon: string): this;
    onClick(callback: () => any): this;
  }

  export class Notice {
    constructor(message: string, timeout?: number);
  }

  export class ItemView {
    constructor(leaf: WorkspaceLeaf);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    contentEl: HTMLElement;
  }
  
  export abstract class FileView extends ItemView {
    file: TFile | null;
    allowNoFile: boolean;
    navigation: boolean;
    
    onLoadFile(file: TFile): Promise<void>;
    onUnloadFile(file: TFile): Promise<void>;
    canAcceptExtension(extension: string): boolean;
  }
  
  export abstract class TextFileView extends FileView {
    data: string;
    
    onLoad(): void;
    getViewData(): string;
    setViewData(data: string, clear: boolean): void;
    clear(): void;
  }

  export class WorkspaceLeaf {
    view: ItemView;
    setViewState(state: any): Promise<void>;
  }

  export interface ViewCreator {
    new(leaf: WorkspaceLeaf): ItemView;
  }

  export interface EventRef {}

  export class Editor {
    getValue(): string;
    setValue(value: string): void;
    getLine(line: number): string;
    lineCount(): number;
    getCursor(): {line: number, ch: number};
    getSelection(): string;
    setSelection(anchor: {line: number, ch: number}, head?: {line: number, ch: number}): void;
    replaceSelection(replacement: string): void;
    replaceRange(replacement: string, from: {line: number, ch: number}, to?: {line: number, ch: number}): void;
  }
}

// 解决Node.js模块类型问题
declare module "node:fs" {
  const fs: typeof import("fs");
  export = fs;
}

declare module "node:path" {
  const nodePath: typeof import("path");
  export = nodePath;
}

declare module "node:child_process" {
  const cp: typeof import("child_process");
  export = cp;
}

declare module "node:util" {
  const util: typeof import("util");
  export = util;
} 