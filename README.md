# Shaka Player Playback Technology for Video.js 

Shaka Player Playback Technology allows Video.js users to utilize [Shaka-Player](https://github.com/google/shaka-player) to playback MPEG DASH videos. This project is still under development, more features and enhancements will be available later.

### Dependencies
  - [Video.js](https://github.com/videojs)
  - [Video.js Font](https://github.com/videojs/font)
  - [Shaka-Player](https://github.com/google/shaka-player)

### Build
Build script requires npm, bower and grunt.

Run ./build.sh

### Usage
  - Include video.shaka.js file in the html page.
  - Specify "shaka" in the techOrder array as needed.
  
### Example
An example is provided under /example directory. Run the build script before using this example.

### Icon
The provided example is using the cog icon from [videojs/font](https://github.com/videojs/font). You are free to use any other icon font to replace the existing one with the help of extra css rules.

### Special Thanks
Thanks to the Shaka Player team who wrote an amazing tool to support DASH playback.

### Support
This work is sponsored by [MetaCDN](http://www.metacdn.com), creators of [StreamShark](https://streamshark.io)
