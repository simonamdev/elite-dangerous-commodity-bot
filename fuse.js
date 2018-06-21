const { FuseBox, HTMLPlugin, WebIndexPlugin } = require('fuse-box/es6');

const fuse = FuseBox.init({
    homeDir: 'src',
    output: 'dist/$name.js'
});

// fuse.dev({ port: 4445, httpServer: false });

fuse.bundle('twitch/bundle')
    .watch('twitch/**') // watch only server related code.. bugs up atm
    .instructions(' > [twitch/index.ts]')

fuse.run();
