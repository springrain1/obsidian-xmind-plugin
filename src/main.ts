import {
  Plugin,
  WorkspaceLeaf,
  TFile,
  TFolder,
  Notice
} from 'obsidian';
// import DEFAULT_SETTINGS from './setting'
import { around } from 'monkey-around'
import { MindMapSettings } from './settings';
import { MindMapSettingsTab } from './settingTab'
// import { AIService } from './services/AIService'

import { MindMapView, mindmapViewType } from "./MindMapView";
import { frontMatterKey, basicFrontmatter, FRONT_MATTER_REGEX } from './constants';
import { t } from './lang/helpers'

// 类型定义
interface MarkdownView {
  file: TFile;
  leaf: WorkspaceLeaf;
  editor: any;
  getViewType(): string;
}


export default class MindMapPlugin extends Plugin {
  settings: MindMapSettings;
  mindmapFileModes: { [file: string]: string } = {};
  _loaded: boolean = false;
  timeOut: any = null;

  async onload() {
    await this.loadSettings();

    // 清理可能已存在的命令，防止重复
    // 由于TypeScript类型定义问题，使用更安全的方式清理命令
    try {
      // @ts-ignore - 类型定义可能不完整，但API实际存在
      if (this.app.commands && this.app.commands.commands) {
        // @ts-ignore -- Legacy code compatibility
        const existingCommands = this.app.commands.commands;
        for (const id in existingCommands) {
          if (id.startsWith('obsidian-enhancing-mindmap:')) {
            // @ts-ignore - 使用API提供的方法移除命令
            this.removeCommand(id);
          }
        }
      }
    } catch (e) {
      console.log("清理命令时出错:", e);
    }

    this.addCommand({
      id: 'Create New MindMap',
      name: `${t('Create new mindmap')}`,
      checkCallback: (checking: boolean) => {
        let leaf = (this.app.workspace as any).activeLeaf;
        if (leaf) {
          if (!checking) {
            const targetFolder = (this.app as any).fileManager.getNewFileParent(
              this.app.workspace.getActiveFile()?.path || ""
            );
            if (targetFolder) {
              this.newMindMap(targetFolder);
            }
          }
          return true;
        }
        return false;
      }
    });

     this.addCommand({
      id: 'Toggle to markdown or mindmap',
      name: `${t('Toggle markdown/mindmap')}`,
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        const markdownView = (this.app.workspace as any).getActiveViewOfType('markdown');
        
        if(mindmapView != null && mindmapView.file && mindmapView.file.path) {
          this.mindmapFileModes[mindmapView.file.path] = 'markdown';
          this.setMarkdownView(mindmapView.leaf);
        } else if(markdownView != null && markdownView.file && markdownView.file.path) {
          // 检查是否需要YAML前置元数据
          if (this.settings.requireFrontMatter) {
            // 如果需要YAML，检查文件是否包含所需的前置元数据
            const cache = (this.app as any).metadataCache.getFileCache(markdownView.file);
            if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
              // 包含所需的YAML前置元数据，可以切换
              this.mindmapFileModes[markdownView.file.path] = mindmapViewType;
              this.setMindMapView(markdownView.leaf);
            } else {
              // 不包含所需的YAML前置元数据，显示提示
              new Notice("需要YAML前置元数据才能打开为思维导图");
            }
          } else {
            // 不需要YAML前置元数据，直接切换
            this.mindmapFileModes[markdownView.file.path] = mindmapViewType;
            this.setMindMapView(markdownView.leaf);
          }
        }
      }
    });

    // Alt + Shift + C
    this.addCommand({
      id: 'Copy Node',
      name: `${t('Copy node')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'C',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          navigator.clipboard.writeText('');
          var node = mindmap.selectNode;
          if(node){
            var text = mindmap.copyNode(node);
            navigator.clipboard.writeText(text);
          }
        }

      }
    });

    // Alt + Shift + V
    this.addCommand({
      id: 'Paste Node',
      name: `${t('Paste node')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'V',
        },
      ],
      callback: () => {
        const mindmapView = (this.app.workspace as any).getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          navigator.clipboard.readText().then(text=>{
              mindmap.pasteNode(text);
              // Copy once more so that the node can be copied once more
              navigator.clipboard.writeText(text);
          });
        }
      }
    });





    // Alt + Shift + Z
    this.addCommand({
      id: 'Undo',
      name: `${t('Undo')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Z',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.undo();
        }
      }
    });

    // Alt + Shift + Y
    this.addCommand({
      id: 'Redo',
      name: `${t('Redo')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Y',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.redo();
        }
      }
    });

    // Alt + Ctrl + Shift + Z
    this.addCommand({
      id: 'Replace by the previous text',
      name: `${t('Replace by the previous text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Ctrl', 'Shift'],
          key: 'Z',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node) {
              // var text = (node.data.oldText as string);
              var text = (node.data.oldText);
              node.setText(text);
              console.log(text+" / "+node.data.text);
          }
  }
      }
    });

    // Shift + F2
    this.addCommand({
      id: 'Edit node',
      name: `${t('Edit node')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'F2',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if (node && !node.data.isEdit) {
            node.edit();
mindmap._menuDom.setCssProps({ 'display': 'none' });
          }
        }
      }
    });

    // Alt + Shift + Enter
    this.addCommand({
      id: 'Add sibling/end editing',
      name: `${t('Add sibling/end editing')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'Enter',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node) {// A node is selected
            if (!node.data.isEdit) {// Not editing a node => Add sibling node
              // if (!node.isExpand) {
              //   node.expand();
              // }
              if (!node.parent) return;
              var newNode = node.mindmap.execute('addSiblingNode', {
                parent: node.parent
              });
mindmap._menuDom.setCssProps({ 'display': 'none' });

              // Move the new node under the previously selected one
              // Do not add this command to the history
              mindmap.moveNode(newNode, node, 'down', false);
            }
            else {// Editing mode => end edit mode
              //node.cancelEdit();

              mindmap.clearSelectNode();
              node.select();
              node.mindmap.editNode=null;
              //this.selectNode.unSelect();
            }
          }
        }
      }
    });

    // Shift + Tab / Insert
    this.addCommand({
      id: 'Insert child',
      name: `${t('Insert child')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'Insert',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node) {
            if (!node.data.isEdit) {// Not editing
              if (!node.isExpand) {
                node.expand();
              }
              node.mindmap.execute("addChildNode", { parent: node });
mindmap._menuDom.setCssProps({ 'display': 'none' });
            } else{
              // mindmap.selectNode.unSelect();
              mindmap.clearSelectNode();
              node.select();
              node.mindmap.editNode=null;
            }
          }
          //else: no node selected -> nothing to do
        }
      }
    });

    // Shift + Delete
    this.addCommand({
      id: 'Delete node & child',
      name: `${t('Delete node & child')}`,
      hotkeys: [
        {
          modifiers: ['Shift'],
          key: 'Delete',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if (node && !node.data.isRoot && !node.data.isEdit) {
            node.mindmap.execute("deleteNodeAndChild", { node });
mindmap._menuDom.setCssProps({ 'display': 'none' });
          }
          //else: Deletion makes no sense
        }
      }
    });

    // Alt + Shift + S
    this.addCommand({
      id: 'Select the node\'s text',
      name: `${t('Select the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'S',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          let node = mindmap.selectNode;
          if(node) {
            node.edit();
            node.selectText();
          }
          //else: no node selected
        }
      }
    });

    // Alt + Shift + B
    this.addCommand({
      id: 'Bold the node\'s text',
      name: `${t('Bold the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'B',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.selectNode) {
            var l_prefix_1 = "**"; // Applied prefix
            var l_prefix_2 = "__"; // Alternate prefix to look for
            var node = mindmap.selectNode;

            if(node.data.isEdit)
            {// A node is edited: set in bold only the selected part
              var l_check_prefix = true;
              node.setSelectedText(l_prefix_1, l_prefix_2, l_check_prefix);
            }

            else
            {// Set in bold the whole node
              mindmap._formatNode(node, l_prefix_1, l_prefix_2);
            }

            mindmap.refresh();
            mindmap.scale(mindmap.mindScale);
          }
          //else: no node selected: nothing to do
        }
      }
    });

    // Alt + Shift + I
    this.addCommand({
      id: 'Italicize the node\'s text',
      name: `${t('Italicize the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'I',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.selectNode) {
            var node = mindmap.selectNode;

            if(node.data.isEdit)
            {// A node is edited: set in italics only the selected part
              node.setSelectedText_italic();
            }

            else
            {// Set in italics the whole node
              var text = node.data.text;
              if( (   ( (text.substring(0,1)=="*")  ||
                        (text.substring(0,1)=="_")  )   &&
                    (text.substring(0,2)!="**")         &&
                    (text.substring(0,2)!="__")         )   ||
                  (text.substring(0,3)=="***")              ||
                  (text.substring(0,3)=="_**")              ||
                  (text.substring(0,3)=="__*")              ||
                  (text.substring(0,3)=="___")              ||
                  (text.substring(0,3)=="**_")              ||
                  (text.substring(0,3)=="*__")              )
              {// Already italic
                if(text.slice(0, 3).includes("_")) {
                  // Replace only the first "_" in the first 3 chars (that make the italic)
                  text = text.slice(0, 3).replace('_', '') + text.slice(3);
                  // Replace only the first "_" in the LAST 3 chars (that make the italic)
                  text = text.slice(0, -3) + text.slice(-3).replace('_', '');
                }
                else{// A "*" is making the italic
                  text = text.slice(0, 3).replace('*', '') + text.slice(3);
                  text = text.slice(0, -3) + text.slice(-3).replace('*', '');
                }
              }
              else {// Not in italic
                text = "_"+text+"_";
                // Used to use "*" to allow bold/italic change in whatever order
                // However "***" is not displayed as bold + italic, so use _ for italic and * for bold
              }

              // Set node text
              node.mindmap.execute('changeNodeText',{
                  node:node,
                  text:text,
                  oldText:node.data.text
              });
              // node.data.oldText = node.data.text;
              // node.setText(text);
            }

            mindmap.refresh();
            mindmap.scale(mindmap.mindScale);
          }
          //else: no node selected: nothing to do

        }
      }
    });

    // Alt + Shift + H
    this.addCommand({
      id: 'Highlight the node\'s text',
      name: `${t('Highlight the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'H',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.selectNode) {// There is a node selected: format
            var l_prefix_1 = "==";
            var l_prefix_2 = l_prefix_1;
            var node = mindmap.selectNode;

            if(node.data.isEdit)
            {// A node is edited: set in highlight only the selected part
              var l_check_prefix = true;
              node.setSelectedText(l_prefix_1, l_prefix_2, l_check_prefix);
            }

            else
            {// Set in highlight the whole node
              mindmap._formatNode(node, l_prefix_1, l_prefix_2);
            }

            mindmap.refresh();
            mindmap.scale(mindmap.mindScale);
          }
        }
        //else: no node selected: nothing to do
      }
    });

    // Alt + Shift + 2
    this.addCommand({
      id: 'Strike through the node\'s text',
      name: `${t('Strike through the node\'s text')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: '2',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.selectNode) {// There is a node selected: format
            var l_prefix_1 = "~~";
            var l_prefix_2 = l_prefix_1;
            var node = mindmap.selectNode;

            if(node.data.isEdit)
            {// A node is edited: set in strikethrough only the selected part
              var l_check_prefix = true;
              node.setSelectedText(l_prefix_1, l_prefix_2, l_check_prefix);
            }

            else
            {// Set in strikethrough the whole node
              mindmap._formatNode(node, l_prefix_1, l_prefix_2);
            }

            mindmap.refresh();
            mindmap.scale(mindmap.mindScale);
          }
        }
        //else: no node selected: nothing to do
      }
    });

    // Alt + Shift + L
    this.addCommand({
      id: 'Remove line breaks (<br>)',
      name: `${t('Remove line breaks (<br>)')}`,
      hotkeys: [
        {
          modifiers: ['Alt','Shift'],
          key: 'l',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          let node = mindmap.selectNode;
          if(node) {
            node.removeLineBreak();
          }
          //else: no node selected
        }
      }
    });


    // (Shift +) Escape
    this.addCommand({
      id: 'Cancel edit',
      name: `${t('Cancel edit')}`,
      hotkeys: [
        {
          modifiers: [],
          key: 'Escape',
        },
        {
          modifiers: ['Shift'],
          key: 'Escape',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if (node && node.data.isEdit) {
            node.select();
            node.mindmap.editNode = null;
            node.cancelEdit();
            mindmap.undo();
            //this.selectNode.unSelect();
          }
        }
      }
    });

    // Alt + Dn
    this.addCommand({
      id: 'Expand one level',
      name: `${t('Expand one level')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'ArrowDown',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          if(mindmap.selectNode) {
            mindmap.setDisplayedLevel(mindmap.selectNode.getLevel()+1);
            mindmap.refresh();
            mindmap._selectNode(mindmap.selectNode, "right");
          }
        }
      }
    });

    // Alt + PgDn
    this.addCommand({
      id: 'Expand one level from the max. displayed level',
      name: `${t('Expand one level from the max. displayed level')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'PageDown',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          {// Expand
            mindmap.setChildrenDisplayedLevel(mindmap.getMaxNodeDisplayedLevel(node)+1);
            mindmap.refresh();
            //mindmap.scale(mindmap.mindScale);
            mindmap.selectNode.select();
          }
        }
      }
    });

    // Alt + Up
    this.addCommand({
      id: 'Collapse one level',
      name: `${t('Collapse one level')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'ArrowUp',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
            if(mindmap.selectNode) {
              mindmap.setDisplayedLevel(mindmap.selectNode.getLevel()-1);
              mindmap.refresh();
              mindmap.selectNode.parent.select();
          }
        }
      }
    });

    // Alt + PgUp:
      this.addCommand({
        id: 'Collapse one level from the max. displayed level',
        name: `${t('Collapse one level from the max. displayed level')}`,
        hotkeys: [
          {
            modifiers: ['Alt'],
            key: 'PageUp',
          },
        ],
          callback: () => {
          const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
          if(mindmapView){
            var mindmap = mindmapView.mindmap;
            var node = mindmap.selectNode;
            if( (node)                                                  &&
                (mindmap.getMaxNodeDisplayedLevel(node)>node.getLevel())   )
            {// Collapse only if current selected node would not be hidden
              mindmap.setChildrenDisplayedLevel(mindmap.getMaxNodeDisplayedLevel(node)-1);
              mindmap.refresh();
              mindmap.scale(mindmap.mindScale);
              mindmap.selectNode.select();
            }
          }
        }
      });

    // Ctrl + Shift + Space
    this.addCommand({
      id: 'Toggle expand/collapse node',
      name: `${t('Toggle expand/collapse node')}`,
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'Space',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          { mindmap._toggleExpandNode(node); }
        }
      }
    });

    // Alt + Shift + Up
    this.addCommand({
      id: 'Move the current node above',
      name: `${t('Move the current node above')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowUp',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(!node)
          {// No node selected: select root node
            mindmap.root.select();
            node = mindmap.selectNode;
          }
          else if((!node.data.isEdit)  &&
                  (!node.data.isRoot)  )
          {// The node can be moved
            var type='top';
            if(node.getIndex() == 0)
            {// First sibling: move BELOW "previous" (=last) node
              type='down';
            }
            //else: no special treatment
            mindmap.moveNode(node, node.getPreviousSibling(), type);
          }
          if ((this.settings.focusOnMove == true))
          {
            mindmap.centerOnNode(mindmap.selectNode);
          }
        }
      }
    });

    // Alt + Shift + Down
    this.addCommand({
      id: 'Move the current node below',
      name: `${t('Move the current node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowDown',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(!node)
          {// No node selected: select root node
            mindmap.root.select();
            node = mindmap.selectNode;
          }
          else if((!node.data.isEdit)  &&
                  (!node.data.isRoot)  )
          {// The node can be moved
            var type='down';
            if(node.getIndex() == node.parent.children.length-1)
            {// Last sibling: move ABOVE "next" (=first) node
                type='top';
            }
            //else: no special treatment
            mindmap.moveNode(node, node.getNextSibling(), type);
          }
          if((this.settings.focusOnMove == true))
            {
            mindmap.centerOnNode(mindmap.selectNode);
          }
        }
      }
    });

    // Alt + Shift + Left
    this.addCommand({
      id: 'Move the current node left',
      name: `${t('Move the current node left')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowLeft',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(!node)
          {// No node selected: select root node
            mindmap.root.select();
            node = mindmap.selectNode;
          }
          else {// Move current node as parent/child depending on the position
            var rootPos = mindmap.root.getPosition();
            var nodePos = node.getPosition();
            if(rootPos.x < nodePos.x)
            {
              mindmap._moveAsParent(node);
            }
            else
            {
              mindmap._moveAsChild(node, node.getPreviousSibling());
            }
          }
          if((this.settings.focusOnMove == true))
            {
            mindmap.centerOnNode(mindmap.selectNode);
          }
        }
      }
    });

    // Alt + Shift + Right
    this.addCommand({
      id: 'Move the current node right',
      name: `${t('Move the current node right')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowRight',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(!node)
          {// No node selected
            mindmap.root.select();
            node = mindmap.selectNode;
          }
          else {
            var rootPos = mindmap.root.getPosition();
            var nodePos = node.getPosition();
            if(rootPos.x < nodePos.x)
            {
              // mindmap.selectedNodes.forEach((n:INode) => {
              //     mindmap._moveAsChild(n);
              // });
              mindmap._moveAsChild(node, node.getPreviousSibling());
            }
            else
            {
              mindmap._moveAsParent(node);
            }
          }
          if((this.settings.focusOnMove == true))
            {
            mindmap.centerOnNode(mindmap.selectNode);
          }
        }
      }
    });


    // Alt + Shift + D
    this.addCommand({
      id: 'Move next siblings as children',
      name: `${t('Move next siblings as children')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'D',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          {  mindmap.moveNextSiblingsAsChildren(node); }
          // else: No node selected: nothing to do
        }
      }
    });


    this.addCommand({
      id: 'Move all siblings as children',
      name: `${t('Move all siblings as children')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Ctrl', 'Shift'],
          key: 'D',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          {  mindmap.moveAllSiblingsAsChildren(node); }
          // else: No node selected: nothing to do
        }
      }
    });


    // Alt + Shift + J
    this.addCommand({
      id: 'Join with the node below',
      name: `${t('Join with the node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'J',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          {  mindmap.joinWithFollowingNode(node); }
          // else: No node selected: nothing to do
        }
      }
    });

    // Alt + Shift + Ctrl + J
    this.addCommand({
      id: 'Join as citation with the node below',
      name: `${t('Join as citation with the node below')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift', 'Ctrl'],
          key: 'J',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node)
          {  mindmap.joinAsCitationWithFollowingNode(node); }
          // else: No node selected: nothing to do
        }
      }
    });

    // Alt + E
    this.addCommand({
      id: 'Center mindmap view on the current node',
      name: `${t('Center mindmap view on the current node')}`,
      hotkeys: [
        {
          modifiers: ['Alt'],
          key: 'E',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.centerOnNode(mindmap.selectNode);
        }
      }
    });

    // Alt + Shift + E
    this.addCommand({
      id: 'Center mindmap view',
      name: `${t('Center mindmap view')}`,
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'E',
        },
      ],
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          mindmap.center();
        }
      }
    });

    this.addCommand({
      id: 'Display the node\'s info in console',
      name: `${t('Display the node\'s info in console')}`,
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
          var mindmap = mindmapView.mindmap;
          var node = mindmap.selectNode;
          if(node) {
            console.log("Node idx: "+node.getIndex());
            console.log("Previous node idx: "+node.getPreviousSibling().getIndex());
            console.log("Next node idx: "+node.getNextSibling().getIndex());
            console.log("Node pos: x="+node.getPosition().x+" / y="+node.getPosition().y);
            console.log("Node dim: x="+node.getDimensions().x+" / y="+node.getDimensions().y);
            console.log("Canvas: "+mindmap.setting.canvasSize);
            console.log("Disp scroll: x="+mindmap.containerEL.scrollLeft+" / y="+mindmap.containerEL.scrollTop);
            console.log("Disp client: x="+mindmap.containerEL.clientWidth+" / y="+mindmap.containerEL.clientHeight);
            //node.setText
          }
        }
      }
    });







    this.addCommand({
      id: 'Export to html',
      name: `${t('Export to html')}`,
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
            mindmapView.exportToSvg();
        }
      }
    });


    this.addCommand({
      id: 'Export to JPEG',
      name: `${t('Export to JPEG')}`,
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if (mindmapView) {
          mindmapView.exportToJpeg();
        }
      }
    });

    this.addCommand({
      id: 'Export to PNG',
      name: `${t('Export to PNG')}`,
      callback: () => {
        const mindmapView = this.app.workspace.getActiveViewOfType(MindMapView);
        if(mindmapView){
            mindmapView.exportToPng();
        }
      }
    });




    this.registerView(mindmapViewType, (leaf) => new MindMapView(leaf, this));
    this.registerEvents();
    this.registerMonkeyAround();


    this.addSettingTab(new MindMapSettingsTab(this.app, this));

  }


  onunload() {
    // AIService清理已在各个组件中单独处理
  }

  async newMindMap(folder?: TFolder) {
    const targetFolder = folder
      ? folder
      : this.app.fileManager.getNewFileParent(
        this.app.workspace.getActiveFile()?.path || ""
      );

    try {
      // @ts-ignore -- Legacy code compatibility
      const mindmap: TFile = await this.app.fileManager.createNewMarkdownFile(
        targetFolder,
        `${t('Untitled mindmap')}`
      );

      // 根据用户设置决定是否添加前置元数据
      // 注意：此设置在UI中不可见，默认为false，保持与原版行为一致
      if (this.settings.requireFrontMatter) {
        // 如果需要前置元数据，则添加
        await this.app.vault.modify(mindmap, basicFrontmatter);
      } else {
        // 如果不需要前置元数据，则添加一个根节点作为开始
        await this.app.vault.modify(mindmap, `# ${t('Untitled mindmap')}`);
      }
      
      setTimeout(async ()=>{
         await this.app.workspace.getLeaf().setViewState({
           type: mindmapViewType,
           state: { file: mindmap.path },
         });
      },100);
    } catch (e) {
      console.error("Error creating mindmap board:", e);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async setMarkdownView(leaf: WorkspaceLeaf) {
    await leaf.setViewState(
      {
        type: "markdown",
        state: leaf.view.getState(),
        popstate: true,
      } as ViewState,
      { focus: true }
    );
  }

  async setMindMapView(leaf: WorkspaceLeaf) {
    await leaf.setViewState({
      type: mindmapViewType,
      state: leaf.view && typeof (leaf.view as any).getState === 'function' ? (leaf.view as any).getState() : {},
      popstate: true,
    } as any);
  }

  registerEvents() {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file: TFile, source: string, leaf?: WorkspaceLeaf) => {
        // 安全检查：确保menu和file存在
        if (!menu) {
          console.warn('Menu is undefined in file-menu event');
          return;
        }

        if (!file) {
          console.warn('File is undefined in file-menu event');
          return;
        }

        // Add a menu item to the folder context menu to create a board
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle(`${t('New mindmap board')}`)
              .setIcon('document')
              .onClick(() => this.newMindMap(file));
          });
        }

        //add markdown view menu open as mind map view
        if (leaf && file instanceof TFile && file.extension === 'md') {
          // 检查当前视图类型，只在非思维导图视图中添加"打开为思维导图"选项
          const currentViewType = leaf.view.getViewType();
          
          if (currentViewType !== mindmapViewType) {
            // 根据requireFrontMatter设置决定是否显示菜单项
            if (this.settings.requireFrontMatter) {
              // 如果需要YAML前置元数据，则检查文件是否有相应的YAML
              const cache = this.app.metadataCache.getFileCache(file);
              if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
                // 只有含有mindmap-plugin的YAML前置元数据才显示菜单
                menu.addItem((item) => {
                  item
                    .setTitle(`${t('Open as mindmap board')}`)
                    .setIcon("document")
                    .onClick(() => {
                      this.mindmapFileModes[file.path] = mindmapViewType;
                      this.setMindMapView(leaf);
                    });
                });
              }
            } else {
              // 如果不需要YAML前置元数据，则为所有Markdown文件添加菜单项
              menu.addItem((item) => {
                item
                  .setTitle(`${t('Open as mindmap board')}`)
                  .setIcon("document")
                  .onClick(() => {
                    this.mindmapFileModes[file.path] = mindmapViewType;
                    this.setMindMapView(leaf);
                  });
              });
            }
          }
        }
      })
    );

    // 注册元数据变化监听器 - 使用更安全的方式
    this.registerEvent(
      (this.app as any).metadataCache.on("changed", (file: any) => {
        try {
          // 获取所有思维导图视图
          const mindmapLeaves = this.app.workspace.getLeavesOfType(mindmapViewType);

          for (const leaf of mindmapLeaves) {
            try {
              const view = leaf.view;
              // 更严格的类型检查和实例验证
              if (view &&
                  typeof view.getViewType === 'function' &&
                  view.getViewType() === mindmapViewType &&
                  view instanceof MindMapView &&
                  (view as any).file &&
                  (view as any).file.path === file.path) {

                // 确保方法存在后再调用
                if (typeof (view as any).onFileMetadataChange === 'function') {
                  try {
                    (view as any).onFileMetadataChange(file);
                  } catch (methodError) {
                    console.debug('onFileMetadataChange method error:', methodError);
                  }
                } else {
                  console.debug('onFileMetadataChange method not found on view');
                }
              }
            } catch (viewError) {
              // 静默处理单个视图的错误
              console.debug('Metadata change error for individual view:', viewError);
            }
          }
        } catch (error) {
          console.warn('Error in metadata change handler:', error);
        }
      })
    );

    // 注册最近文件菜单，确保那里也有思维导图选项
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile) => {
        if (file && file.extension === 'md') {
          // 确保文件打开时可以获取到最新的文件模式
          const isAlreadyMindMap = this.mindmapFileModes[file.path] === mindmapViewType;
          
          // 如果文件内容符合思维导图格式但尚未标记为思维导图
          if (!isAlreadyMindMap) {
            try {
              const cache = this.app.metadataCache.getFileCache(file);
              // 检查是否有YAML前置元数据标记为思维导图
              if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
                this.mindmapFileModes[file.path] = mindmapViewType;
              }
            } catch (e) {
              console.log("检查文件缓存出错:", e);
            }
          }
          
          // 检查当前活动视图是否是思维导图视图，如果是则刷新大纲和地图概览
          const activeLeaf = this.app.workspace.activeLeaf;
          if (activeLeaf) {
            const activeView = activeLeaf.view;
            if (activeView && activeView.getViewType() === mindmapViewType) {
              // 是思维导图视图，刷新大纲和地图概览
              const mindmapView = activeView as MindMapView;
              
              // 通过调用setViewData方法重新加载内容
              setTimeout(() => {
                if (mindmapView.mindmap) {
                  // 确保大纲视图和地图概览都被正确初始化
                  if (!mindmapView.outlineView || !mindmapView.toggleButton) {
                    mindmapView.initOutlineView();
                  } else {
                    // 如果大纲视图已存在，更新引用和内容
                    mindmapView.outlineView.mindmap = mindmapView.mindmap;
                    mindmapView.outlineView.render();
                  }
                  
                  if (!mindmapView.mapOverview || !mindmapView.mapToggleButton) {
                    // 如果没有地图概览，重新初始化
                    if (!mindmapView.outlineView) {
                      mindmapView.initOutlineView(); // 这会同时创建大纲视图和地图概览
                    }
                  } else {
                    // 如果地图概览已存在，更新引用和内容
                    mindmapView.mapOverview.mindmap = mindmapView.mindmap;
                    if (mindmapView.mapOverview.isVisible) {
                      mindmapView.mapOverview.render();
                    }
                  }
                }
              }, 300); // 增加延迟确保思维导图已完全加载
            }
          }
        }
      })
    );

    // 跨视图撤销功能现在通过直接同步实现，不需要事件监听器
  }



  registerMonkeyAround() {
    const self = this;

    this.register(
      around(WorkspaceLeaf.prototype, {
        // Kanbans can be viewed as markdown or kanban, and we keep track of the mode
        // while the file is open. When the file closes, we no longer need to keep track of it.
        detach(next) {
          return function () {
            const state = this.view?.getState();

            // 安全检查：确保文件路径有效
            if (state?.file && typeof state.file === 'string' && state.file.trim() !== '') {
              // 使用file.path作为主要键
              const fileKey = state.file;
              if (self.mindmapFileModes[fileKey]) {
                delete self.mindmapFileModes[fileKey];
              }
            }

            return next.apply(this);
          };
        },

        setViewState(next) {
          return function (state: ViewState, ...rest: any[]) {
            try {
              // 检查必要条件
              if (
                self._loaded &&
                state.type === "markdown" &&
                state.state?.file &&
                typeof state.state.file === 'string' &&
                state.state.file.trim() !== '' &&
                // 确认文件模式不是markdown
                self.mindmapFileModes[state.state.file] !== "markdown"
              ) {
                // 检查文件是否存在
                const file = self.app.vault.getAbstractFileByPath(state.state.file);
                if (!file || !(file instanceof TFile)) {
                  // 如果文件不存在或不是TFile类型，使用原始方法处理
                  return next.apply(this, [state, ...rest]);
                }
                
                // 检查是否有YAML前置元数据
                const cache = self.app.metadataCache.getCache(state.state.file);
                
                // 方式1：检查YAML前置元数据
                if (cache?.frontmatter && cache.frontmatter[frontMatterKey]) {
                  // 如果有YAML前置元数据，强制视图类型为思维导图
                  const newState = {
                    ...state,
                    type: mindmapViewType,
                  };

                  self.mindmapFileModes[state.state.file] = mindmapViewType;
                  return next.apply(this, [newState, ...rest]);
                }
                
                // 当关闭"需要YAML前置元数据"设置时，不自动将md文件转换为思维导图
                // 用户需要手动通过右键菜单选择"打开为思维导图"
              }
            } catch (e) {
              console.log("setViewState异常:", e);
            }

            // 无论如何都执行原始方法
            return next.apply(this, [state, ...rest]);
          };
        },
      })
    );



    // this.register(
    //   around(MarkdownView.prototype, {
    //     onMoreOptionsMenu(next) {
    //       return function (menu: Menu) {
    //         const file = this.file;
    //         const cache = file
    //           ? self.app.metadataCache.getFileCache(file)
    //           : null;

    //         if (
    //           !file ||
    //           !cache?.frontmatter ||
    //           !cache.frontmatter[frontMatterKey]
    //         ) {
    //           return next.call(this, menu);
    //         }



    //         menu
    //           .addItem((item) => {
    //             item
    //               .setTitle(`${t('Open as mindmap board')}`)
    //               .setIcon("document")
    //               .onClick(() => {
    //                 self.mindmapFileModes[this.leaf.id || file.path] =
    //                   mindmapViewType;
    //                 self.setMindMapView(this.leaf);
    //               });
    //           })
    //           .addSeparator();

    //         next.call(this, menu);
    //       };
    //     },
    //   })
    // );


  }




}
