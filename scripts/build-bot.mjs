import {build} from 'esbuild';
await build({entryPoints:['public/bot3d.js'],outfile:'public/bot3d.bundle.js',bundle:true,minify:true,format:'esm',target:'chrome140',legalComments:'eof'});
