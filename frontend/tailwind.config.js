/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // ===== 玄机阁古典配色 =====
        // 动态五行强调色：由 documentElement[data-element] 控制，贯穿全站
        element: "rgb(var(--accent-rgb) / <alpha-value>)",
        glow: "rgb(var(--glow-rgb) / <alpha-value>)",
        gold: "#c4a352",
        "gold-soft": "#b8923a",
        void: "#0a0710",
        ink: "#120a1c",
        amethyst: "#2a1a44",
        paper: "#e8dfd0",
        // ===== 新中式雅致配色（宣纸 + 古铜 + 墨色）=====
        // 背景：宣纸米白
        cream: "#f5ecdb",
        parchment: "#ede1c8",
        "cream-light": "#faf3e2",
        "cream-dark": "#e8d8b8",
        // 文字：墨色
        inkstone: "#2a1810",     // 主文字
        "inkstone-soft": "#5a3f23",  // 次文字
        "inkstone-mute": "#8b6f47",  // 弱化文字
        // 强调：古铜
        bronze: "#8b6f47",
        "bronze-dark": "#5a3f23",
        "bronze-light": "#b8923a",
        // 高亮：暗金
        "gold-deep": "#a3823a",
        // 辅助：苍绿 + 印泥红
        sage: "#6e7d63",
        "sage-light": "#9aaa8e",
        "jade": "#4a6b5b",
        "seal-red": "#a13d2a",
        "seal-red-light": "#c95a3d",
        // 边框 / 分割
        mist: "#d4c5a8",
        "mist-light": "#e8dcc0",
      },
      fontFamily: {
        // 宋体/仿宋 类衬线（正文）
        serif: [
          "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong",
          "SimSun", "宋体", "serif",
        ],
        // 楷体（标题/书法感）
        kai: [
          "Kaiti SC", "STKaiti", "KaiTi", "楷体", "Noto Serif SC",
          "Source Han Serif SC", "serif",
        ],
        // 仿宋（古籍引文/题款）
        fang: [
          "FangSong", "STFangsong", "仿宋", "Noto Serif SC", "serif",
        ],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        // 柔和光效（暗金/元素色）
        "glow-sm": "0 0 12px rgb(var(--glow-rgb) / 0.25)",
        "glow-md": "0 0 28px rgb(var(--glow-rgb) / 0.30)",
        "glow-lg": "0 0 60px rgb(var(--glow-rgb) / 0.35)",
        "gold-glow": "0 0 24px rgba(212,168,67,0.35)",
        // 新中式柔和阴影
        "paper-sm": "0 1px 2px rgba(122, 90, 50, 0.06), 0 1px 3px rgba(122, 90, 50, 0.05)",
        "paper-md": "0 2px 8px rgba(122, 90, 50, 0.08), 0 8px 24px rgba(122, 90, 50, 0.06)",
        "paper-lg": "0 4px 12px rgba(122, 90, 50, 0.10), 0 16px 40px rgba(122, 90, 50, 0.08)",
        "inkstone-soft": "0 1px 2px rgba(42, 24, 16, 0.05)",
        "inkstone-md": "0 4px 12px rgba(42, 24, 16, 0.08)",
        "bronze-glow": "0 4px 16px rgba(139, 111, 71, 0.20)",
        "gold-soft-glow": "0 0 24px rgba(196, 163, 82, 0.30)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        // ===== 玄机阁仪式感动效 =====
        // 星轨旋转
        "orbit": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "orbit-rev": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        // 水墨扩散
        "ink-diffuse": {
          "0%": { transform: "scale(0.35)", opacity: "0.55" },
          "70%": { opacity: "0.18" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        // 旋转符卡（3D 翻转）
        "card-spin": {
          "0%": { transform: "rotateY(0deg) rotateX(0deg)" },
          "50%": { transform: "rotateY(180deg) rotateX(8deg)" },
          "100%": { transform: "rotateY(360deg) rotateX(0deg)" },
        },
        // 太极自转
        "taiji-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        // 星光闪烁
        "twinkle": {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.9" },
        },
        // 呼吸（文案）
        "breathe": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        // 流光（标题/文案渐变流动）
        "shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        // 上浮
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // 渐入上移
        "rise": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // 渐显
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(212, 168, 67, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(212, 168, 67, 0.8), 0 0 40px rgba(212, 168, 67, 0.4)" },
        },
        // 塔罗仪式动画
        "shuffle-card": {
          "0%": { transform: "translateX(0) rotate(0deg)" },
          "15%": { transform: "translateX(-6px) rotate(-3deg)" },
          "30%": { transform: "translateX(8px) rotate(4deg)" },
          "45%": { transform: "translateX(-4px) rotate(-2deg)" },
          "60%": { transform: "translateX(6px) rotate(2deg)" },
          "75%": { transform: "translateX(-2px) rotate(-1deg)" },
          "90%": { transform: "translateX(2px) rotate(1deg)" },
          "100%": { transform: "translateX(0) rotate(0deg)" },
        },
        "deck-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "card-flip": {
          "0%": { transform: "rotateY(0deg) scale(1)" },
          "50%": { transform: "rotateY(90deg) scale(1.05)" },
          "100%": { transform: "rotateY(180deg) scale(1)" },
        },
        "card-fly": {
          "0%": { transform: "translate(0, 0) scale(0.6)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translate(var(--fly-x, 0), var(--fly-y, 0)) scale(1)", opacity: "1" },
        },
        // 新中式动画：墨晕 / 卷轴展开
        "ink-bloom": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "60%": { opacity: "0.30" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        "scroll-unroll": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        "brush": {
          "0%": { strokeDashoffset: "200" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "orbit": "orbit 16s linear infinite",
        "orbit-rev": "orbit-rev 22s linear infinite",
        "ink-diffuse": "ink-diffuse 2.6s ease-out infinite",
        "card-spin": "card-spin 6s ease-in-out infinite",
        "taiji-spin": "taiji-spin 9s linear infinite",
        "twinkle": "twinkle 3.4s ease-in-out infinite",
        "breathe": "breathe 2.8s ease-in-out infinite",
        "shimmer": "shimmer 4s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "rise": "rise 0.7s ease-out both",
        "fade-in": "fade-in 0.8s ease-out both",
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "shuffle-card": "shuffle-card 0.6s linear infinite",
        "deck-float": "deck-float 2s ease-in-out infinite",
        "card-flip": "card-flip 0.8s ease-in-out forwards",
        "card-fly": "card-fly 0.5s ease-out forwards",
        "ink-bloom": "ink-bloom 3.2s ease-out infinite",
        "scroll-unroll": "scroll-unroll 0.8s ease-out both",
        "brush": "brush 1.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
