// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Mizzle',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/lukewarlow/mizzle' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Introduction', slug: 'guides/introduction' },
						{ label: 'Getting Started', slug: 'guides/getting-started' },
						{ label: 'Single-Table Design', slug: 'guides/single-table-design' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'reference' },
				},
/*
				{
					label: 'CLI Reference',
					slug: 'cli-reference',
				},
*/
			],
		}),
	],
});
