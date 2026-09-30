(() => {
  const download = document.querySelector('#download-pdf');
  const toast = document.querySelector('#toast');
  const show = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3500); };
  const clean = (value) => value.replace(/\s+/g, ' ').trim();
  const selected = (name) => [...document.querySelectorAll(`[name="${CSS.escape(name)}"]:checked`)].map(x => x.value);
  const valueFor = (input) => input.type === 'checkbox' || input.type === 'radio' ? '' : clean(input.value || '');
  function model() {
    const values = {};
    document.querySelectorAll('#evaluation-form input, #evaluation-form textarea').forEach(input => {
      const key = input.name;
      if (!key || key.endsWith('[]')) return;
      if (input.type === 'checkbox' || input.type === 'radio') return;
      values[key] = valueFor(input);
    });
    document.querySelectorAll('#evaluation-form input[type="checkbox"][name]').forEach(input => {
      if (input.name.endsWith('[]')) values[input.name.slice(0, -2)] = selected(input.name);
    });
    document.querySelectorAll('#evaluation-form input[type="radio"][name]').forEach(input => {
      values[input.name] = selected(input.name)[0] || '';
    });
    values.bodyMap = [...document.querySelectorAll('.body')].map(map => ({ view: map.dataset.map, regions: [...map.querySelectorAll('.part[data-state]:not([data-state="none"])')].map(x => ({ label: x.getAttribute('aria-label').split(':')[0], state: x.dataset.state })) }));
    return values;
  }
  function buildPdf(data) {
    if (!window.jspdf) throw new Error('Biblioteca de PDF indisponível. Verifique sua conexão e tente novamente.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const width = 210, margin = 16, right = width - margin;
    let y = 17, page = 1;
    const header = () => { pdf.setFillColor(22,40,54); pdf.rect(0,0,210,11,'F'); pdf.setTextColor(22,40,54); pdf.setFont('helvetica','bold'); pdf.setFontSize(15); pdf.text('SpineForm',margin,y); pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(100,130,151); pdf.text('Avaliação Fisioterapêutica da Coluna',margin,y+5); y += 13; pdf.setFont('helvetica','bold'); pdf.setTextColor(22,40,54); pdf.setFontSize(10); pdf.text('Ficha de Avaliação Clínica',margin,y); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5); pdf.text('Coluna Lombar e Dor na Perna Relacionada',margin,y+4.5); y += 8; };
    const footer = () => { pdf.setDrawColor(210,220,225); pdf.line(margin,286,right,286); pdf.setTextColor(108,115,120); pdf.setFontSize(7); pdf.text('SpineForm · Avaliação Clínica · Coluna Lombar',margin,291); pdf.text(`Página ${page}`,right,291,{align:'right'}); };
    const next = (needed = 10) => { if (y + needed < 282) return; footer(); pdf.addPage(); page++; y=17; header(); };
    const line = (text, bold = false) => { if (!text) return; const color = bold ? [22,40,54] : [63,82,93]; pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(bold?10:8.5); pdf.setTextColor(...color); const rows=pdf.splitTextToSize(text,right-margin); next(rows.length*4.2+3); pdf.text(rows,margin,y); y += rows.length*4.2+3; };
    const mapColors = { dor:[196,92,62], formigamento:[21,101,192], queimacao:[249,168,37], choque:[106,27,154], irradiacao:[46,125,50], none:[234,240,242] };
    const drawMap = (maps) => { next(55); const parts={head:[8,0,6,6],leftArm:[0,9,5,16],torso:[7,8,8,18],rightArm:[17,9,5,16],leftLeg:[7,28,4,18],rightLeg:[12,28,4,18]}; const draw=(x,view)=>{const states=maps.find(map=>map.view===view)?.regions||[];pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.setTextColor(22,40,54);pdf.text(view==='front'?'Frente':'Costas',x+10,y);Object.entries(parts).forEach(([key,[px,py,w,h]])=>{const state=states.find(s=>s.label===({head:'Cabeça',leftArm:'Braço esquerdo',torso:'Tronco',rightArm:'Braço direito',leftLeg:'Perna esquerda',rightLeg:'Perna direita'}[key]))?.state||'none';pdf.setFillColor(...mapColors[state]);pdf.setDrawColor(174,191,200);pdf.roundedRect(x+px,y+py+3,w,h,key==='head'?3:1,1,'FD')});};draw(margin+5,'front');draw(margin+43,'back');const legend=[['dor','Dor'],['formigamento','Formigamento'],['queimacao','Queimação'],['choque','Choque'],['irradiacao','Irradiação']];pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.setTextColor(22,40,54);pdf.text('Legenda',margin+88,y+4);legend.forEach(([state,label],index)=>{const legendY=y+9+(index*7);pdf.setFillColor(...mapColors[state]);pdf.setDrawColor(174,191,200);pdf.roundedRect(margin+88,legendY-3,4,4,.7,.7,'FD');pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);pdf.setTextColor(63,82,93);pdf.text(label,margin+95,legendY);});y+=53; };
    header();
    const cards = [...document.querySelectorAll('.card')];
    cards.forEach(card => {
      const title = clean(card.querySelector('h3').textContent); next(14); pdf.setFillColor(238,244,246); pdf.roundedRect(margin,y-3,right-margin,7,1,1,'F'); pdf.setFont('helvetica','bold'); pdf.setTextColor(22,40,54); pdf.setFontSize(10); pdf.text(title,margin+3,y+1.5); y += 10;
      card.querySelectorAll('.field,.subgroup,.note,.body-map').forEach(block => {
        if (block.classList.contains('body-map')) return;
        const label = block.querySelector(':scope > label,.group-title')?.textContent || block.querySelector('strong')?.textContent || '';
        const controls = [...block.querySelectorAll('input,textarea')];
        let answer = controls.map(input => input.type==='checkbox'||input.type==='radio' ? (input.checked?input.value:'') : input.value).filter(Boolean).join(', ');
        if (!answer) return;
        line(`${clean(label)}: ${clean(answer)}`);
      });
      if (title === 'Referências') card.querySelectorAll('.references p').forEach(reference => line(clean(reference.textContent)));
      if (title === 'Mapa Corporal') drawMap(data.bodyMap);
      y += 3;
    });
    footer();
    const patient = (data.patientName || 'paciente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/(^-|-$)/g,'').toLowerCase();
    pdf.save(`SpineForm-Avaliacao-Coluna-${patient || 'paciente'}.pdf`);
  }
  download.addEventListener('click', () => {
    const required = [...document.querySelectorAll('[required]')];
    required.forEach(x=>x.classList.toggle('error',!x.value));
    const screening = document.querySelector('[name="screeningResult"]:checked');
    if (required.some(x=>!x.value) || !screening) { show('Preencha Nome, Data da Avaliação, Queixa Principal e Resultado da triagem.'); document.querySelector('#s1').scrollIntoView({behavior:'smooth'}); return; }
    try { buildPdf(model()); show('PDF gerado com sucesso.'); } catch (error) { show(error.message); }
  });
})();
