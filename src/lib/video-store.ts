/**
 * 视频数据内存存储
 *
 * 由于 Next.js 部署环境可能不支持 SQLite 文件读写，
 * 这里使用模块级内存数组替代数据库。通过 globalThis
 * 缓存，确保开发环境热重载时数据不丢失。
 */

export interface Video {
  id: number;
  title: string;
  url: string;
  description: string;
  createdAt: string;
}

type VideoStore = {
  videos: Video[];
  nextId: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __videoStore: VideoStore | undefined;
}

function createStore(): VideoStore {
  const now = new Date();
  const seed: Video[] = [
    {
      id: 1,
      title: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description:
        '一部由 Blender 基金会制作的开源动画短片，讲述一只巨大的兔子在森林中的冒险故事。',
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 2,
      title: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      description:
        'Blender 基金会首个开源电影项目，探索两个角色在奇异机械世界中的旅程。',
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 3,
      title: 'Sintel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      description:
        '一部独立创作的奇幻短片，讲述少女 Sintel 寻找她所救下的小龙的旅程。',
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
  ];

  return { videos: seed, nextId: 4 };
}

const store: VideoStore = globalThis.__videoStore ?? createStore();

if (!globalThis.__videoStore) {
  globalThis.__videoStore = store;
}

export function getAllVideos(): Video[] {
  return [...store.videos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getVideoById(id: number): Video | undefined {
  return store.videos.find((v) => v.id === id);
}

export function createVideo(input: {
  title: string;
  url: string;
  description: string;
}): Video {
  const video: Video = {
    id: store.nextId++,
    title: input.title,
    url: input.url,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
  store.videos.push(video);
  return video;
}

export function deleteVideo(id: number): boolean {
  const index = store.videos.findIndex((v) => v.id === id);
  if (index === -1) return false;
  store.videos.splice(index, 1);
  return true;
}
