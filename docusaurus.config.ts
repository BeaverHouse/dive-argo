import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Dive to Argo",
  tagline: "Welcome to Dive to Argo!!",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://dive-argo.haulrest.me",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "BeaverHouse", // Usually your GitHub org/user name.
  projectName: "dive-argo", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "ko",
    locales: ["en", "ko"],
  },

  plugins: [
    [
      "content-docs",
      /** @type {import('@docusaurus/plugin-content-docs').Options} */
      {
        id: "extra",
        path: "extra",
        routeBasePath: "extra",
        editUrl: "https://github.com/BeaverHouse/dive-argo/tree/main",
        editLocalizedFiles: true,
        sidebarPath: require.resolve("./sidebarsExtra.js"),
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/BeaverHouse/dive-argo/tree/main",
          editLocalizedFiles: true,
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/diveargo-social-card.jpg",
    navbar: {
      title: "Dive to Argo",
      logo: {
        alt: "My Site Logo",
        src: "img/argo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/extra/alias",
          position: "left",
          label: "Extra",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/BeaverHouse/dive-argo",
          label: "GitHub",
          position: "right",
        },
      ],
      hideOnScroll: true,
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Start Docs",
              to: "/docs/get_started",
            },
          ],
        },
        {
          title: "Other Sites",
          items: [
            {
              label: "Dive to AI",
              to: "https://dive-ai.haulrest.me/",
            },
          ],
        },
        {
          title: "More about HU-Lee",
          items: [
            {
              label: "Blog",
              to: "https://blog.haulrest.me/",
            },
            {
              label: "GitHub",
              href: "https://github.com/HU-Lee",
            },
            {
              label: "LinkedIn",
              to: "https://www.linkedin.com/in/haulrest/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HU-Lee. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
