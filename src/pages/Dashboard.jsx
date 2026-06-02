import { ArrowRight, BadgeDollarSign, ImageUp, Sparkles, WandSparkles } from 'lucide-react';

const creationCards = [
  {
    id: 'prompts',
    title: '生成提示词',
    text: '为灯串、庭院灯和场景图生成适合 TEMU 欧洲站的中英文提示词。',
    icon: Sparkles,
    tone: 'from-[#fff7fa] to-[#ffffff]/80',
    iconTone: 'bg-[#fff0f6] text-[#a85672]',
  },
  {
    id: 'imagePrompts',
    title: '上传产品图',
    text: '从产品图片提取造型、材质、颜色、镂空和光效特征。',
    icon: ImageUp,
    tone: 'from-[#f6f3ff] to-[#ffffff]/80',
    iconTone: 'bg-[#f0ecff] text-[#7666a8]',
  },
  {
    id: 'profitCenter',
    title: '计算利润',
    text: '测算供货价、活动价、广告费和利润空间，判断是否值得跑。',
    icon: BadgeDollarSign,
    tone: 'from-[#fff8eb] to-[#ffffff]/80',
    iconTone: 'bg-[#fff1d6] text-[#9a6a2c]',
  },
  {
    id: 'ads',
    title: '分析新品',
    text: '评估新品 ROAS 档位、测款风险和活动价策略。',
    icon: WandSparkles,
    tone: 'from-[#f2fbf7] to-[#ffffff]/80',
    iconTone: 'bg-[#e8f7ef] text-[#4f8a68]',
  },
];

export function Dashboard({ onNavigate }) {
  return (
    <section className="min-h-[calc(100vh-48px)] rounded-3xl border border-white/70 bg-white/50 p-8 shadow-glass backdrop-blur-2xl">
      <div className="flex min-h-[calc(100vh-112px)] flex-col justify-between">
        <div className="max-w-3xl pt-2">
          <div className="inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-muted">
            Yuliの工作台
          </div>
          <h2 className="mt-8 text-6xl font-semibold leading-[1.05] text-ink">
            今天要做什么？
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted">
            从一张图片、一个产品或一个价格开始，把灯饰运营里的创意、标题、利润和新品判断放到同一个安静的创作空间。
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 pb-1">
          {creationCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className={`group min-h-[260px] rounded-3xl border border-white/70 bg-gradient-to-br ${card.tone} p-6 text-left shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-white`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconTone}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="mt-8 text-3xl font-semibold text-ink">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted">{card.text}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between text-sm font-medium text-ink">
                    <span>开始</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/70 transition group-hover:translate-x-1 group-hover:bg-white">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
