module.exports = {
  reporters: [
    "default",
    ["jest-html-reporter", {
      pageTitle: "API Test Report",
      outputPath: "test-report.html"
    }]
  ]
};