var gulp = require('gulp');
var embedTemplates = require('gulp-angular-embed-templates');
var embedSass = require('gulp-angular2-embed-sass');

gulp.task('build', function () {
  gulp.src('src/**/*.ts') // also can use *.js files
  .pipe(embedTemplates({sourceType:'ts'}))
  .pipe(embedSass())
  .pipe(gulp.dest('./tmp'));
});

gulp.task('default', [ 'build' ]);
