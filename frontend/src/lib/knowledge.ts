// 知识库加载器（纯前端化）
//
// 后端依赖的命理知识库（JSON 结构化数据 + 古籍语料 txt）已拷贝到
// public/data 与 public/corpus，随站点静态分发。本模块在浏览器中按需
// fetch 这些资源并组装成后端 load_all_knowledge() / load_mappings() 的等价物。
//
// 资源路径通过 import.meta.url 计算，兼容 Vite dev 与 GitHub Pages 子路径部署。

// 资源随站点静态分发（public/data）。用 BASE_URL 拼接，兼容 Vite dev（base=/）
// 与 GitHub Pages 子路径部署（base='./'）。import.meta.url 方式在 base='./' 下
// 会解析到 /src/... 导致 404，故统一走 BASE_URL。
const assetUrl = (rel: string): string => `${import.meta.env.BASE_URL}data/${rel}`;

export interface Knowledge {
  tiangandizhi: any; // 天干地支全息
  liushi_jiazi: any; // 六十甲子纳音
  dizhi_canggan: any; // 地支藏干（本/中/余气）
  shishen_rules: any; // 十神规则（日干查表 + 含义）
  shensha_rules: any; // 神煞规则
  shier_changsheng: any; // 十二长生
  jieqi: any; // 节气（含公历起止）
  shishen_modern: any; // 十神现代角色映射
  shensha_events: any; // 神煞现代事件映射
  wuxing_health: any; // 五行健康建议映射
}

let _cache: Knowledge | null = null;
let _promise: Promise<Knowledge> | null = null;

async function loadJson(name: string): Promise<any> {
  const res = await fetch(assetUrl(`${name}.json`));
  if (!res.ok) throw new Error(`加载知识库失败: ${name} (${res.status})`);
  return res.json();
}

/** 加载全部知识库（带缓存，只拉取一次）。 */
export function loadKnowledge(): Promise<Knowledge> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = Promise.all([
    loadJson('tiangandizhi'),
    loadJson('liushi_jiazi'),
    loadJson('dizhi_canggan'),
    loadJson('shishen_rules'),
    loadJson('shensha_rules'),
    loadJson('shier_changsheng'),
    loadJson('jieqi'),
    loadJson('shishen_modern'),
    loadJson('shensha_events'),
    loadJson('wuxing_health'),
  ]).then(
    ([
      tiangandizhi,
      liushi_jiazi,
      dizhi_canggan,
      shishen_rules,
      shensha_rules,
      shier_changsheng,
      jieqi,
      shishen_modern,
      shensha_events,
      wuxing_health,
    ]) => {
      _cache = {
        tiangandizhi,
        liushi_jiazi,
        dizhi_canggan,
        shishen_rules,
        shensha_rules,
        shier_changsheng,
        jieqi,
        shishen_modern,
        shensha_events,
        wuxing_health,
      };
      return _cache;
    },
  );
  return _promise;
}
