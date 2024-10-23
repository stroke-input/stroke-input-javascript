OrdinaryDictionaryReplacement: #.boilerplate-properties-override
- queue_position: BEFORE #boilerplate-properties
- apply_mode: SEQUENTIAL
* %title --> Stroke input method (筆畫輸入法): JavaScript
* %head-elements-before-viewport -->
    <meta name="description" content="A JavaScript implementation of the stroke input method (筆畫輸入法), for desktop browser.">
* %head-elements-after-viewport -->
    <script defer src="stroke-input.js"></script>

RegexDictionaryReplacement: #.chinese-lang
- queue_position: BEFORE #escape-idle-html
* (?P<chinese_run> [⺀-〿㇀-㇣㐀-鿼豈-龎！-｠𠀀-𱍊]+ )
    -->
  <span lang="zh-Hant">\g<chinese_run></span>

FixedDelimitersReplacement: #.keyboard-element
- queue_position: AFTER #inline-semantics
- syntax_type: INLINE
- opening_delimiter: [
- closing_delimiter: ]
- tag_name: kbd

%%%

# %title

<noscript>
--
**JavaScript is required for this implementation of stroke input method to function.**
--
</noscript>

||||

'''
//
  ; Stroke input
  ,{#enabled-status} uninitialised
//
  ; Candidate order
  ,{#candidate-order} uninitialised
'''

<textarea autofocus id="input" placeholder="Enter text here">
</textarea>

'''
//
  ; Stroke sequence
  ,{#stroke-sequence}
//
  ; Candidates
  ,{#candidates}
'''

||||


## Controls

''''
|^
  //
    ; Function
    ; Key
|:
  //
    , Toggle stroke input
    , [F2]
  //
    , Toggle candidate order
    , [F9]
  //
    , Type strokes
    , [U][I][O][J][K] (or [H][S][P][D][Z])
  //
    , Select candidate
    , [1][2][3][4][5][6][7][8][9][0]
  //
    , Type ordinary punctuation
    , [;][\\][?][!][,][.][(][)][:][~]
  //
    , Type special symbol classes
    , [']["][\[][\]][\<][\>][|][`][$][*][%][=]
  //
    , Scroll candidates
    , [↑][↓] (or [PgUp][PgDn]) and ([Home][End])
''''


## TODO list

++++
1. Implement better visuals for stroke sequence and candidates
1. Actual styling (CSS)
1. Make this a submodule (aliased as `javascript`) of `stroke-input.github.io`
1. Add keyboard image with callouts for visual presentation of controls
1. Serve stroke input font for nice stroke characters
++++
