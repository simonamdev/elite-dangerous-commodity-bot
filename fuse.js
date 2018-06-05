const {
    FuseBox,
    BabelPlugin,
    EnvPlugin
} = require("fuse-box");

const fuse = FuseBox.init({
    homeDir: 'src',
    output: 'dist/$name.js',
    useTypescriptCompiler: true,
    sourceMaps: true,
    target: 'server',
    plugins: [
        EnvPlugin({ NODE_ENV: 'development' }),
        BabelPlugin({
            limit2project: false
        })
    ]
});

fuse.bundle('server/bundle')
    .watch('server/**')
    .instructions(' > [src/edcb-twitch.js]')

fuse.run();
