const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const startTag = '<script type="text/babel">';
const startIdx = html.indexOf(startTag);
if (startIdx === -1) {
  console.log("Start tag not found");
  process.exit(1);
}
const codeStart = startIdx + startTag.length;
const endIdx = html.indexOf('</script>', codeStart);
const code = html.substring(codeStart, endIdx);

console.log("Extracted code length:", code.length);

let lineNum = 1427; // script starts around line 1427
let colNum = 1;
let i = 0;
const len = code.length;

function nextChar() {
  if (i >= len) return null;
  const c = code[i++];
  if (c === '\n') {
    lineNum++;
    colNum = 1;
  } else {
    colNum++;
  }
  return c;
}

function peekChar() {
  if (i >= len) return null;
  return code[i];
}

const stack = [];
const voidTags = ['input', 'img', 'br', 'hr', 'link', 'meta'];

while (i < len) {
  const c = nextChar();
  if (c === '/' && peekChar() === '/') {
    while (i < len && peekChar() !== '\n') {
      nextChar();
    }
    continue;
  }
  if (c === '/' && peekChar() === '*') {
    nextChar();
    while (i < len) {
      const nc = nextChar();
      if (nc === '*' && peekChar() === '/') {
        nextChar();
        break;
      }
    }
    continue;
  }
  if (c === '"' || c === "'" || c === '`') {
    const quote = c;
    while (i < len) {
      const nc = nextChar();
      if (nc === '\\') {
        nextChar();
      } else if (nc === quote) {
        break;
      }
    }
    continue;
  }
  if (c === '<') {
    const peek = peekChar();
    if (peek && /[a-zA-Z/]/.test(peek)) {
      const tagStartLine = lineNum;
      const tagStartCol = colNum - 1;
      let tagContent = "";
      let inTagString = null;
      let braceDepth = 0;

      while (i < len) {
        const tc = nextChar();
        if (inTagString) {
          if (tc === '\\') {
            nextChar();
          } else if (tc === inTagString) {
            inTagString = null;
          }
          tagContent += tc;
          continue;
        }
        if (tc === '"' || tc === "'") {
          inTagString = tc;
          tagContent += tc;
          continue;
        }
        if (tc === '{') {
          braceDepth++;
        } else if (tc === '}') {
          braceDepth--;
        }
        if (braceDepth <= 0 && tc === '>') {
          break;
        }
        tagContent += tc;
      }

      tagContent = tagContent.trim();
      if (tagContent.startsWith('/')) {
        const tagName = tagContent.substring(1).trim().split(/[\s\t\r\n]/)[0];
        if (stack.length === 0) {
          console.log(`Unmatched closing tag </${tagName}> at line ${tagStartLine}, col ${tagStartCol}`);
        } else {
          const last = stack.pop();
          if (last.tag !== tagName) {
            console.log(`Mismatched tag: </${tagName}> at line ${tagStartLine} does not match <${last.tag}> from line ${last.line}, col ${last.col}`);
            stack.push(last); // restore
          }
        }
      } else if (tagContent.endsWith('/')) {
        // self-closing
      } else {
        const tagName = tagContent.split(/[\s\t\r\n]/)[0];
        if (voidTags.includes(tagName.toLowerCase())) {
          console.log(`JSX Error: void tag <${tagName}> at line ${tagStartLine}, col ${tagStartCol} is not self-closed with '/>'`);
        } else {
          if (tagName !== "") {
            stack.push({ tag: tagName, line: tagStartLine, col: tagStartCol });
          }
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log("Still open JSX tags at end of file:");
  stack.forEach(item => {
    console.log(`  <${item.tag}> opened at line ${item.line}, col ${item.col}`);
  });
} else {
  console.log("All JSX tags balanced successfully!");
}
