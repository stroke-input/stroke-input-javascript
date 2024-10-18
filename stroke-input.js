function keyListener(event)
{
  // TODO: if stroke input method is disabled return

  event.preventDefault();

  if (event.repeat)
  {
    return;
  }

  switch (event.key)
  {
    case "F2":
      console.log("TOGGLE_STROKE_INPUT_METHOD"); // TODO
      break;

    case "F9":
      console.log("TOGGLE_CANDIDATE_ORDER_PREFERENCE"); // TODO
      break;

    case "u":
    case "U":
    case "h":
    case "H":
      console.log("STROKE_1"); // TODO
      break;

    case "i":
    case "I":
    case "s":
    case "S":
      console.log("STROKE_2"); // TODO
      break;

    case "o":
    case "O":
    case "p":
    case "P":
      console.log("STROKE_3"); // TODO
      break;

    case "j":
    case "J":
    case "d":
    case "D":
      console.log("STROKE_4"); // TODO
      break;

    case "k":
    case "K":
    case "z":
    case "Z":
      console.log("STROKE_5"); // TODO
      break;

    case "Backspace":
      console.log("BACKSPACE"); // TODO
      break;

    case "Delete":
      console.log("DELETE"); // TODO

    case " ":
      console.log("SPACE"); // TODO
      break;

    case "Enter":
      console.log("ENTER"); // TODO
      break;

    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      let candidate_index = (+(event.key) + 9) % 10;
      console.log(`DISPLAYED_CANDIDATE_${candidate_index}`); // TODO
      break;

    case ";":
    case "\\":
    case "?":
    case "!":
    case ",":
    case ".":
    case "(":
    case ")":
    case ":":
    case "~":
      let ordinary_punctuation = event.key;
      console.log(`ORDINARY_PUNCTUATION_${ordinary_punctuation}`); // TODO
      break;

    case "'":
    case '"':
    case "[":
    case "]":
    case "<":
    case ">":
    case "|":
    case "`":
    case "$":
    case "*":
    case "%":
    case "=":
      let symbol_class = event.key;
      console.log(`SYMBOL_CLASS_${symbol_class}`); // TODO
      break;

    case "Home":
      console.log("PAGE_FIRST"); // TODO
      break;

    case "End":
      console.log("PAGE_LAST"); // TODO
      break;

    case "PageUp":
    case "ArrowUp":
    case "ArrowLeft":
      console.log("PAGE_PREVIOUS"); // TODO
      break;

    case "PageDown":
    case "ArrowDown":
    case "ArrowRight":
      console.log("PAGE_NEXT"); // TODO
      break;
  }
}

document.addEventListener("keydown", keyListener);
