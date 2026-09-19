(() => {
 const box=document.getElementById('admin-deploy-box'),status=document.getElementById('admin-deploy-status');if(!box)return;
 const d=window.SUTTON_DEPLOYMENT;
 if(!d){status.textContent='Unknown';box.classList.add('has-issues');box.innerHTML='<strong>Version marker unavailable</strong><p>The live site did not load its deployment marker. A redeploy or cache refresh may be needed.</p>';return}
 const when=d.updated?new Date(d.updated):null,stamp=when&&!Number.isNaN(when.getTime())?when.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Unknown';
 status.textContent='Published';
 box.classList.add('is-current');box.innerHTML=`<strong>✓ Version ${d.version}</strong><p>${d.label} · source updated ${stamp}</p><small>This marker travels with the website deployment. If a newly merged change is missing from the live site, this version helps confirm whether Vercel is still serving an older build.</small>`;
})();