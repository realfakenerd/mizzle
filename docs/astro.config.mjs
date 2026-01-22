// @ts-check
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import starlightPageActions from 'starlight-page-actions';
import starlightLlmsTxt from 'starlight-llms-txt';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
    site: 'https://mizzle-docs.vercel.app',
    vite: {
        // @ts-expect-error i don't know why is getting this error
        plugins: [tailwindcss()],
    },
    integrations: [
        mermaid({
            theme: 'forest',
            autoTheme: true
        }),
        starlight({
            head: [
                {
                    tag: 'style',
                    content: `
                    @view-transition {
                          navigation: auto;
                    }
                    `
                }
            ],
            plugins: [
                starlightLinksValidator(),
                starlightPageActions(),
                starlightLlmsTxt(),
            ],
            title: 'mizzle',
            components: {
                Hero: './src/components/Hero.astro'
            },
            description: 'a drizzle-like DynamoDB ORM',
            customCss: ['./src/styles/global.css', '@fontsource-variable/comfortaa/index.css'],
            favicon: 'favicon.svg',
            logo: {
                src: './src/assets/logo_with_name.svg',
                replacesTitle: true
            },
            editLink: {
                baseUrl: 'https://github.com/realfakenerd/mizzle/edit/main/docs'
            },
            social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/realfakenerd/mizzle' }],
            sidebar: [
                {
                    label: 'Introduction',
                    items: [
                        { label: 'Overview', slug: 'introduction/overview' },
                        { label: 'Getting Started', slug: 'introduction/getting-started' },
                        { label: 'Architecture', slug: 'introduction/architecture' },
                        { label: 'Single-Table Design', slug: 'introduction/single-table-design' },
                    ]
                },
                // {
                //     label: 'Guides',
                //     items: [
                //         { label: 'Introduction', slug: 'guides/introduction' },
                //         { label: 'Architecture', slug: 'guides/architecture' },
                //     ],
                // },
                {
                    label: 'Internals',
                    items: [
                        { label: 'Expression Builder', slug: 'internals/expression-builder' },
                        { label: 'Relational Proxy', slug: 'internals/relational-proxy' },
                    ],
                },
                {
                    label: 'API Reference',
                    autogenerate: { directory: 'reference' },
                },
                {
                    label: 'CLI Reference',
                    slug: 'cli-reference',
                },
            ],
        }),
    ],
});
