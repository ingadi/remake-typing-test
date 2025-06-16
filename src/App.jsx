import './App.css';
import clsx from 'clsx';
import { useState, memo, useRef, useEffect } from 'react';
import { debounce } from 'es-toolkit';

const TEXT = `morning light filters through broken blinds across empty bottles on the kitchen table she counts backward from ten hoping the silence means something different today outside a dog barks at shadows while the world pretends everything is fine`;

const TOKENS = getTokens(TEXT);

const FRAME_RATE = 16;

function App() {
  const [mistakes, setMistakes] = useState(new Set());
  const [totalTyped, setTotalTyped] = useState(0);
  const inputRef = useRef(null);

  useRestrictedTyping();

  const handleInput = debounce((e) => {
    const input = e.target.value;

    if (input.length > TEXT.length) return;

    setMistakes((prevMistakes) => {
      const updatedMistakes = new Set(prevMistakes);
      const hasDeletedCharacters = input.length < totalTyped;

      if (hasDeletedCharacters) {
        for (let i = input.length; i < totalTyped; i++) {
          updatedMistakes.delete(i);
        }
      } else {
        const typedSubstring = input.slice(totalTyped);
        const targetSubstring = TEXT.substring(totalTyped, input.length);

        for (let i = 0; i < targetSubstring.length; i++) {
          if (typedSubstring[i] !== targetSubstring[i]) {
            updatedMistakes.add(i + totalTyped);
          }
        }
      }

      return updatedMistakes;
    });

    setTotalTyped(input.length);
  }, FRAME_RATE);

  function handleRestart() {
    setMistakes(new Set());
    setTotalTyped(0);
    inputRef.current.focus();
    inputRef.current.select();
    inputRef.current.value = '';
  }

  const text = TOKENS.reduce((text, token, tokenIndex) => {
    const { characters, startIdx } = token;

    text.push(
      <Segment
        key={tokenIndex}
        startIdx={startIdx}
        length={characters.length}
        totalTyped={totalTyped}>
        {characters.map((character, characterIdx) => (
          <Character
            key={startIdx + characterIdx}
            character={character}
            hasMistake={mistakes.has(startIdx + characterIdx)}
            wasTyped={startIdx + characterIdx < totalTyped}
          />
        ))}
      </Segment>
    );
    return text;
  }, []);

  return (
    <main className='min-h-screen min-w-screen relative flex flex-col justify-center items-center gap-2'>
      <button onClick={handleRestart} className='flex gap-1 items-end'>
        &#10226; <span className='text-sm'> Restart</span>
      </button>
      <textarea
        ref={inputRef}
        autoFocus
        className='peer opacity-0 absolute'
        onInput={handleInput}
      />
      <p
        onClick={() => inputRef.current.focus()}
        className='peer-focus:blur-none peer-focus:opacity-100 opacity-50 blur-xs font-mono text-2xl max-w-4xl transition-all duration-150 select-none'>
        {text}
      </p>
      <p className='peer-focus:invisible visible flex items-center gap-1 absolute mx-auto z-10 pointer-events-none select-none'>
        <span>&#9757;</span>
        <span>Click here to start typing</span>
      </p>
    </main>
  );
}

export default App;

function Segment({ children, startIdx, length, totalTyped }) {
  const isCurrent = totalTyped >= startIdx && totalTyped < startIdx + length;
  const cursorOffset = Math.min(Math.max(totalTyped - startIdx, 0), length);

  return (
    <span
      className={clsx(
        isCurrent && 'text-purple-400',
        'whitespace-nowrap inline-flex flex-col'
      )}>
      <span>{children}</span>
      <span
        style={{ transform: `translateX(${cursorOffset}ch)` }}
        className={clsx(
          isCurrent && 'visible',
          `invisible gap-7 transition-all duration-75 w-[1ch] outline-1 outline-white`
        )}
      />
    </span>
  );
}

const Character = memo(({ hasMistake, character, wasTyped }) => (
  <span
    className={clsx(
      wasTyped && 'opacity-60',
      hasMistake && 'text-red-400',
      'w-[1ch]'
    )}>
    {SYMBOLS[character] || character}
  </span>
));

function getTokens(text) {
  const tokens = [];

  for (let i = 0; i < text.length; ) {
    const startIdx = i;
    const characters = [];

    if (!checkIsWord(text[i])) {
      characters.push(text[i]);
      i++;
    } else {
      while (i < text.length && checkIsWord(text[i])) {
        characters.push(text[i]);
        i++;
      }
    }

    tokens.push({ startIdx, characters });
  }

  return tokens;
}

const SYMBOLS = {
  ' ': <>&not;</>,
};

function checkIsWord(str) {
  return /\w/.test(str);
}

function useRestrictedTyping() {
  useEffect(() => {
    function handleKeyRestrictions(e) {
      const RESTRICTIONS = [
        (e.ctrlKey || e.metaKey) &&
          ['v', 'a', 'x', 'c', 'z', 'y', 'arrowleft', 'arrowright'].includes(
            e.key.toLowerCase()
          ), // text manipulation shortcuts
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'PageUp',
          'PageDown',
        ].includes(e.key), // cursor manipulation
      ];

      if (RESTRICTIONS.some(Boolean)) {
        e.preventDefault();
        return false;
      }
    }

    document.addEventListener('keydown', handleKeyRestrictions);

    return () => {
      document.removeEventListener('keydown', handleKeyRestrictions);
    };
  }, []);
}

// onInput - Eliminates the event handling overhead (biggest win)
// debounce - Prevents excessive updates during rapid typing bursts
// memo - Only re-renders characters that actually changed
