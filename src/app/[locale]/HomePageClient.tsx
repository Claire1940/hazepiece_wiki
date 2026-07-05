"use client";

import { useState, Suspense, lazy } from "react";
import {
  Anchor,
  Apple,
  ArrowLeftRight,
  ArrowRight,
  AtSign,
  BookOpen,
  Check,
  Clock,
  Copy,
  Crosshair,
  Crown,
  Dna,
  ExternalLink,
  Eye,
  Gamepad2,
  Gift,
  Hand,
  Hourglass,
  LayoutGrid,
  Link2,
  Map,
  MessageCircle,
  Ship,
  Skull,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

// Tools Grid 卡片 → 锚点映射（8 张卡 ↔ 8 个 section，一一对应）
const TOOL_CARD_SECTIONS = [
  "codes",
  "trello-discord",
  "beginner-guide",
  "fruits-tier-list",
  "fruits-and-stock",
  "races-and-haki",
  "swords-and-styles",
  "boss-drops-and-map",
] as const;

// Trello & Discord 模块的链接类型 → 图标映射（统一使用非品牌安全图标）
const LINK_TYPE_ICON: Record<string, LucideIcon> = {
  Trello: LayoutGrid,
  Discord: MessageCircle,
  "Roblox Game": Gamepad2,
  "Roblox Group": Users,
  X: AtSign,
  YouTube: Video,
};

// 水果 Tier List 等级徽章样式（主题色 + 不同透明度区分 S+/S/A/B/C/D，禁止硬编码颜色）
const TIER_BADGE_CLASS: Record<string, string> = {
  "S+": "bg-[hsl(var(--nav-theme))] text-white",
  S: "bg-[hsl(var(--nav-theme))] text-white",
  A: "bg-[hsl(var(--nav-theme)/0.85)] text-white",
  B: "bg-[hsl(var(--nav-theme)/0.65)] text-white",
  C: "bg-[hsl(var(--nav-theme)/0.45)] text-foreground",
  D: "bg-[hsl(var(--nav-theme)/0.3)] text-foreground",
};

// 模块 5：Fruits and Stock 规则图标（按索引分配不同图标）
const FRUIT_RULE_ICON: LucideIcon[] = [Clock, Hourglass, Crown];
// 模块 5：Fruits and Stock 获取路线图标（按索引分配不同图标）
const FRUIT_ROUTE_ICON: LucideIcon[] = [Store, ArrowLeftRight];

// 模块 6：Races and Haki — Haki 项图标（按索引分配不同图标）
const HAKI_ICON: LucideIcon[] = [Zap, Eye, Sparkles];
// 模块 6：Races and Haki — 稀有度徽章样式（主题色透明度梯度）
const RARITY_BADGE_CLASS: Record<string, string> = {
  Mythical: "bg-[hsl(var(--nav-theme))] text-white",
  Legendary: "bg-[hsl(var(--nav-theme)/0.85)] text-white",
  Rare: "bg-[hsl(var(--nav-theme)/0.65)] text-white",
  Uncommon: "bg-[hsl(var(--nav-theme)/0.45)] text-foreground",
  Common: "bg-[hsl(var(--nav-theme)/0.3)] text-foreground",
};

// 模块 7：Swords and Fighting Styles — tier kind（sword/style）图标
const WEAPON_KIND_ICON: Record<string, LucideIcon> = {
  sword: Swords,
  style: Hand,
};

// 模块 8：Boss Drops and Map — sea 分组图标（每个分组不同图标）
const SEA_GROUP_ICON: LucideIcon[] = [Ship, Skull, Anchor, Crosshair];
// 模块 8：sea 分组整体徽章样式（区分普通岛 boss 与超级 boss）
const SEA_GROUP_BADGE_CLASS: Record<string, string> = {
  "Sea 1": "bg-[hsl(var(--nav-theme)/0.18)] text-[hsl(var(--nav-theme-light))] border-[hsl(var(--nav-theme)/0.4)]",
  "Sea 1 Super Boss": "bg-[hsl(var(--nav-theme)/0.65)] text-white border-[hsl(var(--nav-theme)/0.7)]",
  "Sea 2": "bg-[hsl(var(--nav-theme)/0.18)] text-[hsl(var(--nav-theme-light))] border-[hsl(var(--nav-theme)/0.4)]",
  "Sea 2 Super Boss": "bg-[hsl(var(--nav-theme)/0.65)] text-white border-[hsl(var(--nav-theme)/0.7)]",
};

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

export default function HomePageClient({
  latestArticles,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.hazepiece.wiki";

  // Codes 模块状态：Active/Expired 切换 + 复制反馈
  const [codeTab, setCodeTab] = useState<"active" | "expired">("active");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mobileBannerAd = getPreferredMobileBannerSelection();

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((cur) => (cur === code ? null : cur));
      }, 1500);
    } catch {
      // 剪贴板不可用时静默失败，用户仍可手动复制
    }
  };

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Haze Piece Wiki",
        description:
          "Complete Haze Piece Wiki covering codes, Devil Fruits, races, Haki, weapons, bosses, and beginner progression guides for the Haze Seas Roblox rework.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Haze Piece - Roblox Pirate Action RPG",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Haze Piece Wiki",
        alternateName: "Haze Seas Wiki",
        url: siteUrl,
        description:
          "Complete Haze Piece and Haze Seas Wiki resource hub for codes, Devil Fruits, races, Haki, weapons, bosses, and beginner guides.",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Haze Piece Wiki - Roblox Pirate Action RPG",
        },
        sameAs: [
          "https://www.roblox.com/games/6918802270/Haze-Seas",
          "https://discord.com/invite/hazeseas",
          "https://x.com/RealHazeStudios",
          "https://www.youtube.com/@RealHazeStudios",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Haze Seas",
        alternateName: "Haze Piece",
        gamePlatform: ["Web Browser", "Roblox"],
        applicationCategory: "Game",
        genre: ["Action RPG", "Adventure", "Pirate"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 100,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/6918802270/Haze-Seas",
        },
      },
      {
        "@type": "VideoObject",
        name: "HAZE SEAS Official Trailer",
        description:
          "Official Haze Seas trailer featuring the Roblox pirate action RPG gameplay preview.",
        uploadDate: "2026-06-30",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/uLhv4-5NRCc",
        url: "https://www.youtube.com/watch?v=uLhv4-5NRCc",
      },
    ],
  };

  // Codes 模块：按当前 Tab 过滤
  const codeItems = (t.modules.hazePieceCodes.items as any[]).filter(
    (c) => c.status === codeTab,
  );

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("codes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <Gift className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/6918802270/Haze-Seas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* ============================== Video（max-w-5xl，避免挤压广告）============================== */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="uLhv4-5NRCc"
              title="HAZE SEAS [Official Trailer]"
            />
          </div>
        </div>
      </section>

      {/* ============================== Tools Grid（模块导航区，4 张卡，max-w-5xl）============================== */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = TOOL_CARD_SECTIONS[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                                  bg-[hsl(var(--nav-theme)/0.1)]
                                  flex items-center justify-center
                                  group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                  transition-colors"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm md:text-base font-semibold">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* ============================== Latest Updates（LatestGuidesAccordion）============================== */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* ============================== Module 1: Haze Piece Codes ============================== */}
      <section id="codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Gift className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceCodes.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceCodes.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceCodes.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.hazePieceCodes.intro}
            </p>
          </div>

          {/* Active / Expired Tabs */}
          <div className="mb-8 flex justify-center scroll-reveal">
            <div className="inline-flex rounded-lg border border-border bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setCodeTab("active")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  codeTab === "active"
                    ? "bg-[hsl(var(--nav-theme))] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.modules.hazePieceCodes.activeTabLabel}
              </button>
              <button
                type="button"
                onClick={() => setCodeTab("expired")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  codeTab === "expired"
                    ? "bg-[hsl(var(--nav-theme))] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.modules.hazePieceCodes.expiredTabLabel}
              </button>
            </div>
          </div>

          {/* Code cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
            {codeItems.map((item: any) => {
              const isActive = item.status === "active";
              return (
                <div
                  key={item.code}
                  className="flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-5
                             hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full border border-[hsl(var(--nav-theme)/0.3)]
                                     bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs">
                      {item.category}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                        isActive
                          ? "border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.15)] text-[hsl(var(--nav-theme-light))]"
                          : "border-border bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {item.status === "active"
                        ? t.modules.hazePieceCodes.activeTabLabel
                        : t.modules.hazePieceCodes.expiredTabLabel}
                    </span>
                  </div>

                  <code className="block break-all rounded-md bg-black/30 px-3 py-2 font-mono text-base md:text-lg font-bold tracking-wide">
                    {item.code}
                  </code>

                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">
                      {t.modules.hazePieceCodes.rewardLabel}:{" "}
                    </span>
                    <span className="font-medium text-foreground">
                      {item.reward}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.requirement}
                  </p>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => copyCode(item.code)}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border
                                 border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)]
                                 px-3 py-2 text-sm font-medium transition-colors
                                 hover:bg-[hsl(var(--nav-theme)/0.2)]"
                    >
                      {copiedCode === item.code ? (
                        <>
                          <Check className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
                          {t.modules.hazePieceCodes.copiedLabel}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          {t.modules.hazePieceCodes.copyLabel}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* How to redeem */}
          <div className="scroll-reveal rounded-xl border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.05)] p-4 md:p-6">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-base md:text-lg font-bold">
                {t.modules.hazePieceCodes.howToRedeemTitle}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.modules.hazePieceCodes.howToRedeem}
            </p>
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* ============================== Module 2: Haze Piece Trello and Discord ============================== */}
      <section
        id="trello-discord"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Link2 className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceTrelloDiscord.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceTrelloDiscord.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceTrelloDiscord.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.hazePieceTrelloDiscord.intro}
            </p>
          </div>

          {/* Official link cards（外部链接，无内部 URL） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {t.modules.hazePieceTrelloDiscord.items.map((link: any, index: number) => {
              const Icon = LINK_TYPE_ICON[link.type] || Link2;
              return (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-6
                             transition-colors hover:border-[hsl(var(--nav-theme)/0.5)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
                                    bg-[hsl(var(--nav-theme)/0.1)] text-[hsl(var(--nav-theme-light))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base md:text-lg">
                          {link.label}
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-[hsl(var(--nav-theme)/0.3)]
                                         bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs">
                          {link.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.type}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {link.bestFor}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--nav-theme-light))]">
                    {t.modules.hazePieceTrelloDiscord.openLinkLabel}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== Module 3: Haze Piece Beginner Guide ============================== */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <BookOpen className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceBeginnerGuide.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceBeginnerGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceBeginnerGuide.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.hazePieceBeginnerGuide.intro}
            </p>
          </div>

          {/* Steps（独立 section 内对自身步骤使用 map，符合规范） */}
          <div className="space-y-3 md:space-y-4">
            {t.modules.hazePieceBeginnerGuide.items.map((step: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 rounded-xl border border-border bg-white/5 p-4 md:p-6
                           hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full
                                border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                  <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                    {step.step}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1.5 text-lg md:text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="mb-3 text-sm md:text-base text-muted-foreground">
                    {step.summary}
                  </p>
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-[hsl(var(--nav-theme-light))]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.modules.hazePieceBeginnerGuide.checklistLabel}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {step.checklist.map((c: string, ci: number) => (
                      <li key={ci} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span className="text-sm text-muted-foreground">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅 320×50 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* ============================== Module 4: Haze Piece Fruits Tier List ============================== */}
      <section
        id="fruits-tier-list"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceFruitsTierList.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceFruitsTierList.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceFruitsTierList.subtitle}
            </p>
            <p className="mx-auto mb-3 max-w-3xl text-sm md:text-base text-muted-foreground">
              {t.modules.hazePieceFruitsTierList.intro}
            </p>
            <p className="mx-auto max-w-3xl rounded-lg border border-border bg-white/5 px-3 py-2 text-xs text-muted-foreground">
              {t.modules.hazePieceFruitsTierList.tierNote}
            </p>
          </div>

          {/* Tier rows（独立 section 内对自身 tier 使用 map） */}
          <div className="space-y-6 md:space-y-8">
            {t.modules.hazePieceFruitsTierList.tiers.map((tier: any, ti: number) => (
              <div key={ti} className="scroll-reveal">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold ${
                      TIER_BADGE_CLASS[tier.tier] || TIER_BADGE_CLASS.D
                    }`}
                  >
                    {tier.tier}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{tier.label}</h3>
                    <p className="text-xs text-muted-foreground">{tier.summary}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tier.fruits.map((f: any, fi: number) => (
                    <div
                      key={fi}
                      className="flex flex-col rounded-xl border border-border bg-white/5 p-4
                                 hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h4 className="font-bold">{f.name}</h4>
                        <span className="inline-flex items-center rounded-full border border-[hsl(var(--nav-theme)/0.3)]
                                         bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs whitespace-nowrap">
                          {f.rarity}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">{f.role}</p>
                      <div className="mb-2 flex flex-wrap gap-1">
                        {f.bestFor.map((b: string, bi: number) => (
                          <span
                            key={bi}
                            className="inline-flex items-center rounded-md border border-border bg-white/5 px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== Module 5: Haze Piece Fruits and Stock Guide ============================== */}
      <section id="fruits-and-stock" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Apple className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceFruitsAndStockGuide.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceFruitsAndStockGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceFruitsAndStockGuide.subtitle}
            </p>
            <p className="mx-auto max-w-3xl text-sm md:text-base text-muted-foreground">
              {t.modules.hazePieceFruitsAndStockGuide.intro}
            </p>
          </div>

          {/* Spawn & Stock Rules */}
          <div className="mb-10 md:mb-12 scroll-reveal">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-xl md:text-2xl font-bold">
                {t.modules.hazePieceFruitsAndStockGuide.rulesLabel}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {t.modules.hazePieceFruitsAndStockGuide.rules.map((rule: any, ri: number) => {
                const RuleIcon = FRUIT_RULE_ICON[ri] || Clock;
                return (
                  <div
                    key={ri}
                    className="flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-5
                               hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg
                                      bg-[hsl(var(--nav-theme)/0.1)]">
                        <RuleIcon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                                       bg-[hsl(var(--nav-theme))] text-white whitespace-nowrap">
                        {rule.value}
                      </span>
                    </div>
                    <h4 className="mb-1 font-bold">{rule.name}</h4>
                    <p className="mb-2 text-xs text-muted-foreground">{rule.details}</p>
                    <p className="text-xs text-muted-foreground">{rule.note}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Get Fruits */}
          <div className="mb-10 md:mb-12 scroll-reveal">
            <div className="mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-xl md:text-2xl font-bold">
                {t.modules.hazePieceFruitsAndStockGuide.routesLabel}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {t.modules.hazePieceFruitsAndStockGuide.routes.map((route: any, ri: number) => {
                const RouteIcon = FRUIT_ROUTE_ICON[ri] || Store;
                return (
                  <div
                    key={ri}
                    className="flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-5
                               hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg
                                      bg-[hsl(var(--nav-theme)/0.1)]">
                        <RouteIcon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[hsl(var(--nav-theme)/0.3)]
                                       bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                        {route.value}
                      </span>
                    </div>
                    <h4 className="mb-1 font-bold">{route.name}</h4>
                    <p className="mb-2 text-xs text-muted-foreground">{route.details}</p>
                    <p className="text-xs text-muted-foreground">{route.note}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fruit Pool */}
          <div className="scroll-reveal">
            <div className="mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-xl md:text-2xl font-bold">
                {t.modules.hazePieceFruitsAndStockGuide.fruitsLabel}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {t.modules.hazePieceFruitsAndStockGuide.fruits.map((fruit: any, fi: number) => (
                <div
                  key={fi}
                  className="flex flex-col rounded-lg border border-border bg-white/5 p-3
                             hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                    <h4 className="text-sm font-bold truncate">{fruit.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{fruit.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== Module 6: Haze Piece Races and Haki Guide ============================== */}
      <section
        id="races-and-haki"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Dna className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceRacesAndHakiGuide.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceRacesAndHakiGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceRacesAndHakiGuide.subtitle}
            </p>
            <p className="mx-auto max-w-3xl text-sm md:text-base text-muted-foreground">
              {t.modules.hazePieceRacesAndHakiGuide.intro}
            </p>
          </div>

          {/* Haki Unlocks */}
          <div className="mb-10 md:mb-12 scroll-reveal">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-xl md:text-2xl font-bold">
                {t.modules.hazePieceRacesAndHakiGuide.hakiHeading}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {t.modules.hazePieceRacesAndHakiGuide.haki.map((haki: any, hi: number) => {
                const HakiIcon = HAKI_ICON[hi] || Sparkles;
                return (
                  <div
                    key={hi}
                    className="flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-5
                               hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg
                                      bg-[hsl(var(--nav-theme)/0.1)]">
                        <HakiIcon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      <h4 className="font-bold">{haki.name}</h4>
                    </div>
                    <dl className="space-y-2 text-xs">
                      <div>
                        <dt className="font-semibold text-foreground/80">Unlock</dt>
                        <dd className="text-muted-foreground">{haki.unlock}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground/80">Requirements</dt>
                        <dd className="text-muted-foreground">{haki.requirements}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground/80">Base Effect</dt>
                        <dd className="text-muted-foreground">{haki.baseEffect}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground/80">Upgrade Path</dt>
                        <dd className="text-muted-foreground">{haki.upgradePath}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground/80">Max Effect</dt>
                        <dd className="text-muted-foreground">{haki.maxEffect}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 pt-3 border-t border-border text-xs text-[hsl(var(--nav-theme-light))]">
                      <span className="font-semibold">Best For: </span>{haki.bestFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Races */}
          <div className="scroll-reveal">
            <div className="mb-4 flex items-center gap-2">
              <Dna className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="text-xl md:text-2xl font-bold">
                {t.modules.hazePieceRacesAndHakiGuide.racesHeading}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {t.modules.hazePieceRacesAndHakiGuide.races.map((race: any, ri: number) => (
                <div
                  key={ri}
                  className="flex flex-col rounded-xl border border-border bg-white/5 p-4 md:p-5
                             hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="font-bold">{race.name}</h4>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                      RARITY_BADGE_CLASS[race.rarity] || RARITY_BADGE_CLASS.Common
                    }`}>
                      {race.rarity}
                    </span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="font-semibold text-foreground/80">V1</dt>
                      <dd className="text-muted-foreground">{race.v1}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground/80">V2</dt>
                      <dd className="text-muted-foreground">{race.v2}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground/80">Reroll Sources</dt>
                      <dd className="text-muted-foreground">{race.rerollSources}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 pt-3 border-t border-border text-xs text-[hsl(var(--nav-theme-light))]">
                    <span className="font-semibold">Best For: </span>{race.bestFor}
                  </p>
                </div>
              ))}
            </div>

            {/* Race V2 Route */}
            {(() => {
              const v2 = t.modules.hazePieceRacesAndHakiGuide.raceV2Route;
              return (
                <div className="mt-4 md:mt-5 scroll-reveal rounded-xl border border-[hsl(var(--nav-theme)/0.4)]
                                bg-[hsl(var(--nav-theme)/0.06)] p-4 md:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg
                                    bg-[hsl(var(--nav-theme)/0.15)]">
                      <TrendingUp className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                    </span>
                    <h4 className="font-bold">{v2.name}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground/80">Unlock</p>
                      <p className="text-muted-foreground">{v2.unlock}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Requirements</p>
                      <p className="text-muted-foreground">{v2.requirements}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Base Effect</p>
                      <p className="text-muted-foreground">{v2.baseEffect}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Upgrade Path</p>
                      <p className="text-muted-foreground">{v2.upgradePath}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Max Effect</p>
                      <p className="text-muted-foreground">{v2.maxEffect}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Best For</p>
                      <p className="text-muted-foreground">{v2.bestFor}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ============================== Module 7: Haze Piece Swords and Fighting Styles ============================== */}
      <section id="swords-and-styles" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Swords className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceSwordsAndFightingStyles.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceSwordsAndFightingStyles.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceSwordsAndFightingStyles.subtitle}
            </p>
            <p className="mx-auto max-w-3xl text-sm md:text-base text-muted-foreground">
              {t.modules.hazePieceSwordsAndFightingStyles.intro}
            </p>
          </div>

          {/* Tier rows */}
          <div className="space-y-6 md:space-y-8">
            {t.modules.hazePieceSwordsAndFightingStyles.tiers.map((tier: any, ti: number) => {
              const KindIcon = WEAPON_KIND_ICON[tier.kind] || Swords;
              return (
                <div key={ti} className="scroll-reveal">
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold ${
                        TIER_BADGE_CLASS[tier.tier] || TIER_BADGE_CLASS.D
                      }`}
                    >
                      {tier.tier}
                    </span>
                    <div className="flex items-center gap-2">
                      <KindIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      <div>
                        <h3 className="text-lg font-bold">{tier.label}</h3>
                        <p className="text-xs text-muted-foreground">{tier.summary}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tier.entries.map((entry: any, ei: number) => (
                      <div
                        key={ei}
                        className="flex flex-col rounded-xl border border-border bg-white/5 p-4
                                   hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                      >
                        <div className="mb-2">
                          <h4 className="font-bold">{entry.name}</h4>
                          <p className="text-xs text-muted-foreground">{entry.role}</p>
                        </div>
                        <div className="mb-2">
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-foreground/80">
                            <Swords className="w-3 h-3" />
                            {t.modules.hazePieceSwordsAndFightingStyles.movesLabel}
                          </p>
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {entry.moves.map((m: string, mi: number) => (
                              <li key={mi} className="flex items-start gap-1">
                                <Check className="mt-0.5 w-3 h-3 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground/80">
                            {t.modules.hazePieceSwordsAndFightingStyles.howToGetLabel}: </span>
                          {entry.howToGet}
                        </p>
                        {entry.v2Route && (
                          <p className="mb-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground/80">
                              {t.modules.hazePieceSwordsAndFightingStyles.v2RouteLabel}: </span>
                            {entry.v2Route}
                          </p>
                        )}
                        <p className="mt-auto pt-2 border-t border-border text-xs text-[hsl(var(--nav-theme-light))]">
                          <span className="font-semibold">
                            {t.modules.hazePieceSwordsAndFightingStyles.bestForLabel}: </span>
                          {entry.bestFor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== Module 8: Haze Piece Boss Drops and Map ============================== */}
      <section
        id="boss-drops-and-map"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3
                            bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Map className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.modules.hazePieceBossDropsAndMap.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.hazePieceBossDropsAndMap.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              {t.modules.hazePieceBossDropsAndMap.subtitle}
            </p>
            <p className="mx-auto max-w-3xl text-sm md:text-base text-muted-foreground">
              {t.modules.hazePieceBossDropsAndMap.intro}
            </p>
          </div>

          {/* Sea Groups */}
          <div className="space-y-8 md:space-y-10">
            {t.modules.hazePieceBossDropsAndMap.groups.map((group: any, gi: number) => {
              const SeaIcon = SEA_GROUP_ICON[gi] || Ship;
              return (
                <div key={gi} className="scroll-reveal">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
                                    bg-[hsl(var(--nav-theme)/0.1)]">
                      <SeaIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg md:text-xl font-bold">{group.heading}</h3>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          SEA_GROUP_BADGE_CLASS[group.sea] || ""
                        }`}>
                          {group.sea}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{group.summary}</p>
                    </div>
                  </div>

                  {/* Boss rows */}
                  <div className="space-y-2 md:space-y-3">
                    {group.bosses.map((boss: any, bi: number) => (
                      <div
                        key={bi}
                        className="rounded-lg border border-border bg-white/5 p-3 md:p-4
                                   hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                      >
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-4">
                          <div className="md:col-span-3">
                            <p className="text-xs font-semibold text-foreground/70">
                              {t.modules.hazePieceBossDropsAndMap.islandLabel}
                            </p>
                            <p className="text-sm font-bold">{boss.island}</p>
                            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[hsl(var(--nav-theme-light))]">
                              <Skull className="w-3.5 h-3.5" />
                              {boss.boss}
                            </p>
                          </div>
                          <div className="md:col-span-3">
                            <p className="text-xs font-semibold text-foreground/70">
                              {t.modules.hazePieceBossDropsAndMap.spawnLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">{boss.spawn}</p>
                          </div>
                          <div className="md:col-span-4">
                            <p className="text-xs font-semibold text-foreground/70">
                              {t.modules.hazePieceBossDropsAndMap.dropsLabel}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {boss.drops.map((drop: string, di: number) => (
                                <span
                                  key={di}
                                  className="inline-flex items-center rounded-md border border-border bg-white/5 px-1.5 py-0.5 text-xs text-muted-foreground"
                                >
                                  {drop}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-foreground/70">
                              {t.modules.hazePieceBossDropsAndMap.progressionLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">{boss.note}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== FAQ（FAQSection 自管理状态，问答均含 Haze Piece）============================== */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* ============================== CTA ============================== */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner before footer */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* ============================== Footer ============================== */}
      <footer className="border-t border-border bg-white/[0.02]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.com/invite/hazeseas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/RealHazeStudios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/games/6918802270/Haze-Seas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.robloxGame}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@RealHazeStudios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.youtube}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href={locale === "en" ? "/about" : `/${locale}/about`}
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href={locale === "en" ? "/privacy-policy" : `/${locale}/privacy-policy`}
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href={locale === "en" ? "/terms-of-service" : `/${locale}/terms-of-service`}
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href={locale === "en" ? "/copyright" : `/${locale}/copyright`}
                    className="text-muted-foreground transition hover:text-[hsl(var(--nav-theme-light))]"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
