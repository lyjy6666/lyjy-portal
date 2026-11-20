import { describe, it, expect } from 'vitest';
import { centeredCropRect, hasJpegExif, hasPngExif } from './imageLayout';

describe('centeredCropRect', () => {
  it('横图裁 1:1：取中间的正方形', () => {
    expect(centeredCropRect(400, 200, { w: 1, h: 1 })).toEqual({
      sx: 100,
      sy: 0,
      sw: 200,
      sh: 200,
    });
  });

  it('竖图裁 1:1：取中间的方形', () => {
    expect(centeredCropRect(200, 400, { w: 1, h: 1 })).toEqual({
      sx: 0,
      sy: 100,
      sw: 200,
      sh: 200,
    });
  });

  it('16:9 横图保持整幅宽度', () => {
    const r = centeredCropRect(1600, 900, { w: 16, h: 9 });
    expect(r).toEqual({ sx: 0, sy: 0, sw: 1600, sh: 900 });
  });

  it('9:16 裁切横图：按高度反推宽度并居中', () => {
    const r = centeredCropRect(1920, 1080, { w: 9, h: 16 });
    expect(r.sw).toBeCloseTo(1080 * (9 / 16));
    expect(r.sh).toBeCloseTo(1080);
    expect(r.sx).toBeCloseTo((1920 - r.sw) / 2);
  });
});

describe('EXIF 标记回扫', () => {
  it('识别标准 JPEG APP1 Exif 标记', () => {
    // FF D8 FF E1 00 20 "Exif\0\0" … FF D9
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x20, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x11, 0x22, 0xff, 0xd9,
    ]);
    expect(hasJpegExif(bytes)).toBe(true);
  });

  it('普通 JPEG（只有 SOI/EOI）不误报', () => {
    expect(hasJpegExif(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBe(false);
  });

  it('APP1 不是 Exif（如 XMP）不误报', () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x20, 0x68, 0x74, 0x74, 0x70, 0x3a, 0x2f,
      0x2f, 0xff, 0xd9,
    ]);
    expect(hasJpegExif(bytes)).toBe(false);
  });

  it('识别 PNG 的 eXIf 块', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x65, 0x58, 0x49, 0x66, 0x00]);
    expect(hasPngExif(bytes)).toBe(true);
  });

  it('普通 PNG 不误报', () => {
    expect(hasPngExif(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]))).toBe(false);
  });
});
