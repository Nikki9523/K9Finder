//https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build-typescript.html

require('esbuild').build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target:'node22',
  outfile: 'dist/index.js',
}).catch(() => process.exit(1));