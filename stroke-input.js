class StrokeTrieNode
{
  childFromStroke = new Map();
  characters = "";

  prefixCharacters()
  {
    let characters = this.characters;

    for (const [_, child] of this.childFromStroke)
    {
      characters += child.prefixCharacters();
    }

    return characters;
  }
}

class StrokeTrie
{
  rootNode = new StrokeTrieNode();

  insert(strokeSequence, characters)
  {
    let node = this.rootNode;

    for (const stroke of strokeSequence)
    {
      if (!node.childFromStroke.has(stroke))
      {
        node.childFromStroke.set(stroke, new StrokeTrieNode());
      }
      node = node.childFromStroke.get(stroke);
    }
    node.characters = characters;
  }

  lookup(strokeSequence, lookupType)
  {
    let node = this.rootNode;

    for (const stroke of strokeSequence)
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
        return node.prefixCharacters();

      default:
        throw new Error(`bad lookupType ${lookupType}`);
    }
  }
}

class StrokeInputService
{
  #charactersFromStrokeDigitSequence = new StrokeTrie();
}


function isModified(event)
{
  return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
}

function isModifiedCtrlAltMeta(event)
{
  return event.ctrlKey || event.altKey || event.metaKey;
}

function keyListener(event)
{
  // Early exit
  // TODO: if stroke input method is disabled return

  let key = event.key;

  // Toggle stroke input method
  if (key === "F2" && !isModified(event))
  {
    event.preventDefault();
    console.log("TOGGLE_STROKE_INPUT_METHOD"); // TODO
    return;
  }

  // Toggle candidate order preference
  if (key === "F9" && !isModified(event))
  {
    event.preventDefault();
    console.log("TOGGLE_CANDIDATE_ORDER_PREFERENCE"); // TODO
    return;
  }

  // Stroke 1
  if (/^[uh]$/i.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("STROKE_1"); // TODO
    return;
  }

  // Stroke 2
  if (/^[is]$/i.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("STROKE_2"); // TODO
    return;
  }

  // Stroke 3
  if (/^[op]$/i.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("STROKE_3"); // TODO
    return;
  }

  // Stroke 4
  if (/^[jd]$/i.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("STROKE_4"); // TODO
    return;
  }

  // Stroke 5
  if (/^[kz]$/i.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("STROKE_5"); // TODO
    return;
  }

  // Backspace
  if (key === "Backspace")
  {
    event.preventDefault();
    console.log("BACKSPACE"); // TODO: logic for ctrlKey, strokes, selection
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
  if (key === " " && !isModifiedCtrlAltMeta(event))
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
  if (/^[0-9]$/.test(key) && !isModified(event))
  {
    event.preventDefault();
    let candidate_index = (+(key) + 9) % 10;
    console.log(`DISPLAYED_CANDIDATE_${candidate_index}`); // TODO: logic
    return;
  }

  // Ordinary punctuation
  if (/^[;\\?!,.():~]$/.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log(`ORDINARY_PUNCTUATION_${key}`); // TODO
    return;
  }

  // Symbol classes
  if (/^['"\[\]{}<>|`$*%=]$/.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log(`SYMBOL_CLASS_${key}`); // TODO
    return;
  }

  // Candidates first page
  if (key === "Home" && !isModified(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_FIRST"); // TODO: logic
    return;
  }

  // Candidates last page
  if (key === "End" && !isModified(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_LAST"); // TODO: logic
    return;
  }

  // Candidates previous page
  if (["PageUp", "ArrowUp", "ArrowLeft"].includes(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_PREVIOUS"); // TODO: logic
    return;
  }

  // Candidates next page
  if (["PageDown", "ArrowDown", "ArrowRight"].includes(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    console.log("CANDIDATES_PAGE_NEXT"); // TODO: logic
    return;
  }

  // Catch-all for printable ASCII
  if (/^[!-~]$/.test(key) && !isModifiedCtrlAltMeta(event))
  {
    event.preventDefault();
    return;
  }
}

document.addEventListener("keydown", keyListener);

let st = new StrokeTrie();
st.insert("1", "一");
st.insert("11", "二");
st.insert("111", "三");
st.insert("1234", "木朩");
st.insert("251", "卂口囗");
st.insert("2511", "丮冃冄日曰");

for (const s of ["1", "11", "111", "25", "251", "2511", "25112", "1234", "12345"])
{
  console.log([s, st.lookup(s, "exact"), st.lookup(s, "prefix")]);
}
