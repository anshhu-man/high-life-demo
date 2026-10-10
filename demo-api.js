import { createSeed, command, view, register, settle, settleRefund, maintain, id } from './domain.js?v=20261010-system-v2';
const KEY='high-life-system-demo-v2';
export class DemoAPI {
 constructor(){try{this.state=JSON.parse(localStorage.getItem(KEY))||createSeed()}catch{this.state=createSeed()}this.current=sessionStorage.getItem('hl-demo-current');this.config={mode:'demo',api:false,video:true};this.challenge=null;this.persist()}
 persist(){localStorage.setItem(KEY,JSON.stringify(this.state))}
 result(){maintain(this.state);this.persist();return {csrf:'static-demo',view:view(this.state,this.current)}}
 async request(path,data){
  if(path==='/api/config')return this.config;
  if(path==='/api/demo/accounts')return this.state.users.filter(u=>u.status!=='deleted').map(u=>({id:u.id,nickname:u.nickname,role:u.role,identity:u.identity.status,membership:u.membership?.status,profileStatus:u.profileStatus,scope:u.scope}));
  if(path==='/api/demo/switch'){this.current=data.id;sessionStorage.setItem('hl-demo-current',this.current);return this.result()}
  if(path==='/api/session'){if(!this.current)throw Object.assign(new Error('Sign in to continue.'),{status:401});return this.result()}
  if(path==='/api/logout'){this.current=null;sessionStorage.removeItem('hl-demo-current');return {ok:true}}
  if(path==='/api/auth/start'){const contact=String(data.contact||'').toLowerCase().trim();if(!/^\+?[\d\s()-]{8,18}$/.test(contact)&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))throw new Error('Enter a valid phone or email.');this.challenge={id:id(),contact,code:String(Math.floor(100000+Math.random()*900000)),attempts:0,expires:Date.now()+600000,verified:false};return {challenge:this.challenge.id,demoCode:this.challenge.code}}
  if(path==='/api/auth/verify'){const c=this.challenge;if(!c||c.id!==data.challenge||c.expires<Date.now()||c.attempts++>=5||c.verified||c.code!==data.code)throw new Error('Incorrect or expired code.');c.verified=true;const existing=this.state.users.find(u=>u.contact===c.contact);if(existing){if(existing.role==='admin')throw new Error('Use an admin demo account.');this.current=existing.id;sessionStorage.setItem('hl-demo-current',this.current);return {registered:true,...this.result()}}return {registered:false,registrationTicket:c.id}}
  if(path==='/api/auth/register'){if(!this.challenge?.verified||this.challenge.id!==data.ticket)throw new Error('Verify your contact first.');const draft=structuredClone(this.state),u=register(draft,{...data,contact:this.challenge.contact,contactVerified:true});this.state=draft;this.challenge=null;this.current=u.id;sessionStorage.setItem('hl-demo-current',u.id);return this.result()}
  if(path==='/api/demo/refund'){if(this.state.users.find(u=>u.id===this.current)?.role!=='admin')throw new Error('Administrator access required.');const draft=structuredClone(this.state),o=draft.orders.find(o=>o.id===data.order),r=o?.refunds?.find(r=>r.id===data.id);if(!r)throw new Error('Refund request not found.');const result=settleRefund(draft,o.id,{status:'refunded',refundReference:r.id,amountPaise:r.amountPaise,currency:r.currency,providerRef:`DEMO-REFUND-${id()}`});this.state=draft;return {result,...this.result()}}
  if(path==='/api/action'){const draft=structuredClone(this.state);maintain(draft);const result=command(draft,this.current,data.type,data.data);maintain(draft);localStorage.setItem(KEY,JSON.stringify(draft));this.state=draft;return data.type==='account-delete'?{result,view:null}:{result,...this.result()}}
  if(path==='/api/demo/pay'){const draft=structuredClone(this.state),o=draft.orders.find(o=>o.id===data.id&&o.user===this.current);if(!o)throw new Error('Order not found.');const result=settle(draft,o.id,{status:'paid',amountPaise:o.amountPaise,currency:o.currency,providerRef:`DEMO-${id()}`});localStorage.setItem(KEY,JSON.stringify(draft));this.state=draft;return {result,...this.result()}}
  throw new Error('This feature requires the backend.');
 }
}
