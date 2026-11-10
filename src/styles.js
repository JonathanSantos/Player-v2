// As medidas e as cores são as do Player de 2016: 80px de altura, 20% para o
// botão, uma barra de 20px com metade da opacidade, cinza #646464 e roxo #682268.
// Em 2016 elas eram aplicadas elemento por elemento, via `element.style`.
export const STYLE_ID = 'player-styles';

export const PLAYER_CSS = `
.player {
  --player-background: #646464;
  --player-accent: #682268;
  --player-text: #ffffff;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 80px;
  background-color: var(--player-background);
  color: var(--player-text);
  font: 14px/1.3 system-ui, sans-serif;
}
.player *, .player *::before { box-sizing: border-box; }
.player__button {
  flex: 0 0 20%;
  min-width: 48px;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: var(--player-accent);
  color: inherit;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.player__button::before {
  content: '';
  width: 22px;
  height: 24px;
  background-color: currentColor;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}
.player[data-status='playing'] .player__button::before,
.player[data-status='loading'] .player__button::before {
  width: 20px;
  background-color: transparent;
  clip-path: none;
  border-inline: 7px solid currentColor;
}
.player__track {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  touch-action: manipulation;
}
.player__bar {
  width: 0%;
  height: 20px;
  opacity: 0.5;
  background-color: var(--player-accent);
}
.player__info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 12px 14px 0;
  pointer-events: none;
}
.player__title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
}
.player__time {
  flex: none;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}
.player__button:focus-visible,
.player__track:focus-visible {
  outline: 2px solid var(--player-text);
  outline-offset: -4px;
}
.player[data-status='loading'] { cursor: progress; }
.player[data-status='error'] .player__button { cursor: not-allowed; opacity: 0.6; }
@media (prefers-reduced-motion: no-preference) {
  .player__bar { transition: width 0.2s linear; }
}
`;

/** Coloca a folha de estilo no documento, uma única vez, não importa quantos Players existam. */
export const ensureStyles = (document) => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PLAYER_CSS;
  document.head.append(style);
};
