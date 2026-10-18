import { useId, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { getProductNameSuggestions } from "../../services/catalogService";

const maxSuggestions = 6;

type SearchBoxProps = {
  initialQuery: string;
  onSearch: (query: string) => void;
};

// Suggestions are real product names: names that start with what was typed
// come first, then names that contain it.
function pickSuggestions(names: string[], typed: string) {
  const term = typed.trim().toLowerCase();
  if (!term) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower === term) continue;
    if (lower.startsWith(term)) starts.push(name);
    else if (lower.includes(term)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, maxSuggestions);
}

function SearchBox({ initialQuery, onSearch }: SearchBoxProps) {
  const listId = useId();
  const [value, setValue] = useState(initialQuery);
  const [names, setNames] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = open ? pickSuggestions(names, value) : [];

  function loadNames() {
    getProductNameSuggestions()
      .then(setNames)
      .catch(() => {
        // Suggestions are optional; plain search still works without them.
      });
  }

  function choose(name: string) {
    setValue(name);
    setOpen(false);
    setActive(-1);
    onSearch(name);
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setOpen(true);
    setActive(-1);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active >= 0 && suggestions[active]) {
      choose(suggestions[active]);
      return;
    }
    setOpen(false);
    onSearch(value.trim());
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
    >
      <div className="relative w-full">
        <label className="sr-only" htmlFor={`${listId}-input`}>
          Search products
        </label>
        <input
          id={`${listId}-input`}
          name="q"
          type="search"
          value={value}
          onChange={change}
          onFocus={() => {
            loadNames();
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={keyDown}
          maxLength={100}
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-option-${active}` : undefined
          }
          placeholder="Search by product name"
          className="w-full border border-blyver-ink/20 bg-transparent px-4 py-3 outline-none focus:border-blyver-champagne"
        />
        {suggestions.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 border border-t-0 border-blyver-ink/20 bg-blyver-ivory shadow-sm"
          >
            {suggestions.map((name, index) => (
              <li
                key={name}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === active}
                // mouseDown (not click) so the input keeps focus and the
                // list doesn't close before the choice registers.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(name);
                }}
                className={`cursor-pointer px-4 py-3 text-sm ${
                  index === active
                    ? "bg-blyver-ink/10"
                    : "hover:bg-blyver-ink/5"
                }`}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="bg-blyver-ink px-7 py-3 text-[11px] tracking-[0.16em] text-blyver-ivory">
        SEARCH
      </button>
    </form>
  );
}

export default SearchBox;
