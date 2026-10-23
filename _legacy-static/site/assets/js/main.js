/* Epic Elites — lightweight, dependency-free interactions and motion system. */
(() => {
  'use strict';
  const data = window.EE_DATA || {};
  const players = data.players || [];
  const root = document.body.dataset.root || './';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, node = document) => node.querySelector(selector);
  const $$ = (selector, node = document) => Array.from(node.querySelectorAll(selector));
  const asset = filename => `${root}assets/images/${filename}`;
  const clamp = (num,min,max) => Math.max(min, Math.min(max, num));
  let lastFocus = null;
  let toastTimeout = null;
  function toast(message) {
    const node = $('.toast'); if (!node) return;
    node.textContent = message; node.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => node.classList.remove('is-visible'), 3400);
  }

  /* Responsive navigation is a true menu, not a page-cover animation. */
  const toggle = $('.menu-toggle');
  const mobile = $('.mobile-nav');
  if (toggle && mobile) {
    const setMenu = open => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (open) mobile.removeAttribute('inert'); else mobile.setAttribute('inert', '');
      document.body.classList.toggle('overlay-open', open);
      if (open) mobile.querySelector('a')?.focus();
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }
  $('.back-top')?.addEventListener('click', () => window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'}));
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* Home featured roster: state changes content and imagery, never placeholder transitions. */
  const featuredPhoto = $('#featured-img');
  if (featuredPhoto && players.length) {
    const buttons = $$('[data-feature-player]');
    function selectFeatured(index) {
      const p = players[index]; if (!p) return;
      featuredPhoto.src = asset(p.image);
      featuredPhoto.alt = `Epic Elites player ${p.number}`;
      $('#featured-name').textContent = p.name;
      $('#featured-role').textContent = p.role;
      $('#featured-num').textContent = p.number;
      $('#featured-position').textContent = `${p.number} / ${String(players.length).padStart(2,'0')}`;
      buttons.forEach((b, i) => {
        b.classList.toggle('is-current', i === index);
        b.setAttribute('aria-pressed', String(i === index));
      });
    }
    buttons.forEach(b => b.addEventListener('click', () => selectFeatured(Number(b.dataset.featurePlayer))));
  }

  /* Player profiles: large keyboard-accessible artwork and coherent next/previous navigation. */
  const modal = $('#profile-overlay');
  if (modal) {
    let currentIndex = 0;
    const closeButtons = $$('[data-close-profile]', modal);
    const panel = $('.profile-panel', modal);
    const updateProfile = i => {
      currentIndex = (i + players.length) % players.length;
      const p = players[currentIndex]; if (!p) return;
      $('#profile-name').textContent = p.name;
      $('#profile-number').textContent = `${p.number} / ${String(players.length).padStart(2,'0')}`;
      $('#profile-role').textContent = p.role;
      $('#profile-bio').textContent = p.bio || 'Player details will be available soon.';
      $('#profile-image').src = asset(p.image);
      $('#profile-image').alt = `Epic Elites player ${p.number}`;
    };
    const closeProfile = () => {
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('overlay-open');
      lastFocus?.focus();
    };
    $$('[data-player]').forEach(card => card.addEventListener('click', () => {
      lastFocus = document.activeElement;
      updateProfile(Number(card.dataset.player));
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('overlay-open');
      $('.profile-close', modal).focus();
    }));
    closeButtons.forEach(b => b.addEventListener('click', closeProfile));
    $('#profile-prev').addEventListener('click', () => updateProfile(currentIndex - 1));
    $('#profile-next').addEventListener('click', () => updateProfile(currentIndex + 1));
    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeProfile();
      if (event.key === 'ArrowRight') updateProfile(currentIndex + 1);
      if (event.key === 'ArrowLeft') updateProfile(currentIndex - 1);
      if (event.key === 'Tab') {
        const focusable = $$('button:not([disabled])',panel);
        const start = focusable[0], end = focusable[focusable.length-1];
        if (event.shiftKey && document.activeElement === start) { event.preventDefault(); end.focus(); }
        else if (!event.shiftKey && document.activeElement === end) { event.preventDefault(); start.focus(); }
      }
    });
  }

  /* Custom responsive cursor spotlight and spatial tilt on player cards. */
  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.player-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width;
        const y = (e.clientY-r.top)/r.height;
        card.style.setProperty('--mx', `${x*100}%`);
        card.style.setProperty('--my', `${y*100}%`);
        card.style.setProperty('--tx', `${(0.5-y)*4}deg`);
        card.style.setProperty('--ty', `${(x-0.5)*4}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tx','0deg');card.style.setProperty('--ty','0deg');
      });
    });
    $$('.magnetic').forEach(button => {
      button.addEventListener('pointermove', e => {
        const r=button.getBoundingClientRect();
        button.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px,${(e.clientY-r.top-r.height/2)*.1}px)`;
      });
      button.addEventListener('pointerleave',()=>{ button.style.transform=''; });
    });
  }

  /* Match-center filter controls. */
  const tabs = $$('[data-match-tab]');
  if (tabs.length) {
    function activate(which) {
      tabs.forEach(tab => {
        const active = tab.dataset.matchTab === which;
        tab.classList.toggle('is-selected',active);
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      $$('.match-panel').forEach(panel => { panel.hidden = panel.id !== `panel-${which}`; });
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.matchTab));
      tab.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const next = tabs[(index + (event.key==='ArrowRight' ? 1 : -1)+tabs.length)%tabs.length];
          activate(next.dataset.matchTab); next.focus();
        }
      });
    });
  }

  /* Jersey: physically rotates in 3D to the exact supplied back artwork. */
  const jerseyStage = $('#jersey-stage');
  if (jerseyStage) {
    $$('[data-jersey-side]').forEach(button => button.addEventListener('click', () => {
      const back = button.dataset.jerseySide === 'back';
      jerseyStage.classList.toggle('is-back',back);
      $$('[data-jersey-side]').forEach(b => {
        const active = b === button;
        b.classList.toggle('is-current',active);
        b.setAttribute('aria-pressed',String(active));
      });
    }));
  }

  /* Media lightbox. */
  const lightbox = $('#lightbox');
  if (lightbox) {
    const close = () => {
      lightbox.setAttribute('aria-hidden','true');
      document.body.classList.remove('overlay-open');
      lastFocus?.focus();
    };
    $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
      lastFocus = document.activeElement;
      $('#lightbox-img').src = button.dataset.lightbox;
      $('#lightbox-img').alt = button.querySelector('img')?.alt || 'Epic Elites gallery image';
      $('#lightbox-caption').textContent = button.dataset.lightboxCaption;
      lightbox.setAttribute('aria-hidden','false');
      document.body.classList.add('overlay-open');
      $('#lightbox-close').focus();
    }));
    $('#lightbox-close').addEventListener('click',close);
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)close();});
    lightbox.addEventListener('keydown',e=>{
      if(e.key==='Escape')close();
      if(e.key==='Tab'){e.preventDefault();$('#lightbox-close').focus();}
    });
  }

  /* Contact doesn't pretend to send mail: mailto when configured; copy otherwise. */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const f = new FormData(form);
      const name = String(f.get('name')||'').trim();
      const sender = String(f.get('email')||'').trim();
      const subject = String(f.get('subject')||'').trim();
      const message = String(f.get('message')||'').trim();
      const subjectLine = `[Epic Elites] ${subject}`;
      const body = `Name: ${name}\nEmail: ${sender}\nInquiry: ${subject}\n\n${message}`;
      const recipient = form.dataset.email;
      if (recipient) {
        location.href=`mailto:${recipient}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`;
        $('#form-feedback').textContent='Your email application should open with the message prepared. Please send it from there.';
      } else {
        const prepared=`${subjectLine}\n\n${body}`;
        try {
          if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(prepared);}
          else {const t=document.createElement('textarea');t.value=prepared;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();if(!document.execCommand('copy'))throw new Error('Copy unavailable');t.remove();}
          $('#form-feedback').textContent='Your message has been copied. Add the team email in content/team.json to enable email inquiries.';
          toast('MESSAGE COPIED');
        } catch(err) {
          $('#form-feedback').textContent='Email is not configured. Please copy your message manually until the team adds a contact address.';
          toast('CONTACT EMAIL NOT CONFIGURED');
        }
      }
    });
  }

  /* Motion graphics: a sparse drifting signal field, cursor-reactive radar, not decorative slide/fade effects. */
  const canvas = $('#field-canvas');
  const hero = $('.hero');
  if (canvas && hero && !reducedMotion) {
    const ctx = canvas.getContext('2d', {alpha:true});
    let width=0,height=0,dpr=1,raf=0,visible=true;
    const pointer={x:0.72,y:0.42,active:false};
    const dots=Array.from({length:39},(_,i)=>({
      a:i*2.399963, r:0.07+(i%13)*.027, spin:(i%2?-1:1)*(.03+(i%5)*.008), size:(i%7===0?1.8:.8), band: i%3
    }));
    const resize=()=>{
      dpr=Math.min(window.devicePixelRatio||1,2);
      const r=hero.getBoundingClientRect();width=r.width;height=r.height;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const draw=(ms)=>{
      if(!visible)return;
      ctx.clearRect(0,0,width,height);
      const cx=width*.73,cy=height*.46,scale=Math.min(width*.36,height*.43);
      const t=ms*.001;
      const positions=[];
      dots.forEach((dot,i)=>{
        const angle=dot.a+t*dot.spin;
        const radi=dot.r*scale*(1+Math.sin(t*.65+i)*.04);
        let x=cx+Math.cos(angle)*radi*1.3;
        let y=cy+Math.sin(angle)*radi;
        if(pointer.active){
          const dist=Math.hypot(x-pointer.x*width,y-pointer.y*height);
          if(dist<130){const f=(130-dist)/130;x+=(x-pointer.x*width)*f*.11;y+=(y-pointer.y*height)*f*.11;}
        }
        positions.push({x,y});
        ctx.beginPath();ctx.arc(x,y,dot.size,0,Math.PI*2);
        ctx.fillStyle=i%5===0?'rgba(182,123,255,.8)':'rgba(144,91,198,.4)';ctx.fill();
      });
      ctx.lineWidth=.6;
      for(let i=0;i<positions.length;i+=3){
        const a=positions[i],b=positions[(i+6)%positions.length];
        if(Math.hypot(a.x-b.x,a.y-b.y)<180){ctx.strokeStyle='rgba(151,95,208,.13)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      }
      raf=requestAnimationFrame(draw);
    };
    resize();window.addEventListener('resize',resize,{passive:true});
    hero.addEventListener('pointermove',e=>{
      const r=hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width;pointer.y=(e.clientY-r.top)/r.height;pointer.active=true;
    },{passive:true});
    hero.addEventListener('pointerleave',()=>{pointer.active=false;});
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      cancelAnimationFrame(raf);
      if(visible)raf=requestAnimationFrame(draw);
    },{threshold:0});observer.observe(hero);
    if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
      const figure=$('[data-parallax]');
      let tx=0,ty=0,x=0,y=0;
      hero.addEventListener('pointermove',e=>{
        const r=hero.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*19;ty=((e.clientY-r.top)/r.height-.5)*10;
      },{passive:true});
      hero.addEventListener('pointerleave',()=>{tx=0;ty=0;});
      function parallax(){
        x+=(tx-x)*.07;y+=(ty-y)*.07;
        if(figure){figure.style.setProperty('--px',`${x.toFixed(2)}px`);figure.style.setProperty('--py',`${y.toFixed(2)}px`);}
        requestAnimationFrame(parallax);
      }parallax();
    }
  }
})();
