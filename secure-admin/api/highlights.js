import { readCookie, verifySession } from '../lib/session.js';

const OWNER='fauxy87';
const REPO='sutton-cricket-club';
const BRANCH='main';
const PATH='data/highlights.json';

function headers(){
  const token=process.env.GITHUB_PUBLISH_TOKEN;
  if(!token) throw new Error('GITHUB_PUBLISH_TOKEN is not configured');
  return {'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
}
async function getFile(){
  const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`,{headers:headers()});
  if(!r.ok) throw new Error(`Could not read highlights (${r.status})`);
  const f=await r.json();
  return {sha:f.sha,data:JSON.parse(Buffer.from(f.content,'base64').toString('utf8'))};
}
async function putFile(sha,data,message){
  const body={message,branch:BRANCH,sha,content:Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64')};
  const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,{method:'PUT',headers:headers(),body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`Could not publish highlights (${r.status})`);
}
function clean(v,n=180){return String(v??'').trim().slice(0,n)}
function youtubeId(value){
  const v=clean(value,500); if(!v) return '';
  try { const u=new URL(v); if(u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0]||''; if(u.hostname.includes('youtube.com')) { if(u.searchParams.get('v')) return u.searchParams.get('v'); const p=u.pathname.split('/').filter(Boolean); if(['embed','shorts','live'].includes(p[0])) return p[1]||''; }} catch{}
  return '';
}
function normalise(raw,existing={}){
  const id=clean(raw.id,100)||existing.id||`highlight-${Date.now()}`;
  const yid=youtubeId(raw.youtube_url);
  if(!yid) throw new Error('Please enter a valid YouTube video URL');
  return {id,title:clean(raw.title,120)||'Match highlights',date:clean(raw.date,20),team:clean(raw.team,80)||'Sutton CC',opponent:clean(raw.opponent,100),result:clean(raw.result,160),kind:'YouTube',youtube_url:clean(raw.youtube_url,500),youtube_id:yid,poster:clean(raw.poster,500)||`https://i.ytimg.com/vi/${yid}/hqdefault.jpg`,created_at:existing.created_at||new Date().toISOString(),updated_at:new Date().toISOString()};
}
export default async function handler(req,res){
  if(!verifySession(readCookie(req))) return res.status(401).json({ok:false,error:'Not signed in'});
  res.setHeader('Cache-Control','no-store');
  try{
    const file=await getFile(); const data=file.data||{}; const items=Array.isArray(data.highlights)?data.highlights:[];
    if(req.method==='GET') return res.status(200).json({ok:true,highlights:items});
    if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
    const body=req.body||{};
    if(body.action==='delete'){
      const id=clean(body.id,100); const next=items.filter(x=>x.id!==id);
      if(next.length===items.length) return res.status(404).json({ok:false,error:'Highlight not found'});
      const out={...data,generated_at:new Date().toISOString(),source:'Sutton CC Admin',highlights:next};
      await putFile(file.sha,out,'Delete match highlight'); return res.status(200).json({ok:true,message:'Highlight deleted'});
    }
    if(body.action==='save'){
      const id=clean(body.highlight?.id,100); const index=id?items.findIndex(x=>x.id===id):-1; const existing=index>=0?items[index]:{};
      const item=normalise(body.highlight||{},existing); const next=items.slice(); if(index>=0) next[index]=item; else next.unshift(item);
      const out={...data,generated_at:new Date().toISOString(),source:'Sutton CC Admin',highlights:next};
      await putFile(file.sha,out,index>=0?'Update match highlight':'Publish match highlight');
      return res.status(200).json({ok:true,highlight:item,message:index>=0?'Highlight updated':'Highlight published'});
    }
    return res.status(400).json({ok:false,error:'Unknown action'});
  }catch(err){return res.status(500).json({ok:false,error:err.message||'Highlights update failed'});}
}
