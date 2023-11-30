import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Dive to Argo",
  tagline: "Welcome to Dive to Argo!!",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://beaverhouse.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/dive-argo",

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
          items: [],
        },
        {
          title: "More about HU-Lee",
          items: [
            {
              label: "Blog",
              to: "https://blog.haulrest.me/",
            },
            {
              label: "Profile",
              to: "https://profile.haulrest.me/",
            },
            {
              label: "GitHub",
              href: "https://github.com/HU-Lee",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HU-Lee.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
