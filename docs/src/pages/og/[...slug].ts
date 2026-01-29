import { getCollection } from 'astro:content'
import { OGImageRoute } from 'astro-og-canvas'

const entries = await getCollection('docs')
const pages = Object.fromEntries(entries.map(({ data, id }) => [id, { data }]))

export const { getStaticPaths, GET } = await OGImageRoute({
    pages,
    param: 'slug',
    getImageOptions: (_id, page: (typeof pages)[number]) => {
        return {
            title: page.data.title,
            description: page.data.description,
            logo: {
                path: './src/assets/logo.png',
                size: [80],
            },
            bgImage: {
                path: './src/assets/bg.png',
            },
            font: {
                title: {
                    families: ['Comfortaa Variable'],
                    weight: 'Bold',
                },
                description: {
                    families: ['Comfortaa Variable'],
                    weight: 'Normal',
                },
            },
            fonts: [
                './node_modules/@fontsource-variable/comfortaa/files/comfortaa-latin-wght-normal.woff2',
            ],
        }
    },
})
