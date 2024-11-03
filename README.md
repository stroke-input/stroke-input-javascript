# stroke-input-javascript

A JavaScript port of [Stroke Input Method (筆畫輸入法) for Android].


## Workflow

Dependencies:

```bash
$ pipx install conwaymd
$ npm install -g csso-cli
$ npm install -g terser
```

Build:

```bash
$ cmd -a
$ csso stroke-input.css -o stroke-input.min.css
$ terser stroke-input.js -o stroke-input.min.js
```


## License

**Copyright 2024 Conway** <br>
Licensed under the GNU General Public License v3.0 (GPL-3.0-only). <br>
This is free software with NO WARRANTY etc. etc., see [LICENSE]. <br>


[Stroke Input Method (筆畫輸入法) for Android]: https://github.com/stroke-input/stroke-input-android
[LICENSE]: LICENSE
