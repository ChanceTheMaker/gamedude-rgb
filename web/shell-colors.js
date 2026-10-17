const names={'atomic-purple':'Atomic Purple',berry:'Berry',kiwi:'Kiwi',dandelion:'Dandelion',teal:'Teal'};
const key='gamedude-color-shell';
const buttons=[...document.querySelectorAll('button[data-shell]')];
function select(color){
  if(!Object.hasOwn(names,color))color='atomic-purple';
  document.documentElement.dataset.shell=color;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.shell===color));
  document.getElementById('shell-name').textContent=names[color].toUpperCase()+' EDITION';
  document.getElementById('shell-trim').textContent=names[color].toUpperCase();
  const handheld=document.querySelector('#simulator-model option[value="gameboy"]');
  handheld.textContent='Game Boy Color · '+names[color];
}
let saved;try{saved=localStorage.getItem(key);}catch{}
select(saved);
for(const button of buttons)button.addEventListener('click',()=>{
  select(button.dataset.shell);
  try{localStorage.setItem(key,button.dataset.shell);}catch{}
});
