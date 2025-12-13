// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide';

// https://astro.build/config
export default defineConfig({
	site: 'https://lucasilverentand.github.io',
	base: '/lumo-optimized',
	integrations: [
		starlight({
			plugins: [starlightThemeRapide()],
			title: 'Lumo Optimized',
			description: 'A performance-focused Fabric modpack for Minecraft 1.21.8 with quality-of-life improvements, optimized rendering, and beautiful visuals.',
			logo: {
				src: './src/assets/icon.png',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/lucasilverentand/lumo-optimized' },
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Steam Deck', slug: 'getting-started/steam-deck' },
						{ label: 'First Launch', slug: 'getting-started/first-launch' },
					],
				},
				{
					label: 'Mods',
					items: [
						{ label: 'Overview', slug: 'mods/overview' },
						{ label: 'Performance', slug: 'mods/performance' },
						{ label: 'Visual Enhancements', slug: 'mods/visual' },
						{ label: 'Quality of Life', slug: 'mods/qol' },
						{ label: 'Utilities', slug: 'mods/utilities' },
					],
				},
				{
					label: 'Customization',
					items: [
						{ label: 'Shaders', slug: 'customization/shaders' },
						{ label: 'Resource Packs', slug: 'customization/resource-packs' },
						{ label: 'Performance Tuning', slug: 'customization/performance-tuning' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Adding Mods', slug: 'guides/adding-mods' },
						{ label: 'Troubleshooting', slug: 'guides/troubleshooting' },
						{ label: 'FAQ', slug: 'guides/faq' },
					],
				},
			],
			editLink: {
				baseUrl: 'https://github.com/lucasilverentand/lumo-optimized/edit/main/docs/',
			},
			lastUpdated: true,
		}),
	],
});
