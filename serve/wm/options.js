export const offsetScreenX = 9 // to account for frameborder size
export const offsetScreenY = 64 // also accounts for border size

const browserRatio = 16/10; const tall = true // ratio determination
const alternateRatio = tall ? (4/3) : (16/9) // extra code here

const defaultWindowScaling = 1.25; const isStandard = false // change these for easy conf
export const browserSizeY = 600 * defaultWindowScaling // this is the nicest simple 4:3, imo
export const browserSizeX = browserSizeY * (isStandard ? browserRatio : alternateRatio);

export const pos = { x: browserSizeX, y: browserSizeY, ox: offsetScreenX, oy: offsetScreenY, x_no_border: browserSizeX - offsetScreenX, y_no_border: browserSizeY - offsetScreenY }

export const DefaultProgramOptions = { alwaysWelcome: false, optionalCtl: false, hiddenCtl: false, unrooted: false };
export const opt = (...options) => ({ ...DefaultProgramOptions, options });