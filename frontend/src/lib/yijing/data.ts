// 易经核心数据（易经纯前端化的数据层）
// 来源：backend/app/knowledge/structured/liushisi_gua.json + mappings/gua_scenes.json

export interface Trigram {
  symbol: string;
  binary: string; // 三位：高位->低位
  wuxing: string;
  fangwei: string;
}

export const EIGHT_TRIGRAMS: Record<string, Trigram> = {
  乾: { symbol: '☰', binary: '111', wuxing: '金', fangwei: '西北' },
  兑: { symbol: '☱', binary: '110', wuxing: '金', fangwei: '西' },
  离: { symbol: '☲', binary: '101', wuxing: '火', fangwei: '南' },
  震: { symbol: '☳', binary: '100', wuxing: '木', fangwei: '东' },
  巽: { symbol: '☴', binary: '011', wuxing: '木', fangwei: '东南' },
  坎: { symbol: '☵', binary: '010', wuxing: '水', fangwei: '北' },
  艮: { symbol: '☶', binary: '001', wuxing: '土', fangwei: '东北' },
  坤: { symbol: '☷', binary: '000', wuxing: '土', fangwei: '西南' },
};

export interface Hexagram {
  xuhao: number;
  name: string;
  shang_gua: string;
  xia_gua: string;
  binary: string; // 上卦三位 + 下卦三位
  cuo_gua: number;
  zong_gua: number;
  bian_gua: number;
  description: string;
}

export const HEXAGRAMS: Hexagram[] = [
  { xuhao: 1, name: '乾', shang_gua: '乾', xia_gua: '乾', binary: '111111', cuo_gua: 2, zong_gua: 1, bian_gua: 44, description: '乾为天，天行健，君子以自强不息' },
  { xuhao: 2, name: '坤', shang_gua: '坤', xia_gua: '坤', binary: '000000', cuo_gua: 1, zong_gua: 2, bian_gua: 24, description: '坤为地，地势坤，君子以厚德载物' },
  { xuhao: 3, name: '屯', shang_gua: '坎', xia_gua: '震', binary: '010100', cuo_gua: 50, zong_gua: 24, bian_gua: 24, description: '水雷屯，万物始生，艰难险阻' },
  { xuhao: 4, name: '蒙', shang_gua: '艮', xia_gua: '坎', binary: '001010', cuo_gua: 49, zong_gua: 39, bian_gua: 3, description: '山水蒙，蒙昧初开，需要启蒙' },
  { xuhao: 5, name: '需', shang_gua: '坎', xia_gua: '乾', binary: '010111', cuo_gua: 35, zong_gua: 6, bian_gua: 48, description: '水天需，等待时机，诚信守正' },
  { xuhao: 6, name: '讼', shang_gua: '乾', xia_gua: '坎', binary: '111010', cuo_gua: 36, zong_gua: 5, bian_gua: 47, description: '天水讼，争讼纠纷，慎涉公庭' },
  { xuhao: 7, name: '师', shang_gua: '坤', xia_gua: '坎', binary: '000010', cuo_gua: 13, zong_gua: 8, bian_gua: 24, description: '地水师，统兵之道，征战讨伐' },
  { xuhao: 8, name: '比', shang_gua: '坎', xia_gua: '坤', binary: '010000', cuo_gua: 14, zong_gua: 7, bian_gua: 23, description: '水地比，亲比和谐，团结互助' },
  { xuhao: 9, name: '小畜', shang_gua: '巽', xia_gua: '乾', binary: '011111', cuo_gua: 16, zong_gua: 10, bian_gua: 5, description: '风天小畜，小有积蓄，修养成德' },
  { xuhao: 10, name: '履', shang_gua: '乾', xia_gua: '兑', binary: '111110', cuo_gua: 15, zong_gua: 9, bian_gua: 43, description: '天泽履，履行礼仪，如履薄冰' },
  { xuhao: 11, name: '泰', shang_gua: '坤', xia_gua: '乾', binary: '000111', cuo_gua: 63, zong_gua: 12, bian_gua: 34, description: '地天泰，天地交泰，国泰民安' },
  { xuhao: 12, name: '否', shang_gua: '乾', xia_gua: '坤', binary: '111000', cuo_gua: 64, zong_gua: 11, bian_gua: 35, description: '天地否，闭塞不通，守正待时' },
  { xuhao: 13, name: '同人', shang_gua: '乾', xia_gua: '离', binary: '111101', cuo_gua: 7, zong_gua: 14, bian_gua: 25, description: '天火同人，志同道合，团结大同' },
  { xuhao: 14, name: '大有', shang_gua: '离', xia_gua: '乾', binary: '101111', cuo_gua: 8, zong_gua: 13, bian_gua: 26, description: '火天大有，丰盛富有，顺天休命' },
  { xuhao: 15, name: '谦', shang_gua: '坤', xia_gua: '艮', binary: '000001', cuo_gua: 10, zong_gua: 16, bian_gua: 31, description: '地山谦，谦卑虚心，处处受益' },
  { xuhao: 16, name: '豫', shang_gua: '震', xia_gua: '坤', binary: '100000', cuo_gua: 9, zong_gua: 15, bian_gua: 32, description: '雷地豫，和乐愉快，顺时而动' },
  { xuhao: 17, name: '随', shang_gua: '兑', xia_gua: '震', binary: '110100', cuo_gua: 18, zong_gua: 18, bian_gua: 42, description: '泽雷随，随机应变，顺应潮流' },
  { xuhao: 18, name: '蛊', shang_gua: '艮', xia_gua: '巽', binary: '001011', cuo_gua: 17, zong_gua: 17, bian_gua: 46, description: '山风蛊，整治腐败，革弊鼎新' },
  { xuhao: 19, name: '临', shang_gua: '坤', xia_gua: '兑', binary: '000110', cuo_gua: 20, zong_gua: 20, bian_gua: 7, description: '地泽临，居高临下，监督教化' },
  { xuhao: 20, name: '观', shang_gua: '巽', xia_gua: '坤', binary: '011000', cuo_gua: 19, zong_gua: 19, bian_gua: 23, description: '风地观，观察体悟，以化万民' },
  { xuhao: 21, name: '噬嗑', shang_gua: '离', xia_gua: '震', binary: '101100', cuo_gua: 22, zong_gua: 55, bian_gua: 27, description: '火雷噬嗑，咬合审判，去碍通顺' },
  { xuhao: 22, name: '贲', shang_gua: '艮', xia_gua: '离', binary: '001101', cuo_gua: 21, zong_gua: 56, bian_gua: 37, description: '山火贲，文饰修饰，返朴归真' },
  { xuhao: 23, name: '剥', shang_gua: '艮', xia_gua: '坤', binary: '001000', cuo_gua: 43, zong_gua: 24, bian_gua: 2, description: '山地剥，剥落侵蚀，顺势而为' },
  { xuhao: 24, name: '复', shang_gua: '坤', xia_gua: '震', binary: '000100', cuo_gua: 44, zong_gua: 23, bian_gua: 2, description: '地雷复，一阳来复，生机萌发' },
  { xuhao: 25, name: '无妄', shang_gua: '乾', xia_gua: '震', binary: '111100', cuo_gua: 26, zong_gua: 26, bian_gua: 13, description: '天雷无妄，纯真无伪，顺其自然' },
  { xuhao: 26, name: '大畜', shang_gua: '艮', xia_gua: '乾', binary: '001111', cuo_gua: 25, zong_gua: 25, bian_gua: 14, description: '山天大畜，蓄积德能，厚积薄发' },
  { xuhao: 27, name: '颐', shang_gua: '艮', xia_gua: '震', binary: '001100', cuo_gua: 28, zong_gua: 28, bian_gua: 21, description: '山雷颐，颐养之道，自食其力' },
  { xuhao: 28, name: '大过', shang_gua: '兑', xia_gua: '巽', binary: '110011', cuo_gua: 27, zong_gua: 27, bian_gua: 31, description: '泽风大过，过度非常，独立不惧' },
  { xuhao: 29, name: '坎', shang_gua: '坎', xia_gua: '坎', binary: '010010', cuo_gua: 30, zong_gua: 29, bian_gua: 59, description: '坎为水，险难重重，诚信守正' },
  { xuhao: 30, name: '离', shang_gua: '离', xia_gua: '离', binary: '101101', cuo_gua: 29, zong_gua: 30, bian_gua: 56, description: '离为火，光明依附，保持中正' },
  { xuhao: 31, name: '咸', shang_gua: '兑', xia_gua: '艮', binary: '110001', cuo_gua: 32, zong_gua: 32, bian_gua: 28, description: '泽山咸，感应互通，男女之情' },
  { xuhao: 32, name: '恒', shang_gua: '震', xia_gua: '巽', binary: '100011', cuo_gua: 31, zong_gua: 31, bian_gua: 16, description: '雷风恒，恒久坚持，中正守常' },
  { xuhao: 33, name: '遁', shang_gua: '乾', xia_gua: '艮', binary: '111001', cuo_gua: 34, zong_gua: 34, bian_gua: 12, description: '天山遁，退避隐退，保存实力' },
  { xuhao: 34, name: '大壮', shang_gua: '震', xia_gua: '乾', binary: '100111', cuo_gua: 33, zong_gua: 33, bian_gua: 11, description: '雷天大壮，强盛壮大，戒骄戒躁' },
  { xuhao: 35, name: '晋', shang_gua: '离', xia_gua: '坤', binary: '101000', cuo_gua: 5, zong_gua: 36, bian_gua: 12, description: '火地晋，前进晋升，光明磊落' },
  { xuhao: 36, name: '明夷', shang_gua: '坤', xia_gua: '离', binary: '000101', cuo_gua: 6, zong_gua: 35, bian_gua: 55, description: '地火明夷，光明受损，韬光养晦' },
  { xuhao: 37, name: '家人', shang_gua: '巽', xia_gua: '离', binary: '011101', cuo_gua: 38, zong_gua: 38, bian_gua: 22, description: '风火家人，家庭伦理，各尽其责' },
  { xuhao: 38, name: '睽', shang_gua: '离', xia_gua: '兑', binary: '101110', cuo_gua: 37, zong_gua: 37, bian_gua: 49, description: '火泽睽，乖离分歧，求同存异' },
  { xuhao: 39, name: '蹇', shang_gua: '坎', xia_gua: '艮', binary: '010001', cuo_gua: 40, zong_gua: 4, bian_gua: 53, description: '水山蹇，艰难险阻，知难而进' },
  { xuhao: 40, name: '解', shang_gua: '震', xia_gua: '坎', binary: '100010', cuo_gua: 39, zong_gua: 59, bian_gua: 8, description: '雷水解，解除困境，化险为夷' },
  { xuhao: 41, name: '损', shang_gua: '艮', xia_gua: '兑', binary: '001110', cuo_gua: 42, zong_gua: 42, bian_gua: 3, description: '山泽损，损下益上，损余补缺' },
  { xuhao: 42, name: '益', shang_gua: '巽', xia_gua: '震', binary: '011100', cuo_gua: 41, zong_gua: 41, bian_gua: 17, description: '风雷益，损上益下，助人利民' },
  { xuhao: 43, name: '夬', shang_gua: '兑', xia_gua: '乾', binary: '110111', cuo_gua: 23, zong_gua: 44, bian_gua: 10, description: '泽天夬，决断裁断，除恶务尽' },
  { xuhao: 44, name: '姤', shang_gua: '乾', xia_gua: '巽', binary: '111011', cuo_gua: 24, zong_gua: 43, bian_gua: 1, description: '天风姤，相遇邂逅，机不可失' },
  { xuhao: 45, name: '萃', shang_gua: '兑', xia_gua: '坤', binary: '110000', cuo_gua: 46, zong_gua: 46, bian_gua: 48, description: '泽地萃，聚集荟萃，人才汇集' },
  { xuhao: 46, name: '升', shang_gua: '坤', xia_gua: '巽', binary: '000011', cuo_gua: 45, zong_gua: 45, bian_gua: 18, description: '地风升，上升提升，循序渐进' },
  { xuhao: 47, name: '困', shang_gua: '兑', xia_gua: '坎', binary: '110010', cuo_gua: 48, zong_gua: 6, bian_gua: 5, description: '泽水困，困厄穷迫，坚守正道' },
  { xuhao: 48, name: '井', shang_gua: '坎', xia_gua: '巽', binary: '010011', cuo_gua: 47, zong_gua: 40, bian_gua: 5, description: '水风井，井养不穷，修德惠民' },
  { xuhao: 49, name: '革', shang_gua: '兑', xia_gua: '离', binary: '110101', cuo_gua: 4, zong_gua: 50, bian_gua: 38, description: '泽火革，变革除旧，顺天应人' },
  { xuhao: 50, name: '鼎', shang_gua: '离', xia_gua: '巽', binary: '101011', cuo_gua: 3, zong_gua: 49, bian_gua: 18, description: '火风鼎，鼎立革故，烹饪养贤' },
  { xuhao: 51, name: '震', shang_gua: '震', xia_gua: '震', binary: '100100', cuo_gua: 52, zong_gua: 51, bian_gua: 32, description: '震为雷，震惊百里，临危不乱' },
  { xuhao: 52, name: '艮', shang_gua: '艮', xia_gua: '艮', binary: '001001', cuo_gua: 51, zong_gua: 52, bian_gua: 31, description: '艮为山，知止不殆，适可而止' },
  { xuhao: 53, name: '渐', shang_gua: '巽', xia_gua: '艮', binary: '011001', cuo_gua: 54, zong_gua: 54, bian_gua: 39, description: '风山渐，循序渐进，稳步发展' },
  { xuhao: 54, name: '归妹', shang_gua: '震', xia_gua: '兑', binary: '100110', cuo_gua: 53, zong_gua: 53, bian_gua: 34, description: '雷泽归妹，婚嫁之象，名正言顺' },
  { xuhao: 55, name: '丰', shang_gua: '震', xia_gua: '离', binary: '100101', cuo_gua: 56, zong_gua: 21, bian_gua: 36, description: '雷火丰，丰盛盈满，持盈保泰' },
  { xuhao: 56, name: '旅', shang_gua: '离', xia_gua: '艮', binary: '101001', cuo_gua: 55, zong_gua: 22, bian_gua: 30, description: '火山旅，漂泊旅居，谨慎行事' },
  { xuhao: 57, name: '巽', shang_gua: '巽', xia_gua: '巽', binary: '011011', cuo_gua: 58, zong_gua: 57, bian_gua: 53, description: '巽为风，顺从谦逊，借风行船' },
  { xuhao: 58, name: '兑', shang_gua: '兑', xia_gua: '兑', binary: '110110', cuo_gua: 57, zong_gua: 58, bian_gua: 54, description: '兑为泽，喜悦快乐，积极乐观' },
  { xuhao: 59, name: '涣', shang_gua: '巽', xia_gua: '坎', binary: '011010', cuo_gua: 60, zong_gua: 40, bian_gua: 29, description: '风水涣，涣散离散，聚散有时' },
  { xuhao: 60, name: '节', shang_gua: '坎', xia_gua: '兑', binary: '010110', cuo_gua: 59, zong_gua: 61, bian_gua: 47, description: '水泽节，节制约束，适可而止' },
  { xuhao: 61, name: '中孚', shang_gua: '巽', xia_gua: '兑', binary: '011110', cuo_gua: 62, zong_gua: 60, bian_gua: 42, description: '风泽中孚，诚信中正，感化万物' },
  { xuhao: 62, name: '小过', shang_gua: '震', xia_gua: '艮', binary: '100001', cuo_gua: 61, zong_gua: 62, bian_gua: 27, description: '雷山小过，小有过失，宜下不宜上' },
  { xuhao: 63, name: '既济', shang_gua: '坎', xia_gua: '离', binary: '010101', cuo_gua: 11, zong_gua: 64, bian_gua: 37, description: '水火既济，事已成功，居安思危' },
  { xuhao: 64, name: '未济', shang_gua: '离', xia_gua: '坎', binary: '101010', cuo_gua: 12, zong_gua: 63, bian_gua: 38, description: '火水未济，事未完成，再接再厉' },
];

export interface GuaScene {
  gua_name: string;
  gua_symbol: string;
  scenes: string[];
  description: string;
}

export const GUA_SCENES: GuaScene[] = [
  { gua_name: '乾', gua_symbol: '䷀', scenes: ['创业', '刚健', '父亲角色', '领导力', '开创事业', '天道运行', '自强不息'], description: '代表天行健、君子自强不息。对应现代社会的事业开创期、创始人带领公司发展、担任领导核心角色、需要展现魄力和决断力的时期。' },
  { gua_name: '坤', gua_symbol: '䷁', scenes: ['厚德载物', '母亲角色', '包容', '团队协作', '大地', '承载', '柔顺'], description: '代表大地包容万物。对应现代社会中的团队支持角色、项目经理协调资源、人力资源工作、母亲养育子女、需要耐心和包容的场景。' },
  { gua_name: '屯', gua_symbol: '䷂', scenes: ['初创艰难', '万物始生', '新生儿', '事业起步', '突破困境'], description: '代表万事开头难。对应现代社会中的创业初期困境、新产品上市阻力、新生儿诞生后的忙碌、新手入门的学习阶段。' },
  { gua_name: '蒙', gua_symbol: '䷃', scenes: ['启蒙教育', '求学', '童蒙', '虚心求教', '职业培训', '学习方法'], description: '代表启蒙和教育。对应现代社会的入学教育、职业培训、拜师学艺、实习生培养、自学新技能的初级阶段。' },
  { gua_name: '需', gua_symbol: '䷄', scenes: ['等待时机', '耐心等待', '积蓄力量', '求职面试', '资源筹备'], description: '代表需求和等待。对应现代社会中的求职等待期、项目审批流程、融资等待到账、种子轮创业的蓄力期。' },
  { gua_name: '讼', gua_symbol: '䷅', scenes: ['官司诉讼', '争议', '谈判', '合同纠纷', '辩论', '法庭对决'], description: '代表争讼和冲突。对应现代社会中的法律诉讼、商业谈判、合同违约纠纷、职场争吵、网络舆论对立等场景。' },
  { gua_name: '师', gua_symbol: '䷆', scenes: ['军队', '组织', '团队作战', '领导统御', '项目管理', '集体行动'], description: '代表军队和集体行动。对应现代社会的项目管理、团队冲锋、军事行动、公司重组、集体抗议等有组织的集体行动。' },
  { gua_name: '比', gua_symbol: '䷇', scenes: ['合作', '亲和', '团队建设', '人际交往', '联盟', '和谐关系'], description: '代表亲和与团结。对应现代社会中的团队建设活动、商业联盟合作、社交联谊、建立客户关系网等和谐互动场景。' },
  { gua_name: '小畜', gua_symbol: '䷈', scenes: ['小有积蓄', '蓄势待发', '积累阶段', '耐心经营', '理财储蓄'], description: '代表小规模的积累和蓄养。对应现代社会中的个人理财储蓄、副业逐渐起色、公司小规模盈利、知识技能的稳步积累。' },
  { gua_name: '履', gua_symbol: '䷉', scenes: ['履行责任', '谨慎行事', '礼仪规范', '职场规则', '如履薄冰'], description: '代表履行和践行。对应现代社会中的遵守合同条款、职业道德规范、按照规章制度办事、小心翼翼处理敏感事务的场景。' },
  { gua_name: '泰', gua_symbol: '䷊', scenes: ['国泰民安', '一帆风顺', '通泰', '和谐', '万事如意', '盛世'], description: '代表通泰和顺利。对应现代社会中的事业顺风顺水、生活安稳和谐、项目推进顺利、经济繁荣期、国运昌盛等美好场景。' },
  { gua_name: '否', gua_symbol: '䷋', scenes: ['闭塞不通', '低谷期', '艰难', '经济萧条', '沟通不畅', '阻塞'], description: '代表闭塞和逆境。对应现代社会中的经济下行期、职场晋升无望、沟通障碍、关系僵持、项目停滞不前等困境。' },
  { gua_name: '同人', gua_symbol: '䷌', scenes: ['志同道合', '团队合作', '社交', '开源协作', '公关', '志趣相投'], description: '代表与人和同。对应现代社会中的开源社区协作、志同道合者组建团队、行业交流会、社团活动、合伙人相遇等场景。' },
  { gua_name: '大有', gua_symbol: '䷍', scenes: ['丰收', '富有', '成功', '财务自由', '事业巅峰', '满载而归'], description: '代表大丰收和大富有。对应现代社会中的企业IPO上市、年度业绩超额完成、个人财富达到新高度、项目大获成功等辉煌时期。' },
  { gua_name: '谦', gua_symbol: '䷎', scenes: ['谦虚', '低调', '学习态度', '尊重他人', '内敛', '品德修养'], description: '代表谦虚和谦逊。对应现代社会中的领导者保持低调谦虚、新入职场的拜师学习、以谦和态度赢得尊重、不骄不躁的处世方式。' },
  { gua_name: '豫', gua_symbol: '䷏', scenes: ['愉悦', '快乐', '休闲娱乐', '准备工作', '放松', '享受生活'], description: '代表愉悦和预备。对应现代社会的假期旅行、周末聚会休闲、活动前的周密筹备、享受工作和生活的平衡状态。' },
  { gua_name: '随', gua_symbol: '䷐', scenes: ['跟随', '顺势而为', '灵活应变', '随从', '适应变化', '顺从趋势'], description: '代表随顺和跟随。对应现代社会中的跟随行业趋势转型、适应公司新政策、旅游跟团、灵活调整计划的场景。' },
  { gua_name: '蛊', gua_symbol: '䷑', scenes: ['整治腐败', '革除弊端', '医治', '重整旗鼓', '危机处理', '改革'], description: '代表整治弊病。对应现代社会中的企业反腐改革、整顿公司乱象、系统bug修复、个人戒除恶习、组织重整等纠偏场景。' },
  { gua_name: '临', gua_symbol: '䷒', scenes: ['面临', '亲临现场', '监督管理', '上级视察', '临近关头', '深入一线'], description: '代表面临和督导。对应现代社会中的领导亲临一线视察、项目经理现场监督、考试临近、即将面临的重大决策场景。' },
  { gua_name: '观', gua_symbol: '䷓', scenes: ['观察', '考察', '调研', '学习观摩', '审时度势', '洞察'], description: '代表观察和审视。对应现代社会中的市场调研、行业考察、观摩学习、观察局势后再决策、做竞品分析等场景。' },
  { gua_name: '噬嗑', gua_symbol: '䷔', scenes: ['审判', '惩处', '清除障碍', '执法', '决断', '扫清障碍'], description: '代表咬合和审判。对应现代社会中的法律审判、公司开除违规员工、清除项目障碍、果断处理棘手问题等执法和决断场景。' },
  { gua_name: '贲', gua_symbol: '䷕', scenes: ['装饰', '美化', '包装', '设计', '婚礼', '品牌形象', '礼仪'], description: '代表修饰和装饰。对应现代社会中的婚礼策划、品牌包装设计、房屋装修、形象打造、PPT美化等注重外观和仪式感的场景。' },
  { gua_name: '剥', gua_symbol: '䷖', scenes: ['剥落', '衰落', '层层剥离', '衰退', '失去', '被淘汰'], description: '代表剥落和消退。对应现代社会中的行业衰退、公司裁员、财富缩水、关系逐渐疏远、被边缘化等不利渐变过程。' },
  { gua_name: '复', gua_symbol: '䷗', scenes: ['复兴', '回归', '重逢', '翻盘', '复原', '重回正轨'], description: '代表回归和复兴。对应现代社会中的市场回暖、旧情复燃、离职后重回公司、股市反弹、病愈康复等重获新生场景。' },
  { gua_name: '无妄', gua_symbol: '䷘', scenes: ['不妄为', '顺其自然', '意外之灾', '诚实', '不可强求', '守正'], description: '代表不妄动和意外。对应现代社会中的坚守正道不投机、意外中奖或天降横祸、顺其自然的处事哲学、不做超出本分的事。' },
  { gua_name: '大畜', gua_symbol: '䷙', scenes: ['大量积蓄', '厚积薄发', '人才储备', '知识积累', '产能蓄积'], description: '代表大量积蓄和储备。对应现代社会中的公司大量招聘储备人才、科研重大突破前的长期积累、企业扩大产能、个人知识体系的深度构建。' },
  { gua_name: '颐', gua_symbol: '䷚', scenes: ['养生', '休养', '饮食', '休养生息', '充电', '自我照顾'], description: '代表养生的智慧。对应现代社会中的养生保健、休年假充电、饮食调理、休假旅行恢复精力、退休养老等关注身心健康的场景。' },
  { gua_name: '大过', gua_symbol: '䷛', scenes: ['过度', '非常规', '危机', '特殊时期', '极限操作', '颠覆常规'], description: '代表过度和非常态。对应现代社会中的公司激进扩张、个人过度劳累、非常规举措应对危机、极限挑战等打破常规的场景。' },
  { gua_name: '坎', gua_symbol: '䷜', scenes: ['险境', '重重困难', '陷阱', '挑战', '涉险', '水深火热'], description: '代表险陷和困难。对应现代社会中的接连不断的挫折、创业融资困难期、人生低谷、身处高危环境等充满挑战的时期。' },
  { gua_name: '离', gua_symbol: '䷝', scenes: ['光明', '依附', '美丽', '文明', '火热', '网络科技', '分离'], description: '代表光明和依附。对应现代社会中的互联网科技行业、文化产业繁荣、电力和能源行业、需要相互依附的合作关系、美丽的艺术创作。' },
  { gua_name: '咸', gua_symbol: '䷞', scenes: ['感应', '恋爱', '婚姻', '情感沟通', '心有灵犀', '人际感应'], description: '代表感应的力量。对应现代社会中的一见钟情、情侣间的心有灵犀、团队默契合作、商业合作伙伴一拍即合等心灵相通的场景。' },
  { gua_name: '恒', gua_symbol: '䷟', scenes: ['恒久', '坚持', '婚姻长久', '持久经营', '毅力', '坚守初心'], description: '代表恒久和坚持。对应现代社会中的长期婚姻经营、数十年如一日的匠心精神、长期投资持有、企业基业长青的坚守。' },
  { gua_name: '遁', gua_symbol: '䷠', scenes: ['退隐', '隐退', '避让', '全身而退', '战略撤退', '离职'], description: '代表退隐和避让。对应现代社会中的主动辞职、急流勇退、规避市场风险、搬家远离是非之地、退居二线等明智撤退场景。' },
  { gua_name: '大壮', gua_symbol: '䷡', scenes: ['强盛', '壮大', '事业鼎盛', '体力充沛', '规模扩张', '正当盛时'], description: '代表盛大和强壮。对应现代社会中的公司规模迅速扩张、个人事业巅峰、运动员巅峰状态、团队气势如虹等强大态势。' },
  { gua_name: '晋', gua_symbol: '䷢', scenes: ['晋升', '进步', '向上发展', '仕途顺利', '事业上升', '蒸蒸日上'], description: '代表晋升和前进。对应现代社会中的职场升职加薪、企业排名上升、学术职称晋升、事业蒸蒸日上等向上发展场景。' },
  { gua_name: '明夷', gua_symbol: '䷣', scenes: ['受伤', '黑暗时期', '隐忍', '韬光养晦', '挫折', '低调蓄力'], description: '代表光明受伤和黑暗时期。对应现代社会中的遭遇不公正对待、职场被排挤打压、经济大环境不好等需要隐忍等待时机的时期。' },
  { gua_name: '家人', gua_symbol: '䷤', scenes: ['家庭', '家族企业', '家庭教育', '家庭和睦', '家务管理', '家族传承'], description: '代表家庭事务。对应现代社会中的家庭生活管理、家族企业经营、子女教育问题、家庭关系维护、家族财富传承等场景。' },
  { gua_name: '睽', gua_symbol: '䷥', scenes: ['分歧', '背离', '对立', '意见不合', '隔阂', '众叛亲离'], description: '代表乖离和对立。对应现代社会中的团队意见分裂、合伙人分道扬镳、夫妻感情不和、部门之间推诿扯皮等分歧场景。' },
  { gua_name: '蹇', gua_symbol: '䷦', scenes: ['艰难', '步履维艰', '困难重重', '跋涉', '挑战', '逆境前行'], description: '代表艰难和阻碍。对应现代社会中的创业艰难期、求职四处碰壁、项目推进重重阻力、疾病缠身等行走艰难的处境。' },
  { gua_name: '解', gua_symbol: '䷧', scenes: ['解脱', '化解', '危机解除', '解决问题', '释放', '走出困境'], description: '代表解除和释放。对应现代社会中的问题顺利解决、债务纠纷化解、误会冰释、疫情解封、走出心理阴霾等重获自由场景。' },
  { gua_name: '损', gua_symbol: '䷨', scenes: ['损失', '减少', '付出代价', '牺牲', '取舍', '舍小保大'], description: '代表减损和取舍。对应现代社会中的股市亏损、主动降薪保工作、出售资产渡过危机、牺牲短期利益换取长远发展等场景。' },
  { gua_name: '益', gua_symbol: '䷩', scenes: ['增益', '受益', '利好', '投资回报', '收获', '双向受益'], description: '代表增益和获益。对应现代社会中的投资分红、公司盈利增长、学习新技能提升自我、合作双方共赢等获得利益场景。' },
  { gua_name: '夬', gua_symbol: '䷪', scenes: ['决断', '决裂', '果断决策', '清除', '裁决', '最终方案'], description: '代表决断和果决。对应现代社会中的董事会最后决策、公司裁撤亏损部门、结束不良关系、辞职转行的最终决定等重大决断。' },
  { gua_name: '姤', gua_symbol: '䷫', scenes: ['邂逅', '相遇', '偶然', '意外相逢', '机缘', '一念之差'], description: '代表不期而遇。对应现代社会中的偶遇旧爱、意外的商务合作机会、网络上的偶然邂逅、一场改变人生轨迹的相遇场景。' },
  { gua_name: '萃', gua_symbol: '䷬', scenes: ['聚集', '汇聚', '人才济济', '精英荟萃', '群体活动', '聚会'], description: '代表汇聚和聚集。对应现代社会中的行业峰会、大型招聘会、校友会聚会、公司年会、高端人才聚集的盛况。' },
  { gua_name: '升', gua_symbol: '䷭', scenes: ['上升', '晋升', '发展壮大', '步步高升', '上涨', '成长曲线'], description: '代表上升和前进。对应现代社会中的职业稳步晋升、股价持续上涨、公司规模不断壮大、个人成长迅速等蒸蒸日上场景。' },
  { gua_name: '困', gua_symbol: '䷮', scenes: ['困境', '贫困', '被困', '四面楚歌', '走投无路', '资源枯竭'], description: '代表穷困和困境。对应现代社会中的资金链断裂、被竞争对手围剿、失业困境、感情困局、深陷债务等走投无路的处境。' },
  { gua_name: '井', gua_symbol: '䷯', scenes: ['稳定', '取之有道', '社区', '不变', '老牌', '资源', '维护'], description: '代表固定资源和稳定供给。对应现代社会中的稳定工作（铁饭碗）、社区邻里关系、成熟的产品或平台、需要维护的传统资源。' },
  { gua_name: '革', gua_symbol: '䷰', scenes: ['改革', '革命', '变革', '转型', '颠覆', '升级换代', '革新'], description: '代表变革和革新。对应现代社会中的企业数字化转型、行业颠覆性创新、个人职业转型、产品迭代升级、社会制度改革等变革场景。' },
  { gua_name: '鼎', gua_symbol: '䷱', scenes: ['鼎立', '稳定', '创新', '地位稳固', '新事物诞生', '烹饪'], description: '代表鼎盛和新立。对应现代社会中的公司上市建立品牌、新政权建立、开创全新事业、技术创新引领行业、社会地位稳固等场景。' },
  { gua_name: '震', gua_symbol: '䷲', scenes: ['震动', '突发事件', '震惊', '变革', '警醒', '雷厉风行'], description: '代表震动和惊雷。对应现代社会中的突然离职、市场黑天鹅事件、地震等自然灾害、公司突发危机等令人震惊的场景。' },
  { gua_name: '艮', gua_symbol: '䷳', scenes: ['停止', '静止', '知止', '界限', '稳固', '不动如山', '冥想'], description: '代表停止和静止。对应现代社会中的项目暂停、休息充电、冥想修行、坚守底线不动摇、等待时机停止冒进等场景。' },
  { gua_name: '渐', gua_symbol: '䷴', scenes: ['渐进', '循序渐进', '慢慢发展', '稳步推进', '量变到质变', '积累'], description: '代表渐进的进程。对应现代社会中的职业阶梯稳步上升、学习能力的渐进提高、产品版本的持续迭代、关系的慢慢发展。' },
  { gua_name: '归妹', gua_symbol: '䷵', scenes: ['出嫁', '婚姻', '归宿', '结合', '联姻', '回归家庭'], description: '代表女子出嫁和归宿。对应现代社会中的婚礼出嫁、婚姻结合、企业并购联姻、找到人生归宿、长期合作的确定等场景。' },
  { gua_name: '丰', gua_symbol: '䷶', scenes: ['丰收', '丰富', '盛大', '鼎盛时期', '充足', '繁荣昌盛', '富足'], description: '代表丰盛和盛大。对应现代社会中的公司业绩鼎盛、个人成就丰硕、经济繁荣期、精神物质双丰收等气象万千的场景。' },
  { gua_name: '旅', gua_symbol: '䷷', scenes: ['旅行', '出差', '漂泊', '异乡', '旅途', '临时居所', '漂泊在外'], description: '代表旅行和客居。对应现代社会中的商务出差、背包旅行、外地工作、异国留学、在陌生城市打拼等旅居场景。' },
  { gua_name: '巽', gua_symbol: '䷸', scenes: ['顺从', '渗透', '沟通', '渐入', '灵活性', '风', '媒体传播'], description: '代表顺从和渗透。对应现代社会中的市场营销渗透、文化传播推广、灵活调整策略、与上级或客户的顺畅沟通、风投融资等场景。' },
  { gua_name: '兑', gua_symbol: '䷹', scenes: ['喜悦', '交流', '社交', '口才', '谈判', '演说', '娱乐'], description: '代表喜悦和言说。对应现代社会中的脱口秀和演讲、直播带货、销售谈判、社交娱乐活动、愉快的朋友聚会等开心交流场景。' },
  { gua_name: '涣', gua_symbol: '䷺', scenes: ['涣散', '离散', '人心涣散', '分散', '分离', '团队解散'], description: '代表涣散和分散。对应现代社会中的团队解散、公司分拆、感情破裂后的分道扬镳、成员士气低落等人心离散场景。' },
  { gua_name: '节', gua_symbol: '䷻', scenes: ['节制', '节约', '规章制度', '财务管理', '自律', '适度'], description: '代表节制和节度。对应现代社会中的预算管控、个人节制消费、公司财务制度、饮食健康的自律、在规则范围内行事等场景。' },
  { gua_name: '中孚', gua_symbol: '䷼', scenes: ['诚信', '信任', '真诚', '信誉', '真诚合作', '可信赖'], description: '代表内心的诚信。对应现代社会中的建立在诚信基础上的商业合作、品牌信誉积累、真诚的人际关系、获得他人信任等场景。' },
  { gua_name: '小过', gua_symbol: '䷽', scenes: ['小过失', '轻微过当', '谨慎', '调整', '适度修正', '不宜激进'], description: '代表小有过错。对应现代社会中的工作中小失误需要弥补、投资轻微亏损、人际关系中的小摩擦、需要微调策略的场景。' },
  { gua_name: '既济', gua_symbol: '䷾', scenes: ['已完成', '成功', '圆满', '大功告成', '目标达成', '项目交付'], description: '代表事情已经成功完成。对应现代社会中的项目圆满交付、目标顺利达成、毕业典礼、公司上市完成、结婚礼成等完美收官场景。' },
  { gua_name: '未济', gua_symbol: '䷿', scenes: ['未完成', '新的开始', '继续努力', '未竟之业', '过渡期', '再接再厉'], description: '代表尚未完成、新的起点。对应现代社会中的阶段性成果但还需努力、创业初具规模但远未成功、学业结束但职场生涯刚开始等未竟之路。' },
];

// 工具：按卦序号取卦
export function getHexagramByXuhao(xuhao: number): Hexagram | undefined {
  return HEXAGRAMS.find((h) => h.xuhao === xuhao);
}
export function getHexagramByBinary(binary: string): Hexagram | undefined {
  return HEXAGRAMS.find((h) => h.binary === binary);
}
export function getTrigramNameByBinary(binary3: string): string | undefined {
  for (const [name, info] of Object.entries(EIGHT_TRIGRAMS)) {
    if (info.binary === binary3) return name;
  }
  return undefined;
}
