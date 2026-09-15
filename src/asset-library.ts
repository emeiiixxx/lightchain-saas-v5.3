import type { CanvasImage } from './canvas';

export type LibraryImage = Pick<CanvasImage, 'id' | 'name' | 'url'> & Partial<Pick<CanvasImage, 'width' | 'height'>>;
// Figma-provided demo fixtures, not a connected account's upload history.
export const demoAssets: LibraryImage[] = [
  { id: 'figma-single-select', name: '彩色毛绒穿搭', url: '/assets/upload/single-select-asset.png' },
];

// Figma 17:1333 multi-select demo fixtures; original exported assets.
export const multiDemoAssets: LibraryImage[] = [
  {
    "id": "figma-multi-0",
    "name": "浅色花卉图案",
    "url": "/assets/upload/imgAsset.png"
  },
  {
    "id": "figma-multi-1",
    "name": "蓝色几何图案",
    "url": "/assets/upload/imgAsset1.png"
  },
  {
    "id": "figma-multi-2",
    "name": "小狗印花",
    "url": "/assets/upload/imgAsset2.png"
  },
  {
    "id": "figma-multi-3",
    "name": "绿色连衣裙",
    "url": "/assets/upload/imgAsset3.png"
  },
  {
    "id": "figma-multi-4",
    "name": "海边印花套装",
    "url": "/assets/upload/imgAsset4.png"
  },
  {
    "id": "figma-multi-5",
    "name": "蓝色褶皱面料",
    "url": "/assets/upload/imgAsset5.png"
  },
  {
    "id": "figma-multi-6",
    "name": "紫色无袖连衣裙",
    "url": "/assets/upload/imgAsset6.png"
  },
  {
    "id": "figma-multi-7",
    "name": "浅蓝吊带裙",
    "url": "/assets/upload/imgAsset7.png"
  },
  {
    "id": "figma-multi-8",
    "name": "彩色织带面料",
    "url": "/assets/upload/imgAsset8.png"
  },
  {
    "id": "figma-multi-9",
    "name": "白色吊带上衣",
    "url": "/assets/upload/imgAsset9.png"
  },
  {
    "id": "figma-multi-10",
    "name": "米白衬衫套装",
    "url": "/assets/upload/imgAsset10.png"
  },
  {
    "id": "figma-multi-11",
    "name": "白色系带连衣裙",
    "url": "/assets/upload/imgAsset11.png"
  },
  {
    "id": "figma-multi-12",
    "name": "粉色无袖套装",
    "url": "/assets/upload/imgAsset12.png"
  },
  {
    "id": "figma-multi-13",
    "name": "黑色无袖上衣",
    "url": "/assets/upload/imgAsset13.png"
  },
  {
    "id": "figma-multi-14",
    "name": "蓝色条纹衬衫",
    "url": "/assets/upload/imgAsset14.png"
  },
  {
    "id": "figma-multi-15",
    "name": "黄色半身裙",
    "url": "/assets/upload/imgAsset15.png"
  },
  {
    "id": "figma-multi-16",
    "name": "粉色吊带套装",
    "url": "/assets/upload/imgAsset16.png"
  }
];

export async function prepareMainImage(asset: LibraryImage): Promise<Omit<CanvasImage, 'x' | 'y'>> {
  const image = new Image();
  image.src = asset.url;
  await image.decode();
  const width = Math.min(360, image.naturalWidth);
  return { id: crypto.randomUUID(), name: asset.name, url: asset.url, width, height: width * image.naturalHeight / image.naturalWidth, role: 'main' };
}
