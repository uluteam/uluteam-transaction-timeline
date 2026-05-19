// tweaks.jsx — edit mode panel

(function() {
  const panel = document.createElement("div");
  panel.className = "tweaks";
  panel.innerHTML = `
    <div class="tweaks-title">Tweaks</div>
    <div class="tweaks-row">
      <label style="font-weight:600">Accent Red</label>
      <input type="color" id="tw-red" value="${window.__TWEAKS__.accentRed || '#B32025'}" />
    </div>
    <div class="tweaks-row">
      <label style="font-weight:600">Show TC Directions</label>
      <input type="checkbox" id="tw-tc" ${window.__TWEAKS__.showTCDirections ? "checked" : ""} />
    </div>
    <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--line-2); font-size:11px; color:var(--ink-4); line-height:1.5">
      Sign In → Timelines → Timeline Editor. Use the sidebar to switch screens.
    </div>
  `;
  document.body.appendChild(panel);

  function applyTweaks(t) {
    if (t.accentRed) document.documentElement.style.setProperty("--red", t.accentRed);
  }
  applyTweaks(window.__TWEAKS__);

  function sendEdits(edits) {
    Object.assign(window.__TWEAKS__, edits);
    applyTweaks(window.__TWEAKS__);
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*"); } catch (e) {}
  }

  panel.querySelector("#tw-red").addEventListener("input", e => sendEdits({ accentRed: e.target.value }));
  panel.querySelector("#tw-tc").addEventListener("change", e => {
    sendEdits({ showTCDirections: e.target.checked });
    if (window.__forceRerender) window.__forceRerender();
  });

  window.addEventListener("message", (e) => {
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "__activate_edit_mode") panel.classList.add("open");
    if (e.data.type === "__deactivate_edit_mode") panel.classList.remove("open");
  });
  try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
})();
