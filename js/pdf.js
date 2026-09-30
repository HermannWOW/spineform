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
    values.bodyMap = Object.fromEntries(Object.entries(bodyMapState).map(([view,states]) => [view,{...states}]));
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
    const drawMap = maps => {
      const scale = .17, diagramHeight = BodyMap.height * scale;
      next(diagramHeight + 12);
      const top = y + 4;
      Object.entries(BodyMap.views).forEach(([view,label],index) => {
        const x = margin + 4 + index * 59;
        pdf.setFont('helvetica','bold');
        pdf.setFontSize(8);
        pdf.setTextColor(22,40,54);
        pdf.text(label,x + BodyMap.width * scale / 2,y,{align:'center'});
        pdf.setDrawColor('#a8bac5');
        pdf.setLineWidth(scale);
        BodyMap.regions[view].forEach(region => {
          pdf.setFillColor(BodyMap.symptom(maps[view][region.id]).color);
          const path = region.commands.map(({op,c}) => ({
            op: op === 'Z' ? 'h' : op.toLowerCase(),
            c: c.map((value,index) => value * scale + (index % 2 === 0 ? x : top))
          }));
          pdf.path(path).fillStroke();
        });
      });
      const legendX = margin + 126;
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(8);
      pdf.setTextColor(22,40,54);
      pdf.text('Legenda',legendX,y + 4);
      BodyMap.symptoms.slice(1).forEach((item,index) => {
        const legendY = y + 11 + index * 8;
        pdf.setFillColor(item.color);
        pdf.roundedRect(legendX,legendY - 3,4,4,.7,.7,'FD');
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(63,82,93);
        pdf.text(item.label,legendX + 7,legendY);
      });
      pdf.setDrawColor(210,220,225);
      pdf.setLineWidth(.2);
      y = top + diagramHeight + 3;
      // Text makes each marked region explicit as well as preserving the visual diagram.
      Object.entries(BodyMap.views).forEach(([view,label]) => {
        const marked = BodyMap.regions[view].filter(region => maps[view][region.id] !== 'none');
        line(`${label}: ${marked.length ? marked.map(region => `${region.label}: ${BodyMap.symptom(maps[view][region.id]).label}`).join('; ') : 'sem marcações'}`);
      });
    };
    header();
    const cards = [...document.querySelectorAll('.card')];
    cards.forEach(card => {
      const title = clean(card.querySelector('h3').textContent); next(title === 'Mapa Corporal' ? 138 : 14); pdf.setFillColor(238,244,246); pdf.roundedRect(margin,y-3,right-margin,7,1,1,'F'); pdf.setFont('helvetica','bold'); pdf.setTextColor(22,40,54); pdf.setFontSize(10); pdf.text(title,margin+3,y+1.5); y += 10;
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
