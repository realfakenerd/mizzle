// @ts-check
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import startlightLlmsTxt from 'starlight-llms-txt'
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://mizzle-docs.vercel.app',
  integrations: [
    starlight({
      plugins: [starlightLinksValidator(), startlightLlmsTxt()],
      title: 'mizzle',
      components: {
        Hero: './src/components/Hero.astro'
      },
      description: 'a drizzle-like DynamoDB ORM',
      customCss: ['./src/styles/custom.css', './src/styles/colors.css'],
      favicon: 'favicon.svg',
      logo: {
        src: './src/assets/logo_with_name.svg'
      },
      editLink: {
        baseUrl: 'https://github.com/realfakenerd/mizzle/edit/main/docs'
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/realfakenerd/mizzle' }],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Architecture', slug: 'guides/architecture' },
            { label: 'Single-Table Design', slug: 'guides/single-table-design' },
          ],
        },
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
