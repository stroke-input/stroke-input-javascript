OrdinaryDictionaryReplacement: #.boilerplate-properties-override
- queue_position: BEFORE #boilerplate-properties
- apply_mode: SEQUENTIAL
* %title --> Stroke input method (筆畫輸入法): JavaScript
* %head-elements-before-viewport -->
    <meta name="description" content="A JavaScript implementation of the stroke input method (筆畫輸入法), for desktop browser.">
* %head-elements-after-viewport -->
    <link rel="stylesheet" href="stroke-input.css">
    <script>let FIREFOX_FOUC_FIX;</script>
    <script defer src="stroke-input.js"></script>

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

%%%

# %title

<noscript>
--
**{.disabled} JavaScript is required for this implementation of stroke input method to function.**
--
</noscript>

||||{#input-container}

'''
//
  ; Stroke input status
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


## TODO list

++++
1. Make this a submodule (aliased as `javascript`) of `stroke-input.github.io`
++++
