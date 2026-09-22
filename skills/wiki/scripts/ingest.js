// wiki 技能预置脚本：全库 Markdown → wiki/raw/entries/ 规范化快照条目
// 幂等：条目文件名仅由源文件相对路径决定，重跑只覆盖、不产生重复条目
// 用法: node ingest.js [relative-scope]
//   - VAULT_PATH 环境变量必须指向 Vault 根目录（由插件 bash 工具自动注入）
//   - [relative-scope] 可选：仅扫描该 Vault 子目录（文件夹右键局部编译场景）
const fs = require('fs');
const path = require('path');

const vaultPath = process.env.VAULT_PATH;
if (!vaultPath) {
    console.error('Error: VAULT_PATH environment variable is not defined.');
    process.exit(1);
}

// 可选扫描范围：相对 Vault 根的子目录（规范化后必须仍在 Vault 内）。
// VAULT_PATH 可能是正斜杠或反斜杠形式（跨平台），比较前统一归一化分隔符与大小写
const rawScope = process.argv[2];
const scopeArg = (rawScope === '/' || rawScope === '.' || !rawScope) ? undefined : rawScope;
let scanRoot = vaultPath;
if (scopeArg) {
    scanRoot = path.resolve(vaultPath, scopeArg);
    const rootAbs = path.resolve(vaultPath).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
    const scanAbs = path.resolve(scanRoot).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
    if (scanAbs !== rootAbs && !scanAbs.startsWith(rootAbs + '/')) {
        console.error(`Error: scope "${scopeArg}" is outside the vault.`);
        process.exit(1);
    }
    if (!fs.existsSync(scanRoot) || !fs.statSync(scanRoot).isDirectory()) {
        console.error(`Error: scope directory does not exist: ${scopeArg}`);
        process.exit(1);
    }
}

// 产物统一收纳在 wiki/ 下：Vault 根目录只新增一个 wiki/ 目录，扫描时也只需排除 wiki 自身
const rawDir = path.join(vaultPath, 'wiki', 'raw', 'entries');
fs.mkdirSync(rawDir, { recursive: true });

// 日期优先级：文件名中的 YYYY-MM-DD > 源 frontmatter date > 文件 mtime（对齐 SKILL.md 的 ingest 规范）
function extractDate(fileName, content, stat) {
    const byName = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    if (byName) return byName[1];
    const byFm = content.match(/^---[\s\S]*?^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (byFm) return byFm[1];
    return stat.mtime.toISOString().split('T')[0];
}

// 稳定 ID 由完整相对路径生成：不同目录下的同名文件不再互相覆盖；
// 笔记内容修改后重新 ingest 也不会因 mtime 变化产生重复条目。
// 路径中非安全字符统一替换为 _，极少数不同路径归一为同一 ID 时追加序号防覆盖。
// 冲突判定以磁盘上已存在条目的 source_file 归属为准：单次运行内的去重集合无法
// 覆盖「局部范围扫描后再全库重扫」的场景（两次运行的遍历集合不同），若仅靠
// 运行内集合分配序号，同一 ID 可能在两个来源之间漂移，导致条目被错误覆盖。
function readEntrySource(entryPath) {
    try {
        const m = fs.readFileSync(entryPath, 'utf8').match(/^source_file:\s*"((?:[^"\\]|\\.)*)"/m);
        return m ? m[1].replace(/\\"/g, '"') : null;
    } catch {
        return null;
    }
}
const usedIds = new Set();
function makeUniqueId(relPath) {
    let base = relPath.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_').replace(/^_+|_+$/g, '');
    if (!base) base = 'entry';
    let id = base;
    let n = 2;
    while (true) {
        const existingPath = path.join(rawDir, `${id}.md`);
        // ID 可用：未被本次运行占用，且磁盘上要么无同名条目，要么该条目本就归属当前来源（幂等覆盖自身）
        if (!usedIds.has(id) && (!fs.existsSync(existingPath) || readEntrySource(existingPath) === relPath)) {
            break;
        }
        id = `${base}_${n}`;
        n++;
    }
    usedIds.add(id);
    return id;
}

let count = 0;
function scan(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.name.startsWith('.') || item.name === 'wiki' || item.name === 'node_modules') continue;
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
            scan(full);
        } else if (item.name.endsWith('.md')) {
            const relPath = path.relative(vaultPath, full).replace(/\\/g, '/');
            const content = fs.readFileSync(full, 'utf8');
            const dateStr = extractDate(item.name, content, fs.statSync(full));
            const safeId = makeUniqueId(relPath);
            const entry = `---
id: "${safeId}"
source_file: "${relPath.replace(/"/g, '\\"')}"
date: "${dateStr}"
---

${content}
`;
            fs.writeFileSync(path.join(rawDir, `${safeId}.md`), entry, 'utf8');
            count++;
        }
    }
}

scan(scanRoot);
console.log(`Successfully ingested ${count} markdown notes into wiki/raw/entries/`);
