import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

export const onRequest = defineRouteMiddleware((context) => {
    // Get the URL of the generated image for the current page using its ID and
    // append the `.png` file extension.
    const ogImageUrl = new URL(
        `/og/${context.locals.starlightRoute.id || 'index'}.png`,
        context.site,
    )

    const { head, siteTitle } = context.locals.starlightRoute

    // Add the `<meta/>` tags for the Open Graph images.
    head.push({
        tag: 'meta',
        attrs: { property: 'og:image', content: ogImageUrl.href },
    })
    head.push({
        tag: 'meta',
        attrs: { name: 'twitter:image', content: ogImageUrl.href },
    })
    head.push({
        tag: 'meta',
        attrs: { name: 'twitter:title', content: siteTitle },
    })
})
