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
           'video.dev.js': 'video.js/dist/video-js/video.dev.js',
           'videojs.css': 'video.js/dist/video-js/video-js.css',
           'font/vjs.eot': 'video.js/dist/video-js/font/vjs.eot',
           'font/vjs.svg': 'video.js/dist/video-js/font/vjs.svg',
           'font/vjs.ttf': 'video.js/dist/video-js/font/vjs.ttf',
           'font/vjs.woff': 'video.js/dist/video-js/font/vjs.woff',
           'swf/video-js.swf': 'video.js/dist/video-js/video-js.swf'
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
    } 
  });

  grunt.loadNpmTasks('grunt-bowercopy');
  
  // Default task(s).
  grunt.registerTask('default', ['bowercopy']);

};
