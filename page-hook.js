// Sayfanın kendi JS dünyasında (world: "MAIN") çalışır. NiFi, bileşen verisini (konum, boyut, durum)
// D3 ile DOM öğelerine __data__ olarak bağlıyor; bu bilgi eklentinin izole dünyasından görünmez.
//
// Navigate panelindeki minimap bir <canvas>'a çiziliyor, bu yüzden CSS ile boyanamaz. NiFi minimap'in
// SVG katmanındaki boş grubun (g.birdseye > g) dönüşümünü zaten ölçek ve kaydırmaya göre güncelliyor;
// invalid bileşenler için bu gruba bileşen koordinatlarıyla sarı işaretler ekliyoruz. Görünümü dark.css
// belirler (yalnızca dark mode açıkken görünür, yanıp söner).

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PAD = 36; // minimap çok küçük ölçekte olduğu için işareti bileşenden biraz büyük çiziyoruz

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

    // process group: içinde invalid bileşen varsa
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

  // NiFi bileşenleri sürekli yeniler; durum değişimini yakalamak için hafif bir yoklama yeterli.
  setInterval(render, 1500);
  render();
})();
