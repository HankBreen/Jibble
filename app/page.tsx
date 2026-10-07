"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  CircleHelp,
  Menu,
  Mountain,
  RotateCcw,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Puzzle = { id: string; puzzle_date: string; mask_clip_id: string };
type MaskClip = { id: string; masked_video_url: string; trick_name: string | null };
type RevealClip = { reveal_video_url: string | null };
type Skier = {
  first_name: string;
  last_name: string;
  nationality_code: string | null;
  birthdate: string | null;
  olympic_medals: number | null;
  xgames_medals: number | null;
  primary_sponsor: string | null;
};

function getAge(birthdate: string | null) {
  if (!birthdate) return null;
  const born = new Date(`${birthdate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return age;
}

export default function Home() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [clip, setClip] = useState<MaskClip | null>(null);
  const [skier, setSkier] = useState<Skier | null>(null);
  const [revealedVideoUrl, setRevealedVideoUrl] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [activePanel, setActivePanel] = useState<"game" | "stats" | "profile">("game");

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzle() {
      const supabase = createClient();
      const { data: puzzleData, error: puzzleError } = await supabase
        .from("puzzles")
        .select("id,puzzle_date,mask_clip_id")
        .eq("status", "published")
        .lte("puzzle_date", new Date().toISOString().slice(0, 10))
        .order("puzzle_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (puzzleError) throw puzzleError;
      if (!puzzleData) throw new Error("There is no published puzzle available yet.");

      const { data: clipData, error: clipError } = await supabase
        .from("mask_clips")
        .select("id,masked_video_url,trick_name")
        .eq("id", puzzleData.mask_clip_id)
        .eq("status", "ready")
        .maybeSingle();

      if (clipError) throw clipError;
      if (!clipData) throw new Error("The published puzzle does not have a ready masked clip.");

      if (!cancelled) {
        setPuzzle(puzzleData);
        setClip(clipData);
        setLoading(false);
      }
    }

    loadPuzzle().catch((error: unknown) => {
      if (!cancelled) {
        setLoadError(error instanceof Error ? error.message : "Could not load today's puzzle.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (!puzzle || !clip || revealing) return;

    setRevealing(true);
    setLoadError(null);
    const supabase = createClient();

    try {
      const [{ data: puzzleAnswer, error: answerError }, { data: revealClip, error: revealError }] = await Promise.all([
        supabase.from("puzzles").select("skier_id").eq("id", puzzle.id).single(),
        supabase.from("mask_clips").select("reveal_video_url").eq("id", clip.id).single(),
      ]);
      if (answerError) throw answerError;
      if (revealError) throw revealError;

      const { data: skierData, error: skierError } = await supabase
        .from("skiers")
        .select("first_name,last_name,nationality_code,birthdate,olympic_medals,xgames_medals,primary_sponsor")
        .eq("id", puzzleAnswer.skier_id)
        .single();
      if (skierError) throw skierError;

      setSkier(skierData);
      setRevealedVideoUrl((revealClip as RevealClip).reveal_video_url);
      setRevealed(true);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not reveal the skier.");
    } finally {
      setRevealing(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActivePanel("game")} aria-label="Go to today's game">
          <span className="brand-mark"><Mountain size={19} strokeWidth={2.8} /></span>
          <span>SKI<span>{"//"}</span>DLE</span>
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
              <p className="eyebrow"><span className="live-dot" /> DAILY TRICK{puzzle ? ` · ${puzzle.puzzle_date}` : ""}</p>
              <h1>Who&apos;s that skier?</h1>
              <p className="heading-copy">Watch today&apos;s masked trick, then reveal the skier.</p>
            </div>
          </div>

          <div className="video-card">
            <div className="video-topline"><span>TRICK REPLAY</span><span>{clip?.trick_name ?? ""}</span></div>
            <div className="video-stage video-player-stage">
              {loading ? <p className="video-message">Loading today&apos;s puzzle...</p> : clip && (!revealed || revealedVideoUrl) ? <video key={revealed ? revealedVideoUrl : clip.masked_video_url} className="puzzle-video" src={revealed ? revealedVideoUrl ?? undefined : clip.masked_video_url} autoPlay muted loop playsInline controls /> : <p className="video-message">{clip ? "No unmasked video is available for this puzzle." : "Puzzle video unavailable."}</p>}
            </div>
            <div className="video-caption"><span>{revealed ? "IDENTITY REVEALED" : "IDENTITY MASKED"}<span className="caption-dot" />{clip?.trick_name ?? "TODAY'S TRICK"}</span></div>
          </div>

          <div className="game-content">
            {skier && revealed && <div className="result-card skier-details">
              <div><p className="eyebrow">TODAY&apos;S SKIER</p><strong>{skier.first_name} {skier.last_name}</strong>
                <span>{[skier.nationality_code, getAge(skier.birthdate) ? `${getAge(skier.birthdate)} years old` : null].filter(Boolean).join(" · ")}</span>
                <span>Olympic medals: {skier.olympic_medals ?? 0} · X Games medals: {skier.xgames_medals ?? 0}</span>
                {skier.primary_sponsor && <span>Sponsor: {skier.primary_sponsor}</span>}
              </div>
            </div>}
            <div className="reveal-controls">
              <button className="submit-button reveal-toggle" type="button" role="switch" aria-checked={revealed} onClick={toggleReveal} disabled={loading || !clip || revealing}>
                <span className={`toggle-track ${revealed ? "is-on" : ""}`}><span className="toggle-knob" /></span>
                {revealing ? "Revealing..." : revealed ? "Show masked clip" : "I guessed correctly"}
              </button>
              {loadError && <p className="load-error" role="alert">{loadError}</p>}
            </div>
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

function Panel({ title, eyebrow, icon, children }: { title: string; eyebrow: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel-page"><div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="panel-icon">{icon}</div></div>{children}</section>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}
