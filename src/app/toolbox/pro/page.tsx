import ToolboxApp from '@/features/toolbox/ToolboxApp';
// 换肤样式只作用于 [data-skin] 子树，不写全局 :root，因此不会污染旧版与其它页面
import '@/features/toolbox/skins/tokens.css';

export const metadata = {
  title: '格式转换工具箱 · 新版',
  description: '全部处理在浏览器本地完成：图片、文档、文本数据、代码、音视频、压缩、水印与开发工具。',
};

export default function ToolboxProPage() {
  return <ToolboxApp />;
}
