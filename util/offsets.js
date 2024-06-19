export const negativeScreenX = 6 // to account for frameborder size
export const negativeScreenY = 26 // also accounts for border size

const browserRatio = 4/3; const tall = false // ratio determination
const alternateRatio = tall ? (16/10) : (16/9) // extra code here

const defaultWindowScaling = 1.25; const isStandard = true // change these for easy conf
export const browserSizeY = 600 * defaultWindowScaling // this is the nicest simple 4:3, imo
export const browserSizeX = browserSizeY * (isStandard ? browserRatio : alternateRatio);

export const abs = { x: browserSizeX, y: browserSizeY, x_no_border: browserSizeX - negativeScreenX, y_no_border: browserSizeY - negativeScreenY }

export const DefaultProgramOptions = { alwaysWelcome: false, optionalCtl: false };