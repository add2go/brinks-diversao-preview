(()=>{
  'use strict';
  const locale=document.body.dataset.locale||'en';
  const portuguese=locale==='pt';
  const menu=document.querySelector('.menu-toggle');
  const mobile=document.querySelector('#mobile-nav');
  const closeMenu=()=>{if(menu&&mobile){mobile.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',portuguese?'Abrir navegação':'Open navigation');}};
  menu?.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;menu.setAttribute('aria-expanded',String(!mobile.hidden));menu.setAttribute('aria-label',mobile.hidden?(portuguese?'Abrir navegação':'Open navigation'):(portuguese?'Fechar navegação':'Close navigation'));});
  mobile?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile&&!mobile.hidden){closeMenu();menu.focus();}});
  window.matchMedia('(min-width:961px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
  const dialog=document.querySelector('#review-dialog');
  document.querySelectorAll('[data-review-open]').forEach(button=>button.addEventListener('click',()=>dialog.showModal()));
  document.querySelectorAll('[data-review-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog?.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});

  const search=document.querySelector('#journal-search');
  let filter='all';
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function filterStories(){let count=0;const query=normalize(search?.value||'');document.querySelectorAll('[data-story]').forEach(story=>{story.hidden=!(filter==='all'||story.dataset.category===filter)||!normalize(story.dataset.search).includes(query);if(!story.hidden)count++;});const empty=document.querySelector('#no-results');if(empty)empty.hidden=count>0;}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));filterStories();}));
  search?.addEventListener('input',filterStories);

  document.querySelectorAll('[data-review-carousel]').forEach(carousel=>{
    const slides=[...carousel.querySelectorAll('[data-review-slide]')];
    const dots=[...carousel.querySelectorAll('[data-review-dot]')];
    const counter=carousel.querySelector('[data-review-counter]');
    const announcement=carousel.querySelector('[data-review-announcement]');
    let index=0;
    function showReview(next){
      index=(next+slides.length)%slides.length;
      slides.forEach((slide,i)=>{slide.hidden=i!==index;});
      dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
      counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      announcement.textContent=`${carousel.dataset.reviewLabel} ${index+1} ${carousel.dataset.of} ${slides.length}`;
    }
    carousel.querySelector('[data-review-previous]').addEventListener('click',()=>showReview(index-1));
    carousel.querySelector('[data-review-next]').addEventListener('click',()=>showReview(index+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>showReview(i)));
    carousel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showReview(index+(event.key==='ArrowRight'?1:-1));}});
    let touchStart=null;
    carousel.querySelector('.review-slides').addEventListener('touchstart',event=>{const touch=event.changedTouches[0];touchStart={x:touch.clientX,y:touch.clientY};},{passive:true});
    carousel.querySelector('.review-slides').addEventListener('touchend',event=>{if(!touchStart)return;const touch=event.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)showReview(index+(dx<0?1:-1));touchStart=null;},{passive:true});
  });

  const chatPanel=document.querySelector('#chat-panel');
  const chatLauncher=document.querySelector('#chat-launcher');
  const chatPayload=document.querySelector('#chat-data');
  if(chatPanel&&chatLauncher&&chatPayload){
    const data=JSON.parse(chatPayload.textContent);
    const log=document.querySelector('#chat-log');
    const input=document.querySelector('#chat-input');
    function setChatOpen(open){chatPanel.hidden=!open;chatLauncher.setAttribute('aria-expanded',String(open));chatLauncher.setAttribute('aria-label',open?data.close:data.open);if(open){(window.matchMedia('(max-width:760px)').matches?document.querySelector('#chat-close'):input).focus();}else chatLauncher.focus();}
    chatLauncher.addEventListener('click',()=>setChatOpen(chatPanel.hidden));
    document.querySelector('#chat-close').addEventListener('click',()=>setChatOpen(false));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!chatPanel.hidden&&!dialog?.open){event.preventDefault();setChatOpen(false);}});
    function addMessage(text,kind){
      const message=document.createElement('div');message.className=`chat-message ${kind}`;
      const author=document.createElement('span');author.textContent=kind==='assistant'?'Brinks':(portuguese?'Você':'You');
      const paragraph=document.createElement('p');paragraph.textContent=text;
      message.append(author,paragraph);log.append(message);
      while(log.children.length>21)log.firstElementChild.remove();
      log.scrollTop=log.scrollHeight;
    }
    function answer(question,topicIndex){
      addMessage(question,'visitor');
      const normal=normalize(question);
      let topic=Number.isInteger(topicIndex)?data.topics[topicIndex]:null;
      if(!topic){topic=data.topics.find(item=>item.keywords.some(word=>new RegExp(`(?:^|\\s)${word}(?:$|\\s|[?!.,])`,'i').test(normal)));}
      const greeting=/^(hi|hello|hey|oi|ola)[!?.\s]*$/.test(normal);
      addMessage(topic?topic.answer:(greeting?data.greeting:data.fallback),'assistant');
    }
    document.querySelectorAll('[data-chat-topic]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.chatTopic);answer(data.topics[index].question,index);}));
    document.querySelector('#chat-form').addEventListener('submit',event=>{event.preventDefault();const question=input.value.trim();if(!question)return;input.value='';answer(question);input.focus();});
  }

  const form=document.querySelector('#quote-form');
  if(!form)return;
  const select=form.elements.namedItem('experience');
  const choice=new URLSearchParams(location.search).get('experience');
  if(['play','paint','custom','help'].includes(choice))select.value=choice;
  const date=form.elements.namedItem('date');
  const flexible=document.querySelector('#flexible-date');
  const localToday=new Date();
  date.min=`${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
  flexible.addEventListener('change',()=>{date.disabled=flexible.checked;date.required=!flexible.checked;date.setCustomValidity('');});
  date.addEventListener('input',()=>date.setCustomValidity(''));
  const result=document.querySelector('#quote-result');
  const summary=document.querySelector('#quote-summary');
  let brief='';
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(date.value&&!date.disabled&&date.value<date.min){date.setCustomValidity(portuguese?'Escolha a data de hoje ou uma data futura.':'Please choose today or a future event date.');date.reportValidity();return;}
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const labels=portuguese?['Nome','Email','Cidade','Data','Crianças','Idades','Experiência','Observações']:['Name','Email','City','Date','Children','Ages','Experience','Notes'];
    const values=[data.get('name'),data.get('email'),data.get('city'),flexible.checked?(portuguese?'A definir':'To be confirmed'):data.get('date'),data.get('children'),data.get('ages'),select.options[select.selectedIndex].textContent,data.get('message')];
    summary.replaceChildren();
    const pairs=[];
    values.forEach((value,index)=>{if(!value)return;const row=document.createElement('div');const dt=document.createElement('dt');const dd=document.createElement('dd');dt.textContent=labels[index];dd.textContent=String(value);row.append(dt,dd);summary.append(row);pairs.push(`${labels[index]}: ${value}`);});
    brief=`Brinks Diversão | ${portuguese?'PRÉVIA DO PEDIDO, NÃO ENVIADO':'REQUEST PREVIEW, NOT SENT'}\n\n${pairs.join('\n')}\n\n${portuguese?'Nada foi enviado ou salvo pelo site.':'Nothing was sent or saved by the website.'}`;
    form.hidden=true;result.hidden=false;result.focus({preventScroll:true});result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  });
  const copyButton=document.querySelector('#copy-brief');
  copyButton.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(brief);copyButton.textContent=copyButton.dataset.copied;}
    catch{const range=document.createRange();range.selectNodeContents(summary);window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(range);copyButton.textContent=portuguese?'Selecione e copie o resumo':'Select and copy the brief';}
  });
  document.querySelector('#download-brief').addEventListener('click',()=>{const blob=new Blob([brief],{type:'text/plain;charset=utf-8'});const link=document.createElement('a');const address=URL.createObjectURL(blob);link.href=address;link.download='brinks-party-brief.txt';link.click();setTimeout(()=>URL.revokeObjectURL(address),1000);});
  document.querySelector('#edit-brief').addEventListener('click',()=>{form.hidden=false;result.hidden=true;copyButton.textContent=copyButton.dataset.label;form.elements.namedItem('name').focus();});
})();
