module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bowercopy: {
       options: {
         srcPrefix: 'bower_components'
       },
       'video.js': {
         options: {
            destPrefix: 'dist'
         },
         files: {
           'video.js': 'video.js/dist/video.js',
           'videojs.css': 'video.js/dist/video-js.css',
           'font/VideoJS.eot': 'video.js/dist/font/VideoJS.eot',
           'font/VideoJS.svg': 'video.js/dist/font/VideoJS.svg',
           'font/VideoJS.ttf': 'video.js/dist/font/VideoJS.ttf',
           'font/VideoJS.woff': 'video.js/dist/font/VideoJS.woff',
           'swf/video-js.swf': 'video.js/dist/video-js.swf'
         }
       },
       'videojs-font': {
         options: {
            destPrefix: 'dist'
         },
         files: {
           'css/videojs-icons.css': 'videojs-font/css/videojs-icons.css'
         }
       },
       'shaka-player': {
         options: {
            destPrefix: 'dist'
         },
         files: {
           'js/shaka-player.compiled.debug.js': 'shaka-player/shaka-player.compiled.debug.js'
         }
       }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          hostname: 'localhost',
          base: './',
          keepalive: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bowercopy');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task(s).
  grunt.registerTask('default', ['bowercopy']);

};
