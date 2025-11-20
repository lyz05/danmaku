import BilibiliSource from "./api/bilibili.mjs";
import MgtvSource from "./api/mgtv.mjs";
import TencentvideoSource from "./api/tencentvideo.mjs";
import YoukuSource from "./api/youku.mjs";
import IqiyiSource from "./api/iqiyi.mjs";
import GamerSource from "./api/gamer.mjs";

export function createSourceList() {
  const sourceClasses = [
    BilibiliSource,
    MgtvSource,
    TencentvideoSource,
    YoukuSource,
    IqiyiSource,
    GamerSource
  ];

  return sourceClasses.map(SourceClass => new SourceClass());
}
