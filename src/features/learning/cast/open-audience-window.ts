const MIN_STAGE_W = 640;
const MIN_STAGE_H = 480;

/** Open audience slide window — prefers secondary monitor when permitted. */
export async function openAudienceDisplayWindow(
  castUrlAbsolute: string,
  windowName = "pull-rigging-audience"
): Promise<Window | null> {
  if (typeof window === "undefined") return null;

  let left = 80;
  let top = 80;
  let width = Math.min(window.screen.availWidth, 1280);
  let height = Math.min(window.screen.availHeight, 800);

  try {
    interface ScreenAdv extends Screen {
      readonly isPrimary?: boolean;
      readonly availLeft?: number;
      readonly availTop?: number;
      readonly left?: number;
      readonly top?: number;
    }

    interface WindowWithScreens extends Window {
      getScreenDetails?: () => Promise<{ screens: ScreenAdv[] }>;
    }

    const w = window as WindowWithScreens;
    const details = await w.getScreenDetails?.();
    if (details?.screens?.length) {
      const screens = [...details.screens].sort((a, b) => {
        const ap = Boolean(a?.isPrimary);
        const bp = Boolean(b?.isPrimary);
        if (ap !== bp) return Number(ap) - Number(bp);
        return Number(a.availLeft ?? a.left ?? 0) - Number(b.availLeft ?? b.left ?? 0);
      });
      const secondary = screens.find((s) => s.isPrimary !== true) ?? screens.at(-1)!;
      left = secondary.availLeft ?? secondary.left ?? 0;
      top = secondary.availTop ?? secondary.top ?? 0;
      width = Math.max(MIN_STAGE_W, secondary.availWidth ?? window.screen.availWidth);
      height = Math.max(MIN_STAGE_H, secondary.availHeight ?? window.screen.availHeight);
    }
  } catch {
    /* fall back to default placement */
  }

  const features = [
    "popup=yes",
    "noopener=yes",
    "noreferrer=yes",
    `left=${Math.floor(left)}`,
    `top=${Math.floor(top)}`,
    `width=${Math.floor(width)}`,
    `height=${Math.floor(height)}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
  ].join(",");

  return window.open(castUrlAbsolute, windowName, features);
}
