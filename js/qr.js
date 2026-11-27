'use strict';
/* ===== QR kod üretici: bayt modu, hata düzeltme L, sürüm 1–40 (Nayuki algoritmasının sade hâli) ===== */
const QR_ECC=[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30];
const QR_BLK=[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25];
function qrMake(text){
  const data=[...new TextEncoder().encode(text)];
  const rawMods=v=>{ let r=(16*v+128)*v+64; if(v>=2){ const n=Math.floor(v/7)+2; r-=(25*n-10)*n-55; if(v>=7) r-=36; } return r; };
  const dataCw=v=>Math.floor(rawMods(v)/8)-QR_ECC[v]*QR_BLK[v];
  let ver=1; while(ver<=40&&4+(ver<10?8:16)+data.length*8>dataCw(ver)*8) ver++;
  if(ver>40) return null;
  // veri bitleri
  const bits=[], put=(v,n)=>{ for(let i=n-1;i>=0;i--) bits.push((v>>>i)&1); };
  put(4,4); put(data.length,ver<10?8:16); data.forEach(b=>put(b,8));
  const cap=dataCw(ver)*8; put(0,Math.min(4,cap-bits.length)); put(0,(8-bits.length%8)%8);
  for(let p=0xEC;bits.length<cap;p^=0xEC^0x11) put(p,8);
  const cw=[]; for(let i=0;i<bits.length;i+=8){ let b=0; for(let j=0;j<8;j++) b=(b<<1)|bits[i+j]; cw.push(b); }
  // Reed–Solomon hata düzeltme ve blok serpiştirme
  const mul=(x,y)=>{ let z=0; for(let i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z; };
  const deg=QR_ECC[ver], div=new Array(deg).fill(0); div[deg-1]=1; let root=1;
  for(let i=0;i<deg;i++){ for(let j=0;j<deg;j++){ div[j]=mul(div[j],root); if(j+1<deg) div[j]^=div[j+1]; } root=mul(root,2); }
  const rem=d=>{ const r=new Array(deg).fill(0); for(const b of d){ const f=b^r.shift(); r.push(0); div.forEach((c,i)=>{ r[i]^=mul(c,f); }); } return r; };
  const nb=QR_BLK[ver], raw=Math.floor(rawMods(ver)/8), nShort=nb-raw%nb, shortLen=Math.floor(raw/nb), blocks=[];
  for(let i=0,k=0;i<nb;i++){ const d=cw.slice(k,k+shortLen-deg+(i<nShort?0:1)); k+=d.length; const e=rem(d); if(i<nShort) d.push(0); blocks.push(d.concat(e)); }
  const fin=[]; for(let i=0;i<blocks[0].length;i++) blocks.forEach((b,j)=>{ if(i!==shortLen-deg||j>=nShort) fin.push(b[i]); });
  // matris ve sabit desenler
  const N=ver*4+17, M=[...Array(N)].map(()=>new Array(N).fill(false)), F=[...Array(N)].map(()=>new Array(N).fill(false));
  const set=(x,y,d)=>{ M[y][x]=d; F[y][x]=true; };
  for(let i=0;i<N;i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
  for(const [cx,cy] of [[3,3],[N-4,3],[3,N-4]]) for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ const x=cx+dx, y=cy+dy, d=Math.max(Math.abs(dx),Math.abs(dy)); if(x>=0&&x<N&&y>=0&&y<N) set(x,y,d!==2&&d!==4); }
  const al=[]; if(ver>1){ const n=Math.floor(ver/7)+2, step=Math.floor((ver*8+n*3+5)/(n*4-4))*2; al.push(6); for(let p=N-7;al.length<n;p-=step) al.splice(1,0,p); }
  al.forEach((a,i)=>al.forEach((b,j)=>{ if((i===0&&j===0)||(i===0&&j===al.length-1)||(i===al.length-1&&j===0)) return;
    for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1); }));
  const drawFmt=mask=>{ const d=(1<<3)|mask; let r=d; for(let i=0;i<10;i++) r=(r<<1)^((r>>>9)*0x537); const b=((d<<10)|r)^0x5412, g=i=>((b>>>i)&1)===1;
    for(let i=0;i<=5;i++) set(8,i,g(i)); set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8)); for(let i=9;i<15;i++) set(14-i,8,g(i));
    for(let i=0;i<8;i++) set(N-1-i,8,g(i)); for(let i=8;i<15;i++) set(8,N-15+i,g(i)); set(8,N-8,true); };
  drawFmt(0);
  if(ver>=7){ let r=ver; for(let i=0;i<12;i++) r=(r<<1)^((r>>>11)*0x1F25); const b=(ver<<12)|r;
    for(let i=0;i<18;i++){ const d=((b>>>i)&1)===1, a=N-11+i%3, c=Math.floor(i/3); set(a,c,d); set(c,a,d); } }
  let bi=0;
  for(let right=N-1;right>=1;right-=2){ if(right===6) right=5;
    for(let vert=0;vert<N;vert++) for(let j=0;j<2;j++){ const x=right-j, up=((right+1)&2)===0, y=up?N-1-vert:vert;
      if(!F[y][x]&&bi<fin.length*8){ M[y][x]=((fin[bi>>>3]>>>(7-(bi&7)))&1)===1; bi++; } } }
  // maske seçimi (en düşük ceza puanı)
  const MF=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,x=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,
    (x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const apply=m=>{ for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!F[y][x]&&MF[m](x,y)) M[y][x]=!M[y][x]; };
  const penalty=()=>{ let p=0, dark=0;
    for(let a=0;a<N;a++){ let rc=M[a][0], rl=1, cc=M[0][a], cl=1;
      for(let b=1;b<N;b++){
        if(M[a][b]===rc){ rl++; p+=rl===5?3:rl>5?1:0; } else { rc=M[a][b]; rl=1; }
        if(M[b][a]===cc){ cl++; p+=cl===5?3:cl>5?1:0; } else { cc=M[b][a]; cl=1; } } }
    for(let y=0;y<N-1;y++) for(let x=0;x<N-1;x++){ const c=M[y][x]; if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1]) p+=3; }
    for(const r of M) for(const c of r) if(c) dark++;
    return p+Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10; };
  let best=0, bp=Infinity;
  for(let m=0;m<8;m++){ apply(m); drawFmt(m); const p=penalty(); if(p<bp){ bp=p; best=m; } apply(m); }
  apply(best); drawFmt(best);
  return M;
}
function qrCanvas(text,size=320){
  const M=qrMake(text); if(!M) return null;
  const N=M.length, q=4, s=Math.max(2,Math.floor(size/(N+q*2))), c=document.createElement('canvas');
  c.width=c.height=(N+q*2)*s; const g=c.getContext('2d');
  g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.fillStyle='#000';
  M.forEach((r,y)=>r.forEach((d,x)=>{ if(d) g.fillRect((x+q)*s,(y+q)*s,s,s); }));
  c.className='qr'; c.setAttribute('role','img'); c.setAttribute('aria-label','QR kod'); return c;
}
if(typeof module!=='undefined') module.exports={qrMake};
