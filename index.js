'use strict'

const gulp = require('gulp');
const rename = require('gulp-rename');
const gulpif = require('gulp-if');
const concat = require('gulp-concat');
const addsrc = require('gulp-add-src');
const mainNpmFiles = require('gulp-main-npm-files');
const order = require('gulp-order');
const angularFilesort = require('gulp-angular-filesort');
const babel = require('gulp-babel');
const series = require('stream-series');
const inject = require('gulp-inject');
const uglify = require('gulp-uglify');
const ngdocs = require('gulp-ngdocs-components');

const paths = {
    srcScripts: ['src/scripts/**/*.js'],
    srcTests: ['test/**/*.js']
}

function getOptions(options) {
    return options || {};
}

function isMinimal(options) {
    return getOptions(options).minimal === true;
}

function getDestination(options) {
    return getOptions(options).dest || 'dist';
}

function getName(options) {
    return getOptions(options).name || 'index';
}

function srcScripts() {
    return gulp.src(paths.srcScripts)
        .pipe(angularFilesort());
}

function buildScripts(options) {
    var minimal = isMinimal(options);
    var dest = getDestination(options);
    var name = geName(options);
    return srcScripts()
        .pipe(gulpif(minimal, babel({
            presets: ['env', 'minify']
        })))
        .pipe(gulpif(minimal, concat(name + '.js')))
        .pipe(gulpif(minimal, uglify()))
        .pipe(gulp.dest(dest));
}

function buildDocs(options) {
    var dest = getDestination(options);
    var options = {
        scripts: []
    };

    return srcScripts()
        .pipe(ngdocs.process(options))
        .pipe(gulp.dest(dest))
}

function srcTestsScripts() {
    return gulp.src(paths.srcTests)
        .pipe(order([
            '**/*_const_test.js',
            '**/*_value_test.js',
            '**/*_service_test.js',
            '**/*_factory_test.js',
            '**/*_provider_test.js',
            '**/*_directive_test.js',
            '**/*_filter_test.js',
            '**/*_decorator_test.js',
            '*'
        ]));
}

function vendorTestScripts(options) {
    var bootstrap = isBootstrap(options);
    return gulp.src(mainNpmFiles()
            .concat('!node_modules/**/index.js')
            .concat('node_modules/angular/angular.js')
            .concat('node_modules/angular-mocks/angular-mocks.js')
        )
        .pipe(order([
            'jquery.js',
            'angular.js',
            'angular-mocks.js',
            '*'
        ]));
}

function updateKarmaFile(options) {
    var configFile = getConfigFile(options);
    var dest = getDestination(options);
    return gulp.src(configFile)
        .pipe(inject(series(vendorScripts(options), vendorTestScripts(options), srcScripts(), srcTestsScripts()), {
            starttag: 'files: [',
            endtag: '],',
            relative: true,
            transform: function(filepath, file, i, length) {
                return '"' + filepath + '"' + (i + 1 < length ? ',' : '');
            }
        }))
        .pipe(gulp.dest(dest));
}

module.exports = {
    srcScripts: srcScripts,
    srcTestsScripts: srcTestsScripts,
    buildScripts: buildScripts,
    updateKarmaFile: updateKarmaFile
};
