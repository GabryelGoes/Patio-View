import type { TvSlide } from '../types.ts';

/** URLs de vídeo configuradas no slide (playlist ou único mediaUrl). */
export function getVideoSources(slide: TvSlide): string[] {
  const fromList = (slide.mediaPlaylist ?? []).map((u) => String(u).trim()).filter(Boolean);
  if (fromList.length > 0) return fromList;
  const single = slide.mediaUrl?.trim();
  return single ? [single] : [];
}

/** Slide de vídeo com o URL efetivo para esta visita à página da TV. */
export function resolveVideoSlideForVisit(slide: TvSlide, visitIndex: number): TvSlide {
  const sources = getVideoSources(slide);
  if (slide.slideType !== 'video' || sources.length <= 1) return slide;
  const idx = ((visitIndex % sources.length) + sources.length) % sources.length;
  return { ...slide, mediaUrl: sources[idx] };
}
