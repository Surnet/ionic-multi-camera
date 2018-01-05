import config from './rollup.config.umd.js';

config.output.format = "es";
config.output.file = "dist/index.esm.js";

export default config;
