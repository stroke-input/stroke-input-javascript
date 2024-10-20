OrdinaryDictionaryReplacement: #.boilerplate-properties-override
- queue_position: BEFORE #boilerplate-properties
- apply_mode: SEQUENTIAL
* %title --> Stroke input method (筆畫輸入法): JavaScript
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
||
Stroke Input Service: <span id="enabled-status">uninitialised</span>
||
||
Candidate order: <span id="candidate-order-status">uninitialised</span>
||
<textarea autofocus placeholder="Enter text here">
</textarea>
||||
