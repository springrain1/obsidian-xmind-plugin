#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信公众号草稿发布工具
支持上传封面图片、创建草稿文章
"""

import os
import sys
import json
import time
import requests
import argparse
from pathlib import Path
from typing import Optional, Dict, Any
import re
import io

# 强制设置标准输出为 UTF-8 (解决 Windows 终端中文乱码)
if sys.platform.startswith('win'):
    if sys.stdout and sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    if sys.stderr and sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class WeChatPublisher:
    """微信公众号草稿发布器"""

    BASE_URL = "https://api.weixin.qq.com/cgi-bin"
    
    # 动态获取路径：优先使用脚本同级目录，兼容旧的全局路径
    @property
    def SCRIPT_DIR(self):
        return os.path.dirname(os.path.abspath(__file__))

    @property
    def CONFIG_FILE(self):
        # 1. 优先检查本地
        local_config = os.path.join(self.SCRIPT_DIR, "config.json")
        if os.path.exists(local_config):
            return local_config
        # 2. 回退到全局目录（保持向后兼容）
        global_config = os.path.expanduser("~/.wechat-publisher/config.json")
        if os.path.exists(global_config):
            return global_config
        # 3. 默认使用本地路径（用于新创建）
        return local_config

    @property
    def TOKEN_CACHE_FILE(self):
        # 令牌缓存通常放在配置同一级
        return os.path.join(os.path.dirname(self.CONFIG_FILE), ".token_cache.json")

    # 微信API错误码映射
    ERROR_CODES = {
        40001: "AppSecret错误或者AppSecret不属于这个AppID",
        40002: "请确保grant_type字段值为client_credential",
        40013: "不合法的AppID，请检查AppID是否正确",
        40125: "无效的appsecret，请检查AppSecret是否正确",
        40164: "调用接口的IP地址不在白名单中",
        41001: "缺少access_token参数",
        42001: "access_token超时，请检查缓存是否正常",
        45009: "接口调用超过限制（每日API调用量已用完）",
        47003: "参数错误，请检查必填字段是否完整",
        48001: "api功能未授权，请确认公众号类型",
        50005: "用户未关注公众号",
        -1: "系统繁忙，请稍后重试"
    }

    # 默认中心令牌服务器地址
    DEFAULT_CENTER_TOKEN_URL = "https://wewrite.3thinking.cn/mp_token"

    def __init__(self):
        """初始化发布器"""
        self.appid = None
        self.appsecret = None
        self.access_token = None
        # 中心令牌服务器相关配置
        self.use_center_token = False
        self.center_token_url = self.DEFAULT_CENTER_TOKEN_URL
        self.doc_id = None
        self.load_config()

    def load_config(self):
        """加载配置文件，首次运行时启动配置向导"""
        if not os.path.exists(self.CONFIG_FILE):
            print("=" * 60)
            print("  欢迎使用微信公众号草稿发布工具！")
            print("=" * 60)
            print("\n首次使用需要配置微信公众号凭证。")
            print("\n获取方式：")
            print("  1. 登录 https://mp.weixin.qq.com")
            print("  2. 设置与开发 → 基本配置")
            print("  3. 复制AppID和AppSecret\n")

            should_setup = input("是否现在配置？(Y/n): ").strip().lower()
            if should_setup in ['', 'y', 'yes']:
                self._interactive_setup()
            else:
                raise FileNotFoundError(
                    f"请手动创建配置文件: {self.CONFIG_FILE}\n"
                    f"格式: {{'appid': 'your_appid', 'appsecret': 'your_appsecret'}}"
                )

        # 验证配置文件格式
        try:
            with open(self.CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"配置文件格式错误: {e}\n请检查JSON格式是否正确")

        # 加载中心令牌服务器配置
        self.use_center_token = config.get('use_center_token', False)
        self.center_token_url = config.get('center_token_url', self.DEFAULT_CENTER_TOKEN_URL)
        self.doc_id = config.get('doc_id', None)

        # 验证必需字段
        self.appid = config.get('appid', '').strip()
        self.appsecret = config.get('appsecret', '').strip()

        # 如果使用中心令牌服务器且有 doc_id，可以不需要 appid/appsecret
        if self.use_center_token and self.doc_id:
            print(f"✓ 使用中心令牌服务器模式 (doc_id: {self.doc_id[:8]}...)")
        else:
            if not self.appid or self.appid in ['your_appid_here', 'your_appid']:
                raise ValueError(f"请在配置文件中填写有效的appid\n配置文件: {self.CONFIG_FILE}")
            if not self.appsecret or self.appsecret in ['your_appsecret_here', 'your_appsecret']:
                raise ValueError(f"请在配置文件中填写有效的appsecret\n配置文件: {self.CONFIG_FILE}")

            # 验证格式
            if not self.appid.startswith('wx') or len(self.appid) != 18:
                print("⚠ 警告: AppID格式可能不正确（应为wx开头的18位字符）")

            if self.use_center_token:
                print(f"✓ 使用中心令牌服务器模式 (AppID: {self.appid[:6]}***)")
            else:
                print(f"✓ 配置加载成功 (AppID: {self.appid[:6]}***)")

    def _interactive_setup(self):
        """交互式配置向导"""
        print("\n请输入微信公众号凭证：")
        appid = input("AppID (wx开头): ").strip()
        appsecret = input("AppSecret: ").strip()

        # 简单验证
        if not appid.startswith('wx'):
            print("⚠ 警告: AppID通常以wx开头")

        # 创建配置目录和文件
        os.makedirs(os.path.dirname(self.CONFIG_FILE), exist_ok=True)
        config_data = {"appid": appid, "appsecret": appsecret}

        with open(self.CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

        os.chmod(self.CONFIG_FILE, 0o600)
        print(f"\n✓ 配置已保存到: {self.CONFIG_FILE}")
        print("  (已设置权限为600，仅当前用户可读写)")

        self.appid = appid
        self.appsecret = appsecret

    def _handle_api_error(self, errcode: int, errmsg: str, context: str = "") -> str:
        """统一处理API错误，返回友好的中文提示"""
        chinese_msg = self.ERROR_CODES.get(errcode, errmsg)
        error_detail = f"{context}失败 (错误码{errcode}): {chinese_msg}"

        # 提供针对性的解决建议
        if errcode == 40164:
            error_detail += "\n\n💡 解决方法："
            error_detail += "\n  1. 登录微信公众平台 https://mp.weixin.qq.com"
            error_detail += "\n  2. 设置与开发 → 基本配置 → IP白名单"
            error_detail += "\n  3. 添加当前服务器IP"
            try:
                import socket
                ip = socket.gethostbyname(socket.gethostname())
                error_detail += f"\n  4. 当前IP可能是: {ip}"
            except:
                pass

        elif errcode in [40001, 40125, 40013]:
            error_detail += "\n\n💡 解决方法："
            error_detail += "\n  1. 检查配置文件中的AppID和AppSecret是否正确"
            error_detail += f"\n  2. 配置文件位置: {self.CONFIG_FILE}"
            error_detail += "\n  3. AppID应该以wx开头，长度18位"

        elif errcode == 45009:
            error_detail += "\n\n💡 解决方法："
            error_detail += "\n  API调用次数已达上限，请明天再试"
            error_detail += "\n  或联系微信公众平台提升配额"

        return error_detail

    def _extract_ip_from_error(self, errmsg: str) -> Optional[str]:
        """
        从微信错误消息中提取 IP 地址
        
        Args:
            errmsg: 微信 API 返回的错误消息
            
        Returns:
            提取到的 IPv4 地址，或 None
        """
        ipv4_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        matches = re.findall(ipv4_pattern, errmsg)
        return matches[0] if matches else None

    def _request_token_from_central_server(self) -> Optional[Dict[str, Any]]:
        """
        从中心令牌服务器获取 access_token
        
        借鉴自 weixin-api.ts 的 requestTokenFromCentralServer 方法
        
        Returns:
            包含 token 信息的字典，失败返回 None
        """
        url = self.center_token_url
        
        # 构建请求参数
        if self.doc_id:
            # 简化模式：使用 doc_id
            params = {"doc_id": self.doc_id}
            print(f"→ 使用 doc_id 从中心服务器获取 token...")
        else:
            # 标准模式：使用 app_id + secret
            if not self.appid or not self.appsecret:
                print("✗ 错误: 中心令牌服务器需要 appid/appsecret 或 doc_id")
                return None
            params = {
                "app_id": self.appid,
                "secret": self.appsecret
            }
            print(f"→ 使用 appid/appsecret 从中心服务器获取 token...")
        
        try:
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=params,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"✗ 中心服务器请求失败: HTTP {response.status_code}")
                print(f"  响应: {response.text[:200]}")
                return None
            
            result = response.json()
            code = result.get('code', -1)
            data = result.get('data', {})
            
            if code != 0:
                # 处理特殊错误码
                if code == -2:
                    # doc_id 无效，清除并重试
                    print("⚠ doc_id 已失效，将使用 appid/appsecret 重新获取...")
                    self.doc_id = None
                    self._save_doc_id(None)  # 清除缓存的 doc_id
                    return self._request_token_from_central_server()
                
                if code == -10:
                    # 微信 API 错误
                    errcode = data.get('errcode', 0)
                    errmsg = data.get('errmsg', '')
                    
                    if errcode == 40164:
                        # IP 白名单问题
                        ip = self._extract_ip_from_error(errmsg)
                        if ip:
                            print(f"\n✗ IP 不在白名单中")
                            print(f"\n💡 解决方法：")
                            print(f"  1. 登录微信公众平台 https://mp.weixin.qq.com")
                            print(f"  2. 设置与开发 → 基本配置 → IP白名单")
                            print(f"  3. 添加 IP 地址: {ip}")
                        else:
                            print(f"✗ IP 白名单错误: {errmsg}")
                    else:
                        print(f"✗ 微信 API 错误 ({errcode}): {errmsg}")
                    return None
                
                print(f"✗ 中心服务器返回错误 (code={code}): {result.get('msg', '未知错误')}")
                return None
            
            # 成功获取 token
            last_token = data.get('last_token')
            if not last_token:
                print("✗ 中心服务器未返回有效的 token")
                return None
            
            # 保存 doc_id 以便下次使用
            new_doc_id = data.get('doc_id')
            if new_doc_id and new_doc_id != self.doc_id:
                self.doc_id = new_doc_id
                self._save_doc_id(new_doc_id)
                print(f"  ✓ 已保存 doc_id 用于后续认证")
            
            # 计算过期时间
            expire_time = data.get('expiretime', 0)
            if expire_time > 0:
                # 检测是否为毫秒时间戳（大于 10^12 认为是毫秒）
                if expire_time > 1e12:
                    expire_time = expire_time / 1000
                # expiretime 是秒级时间戳
                expires_in = max(0, expire_time - time.time())
            else:
                # 默认 2 小时
                expires_in = 7200
            
            print(f"✓ 从中心服务器获取 token 成功 (有效期: {int(expires_in)}秒)")
            
            return {
                'access_token': last_token,
                'expires_in': expires_in,
                'expire_time': expire_time
            }
            
        except requests.exceptions.Timeout:
            print("✗ 中心服务器请求超时")
            return None
        except requests.exceptions.RequestException as e:
            print(f"✗ 中心服务器请求失败: {e}")
            return None
        except json.JSONDecodeError:
            print("✗ 中心服务器返回无效的 JSON")
            return None

    def _save_doc_id(self, doc_id: Optional[str]):
        """
        保存 doc_id 到配置文件
        
        Args:
            doc_id: 要保存的 doc_id，None 表示清除
        """
        try:
            if os.path.exists(self.CONFIG_FILE):
                with open(self.CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            else:
                config = {}
            
            if doc_id:
                config['doc_id'] = doc_id
            elif 'doc_id' in config:
                del config['doc_id']
            
            with open(self.CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"⚠ 保存 doc_id 失败: {e}")

    def get_access_token(self, force_refresh: bool = False) -> str:
        """
        获取access_token，优先使用缓存

        Args:
            force_refresh: 是否强制刷新token

        Returns:
            access_token字符串
        """
        # 尝试从缓存读取
        if not force_refresh and os.path.exists(self.TOKEN_CACHE_FILE):
            try:
                with open(self.TOKEN_CACHE_FILE, 'r') as f:
                    cache = json.load(f)

                # 检查token是否过期（提前5分钟刷新）
                if time.time() < cache.get('expires_at', 0) - 300:
                    print("✓ 使用缓存的access_token")
                    return cache['access_token']
            except Exception as e:
                print(f"⚠ 读取token缓存失败: {e}")

        # 根据配置选择获取方式
        if self.use_center_token:
            # 使用中心令牌服务器
            result = self._request_token_from_central_server()
            if result:
                access_token = result['access_token']
                expires_in = result.get('expires_in', 7200)
                
                # 缓存 token
                os.makedirs(os.path.dirname(self.TOKEN_CACHE_FILE), exist_ok=True)
                cache_data = {
                    'access_token': access_token,
                    'expires_at': time.time() + expires_in,
                    'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'source': 'center_server'
                }
                with open(self.TOKEN_CACHE_FILE, 'w') as f:
                    json.dump(cache_data, f, indent=2)
                
                return access_token
            else:
                # 中心服务器失败，尝试回退到直接获取
                if self.appid and self.appsecret:
                    print("⚠ 中心服务器获取失败，尝试直接从微信获取...")
                else:
                    raise Exception("无法获取 access_token：中心服务器失败且没有配置 appid/appsecret")

        # 直接从微信获取 token（原有逻辑）
        print("→ 正在获取新的access_token...")
        url = f"{self.BASE_URL}/token"
        params = {
            'grant_type': 'client_credential',
            'appid': self.appid,
            'secret': self.appsecret
        }

        response = requests.get(url, params=params)
        result = response.json()

        if 'errcode' in result:
            error_msg = self._handle_api_error(
                result['errcode'],
                result.get('errmsg', 'Unknown error'),
                context="获取access_token"
            )
            raise Exception(error_msg)

        access_token = result['access_token']
        expires_in = result.get('expires_in', 7200)

        # 缓存token
        os.makedirs(os.path.dirname(self.TOKEN_CACHE_FILE), exist_ok=True)
        cache_data = {
            'access_token': access_token,
            'expires_at': time.time() + expires_in,
            'updated_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }

        with open(self.TOKEN_CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)

        print(f"✓ 获取access_token成功 (有效期: {expires_in}秒)")
        return access_token

    def upload_image(self, image_path: str, return_url: bool = False):
        """
        上传图片到微信服务器

        Args:
            image_path: 图片文件路径
            return_url: 是否返回图片URL（用于内容图片）

        Returns:
            media_id 或 (media_id, url) 元组
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片文件不存在: {image_path}")

        print(f"→ 正在上传图片: {os.path.basename(image_path)}")

        token = self.get_access_token()
        url = f"{self.BASE_URL}/material/add_material"

        params = {
            'access_token': token,
            'type': 'image'
        }

        with open(image_path, 'rb') as f:
            files = {'media': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post(url, params=params, files=files)

        result = response.json()

        if 'errcode' in result and result['errcode'] != 0:
            # 如果是 token 过期，自动刷新后重试一次
            if result['errcode'] in [40001, 42001]:
                print("⚠ access_token 已过期，正在刷新...")
                token = self.get_access_token(force_refresh=True)
                params['access_token'] = token
                with open(image_path, 'rb') as f:
                    files = {'media': (os.path.basename(image_path), f, 'image/jpeg')}
                    response = requests.post(url, params=params, files=files)
                result = response.json()
                if 'errcode' in result and result['errcode'] != 0:
                    error_msg = self._handle_api_error(
                        result['errcode'],
                        result.get('errmsg', 'Unknown error'),
                        context="上传图片（重试后）"
                    )
                    raise Exception(error_msg)
            else:
                error_msg = self._handle_api_error(
                    result['errcode'],
                    result.get('errmsg', 'Unknown error'),
                    context="上传图片"
                )
                raise Exception(error_msg)

        media_id = result.get('media_id')
        image_url = result.get('url', '')
        print(f"✓ 图片上传成功 (media_id: {media_id})")

        if return_url:
            return media_id, image_url
        return media_id

    def _remove_cover_image(self, content: str) -> str:
        """
        移除HTML中的封面图片

        移除策略：
        1. 移除 <img src="cover.png"> 及其变体
        2. 移除第一个出现的 <img> 标签（通常是封面图）
        3. 保留注释中的封面图引用说明

        Args:
            content: HTML内容

        Returns:
            移除封面图后的HTML内容
        """
        import re

        # 策略1: 移除明确的封面图引用（cover.png, cover.jpg, 封面图等）
        cover_patterns = [
            r'<img[^>]*src=["\']cover\.(png|jpg|jpeg|gif)["\'][^>]*>',  # cover.png
            r'<img[^>]*alt=["\'][^"\']*封面[^"\']*["\'][^>]*>',  # alt包含"封面"
            r'<img[^>]*title=["\'][^"\']*封面[^"\']*["\'][^>]*>',  # title包含"封面"
        ]

        for pattern in cover_patterns:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)

        # 策略2: 移除注释后的第一张图片（通常是封面图位置）
        # 匹配：<!-- 注释 --> 后紧跟的 <img> 标签
        content = re.sub(
            r'(<!--[^>]*标题[^>]*-->)\s*<img[^>]*>',
            r'\1',
            content,
            count=1,
            flags=re.IGNORECASE
        )

        return content

    def _upload_content_images(self, content: str, base_dir: str = ".") -> str:
        """
        扫描HTML中的本地图片并上传到微信，替换为微信URL

        Args:
            content: HTML内容
            base_dir: 图片所在的基础目录

        Returns:
            替换后的HTML内容
        """
        import re
        from pathlib import Path

        # 正则匹配所有 <img src="本地路径"> 标签
        img_pattern = r'<img([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>'

        uploaded_count = 0

        def replace_image(match):
            nonlocal uploaded_count
            before_src = match.group(1)
            src = match.group(2)
            after_src = match.group(3)

            # 跳过已经是HTTP/HTTPS的图片
            if src.startswith(('http://', 'https://')):
                return match.group(0)

            # 跳过封面图（已单独处理）
            if 'cover' in src.lower():
                return match.group(0)

            # 构建完整路径
            image_path = Path(base_dir) / src

            if not image_path.exists():
                print(f"  ⚠️ 图片不存在，跳过: {src}")
                return match.group(0)

            try:
                # 上传图片并获取URL
                _, wechat_url = self.upload_image(str(image_path), return_url=True)

                if wechat_url:
                    uploaded_count += 1
                    # 替换为微信URL
                    return f'<img{before_src}src="{wechat_url}"{after_src}>'
                else:
                    print(f"  ⚠️ 未获取到URL，保持原路径: {src}")
                    return match.group(0)

            except Exception as e:
                print(f"  ⚠️ 上传图片失败 {src}: {e}")
                return match.group(0)

        # 执行替换
        content = re.sub(img_pattern, replace_image, content)

        if uploaded_count > 0:
            print(f"  ✓ 成功上传 {uploaded_count} 张内容图片")

        return content

    def _fix_wechat_editor_issues(self, content: str) -> str:
        """
        修复微信编辑器的样式破坏问题

        解决的问题：
        1. 编辑模式下莫名空行（HTML换行符被渲染）
        2. 样式错位（text-indent、margin被重置）
        3. 布局打乱（vertical-align失效）
        4. 字体变大（font-size被重置）
        5. 段落缩进（微信默认添加text-indent: 2em）

        Args:
            content: HTML内容

        Returns:
            修复后的HTML内容
        """
        import re

        # === 核心修复：将带背景色的 div/section 转换为 table（微信编辑器会保留 table 的背景色）===
        def add_important_to_style(style):
            """给style中的所有CSS属性添加 !important"""
            declarations = style.split(';')
            important_declarations = []

            for decl in declarations:
                decl = decl.strip()
                if not decl:
                    continue

                # 如果已经有 !important，保持不变
                if '!important' in decl:
                    important_declarations.append(decl)
                else:
                    # 否则添加 !important
                    important_declarations.append(decl + '!important')

            return ';'.join(important_declarations) + ';'

        # 转换计数器
        conversion_count = {'converted': 0, 'excluded': 0}

        def convert_bg_div_to_table(match):
            """将带背景色的 div/section 转换为 table 结构"""
            tag = match.group(1)  # div 或 section
            style = match.group(2)  # style 属性内容
            content = match.group(3)  # 内部内容

            # 排除不应该转换的情况：
            # 1. 排除最外层容器（background-color: #ffffff 且包含 font-family）
            if 'font-family' in style and 'ffffff' in style.lower():
                conversion_count['excluded'] += 1
                return match.group(0)

            # 2. 排除纯白色背景且没有边框的元素（可能是容器）
            # 去除空格后检查
            style_no_space = style.replace(' ', '')
            if ('background:#ffffff' in style_no_space or 'background-color:#ffffff' in style_no_space) and 'border' not in style:
                conversion_count['excluded'] += 1
                return match.group(0)

            # 只转换真正需要的背景色区块
            if 'background' not in style.lower():
                return match.group(0)

            # 给所有CSS属性添加 !important（关键：确保微信编辑器不会覆盖样式）
            style_important = add_important_to_style(style)

            # 提取 margin 值（如果有）
            margin_match = re.search(r'margin[^:]*:\s*([^;!]+)', style)
            margin = margin_match.group(1).strip() if margin_match else '0'

            # 构建 table 结构（添加圆角）
            # border-collapse:separate 才能让圆角生效，overflow:hidden 确保内容不会超出圆角
            table_html = f'<table style="width:100%!important;border-collapse:separate!important;border-spacing:0!important;border-radius:10px!important;overflow:hidden!important;margin:{margin}!important;"><tr><td style="{style_important}">{content}</td></tr></table>'
            conversion_count['converted'] += 1
            return table_html

        # 转换所有带 style 且包含 background 的 div/section（但排除 span 等行内元素）
        content = re.sub(
            r'<(div|section)\s+style="([^"]*background[^"]*)"[^>]*>(.*?)</\1>',
            convert_bg_div_to_table,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )

        # 打印转换统计
        print(f"  → 背景色区块转换: 成功转换 {conversion_count['converted']} 个, 排除 {conversion_count['excluded']} 个")

        # === 超级压缩：彻底删除所有空白（这是关键！）===
        # 1. 删除所有标签间的空白和换行符
        content = re.sub(r'>\s+<', '><', content)

        # 2. 删除标签后的空白（包括标签内的换行）
        content = re.sub(r'>\s+', '>', content)
        content = re.sub(r'\s+<', '<', content)

        # 3. 压缩多个连续空格为一个（保留正常文本中的空格）
        content = re.sub(r'  +', ' ', content)

        # === 微信编辑器兼容性修复：CSS属性处理 ===
        # 1. 保留 border-radius 但添加 !important（尝试保留圆角效果）
        content = re.sub(r'border-radius:\s*([^;!]+);', r'border-radius:\1!important;', content)

        # 2. 移除 box-shadow（阴影，微信编辑器确实不支持）
        content = re.sub(r'box-shadow:\s*[^;]+;\s*', '', content)

        # 3. 移除 text-shadow
        content = re.sub(r'text-shadow:\s*[^;]+;\s*', '', content)

        # 4. 处理背景样式（微信编辑器对背景的限制）
        # 4.1 移除渐变背景（微信不支持 linear-gradient）
        content = re.sub(r'background:\s*linear-gradient[^;]+;', '', content)

        # 4.2 统一 background 为 background-color 并添加 !important
        content = re.sub(r'\bbackground:\s*([#a-fA-F0-9]+);', r'background-color:\1!important;', content)

        # 4.3 确保所有 background-color 都有 !important
        content = re.sub(r'background-color:\s*([^;!]+);', r'background-color:\1!important;', content)

        # 5. 将所有 <section> 改为 <div>（避免额外空行）
        content = content.replace('<section', '<div')
        content = content.replace('</section>', '</div>')

        # 6. 优化 margin（保持舒适间距，避免过于紧凑）
        # 保留卡片间的间距（18px），只压缩过大的margin
        content = re.sub(r'margin-bottom:\s*([3-9]\d+|[1-9]\d{2,})px;', 'margin-bottom:18px;', content)  # 只压缩>=30px的
        content = re.sub(r'margin:\s*\d+px\s+0\s+\d+px\s+0;', 'margin:0 0 18px 0;', content)

        # === 核心修复2：在最外层容器强制禁用缩进和设置字体大小 ===
        # 修复微信编辑器默认添加的 text-indent: 2em
        content = re.sub(
            r'(<div[^>]*style="[^"]*)(">)',
            lambda m: m.group(1) + ' text-indent: 0 !important; font-size: 15px !important;' + m.group(2),
            content,
            count=1  # 只修改第一个div（外层容器）
        )

        # === 样式修复：确保所有关键样式不被微信编辑器破坏 ===

        # 1. text-indent 强制为 0 且使用 !important（彻底禁用缩进）
        content = re.sub(r'text-indent:\s*[^;!]+;', 'text-indent: 0 !important;', content)
        content = re.sub(r'text-indent:\s*0;', 'text-indent: 0 !important;', content)

        # 给所有没有 text-indent 的 style 属性添加
        content = re.sub(
            r'style="(?![^"]*text-indent)([^"]*)"',
            r'style="\1 text-indent: 0 !important;"',
            content
        )

        # 2. margin 统一处理（保持舒适的段落间距和呼吸感）
        # 段落的 margin 设置为舒适值
        content = re.sub(
            r'margin:\s*0\s+0\s+\d+px\s+0;',
            'margin: 0 0 18px 0 !important;',
            content
        )
        content = re.sub(
            r'margin-bottom:\s*\d+px;',
            'margin-bottom: 18px !important;',
            content
        )
        # section/卡片 之间的间距（调整为18px，更自然）
        content = re.sub(
            r'margin:\s*\d+px\s+0;',
            'margin: 0 0 18px 0 !important;',
            content
        )

        # 3. 添加 !important 到关键对齐属性
        # vertical-align（防止圆形序号错位）
        content = re.sub(
            r'vertical-align:\s*([^;!]+);',
            r'vertical-align: \1 !important;',
            content
        )

        # text-align（防止对齐错位）
        content = re.sub(
            r'text-align:\s*([^;!]+);',
            r'text-align: \1 !important;',
            content
        )

        # 4. display 属性加 !important（防止布局打乱）
        content = re.sub(
            r'display:\s*inline-block;',
            'display: inline-block !important;',
            content
        )

        # 5. line-height 加 !important（防止行高被重置）
        content = re.sub(
            r'line-height:\s*([^;!]+);',
            r'line-height: \1 !important;',
            content
        )

        # 6. font-size 加 !important（防止字体变大）
        content = re.sub(
            r'font-size:\s*([^;!]+);',
            r'font-size: \1 !important;',
            content
        )

        # 7. padding 加 !important（防止内边距变化）
        content = re.sub(
            r'padding:\s*([^;!]+);',
            r'padding: \1 !important;',
            content
        )

        # === 圆角优化：只给卡片表格（单行无<th>的表格）添加圆角 ===
        # 1. 将 border-collapse: collapse 改为 separate（允许圆角）- 只对卡片表格
        # 数据表格（含<th>）保持 collapse 不变

        def add_rounded_corners_to_card_tables(match):
            """只给卡片表格（不含<th>的表格）添加圆角"""
            table_html = match.group(0)
            # 如果表格包含 <th>（数据表格），不添加圆角
            if '<th' in table_html.lower():
                return table_html
            # 卡片表格：添加圆角
            table_html = table_html.replace(
                'border-collapse: collapse;',
                'border-collapse:separate;border-spacing:0;overflow:hidden!important;'
            ).replace(
                'border-collapse:collapse;',
                'border-collapse:separate;border-spacing:0;overflow:hidden!important;'
            )
            # 给table添加圆角
            table_html = re.sub(
                r'<table\s+style="',
                '<table style="border-radius:10px!important;',
                table_html
            )
            # 给td添加圆角
            table_html = re.sub(
                r'(<td\s+style="[^"]*)(">)',
                r'\1border-radius:10px!important;\2',
                table_html
            )
            return table_html

        # 匹配完整的表格并处理
        content = re.sub(
            r'<table[^>]*>.*?</table>',
            add_rounded_corners_to_card_tables,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )

        # 4. 去除相关资源部分的边框（让结尾更简洁）
        content = re.sub(
            r'border-top:\s*1px\s+dashed\s+#ccc;',
            '',
            content
        )

        # === 图片圆角优化：让所有图片都圆润 ===
        # 给所有 img 标签添加圆角（修复后的正则）
        content = re.sub(
            r'<img([^>]*style="[^"]*)"',
            r'<img\1;border-radius:8px!important;"',
            content
        )

        # 给没有 style 属性的 img 添加圆角
        content = re.sub(
            r'<img(?![^>]*style)([^>]*)>',
            r'<img\1 style="border-radius:8px!important;">',
            content
        )

        return content

    # ==================== Frontmatter 解析 ====================

    # note-to-mp 兼容的中文键名映射
    FRONTMATTER_KEY_MAP = {
        '标题': 'title',
        '作者': 'author',
        '摘要': 'digest',
        '原文地址': 'content_source_url',
        '封面': 'cover',
        '封面素材ID': 'thumb_media_id',
        '打开评论': 'need_open_comment',
        '仅粉丝可评论': 'only_fans_can_comment',
        '封面裁剪': 'crop',
        '公众号': 'appid',
        '样式': 'theme',
        '代码高亮': 'highlight',
    }

    @staticmethod
    def parse_frontmatter(md_path: str) -> Dict[str, Any]:
        """从 Markdown 文件解析 YAML frontmatter（兼容 note-to-mp 中文键名）"""
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if not content.startswith('---'):
            return {}
        end = content.find('---', 3)
        if end == -1:
            return {}
        yaml_str = content[3:end].strip()
        metadata = {}
        for line in yaml_str.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if ':' not in line:
                continue
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] in ('"', "'") and value[-1] == value[0]:
                value = value[1:-1]
            if value.startswith('![[') and value.endswith(']]'):
                value = value[3:-2]
            if isinstance(value, str):
                if value.lower() in ('true', 'yes'):
                    value = True
                elif value.lower() in ('false', 'no'):
                    value = False
                elif value == '':
                    value = None
            metadata[key] = value
        return metadata

    @classmethod
    def normalize_frontmatter(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """将中文键名转换为英文键名"""
        result = {}
        for key, value in raw.items():
            eng_key = cls.FRONTMATTER_KEY_MAP.get(key, key)
            if value is not None:
                result[eng_key] = value
        return result

    def create_draft(self,
                    title: str,
                    content: str,
                    author: str = "",
                    thumb_media_id: str = "",
                    digest: str = "",
                    content_source_url: str = "",
                    need_open_comment: int = 0,
                    only_fans_can_comment: int = 0,
                    pic_crop_235_1: str = "",
                    pic_crop_1_1: str = "",
                    content_base_dir: str = ".") -> Dict[str, Any]:
        """
        创建草稿文章

        Args:
            title: 文章标题（≤64字符）
            content: 文章内容（HTML格式）
            author: 作者（≤8字符）
            thumb_media_id: 封面图片的media_id
            digest: 摘要（≤120字符）
            content_source_url: 阅读原文链接
            need_open_comment: 是否打开评论，0不打开，1打开
            only_fans_can_comment: 是否仅粉丝可评论，0所有人，1仅粉丝
            pic_crop_235_1: 封面裁剪坐标（2.35:1）
            pic_crop_1_1: 封面裁剪坐标（1:1）
            content_base_dir: 内容图片所在目录


        Returns:
            创建结果
        """
        # 1. 自动移除封面图片（封面已通过API单独上传）
        content = self._remove_cover_image(content)

        # 2. 上传内容中的其他图片并替换为微信URL
        print("\n→ 正在处理内容中的图片...")
        content = self._upload_content_images(content, content_base_dir)

        # 3. 修复微信编辑器的样式破坏问题
        content = self._fix_wechat_editor_issues(content)
        print("✓ 已优化HTML格式（防止编辑模式样式错位）")

        # 微信字段长度限制（实测值，以汉字为单位，len() 计算）
        MAX_TITLE_CHARS = 64       # 标题≤64个汉字
        MAX_AUTHOR_CHARS = 8       # 作者≤8个汉字
        MAX_DIGEST_CHARS = 120     # 摘要≤120个汉字

        if len(title) > MAX_TITLE_CHARS:
            print(f"\n⚠️  标题过长：{len(title)} 字（限制 {MAX_TITLE_CHARS} 字）")
            print(f"原标题: {title}")
            title = title[:MAX_TITLE_CHARS]
            print(f"已截断: {title}")

        print(f"→ 正在创建草稿: {title}")

        if author and len(author) > MAX_AUTHOR_CHARS:
            print(f"⚠ 作者名超长，已截断：{author} → {author[:MAX_AUTHOR_CHARS]}")
            author = author[:MAX_AUTHOR_CHARS]

        if not digest:
            digest = title[:54]
        if len(digest) > MAX_DIGEST_CHARS:
            print(f"⚠ 摘要超长，已截断")
            digest = digest[:MAX_DIGEST_CHARS]

        token = self.get_access_token()
        url = f"{self.BASE_URL}/draft/add?access_token={token}"

        # 构建文章数据
        article_data = {
            "title": title,
            "author": author,
            "digest": digest,
            "content": content,
            "thumb_media_id": thumb_media_id,
            "need_open_comment": need_open_comment,
            "only_fans_can_comment": only_fans_can_comment,
        }
        # 可选字段（非空时才传递）
        if content_source_url:
            article_data["content_source_url"] = content_source_url
        if pic_crop_235_1:
            article_data["pic_crop_235_1"] = pic_crop_235_1
        if pic_crop_1_1:
            article_data["pic_crop_1_1"] = pic_crop_1_1

        articles = {"articles": [article_data]}

        headers = {'Content-Type': 'application/json; charset=utf-8'}
        # 手动序列化JSON，确保中文不被转义
        data = json.dumps(articles, ensure_ascii=False).encode('utf-8')
        response = requests.post(url, data=data, headers=headers)
        result = response.json()

        if 'errcode' in result and result['errcode'] != 0:
            # 如果是token过期，尝试刷新token后重试
            if result['errcode'] in [40001, 42001]:
                print("⚠ access_token已过期，正在刷新...")
                self.access_token = self.get_access_token(force_refresh=True)
                token = self.access_token
                url = f"{self.BASE_URL}/draft/add?access_token={token}"
                data = json.dumps(articles, ensure_ascii=False).encode('utf-8')
                response = requests.post(url, data=data, headers=headers)
                result = response.json()

                if 'errcode' in result and result['errcode'] != 0:
                    error_msg = self._handle_api_error(
                        result['errcode'],
                        result.get('errmsg', 'Unknown error'),
                        context="创建草稿"
                    )
                    raise Exception(error_msg)
            else:
                error_msg = self._handle_api_error(
                    result['errcode'],
                    result.get('errmsg', 'Unknown error'),
                    context="创建草稿"
                )
                raise Exception(error_msg)

        print(f"✓ 草稿创建成功!")
        print(f"  media_id: {result.get('media_id')}")

        return result


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='微信公众号草稿发布工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  %(prog)s article.md                        # 从 MD 读元数据，自动查找同名 HTML
  %(prog)s article.html                      # 从 HTML 读内容，自动查找同名 MD
  %(prog)s article.md --source-url URL       # 指定阅读原文链接
  %(prog)s article.md --crop --open-comment  # 封面裁剪 + 开启评论
  %(prog)s --interactive                     # 交互式模式
        """
    )

    parser.add_argument('input', nargs='?', help='输入文件 (.md 或 .html)')
    parser.add_argument('-t', '--title', help='文章标题（覆盖 frontmatter）')
    parser.add_argument('-c', '--content', help='HTML 内容文件路径（覆盖自动查找）')
    parser.add_argument('-m', '--markdown', help='Markdown 元数据文件路径（覆盖自动查找）')
    parser.add_argument('-a', '--author', help='作者（覆盖 frontmatter）')
    parser.add_argument('--cover', help='封面图片路径（覆盖 frontmatter）')
    parser.add_argument('-d', '--digest', help='文章摘要（覆盖 frontmatter）')
    parser.add_argument('--source-url', help='阅读原文链接')
    parser.add_argument('--open-comment', action='store_true', help='打开评论')
    parser.add_argument('--fans-only', action='store_true', help='仅粉丝可评论')
    parser.add_argument('--crop', action='store_true', help='封面图裁剪（使用默认裁剪值）')
    parser.add_argument('--interactive', action='store_true', help='交互式模式')

    args = parser.parse_args()

    try:
        publisher = WeChatPublisher()

        # ========== 确定文件路径 ==========
        md_path = None
        html_path = None

        if args.input:
            input_file = os.path.abspath(args.input)
            if not os.path.exists(input_file):
                print(f"错误: 文件不存在: {input_file}")
                sys.exit(1)

            if input_file.endswith('.md'):
                md_path = input_file
                base = os.path.splitext(input_file)[0]
                for suffix in ['_formatted.html', '.html']:
                    candidate = base + suffix
                    if os.path.exists(candidate):
                        html_path = candidate
                        break
            elif input_file.endswith('.html'):
                html_path = input_file
                base = os.path.splitext(input_file)[0]
                if base.endswith('_formatted'):
                    base = base[:-len('_formatted')]
                candidate = base + '.md'
                if os.path.exists(candidate):
                    md_path = candidate

        # CLI 显式指定的优先
        if args.content:
            html_path = os.path.abspath(args.content)
        if args.markdown:
            md_path = os.path.abspath(args.markdown)

        # ========== 读取元数据 ==========
        # 1. 默认值（从 default_metadata.md 读取）
        default_meta_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'default_metadata.md'
        )
        defaults = {}
        if os.path.exists(default_meta_path):
            raw = WeChatPublisher.parse_frontmatter(default_meta_path)
            defaults = WeChatPublisher.normalize_frontmatter(raw)

        # 2. 从 MD frontmatter 读取
        frontmatter = {}
        if md_path and os.path.exists(md_path):
            raw = WeChatPublisher.parse_frontmatter(md_path)
            frontmatter = WeChatPublisher.normalize_frontmatter(raw)
            print(f"✓ 从 {os.path.basename(md_path)} 读取元数据")

        # 3. 合并：默认值 < frontmatter < CLI 参数
        meta = {**defaults, **frontmatter}

        if args.title:
            meta['title'] = args.title
        if args.author:
            meta['author'] = args.author
        if args.digest:
            meta['digest'] = args.digest
        if args.cover:
            meta['cover'] = args.cover
        if args.source_url:
            meta['content_source_url'] = args.source_url
        if args.open_comment:
            meta['need_open_comment'] = True
        if args.fans_only:
            meta['only_fans_can_comment'] = True
        if args.crop:
            meta['crop'] = True

        # ========== 交互模式 ==========
        if args.interactive or (not args.input and not html_path):
            print("=== 微信公众号草稿发布工具（交互式） ===\n")
            meta['title'] = input(f"标题 [{meta.get('title', '')}]: ").strip() or meta.get('title', '')
            meta['author'] = input(f"作者 [{meta.get('author', '及时春雨')}]: ").strip() or meta.get('author', '及时春雨')
            meta['digest'] = input(f"摘要 [{meta.get('digest', '')}]: ").strip() or meta.get('digest', '')
            meta['content_source_url'] = input(f"原文链接 [{meta.get('content_source_url', '')}]: ").strip() or meta.get('content_source_url', '')

            if not html_path:
                html_input = input("HTML 内容文件路径: ").strip()
                if html_input:
                    html_path = os.path.abspath(html_input)

            if not meta.get('cover'):
                cover_input = input("封面图片路径 [cover.png]: ").strip()
                meta['cover'] = cover_input or 'cover.png'

        # ========== 验证必需文件 ==========
        if not html_path or not os.path.exists(html_path):
            print("错误: 未找到 HTML 内容文件")
            if args.input and args.input.endswith('.md'):
                base = os.path.splitext(args.input)[0]
                print(f"提示: 请先用 wechat-article-formatter 生成 {base}_formatted.html")
            sys.exit(1)

        # 自动提取标题
        title = meta.get('title', '')
        if not title:
            with open(html_path, 'r', encoding='utf-8') as f:
                html_peek = f.read(2000)
            title_match = re.search(r'<!--\s*Title:\s*(.+?)\s*-->', html_peek)
            if title_match:
                title = title_match.group(1)
            else:
                title = os.path.splitext(os.path.basename(html_path))[0]
                title = title.replace('_formatted', '').replace('_', ' ')
            meta['title'] = title

        # ========== 读取内容 ==========
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 确定封面路径（多目录查找）
        cover = meta.get('cover', 'cover.png') or 'cover.png'
        if cover and not os.path.isabs(cover):
            search_dirs = [os.path.dirname(os.path.abspath(html_path))]
            if md_path:
                search_dirs.append(os.path.dirname(os.path.abspath(md_path)))
            search_dirs.append(os.getcwd())
            found = False
            for d in search_dirs:
                candidate = os.path.join(d, cover)
                if os.path.exists(candidate):
                    cover = candidate
                    found = True
                    break
            if not found:
                cover = os.path.join(search_dirs[0], cover)  # 保留原始路径用于报错

        # 处理裁剪参数
        pic_crop_235_1 = ""
        pic_crop_1_1 = ""
        if meta.get('crop'):
            pic_crop_235_1 = "0_0_1_0.5"
            pic_crop_1_1 = "0_0.525_0.404_1"

        # ========== 打印摘要 ==========
        print(f"\n{'='*50}")
        print(f"标题: {meta.get('title', '(未设置)')}")
        print(f"作者: {meta.get('author', '(未设置)')}")
        print(f"内容: {html_path} ({len(content)} 字符)")
        print(f"封面: {cover or '(无)'}")
        if meta.get('content_source_url'):
            print(f"原文: {meta['content_source_url']}")
        if meta.get('crop'):
            print(f"裁剪: 2.35:1 + 1:1")
        if meta.get('need_open_comment'):
            print(f"评论: 开启")
        print(f"{'='*50}\n")

        # ========== 上传封面 ==========
        thumb_media_id = ""
        if cover and os.path.exists(cover):
            thumb_media_id = publisher.upload_image(cover)
        elif cover:
            print(f"⚠ 封面图不存在: {cover}，将不设置封面")

        # ========== 创建草稿 ==========
        result = publisher.create_draft(
            title=meta.get('title', ''),
            content=content,
            author=meta.get('author', ''),
            thumb_media_id=thumb_media_id,
            digest=meta.get('digest', ''),
            content_source_url=meta.get('content_source_url', ''),
            need_open_comment=1 if meta.get('need_open_comment') else 0,
            only_fans_can_comment=1 if meta.get('only_fans_can_comment') else 0,
            pic_crop_235_1=pic_crop_235_1,
            pic_crop_1_1=pic_crop_1_1,
            content_base_dir=os.path.dirname(os.path.abspath(html_path)) or "."
        )

        print(f"\n{'='*50}")
        print("✓ 发布成功！请前往微信公众号后台查看草稿")
        print(f"{'='*50}")

    except KeyboardInterrupt:
        print("\n\n操作已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
