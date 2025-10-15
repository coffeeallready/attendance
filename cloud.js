
// cloud.js - Minimal Safe Sync with optional Firebase config via UI (no code edits needed)
(function(){
  const CFG_KEY = 'firebaseConfig'; // config stored in localStorage as JSON
  function getConfig(){
    try{
      if (window.firebaseConfig) return window.firebaseConfig;
      const j = localStorage.getItem(CFG_KEY);
      return j ? JSON.parse(j) : null;
    }catch(e){ return null; }
  }
  async function loadScript(src){
    return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=()=>res(); s.onerror=rej; document.head.appendChild(s); });
  }
  async function ensureSDK(){
    if (window.firebase?.apps?.length) return true;
    const cfg = getConfig(); if (!cfg) return false;
    // Load Firebase SDKs (modular compat)
    await loadScript('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth-compat.js');
    try{
      if (!window.firebase.apps.length) firebase.initializeApp(cfg);
      // Anonymous sign-in
      await firebase.auth().signInAnonymously().catch(()=>{});
      return true;
    }catch(e){ console.warn('Firebase init failed', e); return false; }
  }

  const KEY='yihong_attendance_v1';
  const dbLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(_){ return {}; } };
  const dbSave = (d)=> localStorage.setItem(KEY, JSON.stringify(d));

  window.CloudSync = {
    enabled:false, db:null,
    async enable(){
      const ok = await ensureSDK();
      this.enabled = !!ok;
      if (ok) this.db = firebase.firestore();
      return this.enabled;
    },
    async push(){
      if (!this.enabled) return false;
      try{
        const ref = this.db.doc('companies/default/snapshot/current');
        const obj = dbLoad();
        await ref.set(obj, { merge:true });
        return true;
      }catch(e){ console.warn('push failed', e); return false; }
    },
    async pull(){
      if (!this.enabled) return false;
      try{
        const ref = this.db.doc('companies/default/snapshot/current');
        const snap = await ref.get();
        if (!snap.exists) return false;
        const srv = snap.data()||{};
        // merge: prefer newer meta.updatedAt; union records by id
        const loc = dbLoad();
        const lMeta = (loc.meta && loc.meta.updatedAt) || null;
        const sMeta = (srv.meta && srv.meta.updatedAt) || null;
        if (lMeta && (!sMeta || lMeta >= sMeta)) return true;
        const lrecs = Array.isArray(loc.records)? loc.records : [];
        const srecs = Array.isArray(srv.records)? srv.records : [];
        const byId = {};
        for (const r of lrecs) if (r && r.id) byId[r.id]=r;
        for (const r of srecs) if (r && r.id) byId[r.id]=r;
        const out = Object.assign({}, loc, srv);
        out.records = Object.values(byId);
        dbSave(out);
        return true;
      }catch(e){ console.warn('pull failed', e); return false; }
    },
    // UI helpers to set/get config without editing files
    saveConfig(cfgObj){
      localStorage.setItem(CFG_KEY, JSON.stringify(cfgObj||{}));
      return true;
    },
    getConfig(){ return getConfig(); }
  };
})();
