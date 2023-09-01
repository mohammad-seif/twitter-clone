const { default: Analytics } = require('analytics')
const { default: googleAnalytics } = require('@analytics/google-analytics')

const analytics = Analytics({
  app: 'Twitter Clone',
  plugins: [
    googleAnalytics({
      measurementIds: ['G-XB81LGGXRS']
    })
  ]
})

analytics.ready(() => {
  console.log("Google Analytics started")
})

analytics.page()

module.exports = analytics
