'use client';
import {Suspense,useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';

const movementNames:Record<string,string>={RECEIVE:'استلام / إضافة',MOVE:'نقل بين مواقع التخزين',ISSUE:'صرف',RETURN:'إرجاع',ADJUST:'تسوية الرصيد',PICK:'حجز / تجهيز',DISPATCH:'شحن'};

function MovementsContent(){
  const searchParams=useSearchParams();
  const requestedType=searchParams.get('type');
  const [lots,setLots]=useState<any[]>([]);
  const [lotId,setLotId]=useState('');
  const [movementType,setType]=useState(requestedType&&movementNames[requestedType]?requestedType:'ISSUE');
  const [qtyKg,setQty]=useState(0);
  const [refId,setRef]=useState('');
  const [fromBinCode,setFromBin]=useState('');
  const [toBinCode,setToBin]=useState('');
  const [msg,setMsg]=useState('');
  const selectedLot=useMemo(()=>lots.find((lot)=>lot.id===lotId),[lots,lotId]);
  const bins=selectedLot?.warehouse?.bins||[];

  async function load(preferredLotId=lotId){
    const r=await fetch('/api/inventory/lots',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error);return}
    setLots(j.lots);
    const requested=searchParams.get('lotId');
    const next=[preferredLotId,requested,j.lots[0]?.id].find((id)=>id&&j.lots.some((lot:any)=>lot.id===id));
    setLotId(next||'');
  }

  useEffect(()=>{load('')},[]);
  useEffect(()=>{
    const codes=bins.map((bin:any)=>bin.code);
    setFromBin(codes[0]||'');
    setToBin(codes[1]||codes[0]||'');
  },[lotId,lots]);

  async function submit(){
    setMsg('');
    const payload={lotId,movementType,qtyKg,refType:'MANUAL',refId,...(movementType==='MOVE'?{fromBinCode,toBinCode}:{})};
    const r=await fetch('/api/inventory/movements',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const j=await r.json();
    setMsg(r.ok?`تمت ${movementNames[movementType]}. الرصيد الحالي ${Number(j.balanceKg).toLocaleString()} كجم`:(j.issues?.[0]?.message||j.error));
    if(r.ok)await load(lotId);
  }

  const invalidQty=qtyKg<0||(movementType!=='ADJUST'&&qtyKg<=0);
  const invalidMove=movementType==='MOVE'&&(!fromBinCode||!toBinCode||fromBinCode===toBinCode);
  return <>
    <header className="pageHead"><div><h1>حركة مخزون الخامات</h1><p>صرف وإرجاع ونقل وتسوية مع تحديث فوري للرصيد وسجل Audit</p></div><a className="toolbarLink" href="/inventory">العودة للمخزون</a></header>
    <div className="panel formPanel">
      <div className="formGrid">
        <label>Lot<select value={lotId} onChange={e=>setLotId(e.target.value)}>{lots.map(l=><option key={l.id} value={l.id}>{l.lotNo} — {l.material.nameAr} — {Number(l.availableQtyKg).toLocaleString()} كجم — {l.qcStatus}</option>)}</select></label>
        <label>نوع الحركة<select value={movementType} onChange={e=>setType(e.target.value)}>{Object.entries(movementNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label>{movementType==='ADJUST'?'الرصيد الفعلي الجديد kg':'الكمية kg'}<input type="number" min="0" step="0.001" value={qtyKg} onChange={e=>setQty(Number(e.target.value))}/></label>
        <label>المرجع<input value={refId} onChange={e=>setRef(e.target.value)} placeholder="أمر إنتاج / مستند / سبب التسوية"/></label>
        {movementType==='MOVE'&&<><label>موقع التخزين المصدر<select value={fromBinCode} onChange={e=>setFromBin(e.target.value)}>{bins.map((bin:any)=><option key={bin.id} value={bin.code}>{bin.code}</option>)}</select></label><label>موقع التخزين الوجهة<select value={toBinCode} onChange={e=>setToBin(e.target.value)}>{bins.map((bin:any)=><option key={bin.id} value={bin.code}>{bin.code}</option>)}</select></label></>}
      </div>
      {selectedLot&&<div className="balanceBox balanced"><span>الرصيد المسجل حاليًا</span><b>{Number(selectedLot.availableQtyKg).toLocaleString()} كجم</b><small>{selectedLot.lotNo} • {selectedLot.warehouse.nameAr}</small></div>}
      {movementType==='ADJUST'&&<p className="hint">التسوية تستبدل الرصيد الحالي بالرصيد الفعلي المدخل، ويمكن ضبطه إلى صفر.</p>}
      {movementType==='MOVE'&&bins.length<2&&<div className="formError">يجب تعريف موقعي تخزين مختلفين على الأقل داخل المخزن لتنفيذ النقل.</div>}
      <button className="primary" onClick={submit} disabled={!lotId||invalidQty||invalidMove}>تنفيذ الحركة</button>
      {msg&&<div className="formNotice">{msg}</div>}
    </div>
  </>;
}

export default function Movements(){return <Suspense fallback={<div className="panel">جارٍ تحميل حركة المخزون…</div>}><MovementsContent/></Suspense>}
