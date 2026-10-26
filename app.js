
  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try{localStorage.setItem('theme',next)}catch{}
  }

  (function() {
    let saved;try{saved=localStorage.getItem('theme')}catch{}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();

  // ========== 1. CURSOR PARTICLES - REMOVED ==========

  // The main heading is visible immediately to avoid layout shifts.

  // ========== 3. GLITCH ON SCROLL - REMOVED ==========

  // ========== 4. 3D PERSPECTIVE ON SERVICE CARDS ==========
  (function() {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        this.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  })();

  // ========== 5. NEON GRID CANVAS ==========
  (function() {
    const canvas = document.getElementById('neonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx)return;
    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const gridSize = 60;
    let offset = 0;
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const lineColor = isDark() ? 'rgba(255,92,0,0.08)' : 'rgba(255,92,0,0.06)';
      const dotColor = isDark() ? 'rgba(255,255,255,0.15)' : 'rgba(255,92,0,0.2)';

      offset = (offset + 0.3) % gridSize;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      // Horizontal lines moving down
      for (let y = offset; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Vertical lines
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Intersection dots
      ctx.fillStyle = dotColor;
      for (let x = 0; x < w; x += gridSize) {
        for (let y = offset; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(draw);
    }
    draw();
  })();


document.getElementById('themeToggle').addEventListener('click',toggleTheme);

(function(){
  const form=document.getElementById('leadForm'),errorEl=document.getElementById('formError'),okEl=document.getElementById('formOk');
  if(!form)return;
  const id=form.elements.submission_id;
  let pendingFingerprint='',sending=false;
  function newId(){id.value=window.crypto?.randomUUID?.()||(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
  function error(text){errorEl.textContent=text;okEl.classList.remove('show');}
  function success(){errorEl.textContent='';okEl.textContent='✓ Заявка сохранена. Мы ответим по указанному контакту.';okEl.classList.add('show');}
  function emailValid(value){
    if(value.length>254||!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(value))return false;
    const [local,domain]=value.split('@');
    return local.length<=64&&!local.startsWith('.')&&!local.endsWith('.')&&!local.includes('..')&&domain.split('.').every(label=>/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
  }
  newId();
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;
    const name=form.elements.name.value.trim(),contact=form.elements.contact.value.trim(),idea=form.elements.idea.value.trim();
    if(name.length<2||name.length>80){error('Укажите имя: от 2 до 80 символов.');form.elements.name.focus();return;}
    if(!emailValid(contact)&&!/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact)){error('Укажите корректный email или Telegram в формате @username.');form.elements.contact.focus();return;}
    if(idea.length<5||idea.length>2000){error('Опишите задачу: от 5 до 2000 символов.');form.elements.idea.focus();return;}
    if(form.elements._honey.value){error('Не удалось подтвердить отправку. Обновите страницу и попробуйте снова.');return;}
    const fingerprint=JSON.stringify([name,contact,idea]);
    if(pendingFingerprint&&pendingFingerprint!==fingerprint)newId();
    pendingFingerprint=fingerprint;
    const button=form.querySelector('[type=submit]');sending=true;button.disabled=true;button.textContent='Сохраняем заявку…';error('');
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),90000);
    const slow=setTimeout(()=>{errorEl.textContent='Сервер может просыпаться после простоя. Пожалуйста, подождите.';},10000);
    try{
      const response=await fetch('https://briefops.onrender.com/api/integrations/wov',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},signal:controller.signal,body:JSON.stringify({form_data:{form_id:'wov-v1',site_url:'https://rinpocheshka.github.io/wov/',submission_id:id.value,name,contact,idea,_honey:''}})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.accepted!==true){error(response.status===429?'Слишком много попыток. Подождите и повторите отправку.':'Не удалось подтвердить сохранение. Данные остались в форме — попробуйте отправить ещё раз.');return;}
      form.reset();pendingFingerprint='';newId();success();
    }catch{error('Не удалось подтвердить сохранение. Данные остались в форме — проверьте соединение и повторите отправку.');}
    finally{clearTimeout(timeout);clearTimeout(slow);sending=false;button.disabled=false;button.textContent='Отправить заявку →';}
  });
})();
