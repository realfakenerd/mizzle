// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Mizzle',
      description: 'a drizzle-like DynamoDB ORM',
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
