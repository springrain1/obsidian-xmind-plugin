import MindMap from './mindmap'
import {MarkdownRenderer,normalizePath,TFile,parseLinktext,resolveSubpath,Notice} from 'obsidian'
import {t} from '../lang/helpers'


export function keepLastIndex(dom:HTMLElement) {
    if ( window.getSelection ) { //ie11 10 9 ff safari
        dom.focus();  //ff
        var range = window.getSelection();
        range.selectAllChildren(dom);
        range.collapseToEnd();
    }
    // else if ( document.selection ) { //ie10 9 8 7 6 5
    //     var range = document.selection.createRange();
    //     range.moveToElementText(dom);
    //     range.collapse(false);
    //     range.select();
    // }
};

interface INode {
    id: string;
    text: string;
    pid?:string;
    mdText?:string;
    isRoot?:Boolean;
    children?:INode[];
    isEdit?:boolean;

}

interface BOX {
    x: number;
    y: number;
    width:number;
    height:number;
    right?:number;
    bottom?:number;
}

export class INodeData implements INode{
    id:string;
    text:string;
    pid?:string;
    mdText?:string;
    isRoot?:Boolean;
    children?:INodeData[]
    expanded?:boolean;
    isEdit?:boolean;
}

export default class Node {
    containEl:HTMLElement;
    contentEl:HTMLElement;
    box:BOX = {
        x:0,
        y:0,
        width:0,
        height:0
    };
    mindmap:MindMap;
    isExpand:boolean=true;
    isSelect:boolean = false;
    _oldText?:string;
    parent?:Node;
    //isRoot?:boolean;
    children:Node[]=[];
    boundingRect:any;
    direct?:string;
    isHide:boolean=false;
    stroke?:string;
    //isEdit:boolean=false;
    _barDom:HTMLElement=null;
    _aiButton:HTMLElement=null;
    data:any
    constructor( data:INode,mindMap?:MindMap){
       this.data = data;
       this.mindmap = mindMap;
       this.initDom();
    }

    getId(){
        return this.data.id;
    }

    initDom(){
        this.containEl = document.createElement('div');
        this.containEl.classList.add('mm-node');
        this.containEl.setAttribute('contentEditable','false');
        this.containEl.setAttribute('tabIndex','-1');
        this.containEl.setAttribute('data-id',this.data.id);
        this.containEl.setAttribute('draggable','false');

        this.contentEl = document.createElement('div');
        this.contentEl.classList.add('mm-node-content');
        this.containEl.appendChild(this.contentEl);
        //this.containEl.textContent = this.data.text;
        this.initNodeBar();

        if(this.data.isRoot){
            this.containEl.classList.add('mm-root');
            this.data.isRoot = true;
        }else{
            this.data.isRoot = false;
            this.containEl.classList.remove('mm-root');
        }
        this.parseText();
    }

    initNodeBar(){
        this._barDom = document.createElement('div')
        this._barDom.classList.add('mm-node-bar');
        this.containEl.appendChild(this._barDom);

        // 添加AI扩展按钮
        this.initAIButton();
    }

    initAIButton(){
        this._aiButton = document.createElement('div');
        this._aiButton.classList.add('mm-node-ai-button');
        this._aiButton.textContent = "🧠";
        this._aiButton.title = 'AI 扩展';
        this._aiButton.style.display = 'none'; // 默认隐藏
        this.containEl.appendChild(this._aiButton);

        // 添加点击事件
        this._aiButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showAIMenu(e);
        });

        // 添加鼠标悬停事件
        this.containEl.addEventListener('mouseenter', () => {
            this._aiButton.style.display = 'block';
        });

        this.containEl.addEventListener('mouseleave', () => {
            this._aiButton.style.display = 'none';
        });
    }

    parseText(){
        if (this.data.text.length === 0){
            this.data.text = "Sub title";
        }
        // 安全检查：确保 mindmap.view 和 mindmap.view.app 存在
        if (this.mindmap?.view?.app) {
            MarkdownRenderer.render(this.mindmap.view.app, this.data.text, this.contentEl, this.mindmap.path||"", this.mindmap.view).then(()=>{
                this.data.mdText = this.contentEl.innerHTML;
                this.refreshBox();
                this.mindmap&&this.mindmap.emit('initNode',{});
                this._delay();
            });
        } else {
            // 如果没有 app 实例，直接使用文本渲染
            console.warn("mindmap.view.app 不可用，使用基本文本渲染");
            this.contentEl.innerText = this.data.text;
            this.refreshBox();
            this.mindmap&&this.mindmap.emit('initNode',{});
            this._delay();
        }

    }

    _delay(){
           //parse md
           this.contentEl.findAll(".internal-embed").forEach(async (el) => {
            const src = el.getAttribute("src");
            if(typeof src ==='string'){
                var pathObj=parseLinktext(src);
                var fileData ='';
               if(this.mindmap&&this.mindmap.view){
                    var f = this.mindmap.view.app.metadataCache.getFirstLinkpathDest(pathObj.path,this.mindmap.path);
                    if(f instanceof TFile&&f.extension ==='md'){
                         fileData = await this.mindmap.view.app.vault.adapter.read(f.path);
                         var markdownEmbed = document.createElement('div');
                         markdownEmbed.classList.add('markdown-embed');
                        //  var  markdownHead = document.createElement('div');
                        //  markdownHead.classList.add('markdown-embed-title');
                        //  markdownHead.innerText=f.basename;
                         markdownEmbed.setAttribute('data-name',f.path);
                         var markdownContent = document.createElement('div');
                         markdownContent.classList.add('markdown-embed-content');
                         var markdownPreview = document.createElement('div');
                         markdownPreview.classList.add('markdown-preview-view');
                         markdownContent.appendChild(markdownPreview);
                         var markdownLink = document.createElement('div');
                         markdownLink.classList.add('markdown-embed-link');
                         markdownLink.setAttribute('aria-label','Open link');
                         markdownLink// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Safe SVG content
        .innerHTML = `<a data-href="${src}" href="${src}" class="internal-link" target="_blank" rel="noopener"><svg viewBox="0 0 100 100" class="link" width="20" height="20"><path fill="currentColor" stroke="currentColor" d="M74,8c-4.8,0-9.3,1.9-12.7,5.3l-10,10c-2.9,2.9-4.7,6.6-5.1,10.6C46,34.6,46,35.3,46,36c0,2.7,0.6,5.4,1.8,7.8l3.1-3.1 C50.3,39.2,50,37.6,50,36c0-3.7,1.5-7.3,4.1-9.9l10-10c2.6-2.6,6.2-4.1,9.9-4.1s7.3,1.5,9.9,4.1c2.6,2.6,4.1,6.2,4.1,9.9 s-1.5,7.3-4.1,9.9l-10,10C71.3,48.5,67.7,50,64,50c-1.6,0-3.2-0.3-4.7-0.8l-3.1,3.1c2.4,1.1,5,1.8,7.8,1.8c4.8,0,9.3-1.9,12.7-5.3 l10-10C90.1,35.3,92,30.8,92,26s-1.9-9.3-5.3-12.7C83.3,9.9,78.8,8,74,8L74,8z M62,36c-0.5,0-1,0.2-1.4,0.6l-24,24 c-0.5,0.5-0.7,1.2-0.6,1.9c0.2,0.7,0.7,1.2,1.4,1.4c0.7,0.2,1.4,0,1.9-0.6l24-24c0.6-0.6,0.8-1.5,0.4-2.2C63.5,36.4,62.8,36,62,36 z M36,46c-4.8,0-9.3,1.9-12.7,5.3l-10,10c-3.1,3.1-5,7.2-5.2,11.6c0,0.4,0,0.8,0,1.2c0,4.8,1.9,9.3,5.3,12.7 C16.7,90.1,21.2,92,26,92s9.3-1.9,12.7-5.3l10-10C52.1,73.3,54,68.8,54,64c0-2.7-0.6-5.4-1.8-7.8l-3.1,3.1 c0.5,1.5,0.8,3.1,0.8,4.7c0,3.7-1.5,7.3-4.1,9.9l-10,10C33.3,86.5,29.7,88,26,88s-7.3-1.5-9.9-4.1S12,77.7,12,74 c0-3.7,1.5-7.3,4.1-9.9l10-10c2.6-2.6,6.2-4.1,9.9-4.1c1.6,0,3.2,0.3,4.7,0.8l3.1-3.1C41.4,46.6,38.7,46,36,46L36,46z"></path></svg></a>`

                         el.appendChild(markdownEmbed);
                        //  markdownEmbed.appendChild(markdownHead);
                         markdownEmbed.appendChild(markdownContent);
                         markdownEmbed.appendChild(markdownLink);

                        if(pathObj.subpath){
                            var metacache = this.mindmap.view.app.metadataCache.getFileCache(f);
                            var t=resolveSubpath(metacache,pathObj.subpath);
                         //   console.log(t);
                            if(t&&t.start&&t.end){
                              var md =fileData.substring(t.start.offset,t.end.offset);
                             // console.log(md)
                            }else if(t&&t.start&&!t.end){
                                var md = fileData.substr(t.start.offset);
                            }else{
                                var md = fileData||'';
                            }
                        }else{
                            var md=fileData||'';
                        }

                        if(md){
                            // 安全检查：确保 mindmap.view 和 mindmap.view.app 存在
                            if (this.mindmap?.view?.app) {
                                MarkdownRenderer.render(this.mindmap.view.app, md, markdownPreview, this.mindmap.path||"", this.mindmap.view).then(()=>{
                                   // this.data.mdText = this.editDom.innerHTML;
                                    this.refreshBox();
                                    //this._delay();
                                    this.mindmap&&this.mindmap.emit('renderEditNode',{node:this});
                                });
                            } else {
                                // 如果没有 app 实例，直接使用文本渲染
                                console.warn("mindmap.view.app 不可用，使用基本文本渲染");
                                markdownPreview.innerText = md;
                                this.refreshBox();
                                this.mindmap&&this.mindmap.emit('renderEditNode',{node:this});
                            }
                        }

                    }
               }
            }
          });
         //parse image
         setTimeout(()=>{
             this.contentEl.findAll(".internal-embed").forEach((el) => {
                const src = el.getAttribute("src");
                const target =
                  typeof src === "string" &&
                  this.mindmap&&this.mindmap.view?.app.metadataCache.getFirstLinkpathDest(src, this.mindmap.path);
                if (target instanceof TFile && target.extension !== "md" && this.mindmap) {
                  el.innerText = "";
                  el.createEl(
                    "img",
                    { attr: { src: this.mindmap.view.app.vault.getResourcePath(target) } },
                    (img) => {
                      if (el.hasAttribute("width"))
                        img.setAttribute("width", el.getAttribute("width"));
                      if (el.hasAttribute("alt"))
                        img.setAttribute("alt", el.getAttribute("alt"));
                    }
                  );
                  el.addClasses(["image-embed", "is-loaded"]);
                }
              });

            //Possible causes of delay,code mathjax
            var dom =this.contentEl.querySelector('code')|| this.contentEl.querySelector('.MathJax');
            if(dom){
                setTimeout(()=>{
                    this.clearCacheData();
                    this.refreshBox();
                    this.mindmap&&this.mindmap.emit('renderEditNode',{});
                },100);
            }
            //image
            this.contentEl.querySelectorAll('img').forEach(element => {
                element.onload = () => {
                        this.clearCacheData();
                        this.refreshBox();
                        this.mindmap&&this.mindmap.emit('renderEditNode',{});
                }
                element.onerror = () => {
                        this.clearCacheData();
                        this.refreshBox();
                        this.mindmap&&this.mindmap.emit('renderEditNode',{});
                }

                element.setAttribute('draggble','false');
            });

         },100)
    }

    select(){
        this.isSelect = true;
        this.containEl.setAttribute('draggable','true');
        //if(this.mindmap.view.plugin.settings.focusOnMove) {
            this.containEl.focus(); // set the dom to be focused
        //}
        Object.assign(window,{
            myNode:this
        });
        if(!this.containEl.classList.contains('mm-node-select')){
            this.containEl.classList.add('mm-node-select')
        }
        this.mindmap.selectNode=this;
    }

    unSelect(){
        this.isSelect = false;
        this.containEl.setAttribute('draggable','false');
        if(this.containEl.classList.contains('mm-node-select')){
            this.containEl.classList.remove('mm-node-select')
        }
    }

    edit(){
        this.contentEl.innerText='';
        this._oldText = this.data.text;
        //var _t =  this.data.text.replace(/\r\n/g,"<br/>")
       // _t = _t.replace(/\n/g,"<br/>");
      //  console.log(_t);
        this.contentEl.innerText = this.data.text;
        this.contentEl.setAttribute('contentEditable','true');
        this.contentEl.focus();
        this.mindmap.editNode = this;
        this.data.isEdit = true;
        keepLastIndex(this.contentEl);

        if (this.contentEl.innerText == t('Sub title')) {
            this.selectText();
        }

        if(!this.containEl.classList.contains('mm-edit-node')){
            this.containEl.classList.add('mm-edit-node')
        }
    }

    selectText() {
        var text = this.contentEl;
        // if (document.body.createTextRange) {
        //     var range = document.body.createTextRange();
        //     range.moveToElementText(text);
        //     range.select();
        // }
        if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }


    setSelectedText(i_str_1: string, i_str_2: string, i_check: boolean) {
        // Get selection and Create new text
        let l_selection = window.getSelection();
        let l_selectedText = l_selection.toString();

        // Remove leading space(s)
        let l_leadingSpace = false;
        while (l_selectedText.substring(0,1) == " ") {
            l_selectedText = l_selectedText.substring(1);
            l_leadingSpace = true;
        }

        // Remove trailing space(s)
        let l_trailingSpace = false;
        while (l_selectedText.substring(l_selectedText.length-1) == " ") {
            l_selectedText = l_selectedText.substring(0,l_selectedText.length-1);
            l_trailingSpace = true;
        }

        if(i_check)
        {// Check in case the pre-/suf-fix must be substracted
            if( (l_selectedText.substring(0,2) == i_str_1)  ||
                (l_selectedText.substring(0,2) == i_str_2)  )
            {// Prefix must be substracted, bold first
                l_selectedText = l_selectedText.substring(2); // Remove leading prefix

                if( (l_selectedText.substring(l_selectedText.length-2) == i_str_1)  ||
                    (l_selectedText.substring(l_selectedText.length-2) == i_str_2)  )
                {// Suffix must be substracted
                    l_selectedText = l_selectedText.substring(0,l_selectedText.length-2);
                }
                // else: no trailing prefix
            }
            else if(    (l_selectedText.substring(1,3) == i_str_1)  ||
                        (l_selectedText.substring(1,3) == i_str_2)  )
            {// Prefix must be substracted, italic (?) first
                l_selectedText = l_selectedText[0] + l_selectedText.substring(3); // Remove prefix

                if( (l_selectedText.slice(-3, -1) == i_str_1)   ||
                    (l_selectedText.slice(-3, -1) == i_str_2)   )
                {// Suffix must be substracted
                    l_selectedText = l_selectedText.substring(0,l_selectedText.length-3) +
                        l_selectedText.slice(-1);
                }
                // else: no trailing prefix
            }
            else if(    (l_selectedText.substring(2,4) == i_str_1)  ||
                        (l_selectedText.substring(2,4) == i_str_2)  )
            {// Prefix must be substracted, highlight (?) first
                l_selectedText = l_selectedText.substring(0,2) + l_selectedText.substring(4); // Remove prefix

                if( (l_selectedText.slice(-4, -2) == i_str_1)   ||
                    (l_selectedText.slice(-4, -2) == i_str_2)   )
                {// Suffix must be substracted
                    l_selectedText = l_selectedText.substring(0,l_selectedText.length-4) +
                    l_selectedText.slice(-2);
                }
                // else: no trailing prefix
            }
            else {// No pre-/suf-fix: add it
                l_selectedText = i_str_1+l_selectedText+i_str_1;
            }
        }
        else {// No need to check: add the string
            l_selectedText = i_str_1+l_selectedText+i_str_1;
        }

        // Add a leading/trailing space if needed
        if (l_leadingSpace) {
            l_selectedText = (" "+l_selectedText);
        }
        if (l_trailingSpace) {
            l_selectedText = (l_selectedText+" ");
        }


        // Create a new selection range
        let range = l_selection.getRangeAt(0);
        range.deleteContents();
        let textNode = document.createTextNode(l_selectedText);
        range.insertNode(textNode);

        // Unselect modified text
        //selection.removeAllRanges();
    }

    setSelectedText_italic() {
        // Get selection and Create new text
        let l_selection = window.getSelection();
        let l_selectedText = l_selection.toString();

        // Remove leading space(s)
        let l_leadingSpace = false;
        while (l_selectedText.substring(0,1) == " ") {
            l_selectedText = l_selectedText.substring(1);
            l_leadingSpace = true;
        }

        // Remove trailing space(s)
        let l_trailingSpace = false;
        while (l_selectedText.substring(l_selectedText.length-1) == " ") {
            l_selectedText = l_selectedText.substring(0,l_selectedText.length-1);
            l_trailingSpace = true;
        }

        {// Check in case the pre-/suf-fix must be substracted
            if( (   (   (l_selectedText.substring(0,1)=="*")   ||
                        (l_selectedText.substring(0,1)=="_")    )   &&
                    (l_selectedText.substring(0,2)!="**")           &&
                    (l_selectedText.substring(0,2)!="__")           )   ||
                (l_selectedText.substring(0,3)=="***")                  ||
                (l_selectedText.substring(0,3)=="_**")                  ||
                (l_selectedText.substring(0,3)=="__*")                  ||
                (l_selectedText.substring(0,3)=="___")                  ||
                (l_selectedText.substring(0,3)=="**_")                  ||
                (l_selectedText.substring(0,3)=="*__")                  )
            {// Already italic
                if(l_selectedText.slice(0, 3).includes("_")) {
                    // Replace only the first "_" in the first 3 chars (that make the italic)
                    l_selectedText = l_selectedText.slice(0, 3).replace('_', '') + l_selectedText.slice(3);
                    // Replace only the first "_" in the LAST 3 chars (that make the italic)
                    l_selectedText = l_selectedText.slice(0, -3) + l_selectedText.slice(-3).replace('_', '');
                }
                else{// A "*" is making the italic
                    l_selectedText = l_selectedText.slice(0, 3).replace('*', '') + l_selectedText.slice(3);
                    l_selectedText = l_selectedText.slice(0, -3) + l_selectedText.slice(-3).replace('*', '');
                }
            }
            else {// No pre-/suf-fix: add it
                l_selectedText = "_"+l_selectedText+"_";
                // Used to use "*" to allow bold/italic change in whatever order
                // However "***" is not displayed as bold + italic, so use _ for italic and * for bold
            }
        }

        // Add a leading/trailing space if needed
        if (l_leadingSpace) {
            l_selectedText = (" "+l_selectedText);
        }
        if (l_trailingSpace) {
            l_selectedText = (l_selectedText+" ");
        }

        // Create a new selection range
        let range = l_selection.getRangeAt(0);
        range.deleteContents();
        let textNode = document.createTextNode(l_selectedText);
        range.insertNode(textNode);

        // Unselect modified text
        //selection.removeAllRanges();
    }


    cancelEdit(){
        console.log("CancelEdit");
        var text = this.contentEl.innerText.trim()||'';
        if(text.length == 0){
            text = this._oldText
        }
        this.data.text = text;
        this.contentEl.innerText = '';

        // 确保路径有效，防止undefined导致错误
        const safePath = this.mindmap.path || "";
        
        // 安全检查：确保 mindmap.view 和 mindmap.view.app 存在
        if (this.mindmap?.view?.app) {
            MarkdownRenderer.render(this.mindmap.view.app, text, this.contentEl, safePath, this.mindmap.view).then(()=>{
                this.data.mdText = this.contentEl.innerHTML;
                this.refreshBox();
                this._delay();
            }).catch(err => {
                console.log("渲染Markdown错误:", err);
                // 出错时使用基本文本渲染
                this.contentEl.innerText = text;
                this.refreshBox();
                this._delay();
            });
        } else {
            // 如果没有 app 实例，直接使用文本渲染
            console.warn("mindmap.view.app 不可用，使用基本文本渲染");
            this.contentEl.innerText = text;
            this.refreshBox();
            this._delay();
        }

        if(text != this._oldText){
            this.mindmap.execute('changeNodeText',{
                node:this,
                text,
                oldText:this._oldText
            });
         }

        this.contentEl.setAttribute('contentEditable','false');
        this.data.isEdit = false;

        if(this.containEl.classList.contains('mm-edit-node')){
            this.containEl.classList.remove('mm-edit-node')
        }
    }

    getLevel() {
        var level = 0, parent = this.parent;

        if(!this.data.isRoot){
            level++;
            while (parent && parent != this.mindmap.root) {
                level++;
                parent = parent.parent;
            }
        }
        return level;
    }


    getIndex() {
        var l_index = 0;
        if(!this.data.isRoot)
        { l_index = this.parent.children.indexOf(this); }
        return l_index;
    }


    getChildren(){
        return this.children;
    }

    setPosition(x:number,y:number){
        this.box.x=x;
        this.box.y=y;
        this.containEl.style.left = x + 'px';
        this.containEl.style.top = y + 'px';
    }

    getPosition(){
        return {
            x:this.box.x,
            y:this.box.y
        }
    }

    getDimensions(){
        return {
            x:this.box.width,
            y:this.box.height
        }
    }

    move(dx:number, dy:number) {
        var p = this.getPosition();
        this.setPosition(p.x + dx, p.y + dy);
    }

    getData(){
        return JSON.parse(JSON.stringify(this.data))
    }

    refreshBox(){
        this.box = this.getDomBox();
    }

    getBox(){
        return {...{},...this.box};
    }

    getCBox(){
        return {...{},...this.box};
    }

    getDomBox(){
        var t = parseInt(this.containEl.style.top);
        var l = parseInt(this.containEl.style.left);
        var w = Math.ceil(this.contentEl.offsetWidth);
        var h = Math.ceil(this.contentEl.offsetHeight);

        return {
            x: l,
            y: t,
            width: w,
            height: h,
            th:0,
            bh:0
        }
    }

    getShowNodeList(){
        var list = [];
        (function getList(node:Node) {
            if (node.isShow()) {
                list.push(node);
            }
            node.children.forEach((n) => {
                getList(n);
            });
        })(this);

        return list;
    }

    getSiblings() {
        if (this.parent) {
            return this.parent.children.filter(item => item != this);
        } else {
            return [];
        }
    }


    getPreviousSibling() {
        var returnedNode = (this as Node);

        if (this.parent) {
            var searchedIdx = this.getIndex()-1;
            if(searchedIdx < 0)
            {// This is the first sibling -> return the last one.
                searchedIdx = this.parent.children.length-1;
            }
            // else: searchedIdx already set.

            // Search the sibling
            var sibs = this.getSiblings();
            sibs.forEach((sib) => {
                if (sib.getIndex() == searchedIdx) {
                    returnedNode = sib;
                }
                // else: not the previous sibling
            })
        }
        // else: no node to search

        return returnedNode;
    }

    getNextSibling() {
        var returnedNode = (this as Node);

        if (this.parent) {
            var searchedIdx = this.getIndex()+1;

            if(searchedIdx >= this.parent.children.length)
            {// This is the last sibling -> return the first one.
                searchedIdx = 0;
            }
            // else: searchedIdx already set.

            // Search the sibling
            var sibs = this.getSiblings();
            sibs.forEach((sib) => {
                if (sib.getIndex() == searchedIdx) {
                    returnedNode = sib;
                }
                // else: not the next sibling
            })
        }
        // else: no node to search

        return returnedNode;
    }

    getAllNextSiblings() {
        if (this.parent) {
            // Return all the next siblings
            return this.parent.children.filter(item => item.getIndex() > this.getIndex());
        } else {
            return [];
        }
    }


    getFirstSibling() {
        var returnedNode = (this as Node);
        var searchedIdx = 0;

        // Search the sibling
        var sibs = this.getSiblings();
        sibs.forEach((sib) => {
            if (sib.getIndex() == searchedIdx) {
                returnedNode = sib;
            }
            // else: not the next sibling
        })

        return returnedNode;
    }

    getLastSibling() {
        var returnedNode = (this as Node);
        var searchedIdx = this.parent.children.length-1;

        // Search the sibling
        var sibs = this.getSiblings();
        sibs.forEach((sib) => {
            if (sib.getIndex() == searchedIdx) {
                returnedNode = sib;
            }
            // else: not the next sibling
        })

        return returnedNode;
    }


    isLeaf() {
        return !this.children.length
    }


    isShow() {
        return !this.isHide;
    }

    show(){
        this.containEl.style.display="block";
        this.isHide=false
    }

    hide(){
        this.containEl.style.display="none";
        this.isHide=true
    }

    clearCacheData(){
        var anchor:Node = this;
        while(anchor){
            anchor.boundingRect=null;
            anchor = anchor.parent;
        }
    }

    addChild(node:Node, i?:number) {
        if (this.children.indexOf(node) == -1) {
            if (i > -1) {
                if (i > this.children.length) i = this.children.length;
                this.children.splice(i, 0, node);
            } else {
                this.children.push(node);
            }
            node.parent = this;
        }
    }

    removeChild(child:Node) {
        var index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
        return index;
    }

    setText(text:string) {
        this.data.text = text;
        this.contentEl.empty();
        this.parseText();
    }

    removeLineBreak() {
        var l_newText = this.data.text.replace('<br>', ' ');
        this.mindmap.execute('changeNodeText',{
            node:this,
            text:l_newText,
            oldText:this.data.text
        });
    }

    expand(){
        this.isExpand =true;
        function show(node:Node) {
            node.show();
            node.refreshBox();
            node.boundingRect = null;
            if (node.isExpand) {
                node.children.forEach(c => {
                    show(c)
                });
            }
        };
        show(this);
        if(this.containEl.classList.contains('mm-node-collapse')){
            this.containEl.classList.remove('mm-node-collapse')
        }
    }

    collapse(){

        this.isExpand = false;
        function hide(node:Node) {
            node.hide();
            if (node.isExpand) {
                node.children.forEach(c => {
                    hide(c);
                });
            }
        };

        this.children.forEach((c:Node) => {
            hide(c);
        });

        if(!this.containEl.classList.contains('mm-node-collapse')){
            this.containEl.classList.add('mm-node-collapse')
        }
    }

    /**
     * 显示AI扩展菜单
     */
    showAIMenu(event: MouseEvent) {
        // 移除现有的AI菜单
        const existingMenu = document.querySelector('.mm-ai-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // 创建AI菜单
        const aiMenu = document.createElement('div');
        aiMenu.classList.add('mm-ai-menu');

        // 菜单项
        const menuItems = [
            {
                text: '📝 详细展开',
                action: () => this.expandNodeWithAI('detailed')
            },
            {
                text: '🎯 实际应用',
                action: () => this.expandNodeWithAI('practical')
            },
            {
                text: '💡 生成想法',
                action: () => this.expandNodeWithAI('ideas')
            },
            {
                text: '🔍 生成解析',
                action: () => this.expandNodeWithAI('analysis')
            },
            {
                text: '✨ 自定义提示词',
                action: () => this.showCustomPromptDialog()
            }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('mm-ai-menu-item');
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                aiMenu.remove();
            });
            aiMenu.appendChild(menuItem);
        });

        // 定位菜单
        const rect = this._aiButton.getBoundingClientRect();
        aiMenu.style.position = 'fixed';
        aiMenu.style.left = `${rect.right + 5}px`;
        aiMenu.style.top = `${rect.top}px`;
        aiMenu.style.zIndex = '1000';

        // 添加到页面
        document.body.appendChild(aiMenu);

        // 点击其他地方关闭菜单
        const closeMenu = (e: MouseEvent) => {
            if (!aiMenu.contains(e.target as HTMLElement)) {
                aiMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    /**
     * 显示自定义提示词对话框
     */
    showCustomPromptDialog() {
        const plugin = this.mindmap?.view?.plugin;
        if (!plugin) {
            new Notice('无法获取插件实例');
            return;
        }

        const modal = new MindMapCustomPromptModal(plugin.app, (customPrompt: string) => {
            if (customPrompt) {
                this.expandNodeWithAI('custom', customPrompt);
            }
        });
        modal.open();
    }

    /**
     * 使用AI扩展节点
     */
    async expandNodeWithAI(type: 'detailed' | 'practical' | 'ideas' | 'analysis' | 'custom', customTemplate?: string) {
        try {
            const nodeContent = this.data.text || '';
            let prompt = '';

            // 获取整篇Markdown内容作为上下文
            const markdownContext = this.getMarkdownContext();

            if (type === 'detailed') {
                prompt = `基于以下文档内容，将"${nodeContent}"主题分解为4-6个更详细的子主题，每个子主题不超过8个字，用列表形式返回：

文档内容：
${markdownContext}

请针对"${nodeContent}"生成详细的子主题：`;
            } else if (type === 'practical') {
                prompt = `基于以下文档内容，列举"${nodeContent}"在实际生活中的3-5个具体应用场景，每个场景用短语描述：

文档内容：
${markdownContext}

请针对"${nodeContent}"生成实际应用场景：`;
            } else if (type === 'ideas') {
                prompt = `基于以下文档内容，围绕"${nodeContent}"主题生成4-6个创新想法或相关思路，每个想法用简洁的短语表达：

文档内容：
${markdownContext}

请针对"${nodeContent}"生成创新想法：`;
            } else if (type === 'analysis') {
                prompt = `基于以下文档内容，对"${nodeContent}"进行深入分析，生成4-6个分析维度或关键要点，每个要点用简洁的短语表达：

文档内容：
${markdownContext}

请针对"${nodeContent}"生成分析要点：`;
            } else if (type === 'custom' && customTemplate) {
                // 替换模板中的占位符，支持多种格式
                prompt = customTemplate
                    .replace(/\{\{highlight\}\}/g, nodeContent)
                    .replace(/\{\{content\}\}/g, nodeContent)
                    .replace(/\{\{context\}\}/g, markdownContext)
                    .replace(/\$\{nodeContent\}/g, nodeContent)
                    .replace(/\$\{markdownContext\}/g, markdownContext)
                    .replace(/\{\{nodeContent\}\}/g, nodeContent)
                    .replace(/\{\{markdownContext\}\}/g, markdownContext);
            }

            // 显示处理中的提示
            let processingNotice = new Notice('AI 正在扩展节点...', 0);

            // 调用AI服务
            const plugin = this.mindmap?.view?.plugin;
            const aiService = (plugin as any)?.aiService;
            if (!aiService) {
                processingNotice.hide();
                new Notice('AI 服务未配置', 3000);
                return;
            }

            console.log('Sending prompt to AI:', prompt);

            // 检查是否支持流式输出
            if (aiService.supportsStreaming && aiService.supportsStreaming()) {
                let fullResponse = '';

                const streamingOptions = {
                    onToken: (token: string) => {
                        fullResponse += token;
                        // 更新通知显示当前进度
                        processingNotice.hide();
                        processingNotice = new Notice(`AI 正在扩展节点... (${fullResponse.length} 字符)`, 0);
                    },
                    onComplete: async (response: string) => {
                        processingNotice.hide();
                        console.log('AI response:', response);

                        // 解析AI响应并创建子节点
                        await this.createChildNodesFromAIResponse(response);
                        new Notice('AI 扩展完成');
                    },
                    onError: (error: Error) => {
                        processingNotice.hide();
                        console.error('AI expansion error:', error);
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        new Notice(`AI 扩展失败: ${errorMessage}`);
                    }
                };

                await aiService.streamResponse(prompt, streamingOptions);
            } else {
                // 降级到普通方式
                const response = await aiService.generateResponse(prompt, nodeContent, '', markdownContext);
                console.log('AI response:', response);

                // 隐藏加载提示
                processingNotice.hide();

                // 解析AI响应并创建子节点
                await this.createChildNodesFromAIResponse(response);

                new Notice('AI 扩展完成');
            }
        } catch (error) {
            console.error('AI expansion error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            new Notice(`AI 扩展失败: ${errorMessage}`);

            // 如果有notice还在显示，隐藏它
            const notices = document.querySelectorAll('.notice');
            notices.forEach(notice => {
                if (notice.textContent?.includes('AI 正在生成内容')) {
                    notice.remove();
                }
            });
        }
    }

    /**
     * 获取整篇Markdown内容作为上下文
     */
    getMarkdownContext(): string {
        try {
            const view = this.mindmap?.view;
            if (view && view.file) {
                // 获取文件的原始内容
                const fileContent = view.data || '';
                // 限制上下文长度，避免token过多
                const maxLength = 2000;
                if (fileContent.length > maxLength) {
                    return fileContent.substring(0, maxLength) + '...';
                }
                return fileContent;
            }
            return '';
        } catch (error) {
            console.error('Error getting markdown context:', error);
            return '';
        }
    }

    /**
     * 根据AI响应创建子节点
     */
    async createChildNodesFromAIResponse(response: string) {
        console.log('Creating child nodes from AI response:', response);

        // 解析AI响应，提取列表项
        const lines = response.split('\n').filter(line => line.trim());
        const childTexts: string[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            // 匹配各种列表格式
            if (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
                const text = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
                if (text && text.length > 0 && text.length < 100) {
                    childTexts.push(text);
                }
            } else if (trimmed && !trimmed.includes('：') && !trimmed.includes(':') && !trimmed.includes('文档内容') && !trimmed.includes('请针对')) {
                // 简单的文本行，可能是子主题
                if (trimmed.length > 2 && trimmed.length < 50) {
                    childTexts.push(trimmed);
                }
            }
        });

        // 如果没有找到列表项，尝试按行分割
        if (childTexts.length === 0) {
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed && trimmed.length > 2 && trimmed.length < 50 &&
                    !trimmed.includes('文档内容') && !trimmed.includes('请针对') &&
                    !trimmed.includes('基于以下')) {
                    childTexts.push(trimmed);
                }
            });
        }

        console.log('Extracted child texts:', childTexts);

        // 创建子节点
        if (childTexts.length > 0) {
            // 保存当前视图状态
            const currentViewState = this.saveCurrentViewState();

            // 确保节点展开
            this.isExpand = true;
            this.containEl.classList.remove('mm-node-collapse');

            // 逐个添加子节点
            for (const text of childTexts) {
                await this.addChildNode(text);
            }

            // 清除所有节点的缓存数据，但不清除布局对象
            this.mindmap?.traverseBF((node: any) => {
                if (node && node.clearCacheData) {
                    node.clearCacheData();
                }
            });

            // 更新思维导图数据
            this.mindmap?.updateNodeData();

            // 使用温和的刷新方式，避免重新创建布局
            this.gentleRefresh(currentViewState);

            console.log('Child nodes created successfully');
        } else {
            console.warn('No valid child texts found in AI response');
            new Notice('AI 响应中未找到有效的子主题内容');
        }
    }

    /**
     * 添加子节点
     */
    async addChildNode(text: string): Promise<void> {
        console.log('Adding child node:', text);

        const childData = {
            id: this.generateId(),
            text: text,
            pid: this.data.id,
            isRoot: false
        };

        console.log('Child data:', childData);

        // 创建子节点实例
        const childNode = new Node(childData, this.mindmap);

        // 使用MindMap的addNode方法正确添加节点
        if (this.mindmap) {
            this.mindmap.addNode(childNode, this);
        }

        // 等待子节点初次渲染完成（构造函数已触发 parseText）
        try {
            await this.waitForNodeRender(childNode);
        } catch (e) {
            console.warn('waitForNodeRender error (non-fatal):', e);
        }

        // 更新数据结构
        if (!this.data.children) {
            this.data.children = [];
        }
        this.data.children.push(childData);

        // 标记节点为展开状态
        this.isExpand = true;
        this.data.expanded = true;
        this.containEl.classList.remove('mm-node-collapse');

        console.log('Child node added successfully');
    }

    /**
     * 生成唯一ID
     */
    generateId(): string {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * 保存当前视图状态
     */
    saveCurrentViewState(): any {
        if (!this.mindmap) return null;

        return {
            // 保存当前选中的节点
            selectedNodeId: this.mindmap.selectNode?.getId(),
            // 保存当前滚动位置
            scrollLeft: this.mindmap.containerEL?.scrollLeft || 0,
            scrollTop: this.mindmap.containerEL?.scrollTop || 0,
            // 保存当前缩放比例
            scale: this.mindmap.mindScale || 100,
            // 保存当前父节点（AI扩展的节点）
            parentNodeId: this.getId()
        };
    }

    /**
     * 温和的刷新方式，保持视图状态
     */
    gentleRefresh(viewState: any) {
        if (!this.mindmap) return;

        // 如果有现有的布局，直接更新而不是重新创建
        if (this.mindmap.mmLayout) {
            // 只更新布局，不重新创建
            this.mindmap.mmLayout.layout(this.mindmap.root, this.mindmap.setting.layoutDirect || this.mindmap.mmLayout.direct || 'mind map');
        } else {
            // 如果没有布局，创建新的但保持视图状态
            this.mindmap.refresh(true);
        }

        // 延迟恢复视图状态
        setTimeout(() => {
            this.restoreViewState(viewState);

            // 延迟触发文件内容更新
            setTimeout(() => {
                this.mindmap?.view?.mindMapChange();
            }, 100);
        }, 100);
    }

    /**
     * 等待节点渲染完成（尺寸稳定）
     */
    async waitForNodeRender(node: any, timeout = 300): Promise<void> {
        const start = Date.now();
        let lastW = -1, lastH = -1;

        return new Promise((resolve) => {
            const tick = () => {
                try {
                    const box = node.getBox();
                    if (box.width === lastW && box.height === lastH) {
                        resolve();
                        return;
                    }
                    lastW = box.width; lastH = box.height;
                    if (Date.now() - start > timeout) {
                        resolve();
                        return;
                    }
                    requestAnimationFrame(tick);
                } catch (e) {
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }

    /**
     * 恢复视图状态
     */
    restoreViewState(viewState: any) {
        if (!viewState || !this.mindmap) return;

        try {
            // 恢复选中状态 - 优先选中父节点（AI扩展的节点）
            let nodeToSelect = null;

            // 首先尝试选中父节点（AI扩展的节点）
            if (viewState.parentNodeId) {
                this.mindmap.traverseBF((node: any) => {
                    if (node && node.getId && node.getId() === viewState.parentNodeId) {
                        nodeToSelect = node;
                        return false; // 停止遍历
                    }
                });
            }

            // 如果没找到父节点，尝试恢复原来选中的节点
            if (!nodeToSelect && viewState.selectedNodeId) {
                this.mindmap.traverseBF((node: any) => {
                    if (node && node.getId && node.getId() === viewState.selectedNodeId) {
                        nodeToSelect = node;
                        return false; // 停止遍历
                    }
                });
            }

            // 选中节点
            if (nodeToSelect) {
                // 清除当前选中状态
                if (this.mindmap.selectNode) {
                    this.mindmap.selectNode.unSelect();
                }

                // 选中目标节点
                nodeToSelect.select();
                this.mindmap.selectNode = nodeToSelect;
            }

            // 恢复滚动位置（稍微延迟以确保布局完成）
            setTimeout(() => {
                if (this.mindmap?.containerEL) {
                    this.mindmap.containerEL.scrollLeft = viewState.scrollLeft;
                    this.mindmap.containerEL.scrollTop = viewState.scrollTop;
                }

                // 恢复缩放比例
                if (viewState.scale && viewState.scale !== 100) {
                    this.mindmap?.scale(viewState.scale);
                }
            }, 50);

        } catch (error) {
            console.error('Error restoring view state:', error);
        }
    }

}

/**
 * 思维导图自定义提示词输入模态框
 */
class MindMapCustomPromptModal {
    private app: any;
    private onSubmit: (prompt: string) => void;
    private modal: HTMLDivElement;
    private promptInput: HTMLTextAreaElement;

    constructor(app: any, onSubmit: (prompt: string) => void) {
        this.app = app;
        this.onSubmit = onSubmit;
    }

    open() {
        // 创建模态框背景
        this.modal = document.createElement('div');
        this.modal.className = 'modal-bg';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // 创建模态框内容
        const modalContent = document.createElement('div');
        modalContent.className = 'mindmap-custom-prompt-modal';
        modalContent.style.cssText = `
            background: var(--background-primary) !important;
            border-radius: 8px !important;
            padding: 20px !important;
            width: 350px !important;
            min-width: 350px !important;
            max-width: 90vw !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            position: relative !important;
            box-sizing: border-box !important;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = '自定义提示词';
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: var(--text-normal);
        `;

        // 说明文本
        const description = document.createElement('div');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Modal content HTML
        description.innerHTML = `
            <p style="margin: 0 0 10px 0; color: var(--text-muted); font-size: 12px;">
                提示：如果未包含节点内容参数，系统将自动添加当前节点内容和文档上下文。
            </p>
            <p style="margin: 0 0 15px 0; color: var(--text-muted); font-size: 12px;">
                可用参数：<code>\${nodeContent}</code> - 当前节点内容，<code>\${markdownContext}</code> - 文档上下文
            </p>
        `;

        // 输入框
        this.promptInput = document.createElement('textarea');
        this.promptInput.placeholder = '请输入自定义提示词...\n\n示例：\n分析"${nodeContent}"的优缺点，生成4-6个要点';
        this.promptInput.style.cssText = `
            width: 100%;
            height: 100px;
            padding: 10px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-family: var(--font-monospace);
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
        `;

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        `;

        // 取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
            cursor: pointer;
        `;
        cancelButton.onclick = () => this.close();

        // 确认按钮
        const submitButton = document.createElement('button');
        submitButton.textContent = '确认';
        submitButton.style.cssText = `
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: var(--interactive-accent);
            color: var(--text-on-accent);
            cursor: pointer;
        `;
        submitButton.onclick = () => this.submit();

        // 组装模态框
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);
        modalContent.appendChild(title);
        modalContent.appendChild(description);
        modalContent.appendChild(this.promptInput);
        modalContent.appendChild(buttonContainer);
        this.modal.appendChild(modalContent);

        // 添加到页面
        document.body.appendChild(this.modal);

        // 聚焦输入框
        setTimeout(() => {
            this.promptInput.focus();
        }, 100);

        // 点击背景关闭
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        };

        // 键盘事件
        this.promptInput.onkeydown = (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.submit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        };
    }

    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }

    submit() {
        let prompt = this.promptInput.value.trim();
        if (prompt) {
            // 检查是否包含节点内容参数
            const hasNodeContentParam = prompt.includes('${nodeContent}') ||
                                       prompt.includes('{{nodeContent}}') ||
                                       prompt.includes('${markdownContext}') ||
                                       prompt.includes('{{markdownContext}}');

            // 如果没有包含节点内容参数，自动附加
            if (!hasNodeContentParam) {
                prompt = `基于以下文档内容，围绕"\${nodeContent}"主题：${prompt}

文档内容：
\${markdownContext}

请针对"\${nodeContent}"进行处理：`;
            }

            this.onSubmit(prompt);
            this.close();
        }
    }
}
