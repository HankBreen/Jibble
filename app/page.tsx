"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  CircleHelp,
  Flame,
  Info,
  Menu,
  Mountain,
  RotateCcw,
  Share2,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

type GuessState = "correct" | "close" | "wrong";

type Guess = {
  name: string;
  country: string;
  age: string;
  medals: string;
  sponsors: string;
  state: GuessState;
};

const skiers = [
  { name: "Alex Hall", country: "USA", age: "27", medals: "6", sponsors: "7" },
  { name: "Eileen Gu", country: "CHN", age: "22", medals: "11", sponsors: "10" },
  { name: "Mikaël Kingsbury", country: "CAN", age: "33", medals: "18", sponsors: "8" },
  { name: "Kelly Sildaru", country: "EST", age: "24", medals: "7", sponsors: "6" },
  { name: "Max Parrot", country: "CAN", age: "31", medals: "9", sponsors: "9" },
];

const answer = skiers[0];
const alphabetizedSkiers = [...skiers].sort((a, b) => a.name.localeCompare(b.name));

function Silhouette({ revealed }: { revealed: boolean }) {
  return (
    <div className={`skier-art ${revealed ? "is-revealed" : ""}`} aria-label={revealed ? answer.name : "Masked skier"}>
      <div className="snow snow-one" />
      <div className="snow snow-two" />
      <div className="skier-head" />
      <div className="skier-body" />
      <div className="skier-arm arm-left" />
      <div className="skier-arm arm-right" />
      <div className="skier-leg leg-left" />
      <div className="skier-leg leg-right" />
      <div className="ski ski-left" />
      <div className="ski ski-right" />
      {revealed && <span className="reveal-name">{answer.name}</span>}
    </div>
  );
}

export default function Home() {
  const [guess, setGuess] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [activePanel, setActivePanel] = useState<"game" | "stats" | "profile">("game");

  const submitGuess = () => {
    const selected = skiers.find((skier) => skier.name === guess);
    if (!selected || guesses.some((item) => item.name === selected.name) || guesses.length >= 6) return;
    const state: GuessState = selected.name === answer.name ? "correct" : selected.country === answer.country ? "close" : "wrong";
    setGuesses((current) => [...current, { ...selected, state }]);
    setGuess("");
    if (state === "correct" || guesses.length === 5) setRevealed(true);
  };

  const resetGame = () => {
    setGuesses([]);
    setGuess("");
    setRevealed(false);
  };

  const matchingSkiers = useMemo(() => {
    const query = guess.trim().toLowerCase();
    return alphabetizedSkiers.filter((skier) => {
      const available = !guesses.some((item) => item.name === skier.name);
      return available && (!query || skier.name.toLowerCase().includes(query));
    });
  }, [guess, guesses]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActivePanel("game")} aria-label="Go to today's game">
          <span className="brand-mark"><Mountain size={19} strokeWidth={2.8} /></span>
          <span>SKI<span>//</span>DLE</span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={activePanel === "game" ? "nav-active" : ""} onClick={() => setActivePanel("game")}>Today&apos;s game</button>
          <button className={activePanel === "stats" ? "nav-active" : ""} onClick={() => setActivePanel("stats")}><BarChart3 size={16} /> Stats</button>
          <button onClick={() => setShowHowTo(true)}><CircleHelp size={16} /> How to play</button>
        </nav>
        <div className="top-actions">
          <button className="icon-button mobile-menu" aria-label="Open menu"><Menu size={20} /></button>
          <button className="profile-button" onClick={() => setActivePanel("profile")}><span className="avatar">HB</span><span className="profile-label">Hank</span><ChevronDown size={15} /></button>
        </div>
      </header>

      {activePanel === "game" && (
        <section className="game-page">
          <div className="game-heading">
            <div>
              <p className="eyebrow"><span className="live-dot" /> DAILY TRICK · #042</p>
              <h1>Who&apos;s that skier?</h1>
              <p className="heading-copy">Watch the masked clip. Use the clues to name today&apos;s pro.</p>
            </div>
            <div className="streak-chip"><Flame size={16} fill="currentColor" /> 4 day streak</div>
          </div>

          <div className="video-card">
            <div className="video-topline"><span>TRICK REPLAY</span><span className="clip-time">0:04 <span className="play-dot" /></span></div>
            <div className="video-stage"><Silhouette revealed={revealed} /><div className="scanline" /></div>
            <div className="video-caption"><span>{revealed ? "IDENTITY REVEALED" : "IDENTITY MASKED"}</span><span className="caption-dot" /> SLOPE STYLE: SLOPESTYLE</div>
          </div>

          <div className="game-content">
            <div className="guess-head"><span className="eyebrow">YOUR GUESSES <b>{guesses.length}/6</b></span><button className="give-up" onClick={() => setRevealed(true)} disabled={revealed}>Give up <Info size={14} /></button></div>
            <div className="guess-board">
              <div className="board-header"><span>SKIER</span><span>NATIONALITY</span><span>AGE</span><span>MEDALS</span><span>SPONSORS</span></div>
              {Array.from({ length: 6 }).map((_, index) => {
                const item = guesses[index];
                return <div className={`guess-row ${item?.state ?? "empty"}`} key={index}>
                  <span className="skier-cell">{item ? item.name : <span className="empty-line" />}</span>
                  <span>{item ? <Pill value={item.country} type={item.state} /> : <span className="empty-line short" />}</span>
                  <span>{item ? <Pill value={item.age} type={item.state} /> : <span className="empty-line tiny" />}</span>
                  <span>{item ? <Pill value={item.medals} type={item.state} /> : <span className="empty-line tiny" />}</span>
                  <span>{item ? <Pill value={item.sponsors} type={item.state} /> : <span className="empty-line tiny" />}</span>
                </div>;
              })}
            </div>
            {!revealed ? <div className="guess-form">
              <div className="search-wrap">
                <input
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  placeholder="Search for a skier..."
                  aria-label="Search for a skier"
                  autoComplete="off"
                />
                {searchFocused && matchingSkiers.length > 0 && <div className="search-results">
                  {matchingSkiers.map((skier) => <button key={skier.name} type="button" onMouseDown={() => setGuess(skier.name)}><span>{skier.name}</span><small>{skier.country}</small></button>)}
                </div>}
              </div>
              <button className="submit-button" onClick={submitGuess} disabled={!guess}>Submit guess <span>↵</span></button>
            </div> : <div className="result-card"><div><p className="eyebrow">{guesses.some((item) => item.state === "correct") ? "NICE WORK" : "THE ANSWER WAS"}</p><strong>{answer.name}</strong><span>{answer.country} · {answer.age} years old</span></div><button className="share-button"><Share2 size={16} /> Share result</button></div>}
            <div className="legend"><span><i className="legend-dot exact" /> Correct</span><span><i className="legend-dot close" /> Same country</span><span><i className="legend-dot miss" /> Not a match</span><span className="legend-right">Next daily in <b>08:42:16</b></span></div>
          </div>
        </section>
      )}

      {activePanel === "stats" && <Panel title="Your stats" eyebrow="THE NUMBERS" icon={<BarChart3 />}><div className="stat-grid"><Stat label="Played" value="27" /><Stat label="Win rate" value="81%" /><Stat label="Current streak" value="4" /><Stat label="Best streak" value="12" /></div><div className="history-card"><h3>Recent games</h3><div className="history-row"><span>#041 · Eileen Gu</span><b className="win-text">Solved in 3</b><small>Yesterday</small></div><div className="history-row"><span>#040 · Mikaël Kingsbury</span><b className="win-text">Solved in 5</b><small>Sep 15</small></div><div className="history-row"><span>#039 · Kelly Sildaru</span><b className="loss-text">Gave up</b><small>Sep 14</small></div></div></Panel>}
      {activePanel === "profile" && <Panel title="Your profile" eyebrow="WELCOME BACK" icon={<UserRound />}><div className="profile-card"><span className="large-avatar">HB</span><div><h2>Hank Breen</h2><p>Member since September 2026</p></div><button className="outline-button">Edit profile</button></div><div className="profile-note"><Trophy size={20} /><div><b>Keep the streak alive.</b><span>You&apos;re 3 games away from your personal best.</span></div></div></Panel>}

      {activePanel === "game" && <footer className="footer-note">A new mystery skier every day <span>·</span> Made for the mountain obsessed <Mountain size={14} /></footer>}

      {showHowTo && <div className="modal-backdrop" onClick={() => setShowHowTo(false)}><div className="how-modal" onClick={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => setShowHowTo(false)} aria-label="Close"><X size={18} /></button><div className="modal-icon"><Mountain size={24} /></div><p className="eyebrow">THE BASICS</p><h2>How to play</h2><p className="modal-intro">Identify the pro skier hidden in today&apos;s trick clip. You have six guesses.</p><div className="how-step"><b>01</b><div><strong>Watch the clip</strong><span>The skier is masked, but their style is still a clue.</span></div></div><div className="how-step"><b>02</b><div><strong>Make a guess</strong><span>Tiles flip to show how your guess compares.</span></div></div><div className="how-step"><b>03</b><div><strong>Share your result</strong><span>Come back tomorrow for a new mystery.</span></div></div><button className="submit-button modal-button" onClick={() => setShowHowTo(false)}>Let&apos;s go <RotateCcw size={15} /></button></div></div>}
    </main>
  );
}

function Pill({ value, type }: { value: string; type: GuessState }) {
  return <span className={`value-pill ${type}`}><i />{value}</span>;
}

function Panel({ title, eyebrow, icon, children }: { title: string; eyebrow: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel-page"><div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="panel-icon">{icon}</div></div>{children}</section>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}
