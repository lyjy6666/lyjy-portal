#!/usr/bin/env python3
"""只读历史 dist，生成隔离副本、密钥检查结果和本地截图。"""
import argparse
import hashlib
import json
import re
import shutil
import tempfile
import threading
from functools import partial
from contextlib import nullcontext
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen

REPO = Path('D:/lyjy-portal/main')
ARCHIVE = Path('D:/Users/13418/Desktop/程序/过去程序-500天整理')
IDS = ('home-0804', 'home-0806', 'search-0806', 'nav-0810', 'search-0810',
       'home-0811', 'nav-0823', 'nav-0823plus', 'home-0827', 'nav-0827',
       'search-0827', 'home-0129', 'home-0530')
CSP = ("default-src 'none'; script-src 'self' 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self' data:; media-src 'self' blob: data:; connect-src 'none'; "
       "frame-src 'none'; form-action 'none'; base-uri 'none'")
FONT = '/vendor/fontawesome/css/all.min.css'
TEXT_SUFFIXES = {'.html', '.htm', '.css', '.js', '.mjs', '.json', '.map', '.txt', '.env', '.pem', '.key'}
GUARD = '''<script data-anniversary-isolation>
(()=>{
const deny=()=>Promise.reject(new Error('历史副本已禁用网络请求'));
window.fetch=deny;
XMLHttpRequest.prototype.open=function(){throw new Error('历史副本已禁用网络请求')};
window.WebSocket=function(){throw new Error('历史副本已禁用网络请求')};
window.EventSource=window.WebSocket;
navigator.sendBeacon=()=>false;
if(navigator.serviceWorker)navigator.serviceWorker.register=deny;
window.open=()=>null;
HTMLFormElement.prototype.submit=function(){};
HTMLFormElement.prototype.requestSubmit=function(){};
document.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation()},true);
document.addEventListener('click',e=>{
const a=e.target.closest&&e.target.closest('a[href]');
if(a&&!a.getAttribute('href').startsWith('#')){e.preventDefault();e.stopImmediatePropagation()}
},true);
})();
</script>'''


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def files_under(root):
    # 只遍历指定 dist，拒绝依赖树、符号链接和 junction。
    for p in root.iterdir():
        if p.name == 'node_modules' or p.is_symlink() or p.is_junction():
            raise ValueError('dist 中存在依赖目录或链接，停止处理')
        if p.is_dir():
            yield from files_under(p)
        elif p.is_file():
            yield p


def timeline_sources(archive):
    timeline = archive / '时间线.md'
    text = timeline.read_text(encoding='utf-8-sig')
    rows = re.findall(r'\|\s*(85\d{2})\s*\|[^|]+\|\s*([^|]+?)\s*\|', text)
    table = dict(rows)
    result = []
    for port, version_id in zip(range(8500, 8513), IDS):
        relative = Path(table[str(port)])
        if relative.is_absolute() or '..' in relative.parts or 'node_modules' in relative.parts:
            raise ValueError('时间线路径不安全')
        source = archive / relative
        if not source.is_dir() or not (source / 'index.html').is_file():
            raise ValueError(f'{version_id}: dist 或 index.html 不存在')
        result.append((port, version_id, source))
    return result


def secret_findings(source):
    rules = [
        ('私钥', r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),
        ('云访问密钥', r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
        ('服务令牌', r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b'),
        ('JWT令牌', r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b'),
        ('硬编码认证值', r'''(?i)["']?(?:api[_-]?key|app[_-]?secret|access[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?key|private[_-]?key|password|passwd|token)["']?\s*[:=]\s*["']([^"'\s]{8,})["']'''),
        ('URL认证值', r'(?i)[?&](?:key|api[_-]?key|appsecret|access[_-]?token|token|secret)=([^&\s"\x27`<>]{8,})'),
        ('Bearer令牌', r'(?i)Bearer\s+[A-Za-z0-9_.-]{16,}'),
    ]
    findings = []
    for path in files_under(source):
        if path.suffix.lower() not in TEXT_SUFFIXES and not path.name.startswith('.env'):
            continue
        text = path.read_text(encoding='utf-8-sig', errors='replace')
        kinds = set()
        for kind, pattern in rules:
            for match in re.finditer(pattern, text):
                value = match.group(1) if match.lastindex else match.group()
                if any(marker in value.lower() for marker in ('your_', 'your-', 'example', 'placeholder', 'undefined', '${')):
                    continue
                kinds.add(kind)
        if kinds:
            findings.append({'file': path.relative_to(source).as_posix(), 'types': sorted(kinds)})
    return findings


def rewrite(text, version_id, suffix):
    prefix = f'/anniversary/versions/{version_id}/'
    # 绝对根路径按版本重定位，不产生 CSS 的 ./assets 错误层级。
    text = re.sub(r'(?<![\w/.-])/(assets|music)/', lambda m: prefix + m[1] + '/', text)
    text = re.sub(r'https?://[^\s"\x27<>]*?(?:font-awesome|fontawesome)[^\s"\x27<>]*?/css/all(?:\.min)?\.css', FONT, text, flags=re.I)
    placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    text = re.sub(r'''(\bsrc\s*:\s*["'])(?:https?:)?//[^"']+(["'])''',
                  lambda m: m[1] + placeholder + m[2], text)
    text = re.sub(r'''url\(\s*["']?(?:https?:)?//[^)]+\)''', 'url(' + placeholder + ')', text)
    if suffix in {'.js', '.mjs'}:
        text = re.sub(r'(function\s+\w+\(\{basename:\w+)(?=,children:\w+,window:)',
                      lambda m: m[0] + '=' + json.dumps(prefix.rstrip('/')), text)
        text = re.sub(r'(function\s+\w+\(\w+\)\{let\{basename:\w+)(?=,children:\w+,future:)',
                      lambda m: m[0] + '=' + json.dumps(prefix.rstrip('/')), text)
    if suffix == '.css':
        text = re.sub(r'''@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;''',
                      lambda m: '' if re.search(r'https?:|//', m[0]) else m[0], text, flags=re.I)
    if suffix in {'.html', '.htm'}:
        text = re.sub(r'<script\s+data-anniversary-isolation>.*?</script>\s*', '', text, flags=re.S)
        text = re.sub(r'<meta\b[^>]*http-equiv\s*=\s*["\x27](?:Content-Security-Policy|refresh)["\x27][^>]*>', '', text, flags=re.I)
        text = re.sub(r'<base\b[^>]*>', '', text, flags=re.I)
        meta = f'<meta http-equiv="Content-Security-Policy" content="{CSP}">'
        text, count = re.subn(r'(<head\b[^>]*>\s*(?:<meta\s+charset\s*=[^>]+>\s*)?)',
                             lambda m: m[0] + meta + '\n' + GUARD + '\n', text, count=1, flags=re.I)
        if count != 1:
            raise ValueError('HTML 缺少 head，无法插入隔离策略')
    return text


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and 'src' in attrs:
            self.resources.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'modulepreload', 'preload'):
            self.resources.append(attrs.get('href', ''))


def verify(version, public):
    total = 0
    for path in files_under(version):
        if path.suffix.lower() not in {'.html', '.htm', '.css', '.js', '.mjs'}:
            continue
        text = path.read_text(encoding='utf-8')
        if re.search(r'(?<![\w/.-])/(?:assets|music)/', text):
            raise ValueError(f'{version.name}/{path.name}: 存在未改写的根资源路径')
        if path.suffix.lower() in {'.html', '.htm'}:
            if f'content="{CSP}"' not in text:
                raise ValueError('CSP 校验失败')
            parser = References()
            parser.feed(text)
            for ref in parser.resources:
                url = urlsplit(urljoin('/anniversary/versions/' + version.name + '/', ref))
                if url.scheme or url.netloc:
                    raise ValueError('HTML 存在外部脚本或样式')
                if not (public / unquote(url.path).lstrip('/')).is_file():
                    raise ValueError(f'{version.name}: 本地脚本或样式缺失')
        if path.suffix.lower() in {'.js', '.mjs'} and re.search(
            r'''(?:\bfrom\s*["']|\bimport\s*\(?\s*["'])(?:https?:)?//''', text):
            raise ValueError('JS 存在外部模块导入')
        total += 1
    return total


def prepare(archive, repo, check_only):
    public = repo / 'public'
    if not repo.is_dir() or not public.is_dir() or not (repo / 'scripts').is_dir():
        raise ValueError('目标父目录不存在，禁止创建')
    if not (public / FONT.lstrip('/')).is_file():
        raise ValueError('本地 FontAwesome 不存在')
    sources = timeline_sources(archive)
    report = {'versions': []}
    for port, version_id, source in sources:
        findings = secret_findings(source)
        entry = {'id': version_id, 'port': port, 'source': source.relative_to(archive).as_posix(),
                 'status': 'blocked' if findings else 'checked', 'findings': findings}
        # 疑似项也保守阻止托管，不能把离线正则结果当作已验证真实或失效。
        if findings:
            for finding in findings:
                print(version_id, finding['file'], ', '.join(finding['types']))
        report['versions'].append(entry)
        if check_only or findings:
            continue
        destination = public / 'anniversary' / 'versions' / version_id
        if destination.exists():
            raise ValueError(f'{version_id}: 目标已存在，拒绝覆盖')
        source_hashes = {p.relative_to(source).as_posix(): digest(p) for p in files_under(source)}
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, destination)
        for path in files_under(destination):
            if path.suffix.lower() in {'.html', '.htm', '.css', '.js', '.mjs'}:
                text = path.read_text(encoding='utf-8-sig')
                path.write_text(rewrite(text, version_id, path.suffix.lower()), encoding='utf-8', newline='')
        verify(destination, public)
        if source_hashes != {p.relative_to(source).as_posix(): digest(p) for p in files_under(source)}:
            raise ValueError('原档案哈希发生变化，停止处理')
        entry['status'] = 'prepared'
        entry['source_sha256'] = source_hashes
        entry['output_sha256'] = {p.relative_to(destination).as_posix(): digest(p) for p in files_under(destination)}
        print(version_id, 'prepared')
    if not check_only:
        target = public / 'anniversary' / 'preparation-report.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            raise ValueError('已有准备报告，拒绝覆盖')
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    return report


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def screenshot(repo, fallback, retained_profile=None, refresh=False):
    from playwright.sync_api import sync_playwright
    public = repo / 'public'
    report_path = public / 'anniversary' / 'preparation-report.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    base = 'http://127.0.0.1:3100'
    server = None
    try:
        with urlopen(base + '/', timeout=4) as response:
            if response.status != 200:
                raise ValueError('3100 首页不可用')
        for entry in report['versions']:
            if entry['status'] == 'prepared':
                with urlopen(base + '/anniversary/versions/' + entry['id'] + '/index.html', timeout=4) as response:
                    if response.read().decode('utf-8') != (public / 'anniversary/versions' / entry['id'] / 'index.html').read_text(encoding='utf-8'):
                        raise ValueError('3100 未提供目标副本')
    except Exception:
        print('3100 不可用或未提供目标副本')
        if not fallback:
            return False
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(public)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}'
        print('使用临时回环静态服务')
    if not Path('D:/').is_dir():
        raise ValueError('D 盘 profile 父目录不存在')
    posters = public / 'anniversary' / 'posters'
    posters.mkdir(exist_ok=True)
    results = []
    try:
        # TemporaryDirectory 仅删除本次生成的仓库外目录，不触碰个人档案。
        if retained_profile:
            profile_path = Path(retained_profile).resolve()
            if profile_path.parent != Path('D:/') or not profile_path.name.startswith('lyjy-anniversary-edge-') or not profile_path.is_dir():
                raise ValueError('只能复用本工具生成的 D 盘临时 profile')
        profile_scope = nullcontext(str(profile_path)) if retained_profile else tempfile.TemporaryDirectory(prefix='lyjy-anniversary-edge-', dir='D:/')
        with profile_scope as profile:
            with sync_playwright() as pw:
                context = pw.chromium.launch_persistent_context(
                    profile, channel='msedge', headless=True, viewport={'width': 1280, 'height': 720},
                    service_workers='block', args=['--disable-background-networking', '--disable-component-update',
                                                 '--disable-sync', '--no-first-run'])
                def route_request(route):
                    if urlsplit(route.request.url).netloc == urlsplit(base).netloc:
                        route.continue_()
                    else:
                        route.abort()
                context.route('**/*', route_request)
                for entry in report['versions']:
                    if entry['status'] != 'prepared':
                        continue
                    version_id = entry['id']
                    page = context.new_page()
                    local_failures, external_requests, errors = [], [], []
                    def response_check(response):
                        if response.status >= 400:
                            local_failures.append(urlsplit(response.url).path)
                    page.on('response', response_check)
                    page.on('request', lambda req: external_requests.append(urlsplit(req.url).netloc)
                            if urlsplit(req.url).scheme in ('http', 'https')
                            and urlsplit(req.url).netloc != urlsplit(base).netloc else None)
                    page.on('pageerror', lambda error: errors.append(type(error).__name__))
                    output = posters / (version_id + '.png')
                    if output.exists() and not refresh:
                        raise ValueError(f'{version_id}: 海报已存在，拒绝覆盖')
                    page.goto(base + '/anniversary/versions/' + version_id + '/', wait_until='networkidle')
                    page.wait_for_timeout(5000)
                    root_nodes = page.locator('#root').evaluate('(node)=>node.childElementCount')
                    visible_text_length = len(page.locator('#root').inner_text().strip())
                    page.screenshot(path=str(output), full_page=False)
                    result = {'id': version_id, 'root_nodes': root_nodes, 'visible_text_length': visible_text_length, 'local_failures': sorted(set(local_failures)),
                              'external_request_count': len(external_requests), 'page_error_count': len(errors)}
                    results.append(result)
                    print(version_id, 'screenshot', 'root=', root_nodes, 'local_failures=', len(local_failures),
                          'external_requests=', len(external_requests), 'page_errors=', len(errors))
                    page.close()
                context.close()
                output_report = public / 'anniversary' / 'screenshot-report.json'
                if output_report.exists() and not refresh:
                    raise ValueError('已有截图报告，拒绝覆盖')
                output_report.write_text(json.dumps({'size': [1280, 720], 'versions': results}, ensure_ascii=False, indent=2), encoding='utf-8')
    finally:
        if server:
            server.shutdown()
            server.server_close()
    return len(results) > 0 and all(r['visible_text_length'] > 20 and not r['local_failures'] and not r['external_request_count'] for r in results)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true', help='只读检查，不生成副本')
    parser.add_argument('--screenshots-only', action='store_true', help='只为已准备副本截图')
    parser.add_argument('--fallback-server', action='store_true', help='3100 不可用时使用临时回环服务')
    parser.add_argument('--retained-profile', help='复用被清理钩子保留的本工具 profile，不删除它')
    parser.add_argument('--refresh-posters', action='store_true', help='显式重新生成本工具的截图')
    args = parser.parse_args()
    if args.screenshots_only:
        return 0 if screenshot(REPO, args.fallback_server, args.retained_profile, args.refresh_posters) else 2
    report = prepare(ARCHIVE, REPO, args.check_only)
    print('安全版本:', sum(e['status'] != 'blocked' for e in report['versions']),
          '阻止版本:', sum(e['status'] == 'blocked' for e in report['versions']))
    return 2 if any(e['status'] == 'blocked' for e in report['versions']) else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as error:
        # 不输出包含源码上下文或认证内容的 traceback。
        print('准备失败:', type(error).__name__)
        raise SystemExit(1)
