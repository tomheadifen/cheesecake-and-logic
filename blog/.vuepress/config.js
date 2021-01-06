module.exports = {
  title: 'Cheesecake and Logic',
  description: 'A web development blog',
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-186730726-1'
      }
    ]
  ],
  theme: '@vuepress/theme-blog', // OR shortcut: @vuepress/blog
  themeConfig: {
    /**
     * Ref: https://vuepress-theme-blog.ulivz.com/#modifyblogpluginoptions
     */
    modifyBlogPluginOptions(blogPluginOptions) {
      return blogPluginOptions
    },
    /**
     * Ref: https://vuepress-theme-blog.ulivz.com/#nav
     */
    nav: [
      {
        text: 'Blog',
        link: '/',
      },
      {
        text: 'Tags',
        link: '/tag/',
      },
    ],
    /**
     * Ref: https://vuepress-theme-blog.ulivz.com/#footer
     */
    footer: {
      contact: [
        {
          type: 'github',
          link: 'https://github.com/tomheadifen',
        },
        {
          type: 'twitter',
          link: 'https://twitter.com/ThomasHeadifen',
        },
      ],
      copyright: [
        {
          text: 'Privacy Policy',
          link: 'https://policies.google.com/privacy?hl=en-US',
        },
        {
          text: 'MIT Licensed | Copyright © 2018-present Thomas Headifen',
          link: '',
        },
      ],
    },
  },
}
