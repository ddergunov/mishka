'use strict';

var gulp          = require('gulp'); // Подключаем Gulp
var browserSync   = require('browser-sync').create(); // Подключаем browser-sync
var sass          = require('gulp-sass'); // Подключаем Sass пакет
var autoprefixer  = require('gulp-autoprefixer');
var fs            = require('fs');
var pug           = require('gulp-pug');
var notify        = require('gulp-notify');
var rigger        = require('gulp-rigger'); //работа с инклюдами в html и js;
var cleanCSS      = require('gulp-clean-css');
var sourcemaps    = require('gulp-sourcemaps');
var gcmq          = require('gulp-group-css-media-queries');


var path = {
  build: { //Тут мы укажем куда складывать готовые после сборки файлы
    html: './build/',
    css: './build/css/',
    img:'./build/img/',
    js: './build/js/',
    font: './build/fonts/',
    pug: './build/'
  },
  src: { //Пути откуда брать исходники
    html: './src/html/pages/*.html', //Синтаксис [^_]*.html говорит gulp что мы хотим взять все файлы с расширением .html, кроме начинающихся с _
    css: './src/sass/*.*',
    img:'./src/img/*.*',
    js: './src/js/*.*',
    font: './src/fonts/*.*',
    pug: './src/pug/pages/*.pug',
    normalize: './node_modules/normalize.css/normalize.css'
  },
  watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
    html: './src/html/**/*.html',
    css: ['./src/sass/**/*.sass', 'src/sass/**/*.scss'],
    js: './src/js/*.*',
    pug: './src/pug/**/*.pug',
    img:'./src/img/*.*'
  },
  clean: './build', //директории которые могут очищаться
  outputDir: './build' //исходная корневая директория для запуска минисервера
};


// Static Server
gulp.task('webserver', function () {
  browserSync.init({
    server: [path.outputDir]
  });
});

gulp.task('watch', function () {
  gulp.watch([path.watch.html], ['rigger:build']); //билдим html в случае изменения
  gulp.watch([path.watch.pug], ['pug:build']); // Наблюдение за pug файлами
  gulp.watch([path.watch.css], ['css:build']); // Наблюдение за sass файлами в папке sass
  gulp.watch([path.watch.js], ['js:build']); // Наблюдение за js файлами
  gulp.watch([path.watch.img], ['img:copy']);
  gulp.watch("build/*.html").on('change', browserSync.reload);
});

gulp.task('img:copy', function () {

  return gulp.src(path.src.img)
  .pipe(gulp.dest(path.build.img)); //выгрузим их в папку build

});


// Compile pug into HTML & auto-inject into browsers
gulp.task('pug:build', function () {
  return gulp.src(path.src.pug)
    .pipe(pug({
      locals: {
        nav: JSON.parse(fs.readFileSync('./src/pug/data/navigation.json', 'utf8')),
        content: JSON.parse(fs.readFileSync('./src/pug/data/content.json', 'utf8')),
      },
      pretty: true
    }))
    .on('error', notify.onError(function (error) {
      return {
        title: 'Pug',
        message: error.message
      };
    }))
    .pipe(gulp.dest(path.build.html)) //выгрузим их в папку build
    .pipe(browserSync.reload({
      stream: true
    }));
});

// таск для билдинга html через rigger
gulp.task('rigger:build', function () {
  return gulp.src(path.src.html) //Выберем файлы по нужному пути
    .pipe(rigger()) //Прогоним через rigger
    .on('error', notify.onError(function (error) {
      return {
        title: 'Rigger',
        message: error.message
      };
    }))
    // .pipe(plumber.stop())
    .pipe(gulp.dest(path.build.html)) //выгрузим их в папку build
    .pipe(browserSync.reload({
      stream: true
    })); //И перезагрузим наш сервер для обновлений
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('css:build', function () {
  return gulp.src(path.src.css) // Берем источник
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError)) // Преобразуем Sass в CSS посредством gulp-sass

    .pipe(gcmq())

    .pipe(autoprefixer({
        browsers: ['> 0.1%'],
        cascade: false
    }))

    .pipe(cleanCSS({
        level: 2
    }))

    .pipe(sourcemaps.write('../maps'))

    .pipe(gulp.dest(path.build.css)) // Выгружаем результат в папку css

    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('js:build', function () {

  return gulp.src(path.src.js)
  .pipe(gulp.dest(path.build.js)) //выгрузим их в папку build
  .pipe(browserSync.reload({
    stream: true
  }));

});

gulp.task('build', [
  'js:build',
  'rigger:build', //или pug, или rigger, раскомментировать
  // 'pug:build',
  'css:build',
  'img:copy'
]);

gulp.task('default', ['build', 'watch', 'webserver']);

