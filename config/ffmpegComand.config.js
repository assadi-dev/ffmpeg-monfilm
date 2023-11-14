import { __dirname } from "./constant.config.js";

const div = 65;
/**
 * list d'argument ffmpeg conversion gopro au format equirectangulaire
 */
export const gopropArgs = `128:1344:x=624:y=0,format=yuvj420p,geq=lum='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cb='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cr='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':a='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':interpolation=b,crop=64:1344:x=0:y=0,format=yuvj420p,scale=96:1344[crop],[0:0]crop=624:1344:x=0:y=0,format=yuvj420p[left],[0:0]crop=624:1344:x=752:y=0,format=yuvj420p[right],[left][crop]hstack[leftAll],[leftAll][right]hstack[leftDone],[0:0]crop=1344:1344:1376:0[middle],[0:0]crop=128:1344:x=3344:y=0,format=yuvj420p,geq=lum='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cb='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cr='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':a='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':interpolation=b,crop=64:1344:x=0:y=0,format=yuvj420p,scale=96:1344[cropRightBottom],[0:0]crop=624:1344:x=2720:y=0,format=yuvj420p[leftRightBottom],[0:0]crop=624:1344:x=3472:y=0,format=yuvj420p[rightRightBottom],[leftRightBottom][cropRightBottom]hstack[rightAll],[rightAll][rightRightBottom]hstack[rightBottomDone],[leftDone][middle]hstack[leftMiddle],[leftMiddle][rightBottomDone]hstack[bottomComplete],[0:5]crop=128:1344:x=624:y=0,format=yuvj420p,geq=lum='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cb='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cr='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':a='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':interpolation=n,crop=64:1344:x=0:y=0,format=yuvj420p,scale=96:1344[leftTopCrop],[0:5]crop=624:1344:x=0:y=0,format=yuvj420p[firstLeftTop],[0:5]crop=624:1344:x=752:y=0,format=yuvj420p[firstRightTop],[firstLeftTop][leftTopCrop]hstack[topLeftHalf],[topLeftHalf][firstRightTop]hstack[topLeftDone],[0:5]crop=1344:1344:1376:0[TopMiddle],[0:5]crop=128:1344:x=3344:y=0,format=yuvj420p,geq=lum='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cb='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':cr='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':a='if(between(X,0,64),(p((X+64),Y)*(((X+1))/${div}))+(p(X,Y)*((${div}-((X+1)))/${div})),p(X,Y))':interpolation=n,crop=64:1344:x=0:y=0,format=yuvj420p,scale=96:1344[TopcropRightBottom],[0:5]crop=624:1344:x=2720:y=0,format=yuvj420p[TopleftRightBottom],[0:5]crop=624:1344:x=3472:y=0,format=yuvj420p[ToprightRightBottom],[TopleftRightBottom][TopcropRightBottom]hstack[ToprightAll],[ToprightAll][ToprightRightBottom]hstack[ToprightBottomDone],[topLeftDone][TopMiddle]hstack[TopleftMiddle],[TopleftMiddle][ToprightBottomDone]hstack[topComplete],[bottomComplete][topComplete]vstack[complete],[complete]v360=eac:e:interp=cubic[v],[v]scale=4096:-2`;

export const ffmpegPath = {
  win32: {
    ffmpegPath: `${__dirname}/bin/ffmpeg/win/ffmpeg.exe`,
    ffprobePath: `${__dirname}/bin/ffmpeg/win/ffprobe.exe`,
  },
  linux: {
    ffmpegPath: `${__dirname}/bin/ffmpeg/linux/ffmpeg`,
    ffprobePath: `${__dirname}/bin/ffmpeg/linux/ffprobe`,
  },
  darwin: {
    ffmpegPath: `${__dirname}/bin/ffmpeg/darwin/ffmpeg`,
    ffprobePath: `${__dirname}/bin/ffmpeg/darwin/ffprobe`,
  },
};

export const feedbackStatus = {
  id: "",
  camera: "",
  step: "",
  message: "wait",
  filename: "",
  progress: 0,
  url: "",
  low: "",
  error: "",
  files: [],
};
