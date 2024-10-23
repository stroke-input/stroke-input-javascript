let SEQUENCE_CHARACTERS_FILE_NAME = "res/sequence-characters.txt";
let CHARACTERS_FILE_NAME_TRADITIONAL = "res/characters-traditional.txt";
let CHARACTERS_FILE_NAME_SIMPLIFIED = "res/characters-simplified.txt";
let RANKING_FILE_NAME_TRADITIONAL = "res/ranking-traditional.txt";
let RANKING_FILE_NAME_SIMPLIFIED = "res/ranking-simplified.txt";
let PHRASES_FILE_NAME_TRADITIONAL = "res/phrases-traditional.txt";
let PHRASES_FILE_NAME_SIMPLIFIED = "res/phrases-simplified.txt";

let LAG_PREVENTION_CODE_POINT_COUNT = 1400;
let CJK_MAIN_CODE_POINT_START = 0x4E00;
let CJK_MAIN_CODE_POINT_END = 0x9FFF;
let CJK_EXTENSION_CODE_POINT_MIN = 0x3400;
let CJK_EXTENSION_CODE_POINT_MAX = 0x2CEAF;
let RANKING_PENALTY_CJK_EXTENSION = CJK_MAIN_CODE_POINT_END - CJK_EXTENSION_CODE_POINT_MIN + 1;
let RANKING_PENALTY_PER_CHAR = 2 * CJK_EXTENSION_CODE_POINT_MAX;
let RANKING_PENALTY_UNPREFERRED = 10 * CJK_EXTENSION_CODE_POINT_MAX;
let MAX_PREFIX_MATCH_COUNT = 30;
let MAX_PHRASE_LENGTH = 6;
let CANDIDATE_COUNT_PER_PAGE = 10;

let CHARACTER_FROM_ORDINARY_PUNCTUATION = new Map([
  [";", "；"], // U+FF1B FULLWIDTH SEMICOLON
  ["\\", "、"], // U+3001 IDEOGRAPHIC COMMA
  ["?", "？"], // U+FF1F FULLWIDTH QUESTION MARK
  ["!", "！"], // U+FF01 FULLWIDTH EXCLAMATION MARK
  [",", "，"], // U+FF0C FULLWIDTH COMMA
  [".", "。"], // U+3002 IDEOGRAPHIC FULL STOP
  ["(", "（"], // U+FF08 FULLWIDTH LEFT PARENTHESIS
  [")", "）"], // U+FF09 FULLWIDTH RIGHT PARENTHESIS
  [":", "："], // U+FF1A FULLWIDTH COLON
  ["~", "〜"], // U+301C WAVE DASH
]);

class Keyboardy
{
  static isModified(event)
  {
    return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
  }

  static isModifiedCtrlAltMeta(event)
  {
    return event.ctrlKey || event.altKey || event.metaKey;
  }
}

class Stringy
{
  static getFirstCodePoint(string)
  {
    return string.codePointAt(0);
  }

  static getLength(string)
  {
    return [...string].length;
  }

  static toCodePoints(string)
  {
    return [...string].map(Stringy.getFirstCodePoint);
  }

  static keepLeadingCharacters(string, keptLength)
  {
    return [...string].slice(0, keptLength).join("");
  }

  static keepTrailingCharacters(string, keptLength)
  {
    return [...string].slice(-keptLength).join("");
  }

  static extractCharacters(string, startPosition, endPosition)
  {
    return [...string].slice(startPosition, endPosition).join("");
  }

  static removeLeadingCharacters(string, removedLength)
  {
    return [...string].slice(removedLength).join("");
  }

  static removeTrailingCharacters(string, removedLength)
  {
    return [...string].slice(0, -removedLength).join("");
  }
}

class StrokeTrieNode
{
  childFromStroke = new Map();
  characters = "";

  descendantCharacters()
  {
    let characters = "";

    for (const child of this.childFromStroke.values())
    {
      characters += child.characters + child.descendantCharacters();
    }

    return characters;
  }
}

class StrokeTrie
{
  rootNode = new StrokeTrieNode();

  insert(strokeDigitSequence, characters)
  {
    let node = this.rootNode;

    for (const stroke of strokeDigitSequence)
    {
      if (!node.childFromStroke.has(stroke))
      {
        node.childFromStroke.set(stroke, new StrokeTrieNode());
      }
      node = node.childFromStroke.get(stroke);
    }
    node.characters = characters;
  }

  lookup(strokeDigitSequence, lookupType)
  {
    let node = this.rootNode;

    for (const stroke of strokeDigitSequence)
    {
      if (!node.childFromStroke.has(stroke))
      {
        return ""
      }
      node = node.childFromStroke.get(stroke);
    }

    switch (lookupType)
    {
      case "exact":
        return node.characters;

      case "prefix":
        return node.descendantCharacters();

      default:
        throw new Error(`bad lookupType ${lookupType}`);
    }
  }
}

class Comparer
{
  static candidateComparator(unpreferredCodePoints, sortingRankFromCodePoint, phraseCompletionFirstCodePoints)
  {
    return Comparer.comparatorFunction(
      string =>
      Comparer.computeCandidateRank(string, unpreferredCodePoints, sortingRankFromCodePoint, phraseCompletionFirstCodePoints)
    );
  }

  static candidateCodePointComparator(unpreferredCodePoints, sortingRankFromCodePoint, phraseCompletionFirstCodePoints)
  {
    return Comparer.comparatorFunction(
      codePoint =>
      Comparer.computeCandidateRankBasic(codePoint, 1, unpreferredCodePoints, sortingRankFromCodePoint, phraseCompletionFirstCodePoints)
    );
  }

  static comparatorFunction(rankFunction)
  {
    return (a, b) => rankFunction(a) - rankFunction(b);
  }

  static computeCandidateRank(string, unpreferredCodePoints, sortingRankFromCodePoint, phraseCompletionFirstCodePoints)
  {
    let firstCodePoint = Stringy.getFirstCodePoint(string);
    let stringLength = Stringy.getLength(string);

    return Comparer.computeCandidateRankBasic(
      firstCodePoint,
      stringLength,
      unpreferredCodePoints,
      sortingRankFromCodePoint,
      phraseCompletionFirstCodePoints,
    );
  }

  static computeCandidateRankBasic(
    firstCodePoint,
    stringLength,
    unpreferredCodePoints,
    sortingRankFromCodePoint,
    phraseCompletionFirstCodePoints,
  )
  {
    let coarseRank;
    let fineRank;
    let penalty;

    let noPhraseCompletions = !phraseCompletionFirstCodePoints.length;
    let phraseCompletionIndex = phraseCompletionFirstCodePoints.indexOf(firstCodePoint);
    let firstCodePointMatchesPhraseCompletionCandidate = phraseCompletionIndex > 0;

    let sortingRank = sortingRankFromCodePoint.get(firstCodePoint);
    let cjkBlockPenalty =
            (firstCodePoint < CJK_MAIN_CODE_POINT_START || firstCodePoint > CJK_MAIN_CODE_POINT_END)
              ? RANKING_PENALTY_CJK_EXTENSION
              : 0;
    let sortingRankDefined =
            (sortingRank !== undefined)
              ? sortingRank
              : firstCodePoint + cjkBlockPenalty;

    let lengthPenalty = (stringLength - 1) * RANKING_PENALTY_PER_CHAR;
    let unpreferredPenalty =
            (unpreferredCodePoints.has(firstCodePoint))
              ? RANKING_PENALTY_UNPREFERRED
              : 0;

    if (noPhraseCompletions)
    {
      coarseRank = Number.MIN_SAFE_INTEGER;
      fineRank = sortingRankDefined;
      penalty = lengthPenalty + unpreferredPenalty;
    }
    else if (firstCodePointMatchesPhraseCompletionCandidate)
    {
      coarseRank = Number.MIN_SAFE_INTEGER;
      fineRank = phraseCompletionIndex;
      penalty = lengthPenalty;
    }
    else
    {
      coarseRank = 0;
      fineRank = sortingRankDefined;
      penalty = lengthPenalty + unpreferredPenalty;
    }

    return coarseRank + fineRank + penalty;
  }
}

class Loader
{
  static isCommentLine(line)
  {
    return line.startsWith("#") || !line;
  }

  static async toSequenceCharactersMap(sequenceCharactersFileName)
  {
    let sequenceCharactersText = await fetch(sequenceCharactersFileName).then(response => response.text());

    let charactersFromStrokeDigitSequence = new StrokeTrie();
    for (const line of sequenceCharactersText.split("\n"))
    {
      if (!Loader.isCommentLine(line))
      {
        let [strokeDigitSequence, characters] = line.split("\t");
        charactersFromStrokeDigitSequence.insert(strokeDigitSequence, characters);
      }
    }

    return charactersFromStrokeDigitSequence;
  }

  static async toCharactersCodePointSet(charactersFileName)
  {
    let charactersText = await fetch(charactersFileName).then(response => response.text());

    let codePoints = new Set();
    for (const line of charactersText.split("\n"))
    {
      if (!Loader.isCommentLine(line))
      {
        codePoints.add(Stringy.getFirstCodePoint(line));
      }
    }

    return codePoints;
  }

  static async toRankingData(rankingFileName)
  {
    let rankingText = await fetch(rankingFileName).then(response => response.text());

    let sortingRankFromCodePoint = new Map();
    let commonCodePoints = new Set();
    let currentRank = 0;
    for (const line of rankingText.split("\n"))
    {
      if (!Loader.isCommentLine(line))
      {
        for (const codePoint of Stringy.toCodePoints(line))
        {
          currentRank++;
          if (!sortingRankFromCodePoint.has(codePoint))
          {
            sortingRankFromCodePoint.set(codePoint, currentRank);
          }
          if (currentRank < LAG_PREVENTION_CODE_POINT_COUNT)
          {
            commonCodePoints.add(codePoint);
          }
        }
      }
    }

    return [sortingRankFromCodePoint, commonCodePoints];
  }

  static async toPhraseList(phrasesFileName)
  {
    let phrasesText = await fetch(phrasesFileName).then(response => response.text());

    let phrases = [];
    for (const line of phrasesText.split("\n"))
    {
      if (!Loader.isCommentLine(line))
      {
        phrases.push(line);
      }
    }

    return phrases;
  }
}

class StrokeInputService
{
  isEnabled = null;

  charactersFromStrokeDigitSequence = null;
  codePointsTraditional = null;
  codePointsSimplified = null;
  sortingRankFromCodePointTraditional = null;
  sortingRankFromCodePointSimplified = null;
  commonCodePointsTraditional = null;
  commonCodePointsSimplified = null;
  phrasesTraditional = null;
  phrasesSimplified = null;

  isTraditionalPreferred = null;
  unpreferredCodePoints = null;
  sortingRankFromCodePoint = null;
  commonCodePoints = null;
  phrases = null;

  strokeDigitSequence = "";
  candidates = [];
  candidatesPageIndex = 0;
  phraseCompletionFirstCodePoints = [];

  constructor()
  {
    this._isLoaded = this._loadData()
  }

  async _loadData()
  {
    this.charactersFromStrokeDigitSequence = await Loader.toSequenceCharactersMap(SEQUENCE_CHARACTERS_FILE_NAME);
    this.codePointsTraditional = await Loader.toCharactersCodePointSet(CHARACTERS_FILE_NAME_TRADITIONAL);
    this.codePointsSimplified = await Loader.toCharactersCodePointSet(CHARACTERS_FILE_NAME_SIMPLIFIED);
    [this.sortingRankFromCodePointTraditional, this.commonCodePointsTraditional] = await Loader.toRankingData(RANKING_FILE_NAME_TRADITIONAL);
    [this.sortingRankFromCodePointSimplified, this.commonCodePointsSimplified] = await Loader.toRankingData(RANKING_FILE_NAME_SIMPLIFIED);
    this.phrasesTraditional = await Loader.toPhraseList(PHRASES_FILE_NAME_TRADITIONAL);
    this.phrasesSimplified = await Loader.toPhraseList(PHRASES_FILE_NAME_SIMPLIFIED);
  }

  async initialise()
  {
    await this._isLoaded;

    this.isEnabled = true;
    this.isTraditionalPreferred = true;
    this.updateCandidateOrderPreference();

    UserInterface.updateEnabledStatus(this.isEnabled);
    UserInterface.updateCandidateOrder(this.isTraditionalPreferred);
    UserInterface.initialiseKeys(this);
  }

  async updateCandidateOrderPreference()
  {
    await this._isLoaded;

    if (this.isTraditionalPreferred)
    {
      this.unpreferredCodePoints = this.codePointsSimplified;
      this.sortingRankFromCodePoint = this.sortingRankFromCodePointTraditional;
      this.commonCodePoints = this.commonCodePointsTraditional;
      this.phrases = this.phrasesTraditional;
    }
    else
    {
      this.unpreferredCodePoints = this.codePointsTraditional;
      this.sortingRankFromCodePoint = this.sortingRankFromCodePointSimplified;
      this.commonCodePoints = this.commonCodePointsSimplified;
      this.phrases = this.phrasesSimplified;
    }

    UserInterface.focusInputElement();
  }

  async effectStrokeAppend(strokeDigit)
  {
    await this._isLoaded;

    UserInterface.focusInputElement();

    let newStrokeDigitSequence = this.strokeDigitSequence + strokeDigit;
    let newCandidates = await this.computeCandidates(newStrokeDigitSequence);
    if (newCandidates.length)
    {
      this.strokeDigitSequence = newStrokeDigitSequence;
      this.candidates = newCandidates;
      this.candidatesPageIndex = 0;

      UserInterface.updateStrokeSequence(this.strokeDigitSequence);
      UserInterface.updateCandidates(await this.getShownCandidates());
    }
  }

  async effectBackspace()
  {
    await this._isLoaded;

    let requirePhraseCandidatesUpdate;

    if (this.strokeDigitSequence)
    {
      let newStrokeDigitSequence = Stringy.removeTrailingCharacters(this.strokeDigitSequence, 1);
      let newCandidates = await this.computeCandidates(newStrokeDigitSequence);

      this.strokeDigitSequence = newStrokeDigitSequence;
      this.candidates = newCandidates;
      this.candidatesPageIndex = 0;

      UserInterface.focusInputElement();
      UserInterface.updateStrokeSequence(this.strokeDigitSequence);
      UserInterface.updateCandidates(await this.getShownCandidates());

      requirePhraseCandidatesUpdate = !newStrokeDigitSequence;
    }
    else
    {
      if (!UserInterface.isInputElementFocused())
      {
        UserInterface.focusInputElement();
        return;
      }

      let inputElement = UserInterface.getInputElement();
      let sunderedInputText = UserInterface.sunderInputText();
      let textBeforeCursor = sunderedInputText.before;
      let textSelection = sunderedInputText.selection;
      let textAfterCursor = sunderedInputText.after;

      if (textSelection)
      {
        let newCursorPosition = textBeforeCursor.length;
        inputElement.value = textBeforeCursor + textAfterCursor;
        inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
      }
      else
      {
        let newTextBeforeCursor = Stringy.removeTrailingCharacters(textBeforeCursor, 1);
        let newCursorPosition = newTextBeforeCursor.length;
        inputElement.value = newTextBeforeCursor + textAfterCursor;
        inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
      }

      requirePhraseCandidatesUpdate = true;
    }

    if (requirePhraseCandidatesUpdate)
    {
      let longestPhrasePrefix = UserInterface.getInputTextBeforeCursor(MAX_PHRASE_LENGTH - 1);
      let phraseCompletionCandidates = await this.computePhraseCompletionCandidates(longestPhrasePrefix);

      this.candidates = phraseCompletionCandidates;
      this.candidatesPageIndex = 0;
      this.phraseCompletionFirstCodePoints = [...phraseCompletionCandidates].map(Stringy.getFirstCodePoint);

      UserInterface.updateCandidates(await this.getShownCandidates());
    }
  }

  async effectDelete()
  {
    await this._isLoaded;

    if (!UserInterface.isInputElementFocused())
    {
      UserInterface.focusInputElement();
      return;
    }

    if (this.strokeDigitSequence)
    {
      return;
    }

    let inputElement = UserInterface.getInputElement();
    let sunderedInputText = UserInterface.sunderInputText();
    let textBeforeCursor = sunderedInputText.before;
    let textSelection = sunderedInputText.selection;
    let textAfterCursor = sunderedInputText.after;

    if (textSelection)
    {
      inputElement.value = textBeforeCursor + textAfterCursor;
    }
    else
    {
      let newTextAfterCursor = Stringy.removeLeadingCharacters(textAfterCursor, 1);
      inputElement.value = textBeforeCursor + newTextAfterCursor;
    }

    let newCursorPosition = textBeforeCursor.length;
    inputElement.setSelectionRange(newCursorPosition, newCursorPosition);

    let longestPhrasePrefix = UserInterface.getInputTextBeforeCursor(MAX_PHRASE_LENGTH - 1);
    let phraseCompletionCandidates = await this.computePhraseCompletionCandidates(longestPhrasePrefix);

    this.candidates = phraseCompletionCandidates;
    this.candidatesPageIndex = 0;
    this.phraseCompletionFirstCodePoints = [...phraseCompletionCandidates].map(Stringy.getFirstCodePoint);

    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async effectSpaceKey()
  {
    await this._isLoaded;

    if (!UserInterface.isInputElementFocused())
    {
      UserInterface.focusInputElement();
      return;
    }

    if (this.strokeDigitSequence)
    {
      this.effectCandidateKey(0);
    }
    else
    {
      let inputElement = UserInterface.getInputElement();
      let sunderedInputText = UserInterface.sunderInputText();
      let textBeforeCursor = sunderedInputText.before;
      let textAfterCursor = sunderedInputText.after;
      inputElement.value = textBeforeCursor + " " + textAfterCursor;

      let newCursorPosition = textBeforeCursor.length + 1;
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  }

  async effectEnterKey()
  {
    await this._isLoaded;

    if (!UserInterface.isInputElementFocused())
    {
      UserInterface.focusInputElement();
      return;
    }

    if (this.strokeDigitSequence)
    {
      this.effectCandidateKey(0);
    }
    else
    {
      let inputElement = UserInterface.getInputElement();
      let sunderedInputText = UserInterface.sunderInputText();
      let textBeforeCursor = sunderedInputText.before;
      let textAfterCursor = sunderedInputText.after;
      inputElement.value = textBeforeCursor + "\n" + textAfterCursor;

      let newCursorPosition = textBeforeCursor.length + 1;
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  }

  async effectCandidateKey(index)
  {
    await this._isLoaded;

    if (!UserInterface.isInputElementFocused())
    {
      UserInterface.focusInputElement();
      return;
    }

    let shownCandidates = await this.getShownCandidates();
    if (index >= shownCandidates.length)
    {
      return;
    }

    let candidate = shownCandidates.at(index);
    let inputElement = UserInterface.getInputElement();
    let sunderedInputText = UserInterface.sunderInputText();
    let textBeforeCursor = sunderedInputText.before;
    let textAfterCursor = sunderedInputText.after;
    inputElement.value = textBeforeCursor + candidate + textAfterCursor;

    let newCursorPosition = (textBeforeCursor + candidate).length;
    inputElement.setSelectionRange(newCursorPosition, newCursorPosition);

    this.strokeDigitSequence = "";

    let longestPhrasePrefix = UserInterface.getInputTextBeforeCursor(MAX_PHRASE_LENGTH - 1);
    let phraseCompletionCandidates = await this.computePhraseCompletionCandidates(longestPhrasePrefix);

    this.candidates = phraseCompletionCandidates;
    this.candidatesPageIndex = 0;
    this.phraseCompletionFirstCodePoints = [...phraseCompletionCandidates].map(Stringy.getFirstCodePoint);

    UserInterface.updateStrokeSequence(this.strokeDigitSequence);
    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async effectOrdinaryPunctuationKey(punctuationCharacter)
  {
    await this._isLoaded;

    if (!UserInterface.isInputElementFocused())
    {
      UserInterface.focusInputElement();
      return;
    }

    if (this.strokeDigitSequence)
    {
      return;
    }

    let inputElement = UserInterface.getInputElement();
    let sunderedInputText = UserInterface.sunderInputText();
    let textBeforeCursor = sunderedInputText.before;
    let textAfterCursor = sunderedInputText.after;
    inputElement.value = textBeforeCursor + punctuationCharacter + textAfterCursor;

    let newCursorPosition = (textBeforeCursor + punctuationCharacter).length;
    inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  async onCandidatesFirstPage()
  {
    await this._isLoaded;

    this.candidatesPageIndex = 0;

    UserInterface.focusInputElement();
    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async onCandidatesLastPage()
  {
    await this._isLoaded;

    this.candidatesPageIndex = await this.getCandidatesLastPageIndex();

    UserInterface.focusInputElement();
    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async onCandidatesPreviousPage()
  {
    await this._isLoaded;

    this.candidatesPageIndex = Math.max(0, this.candidatesPageIndex - 1);

    UserInterface.focusInputElement();
    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async onCandidatesNextPage()
  {
    await this._isLoaded;

    let lastPageIndex = await this.getCandidatesLastPageIndex();
    this.candidatesPageIndex = Math.min(lastPageIndex, this.candidatesPageIndex + 1);

    UserInterface.focusInputElement();
    UserInterface.updateCandidates(await this.getShownCandidates());
  }

  async computeCandidates(strokeDigitSequence)
  {
    await this._isLoaded;

    if (!strokeDigitSequence)
    {
      return [];
    }

    let exactMatchCandidates;
    let exactMatchCharacters = this.charactersFromStrokeDigitSequence.lookup(strokeDigitSequence, "exact");
    if (exactMatchCharacters)
    {
      exactMatchCandidates = [...exactMatchCharacters];
      exactMatchCandidates.sort(
        Comparer.candidateComparator(this.unpreferredCodePoints, this.sortingRankFromCodePoint, this.phraseCompletionFirstCodePoints)
      );
    }
    else
    {
      exactMatchCandidates = [];
    }

    let prefixMatchCharactersCollection = this.charactersFromStrokeDigitSequence.lookup(strokeDigitSequence, "prefix");
    let prefixMatchCodePoints = new Set(Stringy.toCodePoints(prefixMatchCharactersCollection));
    if (prefixMatchCodePoints.size > LAG_PREVENTION_CODE_POINT_COUNT)
    {
      prefixMatchCodePoints = new Set([...this.commonCodePoints].filter(codePoint => prefixMatchCodePoints.has(codePoint)));
    }

    let prefixMatchCandidateCodePoints = [...prefixMatchCodePoints];
    prefixMatchCandidateCodePoints.sort(
      Comparer.candidateCodePointComparator(this.unpreferredCodePoints, this.sortingRankFromCodePoint, this.phraseCompletionFirstCodePoints)
    );
    prefixMatchCandidateCodePoints = prefixMatchCandidateCodePoints.slice(0, MAX_PREFIX_MATCH_COUNT);
    let prefixMatchCandidates = [...String.fromCodePoint(...prefixMatchCandidateCodePoints)];

    let candidates = [...exactMatchCandidates, ...prefixMatchCandidates];
    return candidates;
  }

  async computePhraseCompletionCandidates(longestPhrasePrefix)
  {
    await this._isLoaded;

    let phraseCompletionCandidates = [];

    for (
      let phrasePrefix = longestPhrasePrefix;
      phrasePrefix;
      phrasePrefix = Stringy.removeLeadingCharacters(phrasePrefix, 1)
    )
    {
      let prefixMatchPhraseCandidates = this.phrases.filter(phrase => phrase.startsWith(phrasePrefix) && phrase !== phrasePrefix);
      let prefixMatchPhraseCompletions = [];
      let phrasePrefixLength = Stringy.getLength(phrasePrefix);

      for (const phraseCandidate of prefixMatchPhraseCandidates)
      {
        let phraseCompletion = Stringy.removeLeadingCharacters(phraseCandidate, phrasePrefixLength);
        if (!phraseCompletionCandidates.includes(phraseCompletion))
        {
          prefixMatchPhraseCompletions.push(phraseCompletion);
        }
      }

      prefixMatchPhraseCompletions.sort(
        Comparer.candidateComparator(this.unpreferredCodePoints, this.sortingRankFromCodePoint, [])
      );
      phraseCompletionCandidates.push(...prefixMatchPhraseCompletions);
    }

    return phraseCompletionCandidates;
  }

  async getCandidatesLastPageIndex()
  {
    await this._isLoaded;

    return Math.floor((this.candidates.length - 1) / CANDIDATE_COUNT_PER_PAGE);
  }

  async getShownCandidates()
  {
    let startIndex = this.candidatesPageIndex * CANDIDATE_COUNT_PER_PAGE;
    let endIndex = (this.candidatesPageIndex + 1) * CANDIDATE_COUNT_PER_PAGE;
    return this.candidates.slice(startIndex, endIndex);
  }
}

class UserInterface
{
  static initialiseKeys(strokeInputService)
  {
    document.addEventListener("keydown", event => keyListener(event, strokeInputService));
  }

  static updateEnabledStatus(isEnabled)
  {
    let enabledStatusText = isEnabled ? "enabled" : "disabled";
    document.getElementById("enabled-status").textContent = enabledStatusText;
  }

  static updateCandidateOrder(isTraditionalPreferred)
  {
    let candidateOrderStatusText = isTraditionalPreferred ? "Traditional first" : "Simplified first";
    document.getElementById("candidate-order").textContent = candidateOrderStatusText;

    let elementLanguage = isTraditionalPreferred ? "zh-Hant" : "zh-Hans";
    document.getElementById("stroke-sequence").lang = elementLanguage;
    document.getElementById("candidates").lang = elementLanguage;
  }

  static updateStrokeSequence(strokeDigitSequence)
  {
    let strokeSeqenceText = strokeDigitSequence; // TODO: actual stroke characters
    document.getElementById("stroke-sequence").textContent = strokeSeqenceText;
  }

  static updateCandidates(shownCandidates)
  {
    document.getElementById("candidates").textContent = shownCandidates;
  }

  static getInputElement()
  {
    return document.getElementById("input");
  }

  static sunderInputText()
  {
    let inputElement = UserInterface.getInputElement();
    let inputText = inputElement.value;
    let selectionStart = inputElement.selectionStart;
    let selectionEnd = inputElement.selectionEnd;

    return {
      before: Stringy.keepLeadingCharacters(inputText, selectionStart),
      selection: Stringy.extractCharacters(inputText, selectionStart, selectionEnd),
      after: Stringy.removeLeadingCharacters(inputText, selectionEnd),
    };
  }

  static getInputTextBeforeCursor(targetLength)
  {
    let textBeforeCursor = UserInterface.sunderInputText().before;
    return Stringy.keepTrailingCharacters(textBeforeCursor, targetLength);
  }

  static isInputElementFocused()
  {
    let inputElement = UserInterface.getInputElement();
    return document.activeElement === UserInterface.getInputElement();
  }

  static focusInputElement()
  {
    let inputElement = UserInterface.getInputElement();
    inputElement.focus();
  }
}

async function keyListener(event, strokeInputService)
{
  let key = event.key;

  // Toggle stroke input method
  if (key === "F2" && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    strokeInputService.isEnabled = !strokeInputService.isEnabled;
    UserInterface.focusInputElement();
    UserInterface.updateEnabledStatus(strokeInputService.isEnabled);
    return;
  }

  // Toggle candidate order preference
  if (key === "F9" && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    strokeInputService.isTraditionalPreferred = !strokeInputService.isTraditionalPreferred;
    strokeInputService.updateCandidateOrderPreference();
    strokeInputService.candidates = await strokeInputService.computeCandidates(strokeInputService.strokeDigitSequence);

    UserInterface.focusInputElement();
    UserInterface.updateCandidateOrder(strokeInputService.isTraditionalPreferred);
    UserInterface.updateCandidates(strokeInputService.candidates, strokeInputService.candidatesPageIndex);
    return;
  }

  // Early exit if stroke input not enabled
  if (!strokeInputService.isEnabled)
  {
    return;
  }

  // Stroke 1
  if (/^[uh]$/i.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectStrokeAppend(1);
    return;
  }

  // Stroke 2
  if (/^[is]$/i.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectStrokeAppend(2);
    return;
  }

  // Stroke 3
  if (/^[op]$/i.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectStrokeAppend(3);
    return;
  }

  // Stroke 4
  if (/^[jd]$/i.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectStrokeAppend(4);
    return;
  }

  // Stroke 5
  if (/^[kz]$/i.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectStrokeAppend(5);
    return;
  }

  // Backspace
  if (key === "Backspace")
  {
    event.preventDefault();
    strokeInputService.effectBackspace();
    return;
  }

  // Delete
  if (key === "Delete")
  {
    event.preventDefault();
    strokeInputService.effectDelete();
    return;
  }

  // Space
  if (key === " " && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.effectSpaceKey();
    return;
  }

  // Enter
  if (key === "Enter")
  {
    event.preventDefault();
    strokeInputService.effectEnterKey();
    return;
  }

  // Candidate selection
  console.assert(CANDIDATE_COUNT_PER_PAGE === 10);
  if (/^[0-9]$/.test(key) && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    let index = (+(key) + 9) % 10;
    strokeInputService.effectCandidateKey(index);
    return;
  }

  // Ordinary punctuation
  if (CHARACTER_FROM_ORDINARY_PUNCTUATION.has(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    let punctuationCharacter = CHARACTER_FROM_ORDINARY_PUNCTUATION.get(key);
    strokeInputService.effectOrdinaryPunctuationKey(punctuationCharacter);
    return;
  }

  // Symbol classes
  if (/^['"\[\]{}<>|`$*%=]$/.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log(`SYMBOL_CLASS_${key}`); // TODO
    return;
  }

  // Candidates first page
  if (key === "Home" && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    strokeInputService.onCandidatesFirstPage();
    return;
  }

  // Candidates last page
  if (key === "End" && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    strokeInputService.onCandidatesLastPage();
    return;
  }

  // Candidates previous page
  if (["PageUp", "ArrowUp"].includes(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.onCandidatesPreviousPage();
    return;
  }

  // Candidates next page
  if (["PageDown", "ArrowDown"].includes(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    strokeInputService.onCandidatesNextPage();
    return;
  }

  // Catch-all for printable ASCII
  if (/^[!-~]$/.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    UserInterface.focusInputElement();
    return;
  }
}

let strokeInputService = new StrokeInputService();
strokeInputService.initialise();
