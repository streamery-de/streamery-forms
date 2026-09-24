import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    postcssPresetEnv({
      stage: 3,
      features: {
        'custom-properties': false
      },
    })
  ]
};
