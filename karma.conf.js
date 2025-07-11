module.exports = function (config) {
  config.set({
    browsers: ['ChromeHeadless'],
    singleRun: true,
    frameworks: ['jasmine'],
    files: [
      { pattern: './src/test.ts', watched: false }
    ],
    preprocessors: {
      './src/test.ts': ['webpack']
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false
  });
};
