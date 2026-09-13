import { readCookie, verifySession } from '../lib/session.js';

const SITE='https://fauxy87.github.io/sutton-cricket-club/';

export default function handler(req,res){
  const session=verifySession(readCookie(req));
  if(!session){res.redirect('/');return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sutton CC Admin</title><link rel="icon" href="${SITE}assets/sutton-cc-badge.png"><link rel="stylesheet" href="${SITE}styles.css"><link rel="stylesheet" href="${SITE}admin.css"></head><body><header class="site-header"><div class="container nav-wrap"><a class="brand" href="${SITE}"><div><strong>Sutton Cricket Club</strong><span>Secure website admin</span></div></a><div style="margin-left:auto;display:flex;gap:10px;align-items:center"><span style="font-weight:800;color:#073e22">Signed in as ${escapeHtml(session.login)}</span><a class="btn btn-outline dark-outline" href="/api/logout">Sign out</a></div></div></header><main><section class="admin-hero"><div class="container"><p class="eyebrow">Secure administration</p><h1>Club <span>Dashboard</span></h1><p>You are signed in with the authorised GitHub account. Use the tools below to manage Sutton Cricket Club website content.</p></div></section><section class="section"><div class="container"><iframe title="Sutton Cricket Club admin dashboard" src="${SITE}admin-dashboard.html" style="width:100%;min-height:2200px;border:0;border-radius:18px;background:#fff" loading="eager"></iframe></div></section></main><footer><div class="container">Sutton Cricket Club · Secure administration</div></footer></body></html>`);
}

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
