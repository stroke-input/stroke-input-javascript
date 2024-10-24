OrdinaryDictionaryReplacement: #.boilerplate-properties-override
- queue_position: BEFORE #boilerplate-properties
- apply_mode: SEQUENTIAL
* %title --> Stroke input method (筆畫輸入法): JavaScript v0.1.0
* %head-elements-before-viewport -->
    <meta name="description" content="A JavaScript implementation of the stroke input method (筆畫輸入法), for desktop browser.">
* %head-elements-after-viewport -->
    <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="stylesheet" href="stroke-input.min.css">
    <script>let FIREFOX_FOUC_FIX;</script>
    <script defer src="stroke-input.min.js"></script>

RegexDictionaryReplacement: #.chinese-lang
- queue_position: BEFORE #escape-idle-html
* (?P<chinese_run> [⺀-〿㇀-㇣㐀-鿼豈-龎！-｠𠀀-𱍊]+ )
    -->
  <span lang="zh-Hant">\g<chinese_run></span>

FixedDelimitersReplacement: #.keyboard-element
- queue_position: AFTER #inline-semantics
- syntax_type: INLINE
- opening_delimiter: {
- content_replacements: #escape-html
- closing_delimiter: }
- tag_name: kbd

RegexDictionaryReplacement: #.keyboard-element-automatic-id
- queue_position: AFTER #.keyboard-element
* <kbd> (?P<character> \S+? ) </kbd>
    -->
  <button id="\g<character>"><kbd>\g<character></kbd></button>
* '"""' --> '"&quot;"'

OrdinaryDictionaryReplacement: #.typography.typography
- queue_position: BEFORE #whitespace
- apply_mode: SIMULTANEOUS
* (C)~ --> "© "
* -- --> –

OrdinaryDictionaryReplacement: #.links.license-links
- queue_position: BEFORE #explicit-links
- apply_mode: SIMULTANEOUS
* [gpl-3] --> b<https://www.gnu.org/licenses/>
* [apache-2] --> b<https://www.apache.org/licenses/LICENSE-2.0.html>
* [cc-by-4] --> b<https://creativecommons.org/licenses/by/4.0/>
* [cc0] --> b<https://creativecommons.org/publicdomain/zero/1.0/>

%%%

# %title

<noscript>
--
**{.disabled} JavaScript is required for this implementation of stroke input method to function.**
--
</noscript>

--
A port of [Stroke Input Method (筆畫輸入法) for Android][stroke-input-android].
--

||||{#input-container}

'''
//
  ; Stroke input
  ,{#enabled-status} Uninitialised
//
  ; Candidate order
  ,{#candidate-order} Uninitialised
'''

<textarea autofocus id="input" placeholder="Enter text here">
</textarea>

'''
//
  ; Stroke sequence
  ,{#stroke-sequence .strokes}
//{.candidates-row}
  ; Candidates
  ,
    <dl id="candidates">
    </dl>
    <span id="candidates-pagination"></span>
'''

||||

''''{.controls}
|^
  //
    ; Function
    ; Key
|:
  //
    , Toggle stroke input
    , {F2}
  //
    , Toggle candidate order
    , {F9}
  //
    , Type strokes (<span class="strokes">㇐㇑㇒㇔㇖</span>)
    , {U}{I}{O}{J}{K} (or {H}{S}{P}{D}{Z})
  //
    , Select candidate
    , {1}{2}{3}{4}{5}{6}{7}{8}{9}{0}
  //
    , Type ordinary punctuation
    , {;}{\\}{?}{!}{,}{.}{(}{)}{:}{~}
  //
    , Type special symbol classes
    , {'}{"}{[}{]}{<}{>}{|}{`}{$}{*}{%}{=}
  //
    , Scroll candidates
    , {↑}{↓} (or {PgUp}{PgDn}) and {Home}{End}
  //
    , Assorted erasure
    , {Backspace}{Delete}
  //
    , Commit first candidate
    , {Spacebar}{Enter}
''''


## About

--
This JavaScript implementation of the stroke input method
is free and open-source software with ABSOLUTELY NO WARRANTY.
--
--{.notice}
(C)~2024 Conway <br>
Licensed under GPL-3.0-only, see [gpl-3].
--


## Dependencies

### [Conway Stroke Data] (v1.33.1)

--
`sequence-characters.txt` is:
--
--{.notice}
(C)~2021--2024 Conway <br>
Licensed under CC-BY-4.0, see [cc-by-4]. <br>
--

--
Other files are:
--
--{.notice}
Released into the Public Domain, see [cc0].
--

### [Stroke Input Font] (v2.0.1)

--{.notice}
(C)~2021--2022 Conway <br>
Licensed under GPL-3.0-only, see [gpl-3]. <br>
--
--
Modified from a [2015 version of Noto Sans CJK TC],
which is:
--
--{.notice}
(C)~2015 Google and others <br>
Licensed under Apache-2.0, see [apache-2]. <br>
--

[stroke-input-android]: https://github.com/stroke-input/stroke-input-android
[Conway Stroke Data]: https://github.com/stroke-input/stroke-input-data
[Stroke Input Font]: https://github.com/stroke-input/stroke-input-font
[2015 version of Noto Sans CJK TC]: https://github.com/googlefonts/noto-cjk/tree/2663656870e92c0dcbe891590681815ebb509c05


<footer>
[Go up a level to home page](https://stroke-input.github.io)
</footer>
