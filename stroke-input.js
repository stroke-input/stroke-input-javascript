let SEQUENCE_CHARACTERS_FILE_NAME = "res/sequence-characters.txt";
let CHARACTERS_FILE_NAME_TRADITIONAL = "res/characters-traditional.txt";
let CHARACTERS_FILE_NAME_SIMPLIFIED = "res/characters-simplified.txt";
let RANKING_FILE_NAME_TRADITIONAL = "res/ranking-traditional.txt";
let RANKING_FILE_NAME_SIMPLIFIED = "res/ranking-simplified.txt";
let PHRASES_FILE_NAME_TRADITIONAL = "res/phrases-traditional.txt";
let PHRASES_FILE_NAME_SIMPLIFIED = "res/phrases-simplified.txt";

let LAG_PREVENTION_CODE_POINT_COUNT = 1400;

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

  static toCodePoints(string)
  {
    let codePoints = [];

    for (const character of string)
    {
      let codePoint = Stringy.getFirstCodePoint(character);
      codePoints.push(codePoint);
    }

    return codePoints;
  }

  static removeLastCharacter(string)
  {
    return [...string].slice(0, -1).join("") ;
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

  static async toPhraseSet(phrasesFileName)
  {
    let phrasesText = await fetch(phrasesFileName).then(response => response.text());

    let phrases = new Set();
    for (const line of phrasesText.split("\n"))
    {
      if (!Loader.isCommentLine(line))
      {
        phrases.add(line);
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
  // TODO: phraseCompletionFirstCodePoints = [];

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
    this.phrasesTraditional = await Loader.toPhraseSet(PHRASES_FILE_NAME_TRADITIONAL);
    this.phrasesSimplified = await Loader.toPhraseSet(PHRASES_FILE_NAME_SIMPLIFIED);
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
  }

  async effectStrokeAppend(strokeDigit)
  {
    await this._isLoaded;

    let newStrokeDigitSequence = this.strokeDigitSequence + strokeDigit;
    let newCandidates = await this.computeCandidates(newStrokeDigitSequence);
    if (newCandidates)
    {
      this.strokeDigitSequence = newStrokeDigitSequence;
      this.candidates = newCandidates;

      UserInterface.updateStrokeSequence(this.strokeDigitSequence);
      UserInterface.updateCandidates(this.candidates);
    }
  }

  async effectBackspace()
  {
    if (this.strokeDigitSequence)
    {
      let newStrokeDigitSequence = Stringy.removeLastCharacter(this.strokeDigitSequence);
      let newCandidates = await this.computeCandidates(newStrokeDigitSequence);

      this.strokeDigitSequence = newStrokeDigitSequence;
      this.candidates = newCandidates;

      UserInterface.updateStrokeSequence(this.strokeDigitSequence);
      UserInterface.updateCandidates(this.candidates);

      if (!newStrokeDigitSequence)
      {
        // TODO: phrase completion
      }
    }
    else
    {
      // TODO: erasure plus phrase completion etc.
    }
  }

  async computeCandidates(strokeDigitSequence)
  {
    await this._isLoaded;

    if (!strokeDigitSequence)
    {
      return [];
    }

    let exactMatches = this.charactersFromStrokeDigitSequence.lookup(strokeDigitSequence, "exact"); // TODO: other logic
    return exactMatches;
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

  static updateCandidates(candidates) // TODO: pagination and separation
  {
    let candidatesText = candidates;
    document.getElementById("candidates").textContent = candidatesText;
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

    UserInterface.updateCandidateOrder(strokeInputService.isTraditionalPreferred);
    UserInterface.updateCandidates(strokeInputService.candidates);
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
    console.log("DELETE"); // TODO: logic for ctrlKey, strokes, selection
    return;
  }

  // Space
  if (key === " " && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("SPACE"); // TODO: logic for ctrlKey, strokes, selection
    return;
  }

  // Enter
  if (key === "Enter")
  {
    event.preventDefault();
    console.log("ENTER"); // TODO: logic for strokes, selection
    return;
  }

  // Candidate selection
  if (/^[0-9]$/.test(key) && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    let candidate_index = (+(key) + 9) % 10;
    console.log(`DISPLAYED_CANDIDATE_${candidate_index}`); // TODO: logic
    return;
  }

  // Ordinary punctuation
  if (/^[;\\?!,.():~]$/.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log(`ORDINARY_PUNCTUATION_${key}`); // TODO
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
    console.log("CANDIDATES_PAGE_FIRST"); // TODO: logic
    return;
  }

  // Candidates last page
  if (key === "End" && !Keyboardy.isModified(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_LAST"); // TODO: logic
    return;
  }

  // Candidates previous page
  if (["PageUp", "ArrowUp", "ArrowLeft"].includes(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_PREVIOUS"); // TODO: logic
    return;
  }

  // Candidates next page
  if (["PageDown", "ArrowDown", "ArrowRight"].includes(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_NEXT"); // TODO: logic
    return;
  }

  // Catch-all for printable ASCII
  if (/^[!-~]$/.test(key) && !Keyboardy.isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    return;
  }
}

let strokeInputService = new StrokeInputService();
strokeInputService.initialise();
