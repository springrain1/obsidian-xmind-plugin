/*
 * Copyright (c) 2024-2025 Sun Booshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { requestUrl, RequestUrlParam, getBlobArrayBuffer, App, FrontMatterCache, TFile, Platform, Notice } from "obsidian";
import { imageExtToMime } from "./utils";
import AssetsManager from "./assets";
import { NMPSettings } from "./settings";
import * as crypto from "crypto";
import { IsImageLibReady, WebpToJPG } from './imagelib';

const PluginHost = 'https://obplugin.dualhue.cn';

// 直接从微信公众平台获取token (无需通过插件服务器)
export async function wxGetTokenDirect(appid:string, secret:string) {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const res = await requestUrl({
        url,
        method: 'GET',
        throw: false
    });
    return res;
}

export async function wxWidget(authkey: string, params: string) {
    const host = 'https://obplugin.dualhue.cn';
    const path = '/math/widget';
    const url = `${host}${path}`;
    try {
        const res = await requestUrl({
            url,
            throw: false,
            method: 'POST',
            contentType: 'application/json',
            headers: {
                authkey
            },
            body: params
        })
        if (res.status === 200) {
            return res.json.content;
        }
        return res.json.msg;
    } catch (error) {
        console.log(error);
        return error.message;
    }
}

// 上传图片
export async function wxUploadImage(data: Blob, filename: string, token: string, type?: string) {
    let url = '';
    if (type == null || type === '') {
        url = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=' + token;
    } else {
        url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=${type}`
    }

    const N = 16 // The length of our random boundry string
    const randomBoundryString = "djmangoBoundry" + Array(N+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, N) 
    
    // Construct the form data payload as a string
    const pre_string = `------${randomBoundryString}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: "application/octet-stream"\r\n\r\n`;
    const post_string = `\r\n------${randomBoundryString}--`
    
    // Convert the form data payload to a blob by concatenating the pre_string, the file data, and the post_string, and then return the blob as an array buffer
    const pre_string_encoded = new TextEncoder().encode(pre_string);
    // const data = file;
    const post_string_encoded = new TextEncoder().encode(post_string);
    const concatenated = await new Blob([pre_string_encoded, await getBlobArrayBuffer(data), post_string_encoded]).arrayBuffer()

    // Now that we have the form data payload as an array buffer, we can pass it to requestURL
    // We also need to set the content type to multipart/form-data and pass in the boundry string
    const options: RequestUrlParam = {
        method: 'POST',
        url: url,
        contentType: `multipart/form-data; boundary=----${randomBoundryString}`,
        body: concatenated
    };

    const res = await requestUrl(options);
    const resData = await res.json;
    return {
        url: resData.url || '',
        media_id: resData.media_id || '',
        errcode: resData.errcode || 0,
        errmsg: resData.errmsg || '',
    }
}

// 新建草稿
export interface DraftArticle {
    title: string;
    author?: string;
    digest?: string;
    cover?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
    pic_crop_235_1?: string;
    pic_crop_1_1?: string;
    appid?: string;
    theme?: string;
    highlight?: string;
    css?: string;
}

function convertArticle(data: DraftArticle) {
    return {
        title: data.title,
        content: data.content,
        digest: data.digest,
        thumb_media_id: data.thumb_media_id,
        ... data.pic_crop_235_1 && {pic_crop_235_1: data.pic_crop_235_1},
        ... data.pic_crop_1_1 && {pic_crop_1_1: data.pic_crop_1_1},
        ... data.content_source_url && {content_source_url: data.content_source_url},
        ... data.need_open_comment !== undefined && {need_open_comment: data.need_open_comment},
        ... data.only_fans_can_comment !== undefined && {only_fans_can_comment: data.only_fans_can_comment},
        ... data.author && {author: data.author},
    };
}

export async function wxAddDraft(token: string, data: DraftArticle) {
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token;
    const body = {articles:[convertArticle(data)]};

    const res = await requestUrl({
        method: 'POST',
        url: url,
        throw: false,
        body: JSON.stringify(body)
    });

    return res;
}

export async function wxAddDrafts(token: string, data: DraftArticle[]) {
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token;
    const articles = data.map(d=>convertArticle(d));
    const body = {articles};

    const res = await requestUrl({
        method: 'POST',
        url: url,
        throw: false,
        body: JSON.stringify(body)
    });

    return res;
}

export interface DraftImageMediaId {
    image_media_id: string;
}

export interface DraftImageInfo {
    image_list: DraftImageMediaId[];
}

export interface DraftImages {
    article_type: string;
    title: string;
    content: string;
    need_open_commnet: number;
    only_fans_can_comment: number;
    image_info: DraftImageInfo;
}

export async function wxAddDraftImages(token: string, data: DraftImages) {
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token;
    const body = {articles:[data]};

    const res = await requestUrl({
        method: 'POST',
        url: url,
        throw: false,
        body: JSON.stringify(body)
    });

    return res;
}

export async function wxBatchGetMaterial(token: string, type: string, offset: number = 0, count: number = 10) {
    const url = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + token;
    const body = {
        type,
        offset,
        count
    };

    const res = await requestUrl({
        method: 'POST',
        url: url,
        throw: false,
        body: JSON.stringify(body)
    });

    return await res.json;
}

export async function getUploadImageURL(authkey: string, ext: string) {
    const url = PluginHost + '/v1/oss/url/' + ext + '/' + authkey;
    const res = await requestUrl({
        url,
        method: 'GET',
        throw: false,
    });

    if (res.status !== 200) {
        throw new Error(`获取上传地址失败：${res.status} ${res.text}`);
    }
    return await res.json;
}

export async function putImageToOSS(authKey:string, uploadURL: string, data: Blob, ext: string) {
    const contentType = imageExtToMime('.'+ext);
    const res = await requestUrl({
        url: uploadURL,
        method: 'PUT',
        throw: false,
        headers: {
            'x-oss-meta-authkey': authKey,
            'Content-Type': contentType,
        },
        body: await getBlobArrayBuffer(data),
    });
    return res;
}

export async function uploadImageToOSS(authkey: string, data: Blob, filename: string) {
    if (data.size > 1048576) { // 1MB = 1024 * 1024 bytes
        throw new Error(`图片 "${filename}" 大小超过1MB限制`);
    }
    
    const ext = filename.split('.').pop() || 'jpg';
    const {uploadURL, downloadURL} = await getUploadImageURL(authkey, ext);
    await putImageToOSS(authkey, uploadURL, data, ext);
    return downloadURL;
}

function getFrontmatterValue(frontmatter: FrontMatterCache, key: string) {
    const value = frontmatter[key];

    if (value instanceof Array) {
        return value[0];
    }

    return value;
}

export function getMetadata(app: App, file: TFile) {
    const assetsManager = AssetsManager.getInstance();
    const settings = NMPSettings.getInstance();
    let res: DraftArticle = {
        title: '',
        author: undefined,
        digest: undefined,
        content: '',
        content_source_url: undefined,
        cover: undefined,
        thumb_media_id: '',
        need_open_comment: undefined,
        only_fans_can_comment: undefined,
        pic_crop_235_1: undefined,
        pic_crop_1_1: undefined,
        appid: undefined,
        theme: undefined,
        highlight: undefined,
        css: undefined,
    }
    const metadata = app.metadataCache.getFileCache(file);
    if (metadata?.frontmatter) {
        const keys = assetsManager.expertSettings.frontmatter;
        const frontmatter = metadata.frontmatter;
        res.title = getFrontmatterValue(frontmatter, keys.title);
        res.author = getFrontmatterValue(frontmatter, keys.author);
        res.digest = getFrontmatterValue(frontmatter, keys.digest);
        res.content_source_url = getFrontmatterValue(frontmatter, keys.content_source_url);
        res.cover = getFrontmatterValue(frontmatter, keys.cover);
        res.thumb_media_id = getFrontmatterValue(frontmatter, keys.thumb_media_id);
        res.need_open_comment = frontmatter[keys.need_open_comment] ? 1 : undefined;
        res.only_fans_can_comment = frontmatter[keys.only_fans_can_comment] ? 1 : undefined;
        res.appid = getFrontmatterValue(frontmatter, keys.appid);
        if (res.appid && !res.appid.startsWith('wx')) {
            res.appid = settings.wxInfo.find(wx => wx.name === res.appid)?.appid;
        }
        res.theme = getFrontmatterValue(frontmatter, keys.theme);
        res.highlight = getFrontmatterValue(frontmatter, keys.highlight);
        if (frontmatter[keys.crop]) {
            res.pic_crop_235_1 = '0_0_1_0.5';
            res.pic_crop_1_1 = '0_0.525_0.404_1';
        }
        res.css = getFrontmatterValue(frontmatter, keys.css);
    }
    return res;
}

export interface Announcement {
    id: string,
	type: string,
	title: string,
	message: string,
	target_version: string,
	min_obsidian_version: string,
	action_url: string,
	platform: string,
}

export async function requestAnnouncement() {
    const url = PluginHost + '/v1/wx/ann';
    const res = await requestUrl({
        method: 'GET',
        url: url,
        throw: false,
    });
    if (res.status !== 200) {
        console.error(`获取公告失败：${res.status} ${res.text}`);
        return;
    }
    return await res.json as Announcement[];
}

export interface VersionInfo {
    version: string;
    summary: string;
    url: string;
}

export async function requestLatestVersion() {
    const url = PluginHost + '/v1/wx/latest';

    const res = await requestUrl({
        method: 'GET',
        url: url,
        throw: false,
    });

    if (res.status !== 200) {
        console.error(`获取最新版本失败：${res.status} ${res.text}`);
        return;
    }

    return await res.json as VersionInfo;
}

// ==================== 1.1.0 新增功能 ====================

// 检查 access_token 是否过期
export function isAccessTokenExpired(settings: NMPSettings): boolean {
    return !settings.accessToken || 
            !settings.tokenExpireTime || 
            Date.now() > settings.tokenExpireTime;
}

// 刷新 access_token
export async function refreshAccessToken(settings: NMPSettings): Promise<boolean> {
    if (settings.useCenterToken) {
        return await requestTokenFromCentralServer(settings);
    }
    
    if (!settings.appId || !settings.appSecret) {
        new Notice('请先在设置中填写 AppID 和 AppSecret');
        return false;
    }

    try {
        // 构建请求 URL 和参数
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${settings.appId}&secret=${settings.appSecret}`;
        
        // 使用 Obsidian 的 requestUrl API
        const req: RequestUrlParam = {
            url: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        console.log('正在请求 access_token，URL:', url);
        const resp = await requestUrl(req);
        console.log('微信 API 响应:', resp.json);
        
        const respAccessToken: string = resp.json["access_token"];
        if (respAccessToken === undefined) {
            const errcode = resp.json["errcode"];
            const errmsg = resp.json["errmsg"];
            console.error('获取 Access Token 失败:', errmsg);
            new Notice(`获取 Access Token 失败: errorCode: ${errcode}, errmsg: ${errmsg}`);
            return false;
        } else {
            settings.accessToken = respAccessToken;
            settings.tokenExpireTime = Date.now() + (resp.json["expires_in"] * 1000);
            return true;
        }
    } catch (error) {
        console.error('刷新 Access Token 时出错:', error);
        new Notice(`刷新 Access Token 失败: ${error.message}`);
        return false;
    }
}

// 从中心令牌服务器获取 access_token
export async function requestTokenFromCentralServer(settings: NMPSettings): Promise<boolean> {
    const url = settings.centerTokenUrl || "https://wewrite.3thinking.cn/mp_token";
    
    if (!settings.appId && !settings.appSecret && !settings.doc_id) {
        new Notice('请先在设置中填写 AppID 和 AppSecret，或者已有 doc_id');
        return false;
    }
    
    let params: any;
    if (settings.doc_id === undefined || !settings.doc_id) {
        params = {
            app_id: settings.appId,
            secret: settings.appSecret,
        };
    } else {
        params = {
            doc_id: settings.doc_id,
        };
    }

    try {
        const result = await requestUrl({
            method: "POST",
            url: url,
            headers: { "Content-Type": "application/json" },
            throw: false,
            body: JSON.stringify(params),
        });
        
        if (result.status !== 200) {
            new Notice(result.text, 0);
            return false;
        }
        
        const { code, data } = result.json;
        
        if (code !== 0) {
            if (code == -2) {
                settings.doc_id = undefined;
                return await requestTokenFromCentralServer(settings);
            }
            
            if (code == -10) {
                // IP白名单问题
                if (data.errcode === 40164) {
                    const ipv4 = extractIPs(data.errmsg);
                    if (ipv4.length > 0 && ipv4[0]) {
                        new Notice(`请将 IP 地址 ${ipv4[0]} 添加到微信公众平台 IP 白名单`);
                    }
                }
            }
            
            return false;
        }
        
        if (data.last_token === undefined) {
            new Notice('无法获取微信 Access Token', 0);
            return false;
        }
        
        settings.accessToken = data.last_token;
        settings.doc_id = data.doc_id;
        settings.tokenExpireTime = data.expiretime;
        return true;
    } catch (error) {
        console.error("获取微信 Access Token 时出错:", error);
        new Notice('无法获取微信 Access Token', 0);
        return false;
    }
}

// 提取 IP 地址
function extractIPs(input: string): string[] {
    const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ipv4 = input.match(ipv4Pattern) || [];
    
    return ipv4;
}

// 生成用于multipart/form-data请求的边界字符串
export function chooseBoundary(): string {
    const generateRandomHex = (length: number): string => {
        if (Platform.isDesktop) {
            // 桌面端使用Node.js的crypto模块
            try {
                return crypto.randomBytes(length).toString("hex");
            } catch (error) {
                console.log("Node.js crypto模块不可用，使用备选方法");
            }
        }
        
        // 移动端或桌面端crypto不可用时的备选方法
        // 使用Web API的crypto对象生成随机数
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        
        // 转换为16进制字符串
        return Array.from(randomValues)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };
    
    return '----WebKitFormBoundary' + generateRandomHex(16);
}

// 完全从原始插件复制的方法：上传图片到微信公众号 - 使用缓冲区数据
export async function uploadImageToChatWithBuffer(buffer: ArrayBuffer, filename: string, settings: NMPSettings): Promise<string | null> {
    if (isAccessTokenExpired(settings)) {
        const success = await refreshAccessToken(settings);
        if (!success) {
            throw new Error('无法刷新 Access Token');
        }
    }
    
    // 获取文件扩展名
    const fileExt = filename.split('.').pop()?.toLowerCase() || 'png';
    
    // 重试机制
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
        try {
            // 减少冗余日志和通知
            if (retryCount > 0) {
                console.log(`尝试上传图片，第${retryCount + 1}次尝试`);
                new Notice(`尝试上传图片，第${retryCount + 1}次尝试...`);
            } else if (retryCount === 0) {
                new Notice('正在上传图片...');
            }
            
            // 检查buffer是否有效
            if (!buffer || buffer.byteLength === 0) {
                throw new Error('图片数据为空或无效');
            }
            
            // 构建 API URL
            const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${settings.accessToken}`;
            
            // 处理图像大小和格式 - 帮助解决移动端的编码问题
            let processedBuffer = buffer;
            
            // 如果图像太大，可能需要缩小或转换格式
            if (buffer.byteLength > 5000000) { // 5MB
                console.log("图像过大，尝试处理...");
                
                // 如果有图像处理函数可用，使用它
                if (IsImageLibReady()) {
                    if (fileExt === 'webp') {
                        console.log("转换WebP到JPG格式");
                        processedBuffer = WebpToJPG(buffer);
                    }
                }
            }
            
            // 创建一个边界字符串
            const boundary = chooseBoundary();
            const contentType = `multipart/form-data; boundary=${boundary}`;
            
            // 手动构建multipart/form-data请求体
            let requestBody = '';
            requestBody += `--${boundary}\r\n`;
            requestBody += `Content-Disposition: form-data; name="media"; filename="${filename}"\r\n`;
            requestBody += `Content-Type: image/${fileExt}\r\n\r\n`;
            
            // 将请求体转换为ArrayBuffer
            const textEncoder = new TextEncoder();
            const headerBuffer = textEncoder.encode(requestBody);
            
            // 添加尾部边界
            const footerBuffer = textEncoder.encode(`\r\n--${boundary}--\r\n`);
            
            // 合并所有部分
            const totalLength = headerBuffer.byteLength + processedBuffer.byteLength + footerBuffer.byteLength;
            const combinedBuffer = new Uint8Array(totalLength);
            
            // 复制各部分到组合缓冲区
            combinedBuffer.set(new Uint8Array(headerBuffer), 0);
            combinedBuffer.set(new Uint8Array(processedBuffer), headerBuffer.byteLength);
            combinedBuffer.set(new Uint8Array(footerBuffer), headerBuffer.byteLength + processedBuffer.byteLength);
            
            // 使用Obsidian的requestUrl API
            const requestOptions: RequestUrlParam = {
                url: url,
                method: 'POST',
                body: combinedBuffer.buffer,
                headers: {
                    'Content-Type': contentType
                },
                throw: false
            };
            
            // 设置请求超时
            const timeoutPromise = new Promise<{json: {error: string}}>(resolve => {
                setTimeout(() => {
                    resolve({json: {error: '请求超时，请检查网络连接'}});
                }, 60000); // 60秒超时
            });
            
            // 使用Promise.race实现超时处理
            const response = await Promise.race([
                requestUrl(requestOptions),
                timeoutPromise
            ]);
            
            // 检查是否超时或有错误
            if (response.json && response.json.error) {
                console.error('请求出错:', response.json.error);
                throw new Error(response.json.error);
            }
            
            // 如果返回了URL，则成功
            if (response.json && response.json.url) {
                new Notice(`图片上传成功`);
                return response.json.url;
            } 
            // 如果存在错误码，则处理错误
            else if (response.json && response.json.errcode) {
                const errMsg = `微信API错误: ${response.json.errmsg} (${response.json.errcode})`;
                console.error(errMsg);
                throw new Error(errMsg);
            } 
            // 未知响应格式
            else {
                console.error('未知的响应格式:', response);
                throw new Error('微信服务器返回了未知格式的响应');
            }
        } catch (error) {
            lastError = error;
            console.error(`上传失败:`, error);
            
            // 提供更具体的错误信息
            let errorMessage = error.message || '未知错误';
            if (errorMessage.includes('Network Error') || errorMessage.includes('网络连接错误')) {
                errorMessage = '网络连接错误，请检查您的网络连接是否正常';
            } else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
                errorMessage = '网络请求超时，请稍后重试';
            } else if (errorMessage.includes('Unable to encode image')) {
                errorMessage = '无法编码图像，请尝试其他格式的图片';
            }
            
            if (retryCount < maxRetries - 1) {
                new Notice(`上传失败: ${errorMessage}，正在重试...`);
            } else {
                new Notice(`上传失败: ${errorMessage}`);
            }
            
            retryCount++;
            
            // 如果是Access Token错误，重新获取Token
            if (error.message && (
                error.message.includes('access_token') || 
                error.message.includes('40001') || 
                error.message.includes('40014')
            )) {
                await refreshAccessToken(settings);
            }
            
            // 在重试前等待一段时间
            if (retryCount < maxRetries) {
                const waitTime = 2000 * retryCount; // 递增等待时间
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    // 如果所有重试都失败，则抛出最后一个错误
    if (lastError) {
        console.error(`上传失败，已重试${maxRetries}次`);
        throw lastError;
    }
    
    return null;
}

// 发送草稿到公众号草稿箱
export async function sendArticleToDraftBox(data: DraftArticle, settings: NMPSettings): Promise<string | null> {
    if (isAccessTokenExpired(settings)) {
        const success = await refreshAccessToken(settings);
        if (!success) {
            throw new Error('无法刷新 Access Token');
        }
    }

    try {
        const result = await wxAddDraft(settings.accessToken!, data);
        const { errcode, media_id } = result.json;
        
        if (errcode !== undefined && errcode !== 0) {
            new Notice(`发送文章到草稿箱失败: ${errcode}`);
            return null;
        } else {
            new Notice('成功发送文章到草稿箱');
            return media_id;
        }
    } catch (error) {
        console.error('发送草稿失败:', error);
        new Notice(`发送草稿失败: ${error.message}`);
        return null;
    }
}

// 添加从Eagle获取和上传图片的功能
export async function uploadEagleImage(eagleUrl: string, settings: NMPSettings): Promise<string | null> {
    try {
        // 注意：移动端虽然允许Eagle图片上传，但实际可能因为网络限制无法连接到Eagle服务器
        // 尤其是iOS设备，需要确保Eagle服务器和Obsidian在同一网络环境下
        
        // 检查输入，如果不是Eagle URL则返回null
        if (!eagleUrl.startsWith('http://localhost:')) {
            return null;
        }

        // 解析Eagle URL，调整端口
        const originalUrl = new URL(eagleUrl);
        const eaglePort = settings.eagleServerPort || '6060';
        const eagleServerUrl = `http://localhost:${eaglePort}`;
        
        // 构建完整的URL
        const imagePath = originalUrl.pathname;
        const fullUrl = `${eagleServerUrl}${imagePath}`;
        
        // 使用requestUrl获取图片
        new Notice(`正在从Eagle获取图片: ${fullUrl}`);
        
        try {
            const response = await requestUrl({
                url: fullUrl,
                method: 'GET',
            });
            
            if (!response.arrayBuffer || response.arrayBuffer.byteLength === 0) {
                throw new Error('无法获取Eagle图片内容');
            }
            
            // 获取图片扩展名
            const imageId = imagePath.split('/').pop() || '';
            let extension = 'png'; // 默认扩展名
            
            // 处理带有.info后缀的Eagle图片
            if (imageId.endsWith('.info')) {
                extension = 'png'; // Eagle的.info通常是针对png图片的信息
            } else {
                // 尝试从原始URL中获取扩展名
                const extensionMatch = eagleUrl.match(/\.([a-zA-Z0-9]+)(?:\.info)?$/);
                if (extensionMatch && extensionMatch[1]) {
                    extension = extensionMatch[1].toLowerCase();
                }
            }
            
            // 上传图片到微信
            const imageUrl = await uploadImageToChatWithBuffer(response.arrayBuffer, `eagle-image.${extension}`, settings);
            return imageUrl;
        } catch (error) {
            console.error('获取Eagle图片失败:', error);
            throw new Error(`无法获取Eagle图片: ${error.message}`);
        }
    } catch (error) {
        console.error('上传Eagle图片时出错:', error);
        new Notice(`上传Eagle图片失败: ${error.message}`);
        return null;
    }
}
