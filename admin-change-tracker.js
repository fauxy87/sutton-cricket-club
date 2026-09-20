(()=>{
 const bar=document.getElementById('admin-change-indicator');if(!bar)return;
 const text=document.getElementById('admin-change-indicator-text');let dirty=false;
 const ignore=el=>el.closest('#admin-publish-guide,#site-check-admin,#deployment-admin,#play-cricket-admin,#season-admin')||el.matches('input[type="file"]');
 function show(){if(dirty)return;dirty=true;bar.hidden=false;if(text)text.textContent='You have edited website content. Use the relevant Publish button, or Download as a backup.';}
 function prepared(){if(!dirty)return;dirty=false;bar.hidden=true;}
 document.addEventListener('input',e=>{if(e.target.matches('input,textarea,select')&&!ignore(e.target))show();},true);
 document.addEventListener('change',e=>{if(e.target.matches('input,textarea,select')&&!ignore(e.target))show();},true);
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.id||'';if(id.includes('download')||id.includes('copy')||id.includes('publish'))setTimeout(prepared,0);},true);
 window.addEventListener('beforeunload',e=>{if(!dirty)return;e.preventDefault();e.returnValue='';});
 window.SuttonAdminChanges={markDirty:show,markPrepared:prepared,isDirty:()=>dirty};
})();
