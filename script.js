/* بصمتك المناخية — Vanilla JavaScript بدون مكتبات.
   الأقسام: 0) أدوات  1) التنقل  2) الحاسبة  3) الحلول  4) الاختبار  5) التحدي  */
(() => {
  'use strict';

  /* ---------- 0) أدوات مساعدة ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // تخزين محلي آمن: إن تعذّر localStorage (مثل الوضع الخاص) نستخدم الذاكرة المؤقتة ويستمر الموقع بالعمل
  const mem = {};
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); if (v !== null) return JSON.parse(v); } catch (e) { /* نستخدم الذاكرة */ }
      return k in mem ? mem[k] : d;
    },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* تجاهل */ } }
  };
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  /* ---------- 1) التنقل وشاشة التعريف ---------- */
  const views = $$('.view');
  const menu = $('#menu'), menuBtn = $('#menuBtn'), intro = $('#intro');

  function showView() {
    let id = location.hash.slice(1);
    if (!views.some(v => v.id === id)) id = 'home';
    views.forEach(v => { v.hidden = v.id !== id; });
    $$('.menu a').forEach(a => {
      const on = a.dataset.view === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', showView);
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  const openIntro = () => { intro.hidden = false; $('#introStart').focus(); };
  const closeIntro = () => { intro.hidden = true; store.set('cf_intro_seen', true); };
  // $('#introStart').addEventListener('click', closeIntro);
  $('#aboutBtn').addEventListener('click', openIntro);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !intro.hidden) closeIntro(); });

  /* ---------- 2) حاسبة البصمة (مؤشر توعوي) ----------
     المنهجية: كل سؤال له 3 خيارات بنقاط أثر 0 أو 1 أو 2 حسب مدى استدامة العادة.
     النسبة = مجموع النقاط ÷ أقصى مجموع ممكن × 100. لا توجد أي معاملات انبعاث أو أرقام علمية. */
  const CATS = {
    elec: { name: 'الكهرباء', icon: '⚡' },
    water: { name: 'المياه', icon: '💧' },
    trans: { name: 'النقل', icon: '🚌' }
  };
  const QUESTIONS = [
    { id: 'e1', cat: 'elec', q: 'كيف تتعامل مع المكيّف في المنزل؟', o: [
      ['أضبطه على درجة معتدلة وأطفئه عند مغادرة الغرفة', 0], ['أطفئه أحيانًا وأنسى أحيانًا', 1], ['يعمل طوال اليوم على أبرد درجة', 2]] },
    { id: 'e2', cat: 'elec', q: 'ماذا عن الإضاءة والأجهزة الكهربائية؟', o: [
      ['معظم الإضاءة LED وأفصل الأجهزة غير المستخدمة', 0], ['بعضها موفّر للطاقة وبعضها لا', 1], ['لا أنتبه لكفاءتها ولا لإطفائها', 2]] },
    { id: 'e3', cat: 'elec', q: 'هل تستفيد من العزل الحراري أو الطاقة الشمسية؟', o: [
      ['نعم، مسكني فيه عزل جيد أو ألواح أو سخان شمسي', 0], ['أفكر في ذلك ولم أنفذ بعد', 1], ['لا شيء من ذلك', 2]] },
    { id: 'w1', cat: 'water', q: 'كيف تستخدم الماء أثناء الاستحمام؟', o: [
      ['استحمام قصير وأغلق الماء أثناء التصبين', 0], ['استحمام متوسط المدة', 1], ['استحمام طويل والماء يجري دون حاجة', 2]] },
    { id: 'w2', cat: 'water', q: 'كيف تغسل السيارة أو تسقي النباتات؟', o: [
      ['بدلو أو بالتنقيط وفي المساء، أو بمياه معاد استخدامها', 0], ['بالخرطوم أحيانًا', 1], ['بالخرطوم وبكثرة وفي أي وقت', 2]] },
    { id: 'w3', cat: 'water', q: 'كيف تتعامل مع تسريب الصنابير والأنابيب؟', o: [
      ['أصلحه فورًا وأغلق الصنبور عند عدم الحاجة', 0], ['أصلحه بعد فترة', 1], ['لا أتابع الأمر', 2]] },
    { id: 't1', cat: 'trans', q: 'ما وسيلتك الأكثر استخدامًا للتنقل؟', o: [
      ['المشي أو الدراجة أو النقل العام', 0], ['مركبة مشتركة أو كهربائية/هجينة', 1], ['سيارة خاصة بمفردي', 2]] },
    { id: 't2', cat: 'trans', q: 'كيف تخطط لمشاويرك اليومية؟', o: [
      ['أجمع المشاوير في رحلة واحدة', 0], ['أخطط أحيانًا', 1], ['أخرج برحلات منفصلة كثيرة', 2]] },
    { id: 't3', cat: 'trans', q: 'كم تعتمد على السفر الجوي أو الرحلات الطويلة؟', o: [
      ['نادرًا، وأفضّل الاجتماعات والمعاملات عن بُعد', 0], ['مرات قليلة في السنة', 1], ['كثيرًا', 2]] }
  ];
  const TIPS = {
    elec: ['اضبط المكيّف على درجة معتدلة وأطفئه عند الخروج.', 'استبدل المصابيح التقليدية بمصابيح LED.', 'ابحث عن عزل حراري أو سخان شمسي لمسكنك.'],
    water: ['قصّر مدة الاستحمام وأغلق الصنبور أثناء التصبين.', 'اسقِ النباتات مساءً وبالتنقيط إن أمكن.', 'افحص الصنابير والأنابيب بانتظام وأصلح التسريب.'],
    trans: ['جرّب المشي أو النقل العام للمشاوير القريبة.', 'شارك سيارتك مع زملاء أو أصدقاء عند الإمكان.', 'اجمع مشاويرك في رحلة واحدة وفضّل الاجتماعات عن بُعد.']
  };

  const form = $('#calcForm'), calcError = $('#calcError'), calcResult = $('#calcResult');

  function buildForm() {
    form.innerHTML = '';
    Object.keys(CATS).forEach(key => {
      const fs = document.createElement('fieldset');
      fs.innerHTML = `<legend>${CATS[key].icon} ${CATS[key].name}</legend>`;
      QUESTIONS.filter(x => x.cat === key).forEach(q => {
        const box = document.createElement('div');
        box.className = 'q'; box.id = 'box-' + q.id;
        box.innerHTML = `<p>${q.q}</p><div class="opts">` + q.o.map((o, i) =>
          `<label class="opt"><input type="radio" name="${q.id}" value="${o[1]}" id="${q.id}-${i}"><span>${o[0]}</span></label>`).join('') + '</div>';
        fs.appendChild(box);
      });
      form.appendChild(fs);
    });
    const act = document.createElement('div');
    act.className = 'actions';
    act.innerHTML = '<button class="btn" type="submit">اعرض مؤشري</button><button class="btn ghost" type="reset">إعادة الإجابة</button>';
    form.appendChild(act);
  }

  function band(pct) {
    if (pct <= 33) return { c: '#2f9e66', t: 'أثر منخفض تقديريًا', d: 'عاداتك الحالية صديقة للبيئة في معظمها. استمر وشارك غيرك هذه العادات.' };
    if (pct <= 66) return { c: '#e0a100', t: 'أثر متوسط تقديريًا', d: 'لديك عادات جيدة وفرص واضحة للتحسين. ابدأ بالمجال الأعلى في الرسم أدناه.' };
    return { c: '#c0392b', t: 'أثر مرتفع تقديريًا', d: 'هناك فرص كبيرة للتحسين. خطوات صغيرة ومتدرجة تصنع فرقًا، فابدأ بتغيير عادة واحدة اليوم.' };
  }

  function calculate(answers) { // answers: {id: points}
    const cats = {};
    Object.keys(CATS).forEach(k => { cats[k] = { sum: 0, max: 0 }; });
    QUESTIONS.forEach(q => { cats[q.cat].sum += answers[q.id]; cats[q.cat].max += 2; });
    const sum = Object.values(cats).reduce((a, c) => a + c.sum, 0);
    const max = Object.values(cats).reduce((a, c) => a + c.max, 0);
    return { cats, pct: Math.round(sum / max * 100) };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const answers = {};
    let firstMissing = null;
    QUESTIONS.forEach(q => {
      const sel = form.querySelector(`input[name="${q.id}"]:checked`);
      const box = $('#box-' + q.id);
      box.classList.toggle('missing', !sel);
      if (sel) answers[q.id] = Number(sel.value); else if (!firstMissing) firstMissing = box;
    });
    if (firstMissing) {
      calcError.textContent = 'أجب عن جميع الأسئلة أولًا. الأسئلة غير المجابة معلّمة باللون الأحمر.';
      calcError.hidden = false; calcResult.hidden = true;
      firstMissing.scrollIntoView({ block: 'center' });
      return;
    }
    calcError.hidden = true;
    const r = calculate(answers), b = band(r.pct);
    const bars = Object.keys(CATS).map(k => {
      const p = Math.round(r.cats[k].sum / r.cats[k].max * 100);
      return `<div class="bar"><b><span>${CATS[k].icon} ${CATS[k].name}</span><span>${p}%</span></b><div class="track"><i style="width:${p}%"></i></div></div>`;
    }).join('');
    const high = Object.keys(CATS).filter(k => r.cats[k].sum / r.cats[k].max >= 0.5);
    const tips = high.length
      ? high.map(k => `<h3>${CATS[k].icon} نصائح في ${CATS[k].name}</h3><ul class="tips">${TIPS[k].map(t => `<li>${t}</li>`).join('')}</ul>`).join('')
      : '<p class="ok">لا توجد مجالات مرتفعة الأثر في إجاباتك. أحسنت! جرّب «تحدي اليوم» لتواصل التميز.</p>';
    calcResult.innerHTML = `
      <h2 style="margin-top:0">نتيجتك التوعوية</h2>
      <div class="meter"><div class="ring" style="--p:${r.pct};--c:${b.c}"><span>${r.pct}%</span></div>
      <div><h3>${b.t}</h3><p>${b.d}</p></div></div>
      <h3>توزيع الأثر حسب المجال</h3><div class="bars">${bars}</div>
      <p><strong>كيف فُسِّرت النتيجة؟</strong> أعطينا كل إجابة نقطة أثر (0 للأفضل استدامة، 1 للمتوسط، 2 للأعلى أثرًا)، ثم قسمنا مجموع نقاطك على أقصى مجموع ممكن. الأرقام هنا مقياس مقارن لعاداتك وليست كمية انبعاثات.</p>
      ${tips}
      <p class="warn">هذا مؤشر توعوي تقديري وليس قياسًا علميًا دقيقًا. لحساب دقيق للانبعاثات استخدم أدوات متخصصة ومعتمدة.</p>
      <div class="actions"><button class="btn ghost" id="again" type="button">أعد الحساب</button></div>`;
    calcResult.hidden = false;
    calcResult.focus();
    $('#again').addEventListener('click', () => { form.reset(); calcResult.hidden = true; window.scrollTo(0, 0); });
  });
  form.addEventListener('reset', () => { calcError.hidden = true; calcResult.hidden = true; $$('.q.missing').forEach(q => q.classList.remove('missing')); });

  /* ---------- 3) الحلول التكنولوجية ---------- */
  const SOLUTIONS = [
    { i: '☀️', t: 'الطاقة المتجددة', idea: 'توليد الكهرباء من مصادر تتجدد باستمرار كالشمس والرياح بدل حرق الوقود الأحفوري.',
      why: 'حرق الوقود الأحفوري من أبرز أسباب التغير المناخي، فيساعد التوسع في الطاقة المتجددة على تقليل الاعتماد عليه.',
      ex: ['ألواح شمسية على أسطح المنازل والمباني', 'سخانات المياه الشمسية', 'محطات الطاقة الشمسية وطاقة الرياح'],
      ctx: 'تعمل المملكة العربية السعودية على التوسع في الطاقة المتجددة ضمن مبادرة السعودية الخضراء ورؤية 2030.',
      src: [['IEA', 'https://www.iea.org'], ['مبادرة السعودية الخضراء', 'https://www.sgi.gov.sa']] },
    { i: '🌾', t: 'الزراعة الذكية', idea: 'استخدام الحساسات والبيانات لمعرفة حاجة النبات الفعلية من الماء والسماد وتوفير الموارد.',
      why: 'تقلل الهدر في المياه والأسمدة وتساعد على إنتاج الغذاء بموارد أقل، وهذا مهم في المناطق الجافة.',
      ex: ['حساسات رطوبة التربة', 'الري بالتنقيط', 'الزراعة المائية والبيوت المحمية'],
      ctx: 'الزراعة في البيئات الجافة تحتاج إدارة دقيقة للمياه، والتقنية تساعد على ذلك.',
      src: [['FAO', 'https://www.fao.org']] },
    { i: '💧', t: 'ترشيد المياه', idea: 'تقنيات وسلوكيات تقلل استهلاك الماء وتكشف الهدر وتعيد استخدام المياه حيث يمكن.',
      why: 'المياه العذبة محدودة، وتغير المناخ يزيد الضغط عليها في كثير من مناطق العالم.',
      ex: ['العدادات الذكية وأجهزة كشف التسرب', 'الصنابير والدشات الموفرة', 'إعادة استخدام المياه الرمادية في الري'],
      ctx: 'تُعد المنطقة العربية من أكثر مناطق العالم شحًا في المياه العذبة، فالترشيد أولوية.',
      src: [['UN-Water', 'https://www.unwater.org']] },
    { i: '🚌', t: 'النقل المستدام', idea: 'وسائل تنقل تستهلك طاقة أقل وتنتج انبعاثات أقل لكل راكب.',
      why: 'قطاع النقل مصدر مهم لانبعاثات الغازات المسببة للاحتباس الحراري، وتحسين خيارات التنقل يقلل أثره.',
      ex: ['النقل العام والمترو', 'المركبات الكهربائية والهجينة', 'المشي وركوب الدراجات ومشاركة المركبات'],
      ctx: 'تستثمر مدن في المنطقة في شبكات النقل العام والمركبات الكهربائية.',
      src: [['UNEP', 'https://www.unep.org'], ['IEA', 'https://www.iea.org']] }
  ];
  $('#solList').innerHTML = SOLUTIONS.map(s => `
    <details><summary><span aria-hidden="true">${s.i}</span>${s.t}</summary><div class="body">
      <p>${s.idea}</p>
      <h4>لماذا هي مهمة؟</h4><p>${s.why}</p>
      <h4>أمثلة</h4><ul>${s.ex.map(x => `<li>${x}</li>`).join('')}</ul>
      <h4>في سياقنا</h4><p>${s.ctx}</p>
      <p class="src">المصادر: ${s.src.map(x => `<a href="${x[1]}" target="_blank" rel="noopener">${x[0]}</a>`).join(' · ')}</p>
    </div></details>`).join('');

  /* ---------- 4) الاختبار التفاعلي ---------- */
  const QUIZ = [
    { q: 'ما المحرك الرئيسي للتغير المناخي منذ القرن التاسع عشر بحسب الهيئات العلمية؟', a: 'الأنشطة البشرية وفي مقدمتها حرق الوقود الأحفوري', w: ['تغير ميل المحور الأرضي', 'تغير حجم القمر', 'الانفجارات البركانية وحدها'],
      e: 'تؤكد الهيئات العلمية أن الأنشطة البشرية هي المحرك الرئيسي، وأهمها حرق الفحم والنفط والغاز.', s: 'NASA / IPCC' },
    { q: 'أي غاز من الغازات التالية يُعد من أبرز غازات الاحتباس الحراري؟', a: 'ثاني أكسيد الكربون', w: ['الأكسجين', 'النيتروجين', 'الهيليوم'],
      e: 'ثاني أكسيد الكربون من أبرز غازات الاحتباس الحراري، وينتج بكثرة عن حرق الوقود الأحفوري.', s: 'NASA Climate' },
    { q: 'ما الفرق بين الطقس والمناخ؟', a: 'المناخ هو متوسط الطقس على مدى سنوات طويلة', w: ['هما شيء واحد', 'الطقس يُقاس بالسنوات والمناخ بالساعات', 'المناخ يخص الصحراء فقط'],
      e: 'الطقس حالة الجو الآن، أما المناخ فهو النمط العام والمتوسط على مدى فترات طويلة.', s: 'NASA Climate' },
    { q: 'أي مما يلي مصدر للطاقة المتجددة؟', a: 'الطاقة الشمسية', w: ['الفحم', 'الغاز الطبيعي', 'النفط'],
      e: 'الشمس والرياح مصادر تتجدد باستمرار، أما الفحم والنفط والغاز فوقود أحفوري.', s: 'IEA' },
    { q: 'ما فائدة الري بالتنقيط في الزراعة؟', a: 'إيصال الماء إلى جذور النبات مباشرة وتقليل الهدر', w: ['زيادة تبخر الماء', 'استخدام ماء أكثر', 'منع النمو'],
      e: 'يوصل الري بالتنقيط الماء قرب الجذور بكميات محسوبة فيقل الهدر.', s: 'FAO' },
    { q: 'أي سلوك يساعد على تقليل استهلاك الكهرباء في المنزل؟', a: 'استخدام إضاءة LED وإطفاء الأجهزة غير المستخدمة', w: ['ترك الأجهزة في وضع التشغيل', 'تشغيل المكيّف مع فتح النوافذ', 'إضاءة كل الغرف طوال اليوم'],
      e: 'الإضاءة الموفرة للطاقة والانتباه لإطفاء الأجهزة من أبسط وسائل خفض الاستهلاك.', s: 'IEA' },
    { q: 'لماذا يساعد النقل العام والمشي على حماية المناخ؟', a: 'لأنها تقلل الانبعاثات الناتجة عن كل شخص مقارنة بالسيارة الخاصة', w: ['لأنها لا تحتاج إلى أي طاقة', 'لأنها تزيد عدد السيارات', 'لأنها تحرق وقودًا أكثر لكل راكب'],
      e: 'نقل عدد كبير من الركاب معًا أو الاستغناء عن المركبة يخفض الانبعاثات لكل فرد.', s: 'UNEP' },
    { q: 'لماذا يُعد ترشيد المياه مهمًا في المنطقة العربية؟', a: 'لأن مصادر المياه العذبة فيها محدودة', w: ['لأن المياه فيها لا تنتهي', 'لأن الأمطار غزيرة طوال العام', 'لأن المياه لا تُستخدم في الزراعة'],
      e: 'تُصنف المنطقة العربية ضمن المناطق الأكثر شحًا في المياه العذبة، لذلك يزداد أثر كل لتر نوفره.', s: 'UN-Water' }
  ];
  const quizBox = $('#quizBox');
  let qs;
  function startQuiz() { qs = { i: 0, score: 0, log: [], items: shuffle(QUIZ).map(x => ({ ...x, opts: shuffle([x.a, ...x.w]) })) }; renderQ(); }
  function renderQ() {
    const x = qs.items[qs.i], n = qs.items.length;
    quizBox.innerHTML = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${qs.i}"><i style="width:${qs.i / n * 100}%"></i></div>
      <p class="chip">السؤال ${qs.i + 1} من ${n}</p><h2 style="margin-top:0">${x.q}</h2>
      <div class="qopts">${x.opts.map((o, k) => `<button type="button" class="qopt" data-k="${k}">${o}</button>`).join('')}</div>
      <div id="fb" aria-live="polite"></div>`;
    $$('.qopt', quizBox).forEach(b => b.addEventListener('click', () => answer(b, x)));
  }
  function answer(btn, x) {
    const picked = x.opts[Number(btn.dataset.k)], ok = picked === x.a;
    if (ok) qs.score++;
    qs.log.push({ q: x.q, picked, a: x.a, ok, e: x.e, s: x.s });
    $$('.qopt', quizBox).forEach(b => { b.disabled = true; const t = x.opts[Number(b.dataset.k)]; if (t === x.a) b.classList.add('right'); else if (b === btn) b.classList.add('wrong'); });
    const last = qs.i === qs.items.length - 1;
    $('#fb').innerHTML = `<div class="feedback"><strong class="${ok ? 'tag-ok' : 'tag-no'}">${ok ? 'إجابة صحيحة ✓' : 'إجابة غير صحيحة ✗'}</strong><br>${x.e}<br><span class="src">المصدر: ${x.s}</span></div>
      <button class="btn" id="nextQ" type="button">${last ? 'عرض النتيجة' : 'السؤال التالي'}</button>`;
    $('#nextQ').focus();
    $('#nextQ').addEventListener('click', () => { qs.i++; if (qs.i < qs.items.length) renderQ(); else renderResult(); });
  }
  function renderResult() {
    const n = qs.items.length, p = Math.round(qs.score / n * 100);
    const msg = p >= 80 ? 'ممتاز! لديك وعي مناخي رائع.' : p >= 50 ? 'جيد! راجع التصحيح أدناه لتتعلم أكثر.' : 'بداية جيدة. راجع التصحيح أدناه وأعد المحاولة.';
    const best = Math.max(store.get('cf_best', 0), p); store.set('cf_best', best);
    quizBox.innerHTML = `<h2 style="margin-top:0">نتيجتك: ${qs.score} من ${n} (${p}%)</h2><p class="ok">${msg}</p><p class="note">أفضل نتيجة على هذا الجهاز: ${best}%</p>
      <h3>تصحيح الإجابات</h3><ol class="review">${qs.log.map(l => `<li>${l.q}<br>
      <span class="${l.ok ? 'tag-ok' : 'tag-no'}">إجابتك: ${l.picked} ${l.ok ? '✓' : '✗'}</span>${l.ok ? '' : `<br><span class="tag-ok">الصحيح: ${l.a}</span>`}<br><span class="src">${l.e} (${l.s})</span></li>`).join('')}</ol>
      <button class="btn" id="retry" type="button">أعد الاختبار</button>`;
    $('#retry').addEventListener('click', startQuiz);
  }

  /* ---------- 5) تحدي اليوم ---------- */
  const CHALLENGES = [
    ['الكهرباء', 'أطفئ كل جهاز غير مستخدم في غرفتك قبل الخروج.', 'الأجهزة المتروكة في وضع التشغيل تستهلك كهرباء دون فائدة.'],
    ['الكهرباء', 'استبدل مصباحًا تقليديًا واحدًا بمصباح LED، أو ابحث عن مصابيح موفرة في منزلك.', 'الإضاءة الموفرة تستهلك طاقة أقل لإنتاج الضوء نفسه.'],
    ['الكهرباء', 'اضبط المكيّف اليوم على درجة معتدلة وأغلق الأبواب والنوافذ.', 'الدرجة المعتدلة وإحكام الإغلاق يقللان حمل التبريد.'],
    ['الكهرباء', 'افصل شواحن الأجهزة من المقبس بعد انتهاء الشحن.', 'عادة بسيطة تقلل الاستهلاك غير الضروري.'],
    ['المياه', 'اجعل استحمامك اليوم أقصر من المعتاد.', 'كل لتر نوفره يخفف الضغط على موارد المياه العذبة المحدودة.'],
    ['المياه', 'أغلق الصنبور أثناء تفريش الأسنان أو غسل الأطباق.', 'الماء الجاري دون حاجة هدر يمكن تجنبه بسهولة.'],
    ['المياه', 'افحص صنبورًا أو سيفونًا في بيتك بحثًا عن تسريب، وأبلغ الأسرة إن وجدته.', 'التسريب الصغير المستمر يضيّع ماءً كثيرًا مع الوقت.'],
    ['المياه', 'أعد استخدام ماء غسل الخضار لسقاية نبتة.', 'إعادة الاستخدام تعطي الماء فائدة ثانية.'],
    ['النقل', 'امشِ أو استخدم الدراجة لمشوار قريب بدل السيارة.', 'التنقل بلا محرك لا ينتج انبعاثات وهو مفيد لصحتك.'],
    ['النقل', 'شارك السيارة مع زميل أو قريب في مشوار مشترك اليوم.', 'مقعد مشغول في سيارة قائمة أفضل من سيارة إضافية.'],
    ['النقل', 'اجمع مشاويرك اليوم في رحلة واحدة مخططة.', 'تقل المسافة المقطوعة ويقل استهلاك الوقود.'],
    ['الاستهلاك', 'ارفض كيس بلاستيك واحد اليوم واستخدم حقيبة قابلة لإعادة الاستخدام.', 'تقليل المهملات من المصدر أفضل من التخلص منها.'],
    ['الاستهلاك', 'خطط لوجباتك اليوم بحيث لا يُهدر أي طعام.', 'هدر الطعام يهدر معه الماء والطاقة المستخدمين في إنتاجه.'],
    ['التوعية', 'أخبر صديقًا أو فردًا من أسرتك بمعلومة واحدة تعلمتها في هذا الموقع.', 'نشر الوعي يضاعف أثر الفعل الفردي.']
  ];
  const chCat = $('#chCat'), chText = $('#chText'), chWhy = $('#chWhy'), chMsg = $('#chMsg'), chDone = $('#chDone');
  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const dayIndex = () => { const d = new Date(), s = new Date(d.getFullYear(), 0, 0); return Math.floor((d - s) / 86400000) % CHALLENGES.length; };
  let chIdx = dayIndex();
  function renderChallenge() {
    const c = CHALLENGES[chIdx];
    chCat.textContent = c[0]; chText.textContent = c[1]; chWhy.textContent = 'لماذا؟ ' + c[2];
    $('#chCount').textContent = store.get('cf_done', 0);
    const doneToday = store.get('cf_done_ids', {})[todayKey() + '#' + chIdx];
    chDone.disabled = !!doneToday;
    chMsg.textContent = doneToday ? 'أحسنت! أنجزت هذا التحدي اليوم 🌱' : '';
  }
  chDone.addEventListener('click', () => {
    const ids = store.get('cf_done_ids', {}), k = todayKey() + '#' + chIdx;
    if (!ids[k]) { ids[k] = true; store.set('cf_done_ids', ids); store.set('cf_done', store.get('cf_done', 0) + 1); }
    renderChallenge();
  });
  $('#chNext').addEventListener('click', () => { chIdx = (chIdx + 1) % CHALLENGES.length; renderChallenge(); });

  /* ---------- تشغيل ---------- */
  buildForm();
  startQuiz();
  renderChallenge();
  showView();
  if (!store.get('cf_intro_seen', false)) openIntro();
})();
