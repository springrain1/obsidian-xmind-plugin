import {
    App,
    PluginSettingTab,
    Setting,
} from 'obsidian';
import MindMap from './main';
import { t } from './lang/helpers'
import { MindMapView, mindmapViewType } from './MindMapView';
import MyNode from './mindmap/INode';
import { AISettingsTab } from './settings/AISettingsTab';
import { AISettingsManager } from './settings/AISettings';

export class MindMapSettingsTab extends PluginSettingTab {
    plugin: MindMap;
    private aiSettingsManager: AISettingsManager;
    private aiSettingsTab: AISettingsTab;
    
    constructor(app: App, plugin: MindMap) {
        super(app, plugin);
        this.plugin = plugin;
        this.aiSettingsManager = new AISettingsManager(plugin.settings.ai);
        this.aiSettingsTab = new AISettingsTab(app, this.containerEl, this.aiSettingsManager);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName(`${t('Canvas size')}`)
            .setDesc(`${t('Canvas size desc')}`)
            .addDropdown(dropDown =>
                dropDown
                    .addOption('4000', '4000')
                    .addOption('6000', '6000')
                    .addOption('8000', '8000')
                    .addOption('10000', '10000')
                    .addOption('12000', '12000')
                    .addOption('16000', '16000')
                    .addOption('20000', '20000')
                    .addOption('30000', '30000')
                    .addOption('36000', '36000')
                    .setValue(this.plugin.settings.canvasSize.toString() || '8000')
                    .onChange((value: string) => {
                        var _v = Number.parseInt(value)
                        this.plugin.settings.canvasSize = _v;
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            v.mindmap.setting.canvasSize = _v;
                            v.mindmap.setAppSetting();
                            var box = v.mindmap.root.getBox();
                            v.mindmap.root.setPosition(_v / 2 - box.width / 2, _v / 2 - box.height / 2);
                            v.mindmap.refresh();
                            v.mindmap.center();
                        });
                    }));

        new Setting(containerEl)
            .setName(`${t('Canvas background')}`)
            .setDesc(`${t('Canvas background desc')}`)
            .addText(text =>
                text
                    .setValue(this.plugin.settings.background || 'transparent')
                    .setPlaceholder('Example: black|white|#ccc')
                    .onChange((value: string) => {
                        this.plugin.settings.background = value;
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            v.mindmap.setting.background = this.plugin.settings.background;
                            v.mindmap.setAppSetting();
                        });
                    }));

        new Setting(containerEl)
            .setName(`${t('Max level of node to markdown head')}`)
            .setDesc(`${t('Max level of node to markdown head desc')}`)
            .addDropdown(dropDown =>
                dropDown
                    .addOption('0', '0')
                    .addOption('1', '1')
                    .addOption('2', '2')
                    .addOption('3', '3')
                    .addOption('4', '4')
                    .addOption('5', '5')
                    .addOption('6', '6')
                    .setValue(this.plugin.settings.headLevel.toString() || '2')
                    .onChange((value: string) => {
                        this.plugin.settings.headLevel = Number.parseInt(value);
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            v.mindmap.setting.headLevel = this.plugin.settings.headLevel;
                        });
                    }));



        new Setting(containerEl)
            .setName(`${t('Font size')}`)
            .setDesc(`${t('Font size desc')}`)
            .addText(text =>
                text
                    .setValue(this.plugin.settings.fontSize?.toString() || '16')
                    .setPlaceholder('Example: 16')
                    .onChange((value: string) => {
                        this.plugin.settings.fontSize = Number.parseInt(value);
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            v.mindmap.setting.fontSize = this.plugin.settings.fontSize;
                            v.mindmap.setAppSetting();
                            v.mindmap.traverseBF((n: MyNode) => {
                                n.boundingRect = null;
                                n.refreshBox();
                            })
                            v.mindmap.refresh();
                        });
                    }));

        new Setting(containerEl)
            .setName(`${t('Mind map layout direct')}`)
            .setDesc(`${t('Mind map layout direct desc')}`)
            .addDropdown(dropDown =>
                dropDown
                    .addOption('mind map', t('Centered'))
                    .addOption('right', t('Right'))
                    .addOption('left', t('Left'))
                    .addOption('clockwise', t('Clockwise'))
                    .setValue(this.plugin.settings.layoutDirect.toString() || 'mind map')
                    .onChange((value: string) => {
                        this.plugin.settings.layoutDirect = value;
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);
                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            v.mindmap.setting.layoutDirect = this.plugin.settings.layoutDirect;
                            v.mindmap.refresh();
                        });
                    }));

        new Setting(containerEl)
            .setName(`${t('Stroke Array')}`)
            .setDesc(`${t('Stroke Array Desc')}`)
            .addText(text =>
                text
                    .setValue(this.plugin.settings.strokeArray?.toString() || '')
                    .setPlaceholder('Example: red,orange,blue ...')
                    .onChange((value: string) => {
                        //this.plugin.settings.strokeArray = value
                        this.plugin.settings.strokeArray = value.split(',');
                        this.plugin.saveData(this.plugin.settings);
                        const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);

                        mindmapLeaves.forEach((leaf) => {
                            var v = leaf.view as MindMapView;
                            //v.mindmap.setting.strokeArray = this.plugin.settings.strokeArray.split(',');
                            v.mindmap.setting.strokeArray = this.plugin.settings.strokeArray;
                            if( v.mindmap.mmLayout){
                                v.mindmap.mmLayout.colors=v.mindmap.setting.strokeArray;
                            }

                            v.mindmap.traverseBF((n: MyNode) => {
                                n.boundingRect = null;
                                n.refreshBox();
                            })
                            v.mindmap.refresh();
                        });
                    }));

        new Setting(containerEl)
            .setName('Display moved on current node')
            .setDesc(
                'If enabled, the mindmap view is centered on the current node when moving it',
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.focusOnMove).onChange((value) => {
                        this.plugin.settings.focusOnMove = value;
                        this.plugin.saveData(this.plugin.settings);

                }),
            );

        // 添加YAML前置元数据配置选项
        new Setting(containerEl)
            .setName(`${t('Require YAML frontmatter')}`)
            .setDesc(`${t('If enabled, mindmap files will require YAML frontmatter. If disabled, you can create mindmaps without frontmatter.')}`)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.requireFrontMatter)
                    .onChange((value) => {
                        this.plugin.settings.requireFrontMatter = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            );

        // 添加 AI 设置部分
        this.displayAISettings(containerEl);
    }

    private displayAISettings(containerEl: HTMLElement): void {
        // 创建 AI 设置容器
        const aiContainer = containerEl.createDiv('ai-settings-container');
        
        // 更新 AI 设置管理器的保存方法
        this.aiSettingsTab = new AISettingsTab(this.app, aiContainer, this.aiSettingsManager);
        
        // 重写保存方法以集成到主插件设置
        (this.aiSettingsTab as any).saveSettings = async () => {
            this.plugin.settings.ai = this.aiSettingsManager.getSettings();
            await this.plugin.saveData(this.plugin.settings);
            
            // 更新 AI 服务
            if (this.plugin.aiService) {
                this.plugin.aiService.updateSettings(this.aiSettingsManager.getSettings());
            }
        };
        
        // 显示 AI 设置
        this.aiSettingsTab.display();
    }
}
