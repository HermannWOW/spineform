// Shared anatomy, colors and state contract for the interactive map and vector PDF.
const BodyMap = (() => {
  const width = 300, height = 640;
  const symptoms = [
    { id:'none', label:'Sem marcação', color:'#edf3f6' },
    { id:'dor', label:'Dor', color:'#c45c3e' },
    { id:'formigamento', label:'Formigamento', color:'#1565c0' },
    { id:'queimacao', label:'Queimação', color:'#f9a825' },
    { id:'choque', label:'Choque', color:'#6a1b9a' },
    { id:'irradiacao', label:'Irradiação', color:'#2e7d32' }
  ];
  const views = { front:'Frente', back:'Costas' };
  const region = (id, label, path) => ({
    id, label,
    // Absolute move, line and cubic curves allow the same paths in SVG and jsPDF.
    commands: [...path.matchAll(/([MLCZ])([^MLCZ]*)/g)].map(([,op,values]) => ({
      op, c: values.trim() ? values.trim().split(/[ ,]+/).map(Number) : []
    }))
  });
  const head = region('head','Cabeça','M 150 16 C 133 16 125 28 125 46 C 122 46 123 58 127 59 C 129 71 139 81 150 82 C 161 81 171 71 173 59 C 177 58 178 46 175 46 C 175 28 167 16 150 16 Z');
  const neck = region('neck','Pescoço / cervical','M 138 78 C 139 89 139 97 130 103 L 150 113 L 170 103 C 161 97 161 89 162 78 C 154 83 146 83 138 78 Z');
  // Bilateral templates describe the viewer's left. Patient laterality reverses in front view.
  const paired = {
    Shoulder: ['Ombro','M 130 103 C 120 108 105 108 96 119 C 91 125 88 136 88 145 L 110 151 C 113 139 117 125 130 121 L 130 103 Z'],
    UpperArm: ['Braço (porção proximal)','M 88 145 C 83 157 79 173 77 188 L 99 193 C 103 179 107 164 110 151 L 88 145 Z'],
    Biceps: ['Bíceps','M 77 188 C 74 202 71 214 70 229 L 91 232 C 93 220 96 206 99 193 L 77 188 Z'],
    Forearm: ['Antebraço','M 70 229 C 64 246 61 265 58 284 L 54 306 L 69 311 C 73 294 80 279 84 261 C 88 247 91 239 91 232 L 70 229 Z'],
    Hand: ['Mão','M 54 306 C 49 316 44 330 44 337 C 44 342 48 341 51 333 L 48 353 C 47 359 51 360 53 354 L 56 340 L 54 359 C 54 365 58 365 59 359 L 62 341 L 61 357 C 61 362 65 362 66 356 L 68 340 L 68 352 C 68 357 72 355 73 350 C 77 332 75 324 69 311 L 54 306 Z'],
    Thigh: ['Coxa','M 112 293 C 107 325 110 353 113 375 L 116 416 L 143 416 C 147 387 148 363 148 345 L 148 310 C 136 308 123 303 112 293 Z'],
    Knee: ['Joelho','M 116 416 C 114 426 115 438 117 447 L 142 447 C 145 435 145 426 143 416 L 116 416 Z'],
    Shin: ['Canela','M 117 447 C 114 468 116 493 120 516 C 123 530 122 542 123 555 L 138 555 C 139 536 143 516 144 495 C 145 475 145 460 142 447 L 117 447 Z'],
    Ankle: ['Tornozelo','M 123 555 C 123 565 122 573 120 583 L 139 584 C 137 573 138 566 138 555 L 123 555 Z'],
    Foot: ['Pé','M 120 583 C 116 591 107 600 107 607 C 107 614 132 615 139 609 C 143 604 141 592 139 584 L 120 583 Z']
  };
  const bilateral = (view, name, path = paired[name][1], label = paired[name][0]) => ['left','right'].map(side => {
    const feminine = ['Hand','Thigh','Shin','Calf'].includes(name);
    const laterality = side === 'left' ? (feminine ? 'esquerda' : 'esquerdo') : (feminine ? 'direita' : 'direito');
    const item = region(`${side}${name}`,`${label} ${laterality}${view === 'back' ? ' posterior' : ''}`,path);
    const mirror = view === 'front' ? side === 'left' : side === 'right';
    if (mirror) item.commands = item.commands.map(({op,c}) => ({op,c:c.map((value,index) => index % 2 === 0 ? width - value : value)}));
    return item;
  });
  const front = [head, neck, ...bilateral('front','Shoulder'),
    region('chest','Peitoral / tórax superior','M 130 103 L 150 113 L 170 103 L 170 121 C 183 125 187 139 190 151 L 184 174 C 163 179 137 179 116 174 L 110 151 C 113 139 117 125 130 121 Z'),
    region('abdomen','Abdômen','M 116 174 C 120 195 124 217 119 241 C 138 250 162 250 181 241 C 176 217 180 195 184 174 C 163 179 137 179 116 174 Z'),
    region('pelvis','Quadril / pelve','M 119 241 C 115 258 112 274 112 293 C 123 303 136 308 148 310 L 150 304 L 152 310 C 164 308 177 303 188 293 C 188 274 185 258 181 241 C 162 250 138 250 119 241 Z'),
    ...['UpperArm','Biceps','Forearm','Hand','Thigh','Knee','Shin','Ankle','Foot'].flatMap(name => bilateral('front',name))
  ];
  const back = [
    {...head,label:'Cabeça posterior'}, {...neck,label:'Cervical posterior'}, ...bilateral('back','Shoulder'),
    region('upperBack','Região escapular / torácica alta','M 130 103 L 150 113 L 170 103 L 170 121 C 183 125 187 139 190 151 L 184 174 C 163 179 137 179 116 174 L 110 151 C 113 139 117 125 130 121 Z'),
    region('midBack','Região torácica média','M 116 174 C 120 191 123 206 123 219 C 140 224 160 224 177 219 C 177 206 180 191 184 174 C 163 179 137 179 116 174 Z'),
    region('lowerBack','Lombar','M 123 219 C 124 233 117 250 115 263 C 135 267 165 267 185 263 C 183 250 176 233 177 219 C 160 224 140 224 123 219 Z'),
    ...bilateral('back','Glute','M 115 263 C 113 272 112 282 112 293 C 123 303 136 308 148 310 L 150 304 L 150 266 C 138 267 126 266 115 263 Z','Glúteo'),
    ...bilateral('back','UpperArm','M 88 145 C 80 165 73 203 70 229 L 91 232 C 94 211 104 173 110 151 L 88 145 Z','Braço'),
    ...['Forearm','Hand','Thigh','Knee'].flatMap(name => bilateral('back',name)),
    ...bilateral('back','Calf',paired.Shin[1],'Panturrilha'),
    ...['Ankle','Foot'].flatMap(name => bilateral('back',name))
  ];
  const regions = { front, back };
  const createState = () => Object.fromEntries(Object.entries(regions).map(([view,items]) => [view,Object.fromEntries(items.map(item => [item.id,'none']))]));
  const nextState = current => symptoms[(symptoms.findIndex(item => item.id === current) + 1) % symptoms.length].id;
  const symptom = state => symptoms.find(item => item.id === state) || symptoms[0];
  const render = view => `<div class="body-map" data-view="${view}">
    <strong id="map-${view}-title">${views[view]}</strong>
    <p class="body-orientation">Lados do paciente · ${view === 'front' ? 'direito à sua esquerda' : 'esquerdo à sua esquerda'}</p>
    <svg class="body" data-map="${view}" viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="map-${view}-title" aria-describedby="body-map-help">
      ${regions[view].map(item => `<path id="${view}-${item.id}" class="part" data-region="${item.id}" data-state="none" d="${item.commands.map(({op,c}) => `${op} ${c.join(' ')}`).join(' ')}" fill="${symptom('none').color}" stroke="#a8bac5" stroke-width="1" stroke-linejoin="round" role="button" tabindex="0" aria-label="${item.label}: Sem marcação" aria-describedby="body-map-help"><title>${item.label}: Sem marcação</title></path>`).join('')}
    </svg>
    <div class="body-map-controls"><label for="map-${view}-region">Marcação por região</label>
      <select id="map-${view}-region" class="input region-select">${regions[view].map(item => `<option value="${item.id}">${item.label}</option>`).join('')}</select>
      <button type="button" class="region-cycle" aria-controls="${view}-head">Próximo sintoma</button>
      <p class="region-status" role="status" aria-live="polite" aria-atomic="true">Cabeça${view === 'back' ? ' posterior' : ''}: Sem marcação</p>
    </div>
  </div>`;
  return { width, height, symptoms, views, regions, createState, nextState, symptom, render };
})();
