import gulp from "gulp";

// технические
import changed from "gulp-changed";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import notify from "gulp-notify";
import server from "gulp-server-livereload";
import clean from "gulp-clean";
import size from "gulp-size";
import fs from "fs";

// стили
import autoprefixer from "gulp-autoprefixer";
import sourceMaps from "gulp-sourcemaps";
import sassGlob from "gulp-sass-glob";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import cssnano from "gulp-cssnano";
import gcmq from "gulp-group-css-media-queries";

// Изображения
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from "gulp-imagemin";
import webp from "gulp-webp";

// HTML
import htmlmin from "gulp-htmlmin";

// Js
import uglify from "gulp-uglify";
import babel from "gulp-babel";

const sass = gulpSass(dartSass);
const paths = {
  html: "./src/index.html",
  font: "./src/fonts/**/*",
  img: "./src/img/*.{svg,png,jpg,gif}",
  scss: "./src/scss/*.scss",
  js: "./src/js/*.js",
};

gulp.task("html", function () {
  const dest = "./build/";

  return gulp
    .src(paths.html)
    .pipe(changed(dest))
    .pipe(size({ title: "HTML" }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true, collapseWhitespace: true }))
    .pipe(plumber(plumberNotify("HTML")))
    .pipe(gulp.dest(dest));
});

gulp.task("font", function () {
  const dest = "./build/fonts/";

  return gulp
    .src(paths.font, { base: "src" })
    .pipe(changed(dest))
    .pipe(plumber(plumberNotify("FONT")))
    .pipe(gulp.dest(dest));
});

gulp.task("copyImg", function () {
  const dest = "./build/img";

  return gulp
    .src(paths.img, { encoding: false, base: "src" })
    .pipe(plumber(plumberNotify("IMAGES")))
    .pipe(changed(dest))
    .pipe(
      imagemin([
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({ plugins: [{ removeViewBox: false }] }),
        webp({ quality: 75 }),
      ])
    )
    .pipe(gulp.dest(dest));
});

gulp.task("sass", function () {
  const dest = "./build/css/";

  return gulp
    .src(paths.scss)
    .pipe(plumber(plumberNotify("Styles")))
    .pipe(changed(dest, { extension: ".css" }))
    .pipe(sassGlob())
    .pipe(sourceMaps.init())
    .pipe(sass())
    .pipe(gcmq())
    .pipe(autoprefixer())
    .pipe(cssnano())
    .pipe(sourceMaps.write())
    .pipe(rename("style.css"))
    .pipe(gulp.dest(dest));
});

gulp.task("js", function () {
  const dest = "./build/";

  return gulp
    .src(paths.js)
    .pipe(changed(dest))
    .pipe(plumber(plumberNotify("Js")))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(uglify())
    .pipe(rename("script.js"))
    .pipe(gulp.dest(dest));
});

gulp.task("startServer", function () {
  return gulp.src("./build/").pipe(
    server({
      livereload: true,
      open: true,
    })
  );
});

gulp.task("clean", function (done) {
  if (fs.existsSync("./build/")) {
    return gulp.src("./build/", { read: false }).pipe(clean());
  }

  done();
});

gulp.task("watch", function () {
  gulp.watch(paths.html, gulp.parallel("html"));
  gulp.watch(paths.font, gulp.parallel("font"));
  gulp.watch(paths.img, gulp.parallel("copyImg"));
  gulp.watch(paths.scss, gulp.parallel("sass"));
  gulp.watch(paths.js, gulp.parallel("js"));
});

gulp.task("default", gulp.series("clean", gulp.parallel("html", "sass", "copyImg", "font", "js"), gulp.parallel("watch", "startServer")));

function plumberNotify(errorTitle) {
  return {
    errorHandler: notify.onError({
      title: errorTitle,
      message: "Error <%= error.message %>",
      sound: false,
    }),
  };
}