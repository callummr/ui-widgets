module.exports = function(grunt){
  'use strict';

  grunt.initConfig({
    dirs: {
      jsFile: './assets/js/',
      jsLibs: './assets/js/libs/'
    },
    babel: {
      options: {
        presets: ['es2015']
      },
      dist: {
        files: {
          './assets/dist/js/app.js': ['./assets/js/temp/concat.js']
        }
      }
    },
    concat: {
      js: {
        src: [
          './assets/js/libs/jquery-1.11.3.js',
          './assets/js/libs/xml2json.js',
          './assets/js/libs/jquery-rotate.js',
          './assets/js/utils.js',
          './assets/js/user-create-product.js'
        ],
        dest: './assets/js/temp/concat.js'
      }
    },
    watch: {
      scripts: {
        files: ['./assets/js/**/*.js'],
        tasks: ['js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-babel');

  grunt.registerTask('default', ['js', 'watch']);
  grunt.registerTask('js', ['concat', 'babel']);
};