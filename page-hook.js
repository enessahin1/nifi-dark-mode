// Runs in the page's own JS world (world: "MAIN"). NiFi binds component data (position, size, status)
// onto DOM elements as __data__ via D3; that data is invisible from the extension's isolated world.
//
// The Navigate panel's minimap draws onto a <canvas>, so it can't be styled with CSS. NiFi already
// updates the transform of an empty group (g.birdseye > g) in the minimap's SVG layer to match scale
// and pan; we add yellow markers to that group with component coordinates for invalid components.
// Their appearance is set by dark.css (only visible and blinking while dark mode is on).

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PAD = 36; // the minimap is at a very small scale, so we draw the marker a bit larger than the component

  let lastSignature = '';

  function isInvalid(datum) {
    return datum?.status?.aggregateSnapshot?.runStatus === 'Invalid';
  }

  function collectInvalid() {
    const items = [];

    document.querySelectorAll('g.processor, g.input-port, g.output-port').forEach((el) => {
      const d = el.__data__;
      if (d && isInvalid(d) && d.position && d.dimensions) items.push(d);
    });

    // process group: if it contains an invalid component
    document.querySelectorAll('g.process-group').forEach((el) => {
      const d = el.__data__;
      if (d && d.invalidCount > 0 && d.position && d.dimensions) items.push(d);
    });

    return items;
  }

  function render() {
    const layer = document.querySelector('#birdseye svg g.birdseye > g');
    if (!layer) return;

    const items = collectInvalid();
    const signature = items
      .map((d) => `${d.id}:${d.position.x},${d.position.y},${d.dimensions.width},${d.dimensions.height}`)
      .sort()
      .join('|');
    const existing = layer.querySelectorAll('.nd-bird-invalid').length;
    if (signature === lastSignature && existing === items.length) return;
    lastSignature = signature;

    layer.querySelectorAll('.nd-bird-invalid').forEach((el) => el.remove());

    for (const d of items) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', 'nd-bird-invalid');
      rect.setAttribute('x', String(d.position.x - PAD));
      rect.setAttribute('y', String(d.position.y - PAD));
      rect.setAttribute('width', String(d.dimensions.width + PAD * 2));
      rect.setAttribute('height', String(d.dimensions.height + PAD * 2));
      rect.setAttribute('rx', String(PAD / 2));
      layer.appendChild(rect);
    }
  }

  // NiFi continuously refreshes components; a light poll is enough to catch status changes.
  setInterval(render, 1500);
  render();
})();
