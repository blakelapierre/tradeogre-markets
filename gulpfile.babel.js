const {dependencies} = require('./package.json'),
      gulp = require('gulp'),
      multipipe = require('multipipe'),
      fs = require('fs'),
      path = require('path'),
      browserify = require('browserify'),
      babelify = require('babelify'),
      tsify = require('tsify'),
      browserSync = require('browser-sync'),
      reload = browserSync.reload,
      source = require('vinyl-source-stream'),
      through = require('through2'),
      _ = require('lodash'),
      {
        autoprefixer,
        cached,
        changed,
        clean,
        concat,
        imagemin,
        less,
        lessReporter,
        minifyCss,
        minifyHtml,
        pipe,
        print,
        remember,
        revAll,
        sequence,
        sourcemaps,
        spritesmith,
        tasks,
        tslint,
        uglify,
        util
      } = require('gulp-load-plugins')({pattern: ['gulp_*', 'gulp.*', 'gulp-*']});

const result = tasks(gulp, require);
if (typeof result === 'string') console.log(result);

let p = name => print(file => console.log(name, file));

gulp.task('default', ['build']);

gulp.task('build', sequence(['clean:rev', 'clean:dist'],
                            ['js:vendor', 'js:app', 'html', 'images', 'styles', 'fonts'],
                            ['minify:css', 'minify:html', 'minify:js', 'minify:images'],
                            'rev'));

gulp.task('dev', cb => {
  const {src} = paths;

  sequence('clean:dev',
          ['js:vendor', 'js:app', 'html', 'images', 'styles', 'fonts'],
          'browser-sync')(cb);

  gulp.watch(src.vendor,    ['js:vendor']);
  gulp.watch(src.scripts,   ['js:app']);
  gulp.watch(src.templates, ['js:app']);
  gulp.watch(src.html,      ['html']);
  gulp.watch(src.images,    ['images']);
  gulp.watch(src.less,      ['styles'])
      .on('change', event => {
        if (event.type === 'deleted') {
          delete cached.caches['styles'][event.path];
          remember.forget('styles', event.path);
        }
      });
});

gulp.task('browser-sync',
  () => browserSync({
    server: paths.dev.$,
    ghostMode: false
  }));

gulp.task('js:vendor',
  () => pipe([
    browserify()
      .require(_.keys(dependencies))
      .bundle()
    ,source('vendor.js')
    ,p('js:vendor')
    ,gulp.dest(paths.dev.$)
    ,reload({stream: true})
  ]));

gulp.task('js:app', ['js:lint'],
  () => pipe([
    browserify({
      entries: [paths.src.app],
      debug: true
    })
      .plugin(tsify, { noImplicityAny: true })
      .transform(babelify)
      .external(_.keys(dependencies))
      .bundle()
      .on('error', function(err) { // Cannot use => syntax here, as `this` must be set by the caller
        console.log('js:app error', err, err.stack);
        this.emit('end');
      })
    ,source('app.js')
    ,gulp.dest(paths.dev.$)
    ,reload({stream: true})
  ]));

gulp.task('js:lint',
  () => pipe([
    gulp.src(paths.src.scripts)
    ,cached('js:lint')
    ,p('js:lint')
    ,tslint({formatter: 'verbose'})
    ,tslint.report()
  ]));

gulp.task('styles', ['less:concat']);

gulp.task('less:concat', ['less:debug'],
  () => pipe([
    gulp.src(['./.dev/tmp.css', './.dev/sprites.css'])
    ,p('less:concat:pre')
    ,concat('app.css')
    ,p('less:concat:post')
    ,gulp.dest(paths.dev.$)
    ,reload({stream: true})
  ]));

gulp.task('less:debug', ['sprites'],
  () => multipipe( // my gulp-pipe fails here because of the less().on [doesn't forward errors]
    gulp.src(paths.src.less)
    ,cached('less')
    ,p('less:debug')
    ,sourcemaps.init()
    ,less()
      .on('error', lessReporter)
    ,autoprefixer()
    ,sourcemaps.write()
    ,remember('less')
    ,concat('tmp.css')
    ,gulp.dest(paths.dev.$)
  ));

gulp.task('sprites',
  () => pipe([
    gulp.src(paths.src.images)
    ,p('sprites:pre')
    ,spritesmith({
      imgName: './sprites.png',
      cssName: './sprites.css',
      cssTemplate:
        ({sprites, spritesheet}) => {
          return _.map(sprites, sprite => {
            const {name, offset_x, offset_y, width, height} = sprite,
                  position = {x: 100 * offset_x / width, y: 100 * offset_y / height},
                  size = {x: 100 * spritesheet.width / width, y: 100 * spritesheet.height / height};
            return `.sprite-${name} { background-image: url('${spritesheet.image}'); background-position: ${position.x}% ${position.y}% ; background-size: ${size.x}% ${size.y}%; width: 100%; height: 100%; }`;
          }).join('\n');
        },
      cssOpts: {cssSelector: ({name}) => `.sprite-${name}`}
    })
    ,p('sprites:post')
    ,gulp.dest(paths.dev.$)
  ]));

gulp.task('html',
  () => pipe([
    gulp.src(paths.src.html)
    ,p('html')
    ,gulp.dest(paths.dev.$)
    ,reload({stream: true})
  ]));

gulp.task('images',
  () => pipe([
    gulp.src(paths.src.images)
    ,changed(paths.dev.$)
    ,p('images')
    ,gulp.dest(paths.dev.$)
    ,reload({stream: true})
  ]));

gulp.task('fonts');

gulp.task('rev',
  () => pipe([
    gulp.src([paths.rev.$all])
    ,p('rev:pre')
    ,(new revAll({
      dontRenameFile: ['index\.html'],
      dontSearchFile: ['vendor.js']
    })).revision()
    ,p('rev:post')
    ,gulp.dest(paths.dist.$)
  ]));

((task) => {
  _.each({
    css:    {fn: minifyCss},
    js:     {fn: uglify, src: ({dev}) => [dev.app].concat([dev.vendor])},
    html:   {fn: () => minifyHtml({quotes: true})},
    images: {fn: imagemin, src: ({dev}) => [dev.sprites]}
  }, ({dest, fn, src}, part) => {
    let name = `${task}:${part}`;
    gulp.task(name,
      () => (({dev, rev}) =>
        pipe([
          gulp.src((src || (() => ([dev[part]])))(paths))
          ,p(name)
          ,fn()
          ,gulp.dest(dest || rev.$)])
      )(paths));

  });
})('minify'); // Is there a way to get 'minify' to occur before the code...without verbosity?

((task) => _.each(['dev', 'dist', 'rev'],
  version =>
    gulp.task(`${task}:${version}`,
      () => pipe([
        gulp.src(paths[version].$, {read: false})
        ,clean()
      ]))
))('clean');

const paths = {
  src: {
    $: './src',
    app: ['./src/app.js'],
    less: ['src/**/*.less'],
    html: ['./src/index.html'],
    images: ['./src/**/*.{svg,gif,png,jpg}'],
    scripts: ['src/**/*.js'],
    templates: ['src/modules/**/template.html'],
    vendor: ['!./node_modules/*/node_modules/**']
            .concat(_.map(dependencies, (version, dependency) => { return `./node_modules/${dependency}/**/*.js`; } )),
  },
  dev: {
    $: './.dev',
    $all: './.dev/**',
    app: './.dev/app.js',
    css: './.dev/app.css',
    html: './.dev/index.html',
    images: './.dev/**/*.{svg,gif,png,jpg}',
    sprites: './.dev/sprites.png',
    vendor: './.dev/vendor.js'
  },
  rev: {
    $: './.rev',
    $all: './.rev/**'
  },
  dist: {
    $: './.dist',
    app: './.dist/app.js',
    css: './.dist/app.css',
    html: './.dist/index.html'
  }
};