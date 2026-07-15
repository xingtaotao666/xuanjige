/**
 * 标准 78 张塔罗牌数据
 * 韦特系塔罗（Rider-Waite）传统含义
 */
import type { TarotCardDef } from '@/types/tarot';

const majorArcana: TarotCardDef[] = [
  { number: 0, nameCn: '愚者', nameEn: 'The Fool', arcana: 'major', keywords: '开始,冒险,天真,自由,未知', meaningUpright: '新的开始、充满希望的冒险。跟随内心直觉，拥抱未知的可能性。保持开放心态，不计后果地迈出第一步。', meaningReversed: '鲁莽行事、轻率决定、冒险失败。需要三思而后行，或有人正在阻止你做出错误的选择。', element: '风', astrology: '天王星', imageDesc: '一个年轻人站在悬崖边，背着行囊，手中握着一朵白玫瑰，身旁跟着一只小白狗。' },
  { number: 1, nameCn: '魔术师', nameEn: 'The Magician', arcana: 'major', keywords: '创造,能力,自信,资源,技能', meaningUpright: '拥有完成目标所需的一切资源和技能。创造力旺盛，自信满满，能将想法变为现实。是行动的号角。', meaningReversed: '才能被浪费、缺乏方向、操控他人。可能是在滥用能力，或是信心不足导致裹足不前。', element: '水星', astrology: '水星', imageDesc: '桌上摆放着四元素的象征物，魔术师一手举向天空，一手指向地面，头顶有无穷符号。' },
  { number: 2, nameCn: '女祭司', nameEn: 'The High Priestess', arcana: 'major', keywords: '直觉,奥秘,内省,智慧,潜意识', meaningUpright: '倾听内在的声音，信任直觉。是深入探索自我、获取内在智慧的时刻。保留秘密，静待真相浮现。', meaningReversed: '忽视直觉、秘密被揭露、表面化。拒绝倾听内心的声音，或隐藏的秘密即将被揭开。', element: '水', astrology: '月亮', imageDesc: '一位身穿蓝袍的女性坐在两根黑白柱子之间，手持卷轴，脚旁有一弯新月。' },
  { number: 3, nameCn: '皇后', nameEn: 'The Empress', arcana: 'major', keywords: '丰收,孕育,自然,温柔,丰饶', meaningUpright: '丰饶与收获的象征。代表母性、创造力、自然的繁荣。是一个孕育新事物（作品、关系、生命）的美好时期。', meaningReversed: '依赖他人、创造力受阻、失去滋养。过度依赖外在关注，或在创造过程中遇到瓶颈。', element: '土', astrology: '金星', imageDesc: '一位雍容华贵的女性坐在王座上，周围是金色的麦田和茂密的森林，头戴十二星冠。' },
  { number: 4, nameCn: '皇帝', nameEn: 'The Emperor', arcana: 'major', keywords: '权威,秩序,稳定,掌控,领导', meaningUpright: '权威、领导力与稳定的象征。代表秩序、结构和父性力量。需要建立规则、采取有纪律的行动。', meaningReversed: '专制、滥用权力、缺乏纪律。过于刚硬或控制欲过强。也可能是缺乏权威和方向感。', element: '火', astrology: '白羊座', imageDesc: '一位威严的国王坐在石座上，手持权杖和金球，背景是光秃秃的群山，象征坚实的权威。' },
  { number: 5, nameCn: '教皇', nameEn: 'The Hierophant', arcana: 'major', keywords: '传统,信仰,教导,仪式,智慧', meaningUpright: '遵循传统与正统。代表精神导师、教育、仪式。寻求更高的智慧或需要遵守已知的规范和制度。', meaningReversed: '打破常规、独立思考、标新立异。不再盲从权威，开始质疑传统，走属于自己的道路。', element: '土', astrology: '金牛座', imageDesc: '一位身穿红袍的教皇坐在两个信徒之间，头顶三重冠，右手指向天空，左手持三重十字杖。' },
  { number: 6, nameCn: '恋人', nameEn: 'The Lovers', arcana: 'major', keywords: '爱情,选择,结合,关系,和谐', meaningUpright: '深刻的爱情与结合。面临重要的选择，需要跟随内心做决定。代表和谐关系、吸引力与承诺。', meaningReversed: '感情不和、选择冲突、价值观分裂。关系中的不和谐，或在重要选择面前犹豫不决。', element: '风', astrology: '双子座', imageDesc: '一对男女站在伊甸园中，头顶有天使赐福，背后是智慧树和生命树，象征选择与诱惑。' },
  { number: 7, nameCn: '战车', nameEn: 'The Chariot', arcana: 'major', keywords: '胜利,意志,决心,征服,突破', meaningUpright: '凭借意志力取得胜利。克服障碍、征服困难。坚定目标前进，必将抵达终点。自信与自律的力量。', meaningReversed: '失去方向、意志薄弱、遭遇挫折。缺乏自控力或方向感，内心矛盾导致行动受阻。', element: '水', astrology: '巨蟹座', imageDesc: '一位战士站在战车上，由两只黑白狮身人面兽牵引，战士手握权杖，背后是城墙。' },
  { number: 8, nameCn: '力量', nameEn: 'Strength', arcana: 'major', keywords: '勇气,内在力量,耐心,坚毅,温柔', meaningUpright: '以温柔驾驭刚强。内在的勇气和毅力，用慈悲和耐心面对困难。不是蛮力，而是精神力量。', meaningReversed: '软弱、缺乏自信、被欲望控制。内在力量不足，或让恐惧和欲望占据了主导地位。', element: '火', astrology: '狮子座', imageDesc: '一位身穿白裙的女性正在温柔地合上狮子的嘴，象征以精神力量驯服野性本能。' },
  { number: 9, nameCn: '隐士', nameEn: 'The Hermit', arcana: 'major', keywords: '内省,独处,智慧,寻找,指引', meaningUpright: '在孤独中寻找真理。需要暂时远离外界，向内探索，寻找答案。是深思熟虑、寻求启蒙的时期。', meaningReversed: '孤立过度、逃避现实、拒绝帮助。过度封闭自己，或拒绝接受他人的指引。', element: '土', astrology: '处女座', imageDesc: '一位穿着灰袍的老人站在雪山之巅，手中提着一盏点亮的灯，灯中有一颗六角星。' },
  { number: 10, nameCn: '命运之轮', nameEn: 'Wheel of Fortune', arcana: 'major', keywords: '变化,循环,机遇,命运,转折', meaningUpright: '命运的轮盘正在转动。新的机遇出现，生活即将发生变化。是好运将至或人生进入新阶段的标志。', meaningReversed: '厄运连连、抗拒变化、失去控制。运气不好或在不恰当的时机做错误的决定。', element: '风', astrology: '木星', imageDesc: '一个巨大的轮盘正在转动，轮上有四种符号，四角有四位天使代表四福音。' },
  { number: 11, nameCn: '正义', nameEn: 'Justice', arcana: 'major', keywords: '公平,真相,法律,平衡,因果', meaningUpright: '公平公正的裁决。真相将水落石出，因果报应显现。需要诚实地面对自己，做出理性和公平的判断。', meaningReversed: '不公、谎言、逃避责任、法律纠纷。判决不公，真相被掩盖，或不愿承担应有责任。', element: '风', astrology: '天秤座', imageDesc: '一位手持天平与剑的女性端坐在石座前，眼神坚定，象征公正不偏不倚。' },
  { number: 12, nameCn: '倒吊人', nameEn: 'The Hanged Man', arcana: 'major', keywords: '牺牲,放下,换位,等待,顿悟', meaningUpright: '以退为进，换一个角度看世界。主动的牺牲和放下，在等待中获得顿悟。需要暂停，重新审视。', meaningReversed: '无谓牺牲、拖延、拒绝放手。困在原地不肯改变，或牺牲毫无意义。', element: '水', astrology: '海王星', imageDesc: '一个男人被倒吊在T形架上，神态安详，头顶有光环，双手被反绑在身后。' },
  { number: 13, nameCn: '死神', nameEn: 'Death', arcana: 'major', keywords: '结束,转变,新生,放手,蜕变', meaningUpright: '不可逆转的结束与新生的开始。代表深刻的转变和蜕变。旧的事物必须死去，新的事物才能诞生。', meaningReversed: '抗拒改变、停滞不前、恐惧结局。不愿放手过去，导致生命能量停滞。', element: '水', astrology: '天蝎座', imageDesc: '一位身穿铠甲的骷髅骑士骑着白马，所到之处万物凋零，但远方有朝阳升起。' },
  { number: 14, nameCn: '节制', nameEn: 'Temperance', arcana: 'major', keywords: '平衡,和谐,适中,耐心,融合', meaningUpright: '平衡与和谐的艺术家。需要在中庸之道中找到平衡。调和矛盾，耐心等待事物自然发展。', meaningReversed: '失衡、极端、急躁、过度。生活失去平衡，或缺乏耐心导致前功尽弃。', element: '火', astrology: '射手座', imageDesc: '一位天使站在水边，将水在两个杯子之间来回倒流，象征平衡与调和。' },
  { number: 15, nameCn: '恶魔', nameEn: 'The Devil', arcana: 'major', keywords: '束缚,欲望,物质,沉溺,执念', meaningUpright: '被物质或欲望所束缚。代表沉迷、依赖和执念。需要清醒地认识自己被什么所困。', meaningReversed: '觉醒、挣脱枷锁、重获自由。意识到自己的束缚，正在努力挣脱。自由就在眼前。', element: '土', astrology: '摩羯座', imageDesc: '一个长着羊角蝙蝠翼的恶魔坐在石座上，脚下一男一女被锁链拴住，但锁链是松的。' },
  { number: 16, nameCn: '高塔', nameEn: 'The Tower', arcana: 'major', keywords: '崩塌,剧变,颠覆,觉醒,重建', meaningUpright: '突如其来的剧变。旧有结构崩溃，看似毁灭但其实是必要的清洗。重建将从此开始。', meaningReversed: '避免灾难、抗拒改变、危机延迟。灾难被暂时避免，但根本问题没有解决。', element: '火', astrology: '火星', imageDesc: '一座高塔被闪电击中，塔顶崩裂，两个人从塔上坠落，背景是黑暗的夜空。' },
  { number: 17, nameCn: '星星', nameEn: 'The Star', arcana: 'major', keywords: '希望,灵感,平静,治愈,指引', meaningUpright: '希望的灯塔在黑暗中闪耀。代表灵感、平静和疗愈。经过风暴后的宁静，信心与希望重新燃起。', meaningReversed: '失去希望、灵感枯竭、沮丧。对未来失去信心，感到迷茫和无助。', element: '风', astrology: '水瓶座', imageDesc: '一位裸身女子跪在水边，一只手将水倒入水塘，另一只手倒向地面，头顶有七颗星辰闪耀。' },
  { number: 18, nameCn: '月亮', nameEn: 'The Moon', arcana: 'major', keywords: '幻觉,恐惧,潜意识,未知,不安', meaningUpright: '潜意识的迷雾与幻象。隐藏的真相、恐惧和不安浮出水面。需要面对内心的阴影，分辨真实与虚幻。', meaningReversed: '恐惧消散、看清真相、释放不安。之前的困惑正在变得清晰，走出迷雾。', element: '水', astrology: '双鱼座', imageDesc: '夜空中一轮满月，两侧各有一座塔楼，一条小径通往远方，狼和狗对月而吠，水中爬出龙虾。' },
  { number: 19, nameCn: '太阳', nameEn: 'The Sun', arcana: 'major', keywords: '成功,快乐,活力,光明,成就', meaningUpright: '最吉祥的牌之一。代表成功、喜悦和成就感。一切欣欣向荣，生命充满能量与活力。', meaningReversed: '暂时暗淡、乐观过度、小挫折。快乐虽有但不够纯粹，或过分乐观导致失望。', element: '火', astrology: '太阳', imageDesc: '一轮巨大的太阳照耀大地，一个孩童骑在白马上，手中挥舞红色旗帜，背后是向日葵。' },
  { number: 20, nameCn: '审判', nameEn: 'Judgement', arcana: 'major', keywords: '觉醒,重生,召唤,评判,升华', meaningUpright: '灵魂的觉醒与召唤。是重新评判过去、获得重生、开启新篇章的时刻。听到内心的召唤，勇敢回应。', meaningReversed: '自我怀疑、拒绝召唤、拖延决定。不愿面对真相，或拒绝内心深处的声音。', element: '火', astrology: '冥王星', imageDesc: '天使加百列吹响号角，棺椁中的人们在号声中苏醒，双手高举迎接审判。' },
  { number: 21, nameCn: '世界', nameEn: 'The World', arcana: 'major', keywords: '完成,圆满,成就,旅行,整合', meaningUpright: '圆满的终点与新的起点。完成了一个伟大的循环，达成了目标。是收获成就和获得认可的顶点。', meaningReversed: '未完成、停滞、缺少圆满。事情尚未完成，或缺少最后一环。需要耐心等待。', element: '土', astrology: '土星', imageDesc: '一位舞者被月桂叶编织的花环环绕，四角有四个符号代表四元素和四福音，象征圆满。' },
];

const minorArcanaSuits: { suit: 'wands' | 'cups' | 'swords' | 'pentacles'; nameCn: string; element: string }[] = [
  { suit: 'wands', nameCn: '权杖', element: '火' },
  { suit: 'cups', nameCn: '圣杯', element: '水' },
  { suit: 'swords', nameCn: '宝剑', element: '风' },
  { suit: 'pentacles', nameCn: '星币', element: '土' },
];

const minorArcanaRanks: { number: number; nameCn: string; nameEn: string; keywords: string; upright: string; reversed: string }[] = [
  { number: 1, nameCn: '一', nameEn: 'Ace', keywords: '开始,根源,种子,机会', upright: '新的开始与潜力。该元素的本质力量被唤醒。', reversed: '阻碍、延迟、缺乏该元素的能量。' },
  { number: 2, nameCn: '二', nameEn: 'Two', keywords: '平衡,选择,合作,计划', upright: '平衡与联合。需要协调两个方向。', reversed: '失衡、对立、选择困难。' },
  { number: 3, nameCn: '三', nameEn: 'Three', keywords: '成长,扩展,协作,落实', upright: '初步成果与团队合作。落地执行。', reversed: '协调不足、计划受阻。' },
  { number: 4, nameCn: '四', nameEn: 'Four', keywords: '稳定,巩固,休息,停滞', upright: '稳固基础，暂时休息以巩固成果。', reversed: '过度稳定、僵化、失去动力。' },
  { number: 5, nameCn: '五', nameEn: 'Five', keywords: '冲突,挑战,竞争,失落', upright: '冲突与不和谐。面临挑战和竞争。', reversed: '和解、修复冲突、调整。' },
  { number: 6, nameCn: '六', nameEn: 'Six', keywords: '和谐,分享,胜利,过渡', upright: '和谐与成功。共享成果，顺利过渡。', reversed: '傲慢、延迟、不平衡的给予。' },
  { number: 7, nameCn: '七', nameEn: 'Seven', keywords: '策略,评估,坚持,挑战', upright: '需要策略和坚持。评估局势后行动。', reversed: '放弃、困惑、被压倒。' },
  { number: 8, nameCn: '八', nameEn: 'Eight', keywords: '行动,速度,前进,学习', upright: '快速行动与前进。努力走向目标。', reversed: '缓慢、拖延、错误方向。' },
  { number: 9, nameCn: '九', nameEn: 'Nine', keywords: '完成,独立,丰收,坚持', upright: '接近完成。独立坚持到了最后阶段。', reversed: '功亏一篑、不愿放手。' },
  { number: 10, nameCn: '十', nameEn: 'Ten', keywords: '完成,满溢,结束,负担', upright: '一个周期的完成。满载成果或沉重的结束。', reversed: '不堪重负、未完成的结局。' },
  { number: 11, nameCn: '侍从', nameEn: 'Page', keywords: '消息,学习,探索,好奇心', upright: '探索与学习。充满好奇心的年轻能量。', reversed: '不成熟、延迟消息、缺乏方向。' },
  { number: 12, nameCn: '骑士', nameEn: 'Knight', keywords: '行动,追求,冒险,进取', upright: '全力以赴的追求。快速行动，充满激情。', reversed: '鲁莽、冲动、方向错误。' },
  { number: 13, nameCn: '皇后', nameEn: 'Queen', keywords: '成熟,内在力量,情感,滋养', upright: '成熟的内在力量。以该元素的方式滋养和引领。', reversed: '过度情绪化、不安全感、依赖。' },
  { number: 14, nameCn: '国王', nameEn: 'King', keywords: '权威,掌控,领导,成熟', upright: '成熟的外在权威。对该元素的精通与掌控。', reversed: '专制、滥用权力、不成熟的领导。' },
];

const suitKeywords: Record<string, { upright: string; reversed: string }> = {
  wands: { upright: '行动力、热情、事业、创造、活力', reversed: '热情消退、缺乏动力、方向不明' },
  cups: { upright: '情感、关系、直觉、爱、心灵', reversed: '情绪阻塞、情感失衡、内敛' },
  swords: { upright: '理性、思考、沟通、挑战、决策', reversed: '思维混乱、冲突回避、判断失误' },
  pentacles: { upright: '物质、财富、健康、实际、工作', reversed: '财务损失、身体疲惫、实用问题' },
};

function buildMinorCards(): TarotCardDef[] {
  const cards: TarotCardDef[] = [];
  for (const suitData of minorArcanaSuits) {
    const sk = suitKeywords[suitData.suit];
    for (const rank of minorArcanaRanks) {
      const nameCnFull = `${rank.nameCn}${suitData.nameCn}`;
      const isCourt = rank.number >= 11;
      const cardNameEn = isCourt ? `${rank.nameEn} of ${capitalize(suitData.suit)}` : `${rank.nameEn} of ${capitalize(suitData.suit)}`;
      cards.push({
        number: rank.number,
        nameCn: nameCnFull,
        nameEn: cardNameEn,
        arcana: 'minor',
        suit: suitData.suit,
        keywords: `${suitData.nameCn} · ${rank.keywords}`,
        meaningUpright: `${sk.upright}。${rank.upright}`,
        meaningReversed: `${sk.reversed}。${rank.reversed}`,
        element: suitData.element,
        imageDesc: `韦特塔罗 ${nameCnFull}（${cardNameEn}）`,
      });
    }
  }
  return cards;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 全部 78 张塔罗牌 */
export const ALL_TAROT_CARDS: TarotCardDef[] = [...majorArcana, ...buildMinorCards()];

/** 通过编号查找牌 */
export function getCardByNumber(number: number): TarotCardDef | undefined {
  return ALL_TAROT_CARDS.find((c) => c.number === number && c.arcana === 'major');
}

/** 通过名称查找牌 */
export function findCardByName(name: string): TarotCardDef | undefined {
  return ALL_TAROT_CARDS.find(
    (c) => c.nameCn.includes(name) || c.nameEn.toLowerCase().includes(name.toLowerCase()),
  );
}

/** 牌阵各位置描述 */
export const SPREAD_POSITIONS: Record<string, string[]> = {
  single: ['当前指引'],
  three: ['过去', '现在', '未来'],
  cross: ['当前状况', '挑战', '深层根源', '外界影响', '希望与恐惧', '最终结果'],
  celtic: ['当前状态', '挑战', '过去基础', '近期过去', '最佳可能', '近期未来', '自我态度', '环境影响', '希望与恐惧', '最终结果'],
};
