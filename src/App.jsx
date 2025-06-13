import './App.css';
import clsx from 'clsx';
import { useState, memo, useRef, useEffect } from 'react';
import { debounce } from 'es-toolkit';

const PHRASE = `The coffee shop was empty except for her, typing furiously at a corner table. 
Steam rose from her untouched cup as rain drummed against the windows. 
She glanced up when the bell chimed, watching a stranger shake off the storm. 
Their eyes met for just a moment—two people caught between where they'd been and where they were going. 
He ordered his coffee black, she returned to her screen, and the moment dissolved like sugar in hot water. 
But sometimes the smallest encounters leave the deepest marks.`;

const CHARS = PHRASE.split('');

const FRAME_RATE = 16;

function App() {
  const [mistakes, setMistakes] = useState(new Set());
  const [currentLength, setCurrentLength] = useState(0);
  const inputRef = useRef(null);

  usePreventPaste();

  const handleInput = debounce((e) => {
    const input = e.target.value;

    if (input.length > CHARS.length) return;

    setMistakes((prevMistakes) => {
      ``;
      const updatedMistakes = new Set(prevMistakes);
      const hasDeletedChars = input.length < currentLength;

      if (hasDeletedChars) {
        for (let i = input.length; i < currentLength; i++) {
          updatedMistakes.delete(i);
        }
      } else {
        const newSubstring = input.slice(currentLength);
        const targetSubstring = PHRASE.substring(currentLength, input.length);

        for (let i = 0; i < targetSubstring.length; i++) {
          if (newSubstring[i] !== targetSubstring[i]) {
            updatedMistakes.add(i + currentLength);
          }
        }
      }

      return updatedMistakes;
    });

    setCurrentLength(input.length);
  }, FRAME_RATE);

  const paragraph = CHARS.map((letter, idx) => (
    <CharacterSpan
      key={idx}
      isActive={currentLength === idx}
      hasMistake={mistakes.has(idx)}
      letter={letter}
      wasTyped={currentLength > idx}
    />
  ));

  return (
    <main className='min-h-screen min-w-screen flex items-center'>
      <div className='mx-auto'>
        <textarea
          ref={inputRef}
          autoFocus
          className='peer opacity-0 pointer-events-none'
          onInput={handleInput}
        />
        <p
          className='mx-4 opacity-10 peer-focus:opacity-100 transition-all font-mono text-2xl max-w-4xl select-none cursor-pointer'
          onClick={() => inputRef.current.focus()}>
          {paragraph}
        </p>
      </div>
    </main>
  );
}

export default App;

const CharacterSpan = memo(({ isActive, hasMistake, letter, wasTyped }) => (
  <span className='inline-flex h-8 items-center'>
    <span
      className={clsx(
        'w-1 rounded-2xl h-full animate-pulse bg-blue-500 invisible',
        isActive && 'visible'
      )}
    />
    <span
      className={clsx(wasTyped && 'opacity-60', hasMistake && 'text-red-500')}>
      {letter}
    </span>
  </span>
));

function usePreventPaste() {
  useEffect(() => {
    function handlePaste(e) {
      const isKeyCtrlV =
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v';

      if (isKeyCtrlV) {
        e.preventDefault();
        return false;
      }
    }

    document.addEventListener('keydown', handlePaste);

    return () => {
      document.removeEventListener('keydown', handlePaste);
    };
  }, []);
}

// onInput - Eliminates the event handling overhead (biggest win)
// debounce - Prevents excessive updates during rapid typing bursts
// memo - Only re-renders characters that actually changed
