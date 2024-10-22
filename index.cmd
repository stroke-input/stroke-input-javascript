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
