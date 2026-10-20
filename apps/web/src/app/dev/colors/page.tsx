"use client";

type TokenItem = {
  name: string;
  lightHex: string;
  darkHex: string;
  usage: string;
  swatchClass: string;
};

type TokenSection = {
  title: string;
  tokens: TokenItem[];
};

const TOKEN_SECTIONS: TokenSection[] = [
  {
    title: "1.1 Fon (Background)",
    tokens: [
      { name: "--ig-primary-background", lightHex: "FFFFFF", darkHex: "0C1014", usage: "Основной фон страницы", swatchClass: "bg-[rgb(var(--ig-primary-background))]" },
      { name: "--ig-secondary-background", lightHex: "F3F5F7", darkHex: "25292E", usage: "Вторичный фон, страница логина", swatchClass: "bg-[rgb(var(--ig-secondary-background))]" },
      { name: "--ig-highlight-background", lightHex: "F3F5F7", darkHex: "25292E", usage: "Hover строк (сайдбар, списки)", swatchClass: "bg-[rgb(var(--ig-highlight-background))]" },
      { name: "--ig-elevated-background", lightHex: "FFFFFF", darkHex: "212328", usage: "Модалки, поповеры", swatchClass: "bg-[rgb(var(--ig-elevated-background))]" },
      { name: "--ig-elevated-highlight-background", lightHex: "EFEFEF", darkHex: "363636", usage: "Hover внутри модалки", swatchClass: "bg-[rgb(var(--ig-elevated-highlight-background))]" },
      { name: "--ig-banner-background", lightHex: "FFFFFF", darkHex: "262626", usage: "Баннеры", swatchClass: "bg-[rgb(var(--ig-banner-background))]" },
      { name: "--ig-dropdown-background", lightHex: "F3F5F7", darkHex: "25292E", usage: "Выпадающие списки", swatchClass: "bg-[rgb(var(--ig-dropdown-background))]" },
      { name: "--ig-menu-background-color", lightHex: "F8F9F9", darkHex: "262B31", usage: "Меню More", swatchClass: "bg-[rgb(var(--ig-menu-background-color))]" },
      { name: "--ig-hover-overlay", lightHex: "12,16,20 @ 5%", darkHex: "255,255,255 @ 10%", usage: "Слой наведения поверх элемента", swatchClass: "bg-[var(--ig-hover-overlay)]" },
      { name: "--ig-temporary-highlight", lightHex: "F5FBFF", darkHex: "0095F6", usage: "Временная подсветка (новый комментарий)", swatchClass: "bg-[rgb(var(--ig-temporary-highlight))]" },
    ],
  },
  {
    title: "1.2 Matn va ikonka (Text & Icons)",
    tokens: [
      { name: "--ig-primary-text", lightHex: "0C1014", darkHex: "F8F9F9", usage: "Основной текст, username", swatchClass: "bg-[rgb(var(--ig-primary-text))]" },
      { name: "--ig-secondary-text", lightHex: "6A717A", darkHex: "A2AAB4", usage: "Время, View all comments", swatchClass: "bg-[rgb(var(--ig-secondary-text))]" },
      { name: "--ig-tertiary-text", lightHex: "C7C7C7", darkHex: "737373", usage: "Приглушенный текст", swatchClass: "bg-[rgb(var(--ig-tertiary-text))]" },
      { name: "--ig-primary-icon", lightHex: "0C1014", darkHex: "F8F9F9", usage: "Основные иконки", swatchClass: "bg-[rgb(var(--ig-primary-icon))]" },
      { name: "--ig-secondary-icon", lightHex: "8E8E8E", darkHex: "8E8E8E", usage: "Вторичные иконки", swatchClass: "bg-[rgb(var(--ig-secondary-icon))]" },
      { name: "--ig-tertiary-icon", lightHex: "C7C7C7", darkHex: "737373", usage: "Неактивные иконки", swatchClass: "bg-[rgb(var(--ig-tertiary-icon))]" },
      { name: "--ig-link", lightHex: "00376B", darkHex: "E0F1FF", usage: "Ссылки в био, #hashtag, @mention", swatchClass: "bg-[rgb(var(--ig-link))]" },
      { name: "--ig-colors-link-text", lightHex: "4150F7", darkHex: "708DFF", usage: "Ссылки действий (Sign up)", swatchClass: "bg-[rgb(var(--ig-colors-link-text))]" },
      { name: "--ig-text-on-color", lightHex: "FFFFFF", darkHex: "FFFFFF", usage: "Текст на цветной кнопке", swatchClass: "bg-[rgb(var(--ig-text-on-color))]" },
      { name: "--ig-text-on-media", lightHex: "FFFFFF", darkHex: "FFFFFF", usage: "Текст поверх фото/видео (Reels, Stories)", swatchClass: "bg-[rgb(var(--ig-text-on-media))]" },
    ],
  },
  {
    title: "1.3 Xatho va border (Borders & Separators)",
    tokens: [
      { name: "--ig-separator", lightHex: "DBDFE4", darkHex: "2B3036", usage: "Разделительная линия", swatchClass: "bg-[rgb(var(--ig-separator))]" },
      { name: "--ig-elevated-separator", lightHex: "DBDFE4", darkHex: "2B3036", usage: "Линия в модалке", swatchClass: "bg-[rgb(var(--ig-elevated-separator))]" },
      { name: "--ig-stroke", lightHex: "DBDBDB", darkHex: "363636", usage: "Рамка карточек, просмотренная Story", swatchClass: "bg-[rgb(var(--ig-stroke))]" },
      { name: "--ig-focus-stroke", lightHex: "A8A8A8", darkHex: "555555", usage: "Рамка фокуса", swatchClass: "bg-[rgb(var(--ig-focus-stroke))]" },
      { name: "--ig-tablist-border", lightHex: "DBDFE4", darkHex: "2B3036", usage: "Линия вкладок профиля", swatchClass: "bg-[rgb(var(--ig-tablist-border))]" },
      { name: "--ig-tab-underline-active", lightHex: "0C1014", darkHex: "F8F9F9", usage: "Активная вкладка", swatchClass: "bg-[rgb(var(--ig-tab-underline-active))]" },
      { name: "--ig-stroke-on-media", lightHex: "FFFFFF", darkHex: "FFFFFF", usage: "Рамка поверх медиа", swatchClass: "bg-[rgb(var(--ig-stroke-on-media))]" },
    ],
  },
  {
    title: "1.4 Tugmaho (Buttons)",
    tokens: [
      { name: "--ig-primary-button", lightHex: "4A5DF9", darkHex: "4A5DF9", usage: "Log in, Follow, Share, Send", swatchClass: "bg-[rgb(var(--ig-primary-button))]" },
      { name: "--ig-primary-button-hover", lightHex: "4150F7", darkHex: "4150F7", usage: "Primary hover", swatchClass: "bg-[rgb(var(--ig-primary-button-hover))]" },
      { name: "--ig-colors-button-primary-background--pressed", lightHex: "4150F7", darkHex: "4150F7", usage: "Primary pressed", swatchClass: "bg-[rgb(var(--ig-colors-button-primary-background--pressed))]" },
      { name: "--ig-colors-button-primary-background--disabled", lightHex: "B8CDFF", darkHex: "18208B", usage: "Primary disabled", swatchClass: "bg-[rgb(var(--ig-colors-button-primary-background--disabled))]" },
      { name: "--ig-colors-button-primary-text", lightHex: "FFFFFF", darkHex: "FFFFFF", usage: "Текст на primary кнопке", swatchClass: "bg-[rgb(var(--ig-colors-button-primary-text))]" },
      { name: "--ig-colors-button-secondary-background", lightHex: "F0F2F5", darkHex: "25292E", usage: "Following, Edit profile, Message", swatchClass: "bg-[rgb(var(--ig-colors-button-secondary-background))]" },
      { name: "--ig-colors-button-secondary-background--hover", lightHex: "E7EAEE", darkHex: "363C44", usage: "Secondary hover", swatchClass: "bg-[rgb(var(--ig-colors-button-secondary-background--hover))]" },
      { name: "--ig-colors-button-secondary-background--disabled", lightHex: "DCE0E5", darkHex: "2B3036", usage: "Secondary disabled", swatchClass: "bg-[rgb(var(--ig-colors-button-secondary-background--disabled))]" },
      { name: "--ig-colors-button-secondary-text", lightHex: "0C1014", darkHex: "FFFFFF", usage: "Secondary text", swatchClass: "bg-[rgb(var(--ig-colors-button-secondary-text))]" },
      { name: "--ig-colors-button-secondary-text--disabled", lightHex: "5E646D", darkHex: "A2AAB4", usage: "Secondary disabled text", swatchClass: "bg-[rgb(var(--ig-colors-button-secondary-text--disabled))]" },
      { name: "--ig-colors-button-borderless-text", lightHex: "4150F7", darkHex: "708DFF", usage: "Follow в шапке поста, Post в комментарии", swatchClass: "bg-[rgb(var(--ig-colors-button-borderless-text))]" },
      { name: "--ig-colors-button-borderless-text--hover", lightHex: "2536D0", darkHex: "85A1FF", usage: "Borderless hover", swatchClass: "bg-[rgb(var(--ig-colors-button-borderless-text--hover))]" },
      { name: "--ig-colors-button-borderless-text--pressed", lightHex: "1F28AD", darkHex: "A3BCFF", usage: "Borderless pressed", swatchClass: "bg-[rgb(var(--ig-colors-button-borderless-text--pressed))]" },
      { name: "--ig-colors-button-borderless-text--disabled", lightHex: "B8CDFF", darkHex: "18208B", usage: "Borderless disabled", swatchClass: "bg-[rgb(var(--ig-colors-button-borderless-text--disabled))]" },
      { name: "--ig-colors-button-primary-link-text", lightHex: "3143E3", darkHex: "85A1FF", usage: "Основная кнопка-ссылка", swatchClass: "bg-[rgb(var(--ig-colors-button-primary-link-text))]" },
      { name: "--ig-tertiary-button-background", lightHex: "FFFFFF", darkHex: "FFFFFF", usage: "Третичная кнопка фон", swatchClass: "bg-[rgb(var(--ig-tertiary-button-background))]" },
      { name: "--ig-tertiary-button-border", lightHex: "DBDBDB", darkHex: "DBDBDB", usage: "Третичная кнопка рамка", swatchClass: "bg-[rgb(var(--ig-tertiary-button-border))]" },
      { name: "--ig-tertiary-button-hover", lightHex: "F5F5F5", darkHex: "F5F5F5", usage: "Третичная кнопка hover", swatchClass: "bg-[rgb(var(--ig-tertiary-button-hover))]" },
      { name: "--ig-tertiary-button-text", lightHex: "262626", darkHex: "262626", usage: "Третичная кнопка текст", swatchClass: "bg-[rgb(var(--ig-tertiary-button-text))]" },
    ],
  },
  {
    title: "1.5 Input (Forms)",
    tokens: [
      { name: "--ig-input-border-primary", lightHex: "212328", darkHex: "F8F9F9", usage: "Рамка инпута в фокусе", swatchClass: "bg-[rgb(var(--ig-input-border-primary))]" },
      { name: "--ig-input-border-secondary", lightHex: "DBDFE4", darkHex: "5E646D", usage: "Обычная рамка инпута", swatchClass: "bg-[rgb(var(--ig-input-border-secondary))]" },
      { name: "--ig-input-disabled-background-color", lightHex: "F3F5F7", darkHex: "25292E", usage: "Фон disabled инпута", swatchClass: "bg-[rgb(var(--ig-input-disabled-background-color))]" },
      { name: "--ig-input-text-and-icon-primary", lightHex: "0C1014", darkHex: "F8F9F9", usage: "Текст и иконка инпута", swatchClass: "bg-[rgb(var(--ig-input-text-and-icon-primary))]" },
      { name: "--ig-input-text-and-icon-secondary", lightHex: "6A717A", darkHex: "A2AAB4", usage: "Placeholder инпута", swatchClass: "bg-[rgb(var(--ig-input-text-and-icon-secondary))]" },
    ],
  },
  {
    title: "1.6–1.8 Holat, Direct va Toggle (Badges, Direct & Switch)",
    tokens: [
      { name: "--ig-badge", lightHex: "FF3040", darkHex: "FF3040", usage: "Точка уведомлений, красное сердце лайка", swatchClass: "bg-[rgb(var(--ig-badge))]" },
      { name: "--ig-error-or-destructive", lightHex: "ED4956", darkHex: "ED4956", usage: "Ошибка формы, Delete, Unfollow", swatchClass: "bg-[rgb(var(--ig-error-or-destructive))]" },
      { name: "--ig-success", lightHex: "58C322", darkHex: "58C322", usage: "Свободный username", swatchClass: "bg-[rgb(var(--ig-success))]" },
      { name: "--ig-live-badge", lightHex: "FF0169", darkHex: "FF0169", usage: "Значок LIVE", swatchClass: "bg-[rgb(var(--ig-live-badge))]" },
      { name: "--ig-close-friends-refreshed", lightHex: "1CD14F", darkHex: "1CD14F", usage: "Кольцо Close friends", swatchClass: "bg-[rgb(var(--ig-close-friends-refreshed))]" },
      { name: "--ig-subscribers-only", lightHex: "7638FA", darkHex: "7638FA", usage: "Контент подписчиков", swatchClass: "bg-[rgb(var(--ig-subscribers-only))]" },
      { name: "--ig-outgoing-message-bubble", lightHex: "4A5DF9", darkHex: "4A5DF9", usage: "Исходящее сообщение в Direct", swatchClass: "bg-[rgb(var(--ig-outgoing-message-bubble))]" },
      { name: "--ig-incoming-message-bubble", lightHex: "F3F5F7", darkHex: "25292E", usage: "Входящее сообщение в Direct", swatchClass: "bg-[rgb(var(--ig-incoming-message-bubble))]" },
      { name: "--ig-toggle-background-on-prism", lightHex: "0C1014", darkHex: "F8F9F9", usage: "Switch включен", swatchClass: "bg-[rgb(var(--ig-toggle-background-on-prism))]" },
      { name: "--ig-toggle-background-off-prism", lightHex: "6A717A", darkHex: "A2AAB4", usage: "Switch выключен", swatchClass: "bg-[rgb(var(--ig-toggle-background-off-prism))]" },
      { name: "--ig-toggle-background-disabled-on-prism", lightHex: "838993", darkHex: "838993", usage: "Switch disabled", swatchClass: "bg-[rgb(var(--ig-toggle-background-disabled-on-prism))]" },
    ],
  },
];

function ThemeColumn({ mode }: { mode: "light" | "dark" }) {
  const isDark = mode === "dark";

  return (
    <div
      className={
        isDark
          ? "dark __ig-dark-mode rounded-xl border border-ig-separator bg-ig-bg p-6 text-ig-text"
          : "light __ig-light-mode rounded-xl border border-ig-separator bg-ig-bg p-6 text-ig-text"
      }
    >
      <div className="mb-6 flex items-center justify-between border-b border-ig-separator pb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isDark ? "Dark Mode (.dark)" : "Light Mode (:root)"}
          </h2>
          <p className="text-xs text-ig-text-secondary">
            Все цвета рендерятся напрямую через CSS-переменные <code>var(--ig-*)</code>
          </p>
        </div>
        <span className="rounded-lg bg-ig-primary px-3 py-1.5 text-xs font-semibold text-ig-text-on-color">
          Primary Button
        </span>
      </div>

      {/* Градиент Instagram (1.10) */}
      <div className="mb-6 rounded-lg border border-ig-separator p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <code className="font-mono font-semibold">--ig-brand-gradient</code>
          <span className="text-ig-text-secondary">Story ring / Brand</span>
        </div>
        <div
          className="h-6 w-full rounded-md"
          style={{ background: "var(--ig-brand-gradient)" }}
        />
      </div>

      <div className="space-y-6">
        {TOKEN_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-sm font-semibold text-ig-text-secondary">
              {section.title}
            </h3>
            <div className="divide-y divide-ig-separator rounded-lg border border-ig-separator">
              {section.tokens.map((token) => (
                <div
                  key={token.name}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`h-7 w-7 shrink-0 rounded-md border border-ig-stroke ${token.swatchClass}`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-mono font-medium">
                        {token.name}
                      </div>
                      <div className="truncate text-ig-text-secondary">
                        {token.usage}
                      </div>
                    </div>
                  </div>
                  <code className="shrink-0 rounded bg-ig-bg-secondary px-2 py-0.5 font-mono text-[11px] text-ig-text-secondary">
                    {isDark ? token.darkHex : token.lightHex}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DevColorsPage() {
  return (
    <main className="min-h-screen bg-ig-bg px-6 py-8 text-ig-text">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-1 border-b border-ig-separator pb-4">
          <div className="flex items-center gap-3">
            <span className="font-logo text-3xl">Instagram</span>
            <span className="rounded-md bg-ig-bg-secondary px-2.5 py-1 text-xs font-semibold text-ig-text-secondary">
              FE-02 · Spec 10 §1 Design Tokens
            </span>
          </div>
          <p className="text-xs text-ig-text-secondary">
            Сравнение оригинальных токенов Instagram в Light и Dark режимах бок о бок (Spec 10 AC2, AC3, AC9)
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ThemeColumn mode="light" />
          <ThemeColumn mode="dark" />
        </div>
      </div>
    </main>
  );
}