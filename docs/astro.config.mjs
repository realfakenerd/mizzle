// @ts-check
import partytown from "@astrojs/partytown";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightPageActions from "starlight-page-actions";

// https://astro.build/config
export default defineConfig({
    site: "https://mizzle-docs.vercel.app",
    vite: {
        // @ts-expect-error i don't know why is getting this error
        plugins: [tailwindcss()],
    },
    integrations: [mermaid({
        autoTheme: true,
        theme: "dark",
    }), starlight({
        head: [
            {
                tag: "script",
                attrs: { type: "text/partytown" },
                content: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-R9Q9ZBZS73');
              `,
            },
            {
                tag: "script",
                attrs: {
                    src: "https://www.googletagmanager.com/gtag/js?id=G-R9Q9ZBZS73",
                    type: "text/partytown",
                    async: true,
                },
            },
            {
                tag: "style",
                content: `@view-transition { navigation: auto; }`,
            },
        ],
        plugins: [starlightLinksValidator(), starlightPageActions(), starlightLlmsTxt()],
        title: "mizzle",
        components: {
            Hero: "./src/components/Hero.astro",
        },
        description: "a drizzle-like DynamoDB ORM",
        customCss: ["./src/styles/global.css", "@fontsource-variable/comfortaa/index.css"],
        favicon: "favicon.svg",
        logo: {
            src: "./src/assets/logo_with_name.svg",
            replacesTitle: true,
        },
        editLink: {
            baseUrl: "https://github.com/realfakenerd/mizzle/edit/main/docs",
        },
        social: [{ icon: "github", label: "GitHub", href: "https://github.com/realfakenerd/mizzle" }],
        sidebar: [
            {
                label: "Introduction",
                items: [
                    { label: "Overview", slug: "introduction/overview" },
                    { label: "Getting Started", slug: "introduction/getting-started" },
                    { label: "Architecture", slug: "introduction/architecture" },
                    { label: "Single-Table Design", slug: "introduction/single-table-design" },
                ],
            },
            // {
            //     label: 'Guides',
            //     items: [
            //         { label: 'Introduction', slug: 'guides/introduction' },
            //         { label: 'Architecture', slug: 'guides/architecture' },
            //     ],
            // },
            {
                label: "Internals",
                items: [
                    { label: "Expression Builder", slug: "internals/expression-builder" },
                    { label: "Relational Proxy", slug: "internals/relational-proxy" },
                ],
            },
            {
                label: "API Reference",
                autogenerate: { directory: "reference" },
            },
            {
                label: "CLI Reference",
                slug: "cli-reference",
            },
        ],
    }),
    svelte(),
    partytown({
        config: {
            forward: ['dataLayer.push']
        }
    })],
});
