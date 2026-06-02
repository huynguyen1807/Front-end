module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            app: './src/app',
            assets: './src/assets',
            components: './src/components',
            config: './src/config',
            features: './src/features',
            hooks: './src/hooks',
            services: './src/services',
            theme: './src/theme',
            types: './src/types',
            utils: './src/utils'
          }
        }
      ],
      'react-native-worklets/plugin'
    ]
  };
};
