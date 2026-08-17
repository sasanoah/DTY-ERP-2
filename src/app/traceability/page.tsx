'use client';
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {KpiCard} from '@/components/KpiCard';
import {Status} from '@/components/Status';

const movementNames:Record<string,string>={RECEIVE:'استلام',MOVE:'نقل مخزني',ISSUE:'صرف للإنتاج',RETURN:'إرجاع',ADJUST:'تسوية رصيد',PICK:'تجهيز',DISPATCH:'شحن'};
function kg(value:unknown){return `${Number(value||0).toLocaleString()} كجم`}
function date(value:unknown){return value?new Date(String(value)).toLocaleString('ar-EG'):'—'}
function customers(lines:any[]=[]){return [...new Set(lines.map(line=>line.delivery?.salesOrder?.customer?.nameAr).filter(Boolean))].join('، ')||'—'}

function RawTrace({raw}:{raw:any}){
  const chain=(raw.materialIssues||[]).flatMap((issue:any)=>{
    const finished=issue.productionRun?.finishedLots||[];
    return finished.length?finished.map((lot:any)=>({issue,lot})):[{issue,lot:null}];
  });
  return <>
    <div className="kpiGrid">
      <KpiCard label="Lot الخامة" value={raw.lotNo} note={raw.material.nameAr}/>
      <KpiCard label="الرصيد الحالي" value={kg(raw.availableQtyKg)} note={`من أصل ${kg(raw.receivedQtyKg)}`}/>
      <div className="kpi"><span>حالة الجودة</span><strong><Status value={raw.qcStatus}/></strong><small>{raw.supplier?.nameAr||'بدون مورد مسجل'}</small></div>
    </div>
    <div className="panel"><div className="panelTitle"><h2>رحلة الإنتاج من POY إلى DTY والعميل</h2><span>{chain.length} نتيجة</span></div><div className="tableWrap"><table><thead><tr><th>أمر الإنتاج</th><th>الماكينة</th><th>صرف POY</th><th>تشغيل الوردية</th><th>Lot DTY الناتج</th><th>الكمية / الجودة</th><th>العميل</th></tr></thead><tbody>{chain.length?chain.map(({issue,lot}:any,index:number)=><tr key={`${issue.id}-${lot?.id||index}`}><td className="ltr">{issue.productionRun.productionOrder.orderNo}</td><td>{issue.productionRun.productionOrder.machine.code}</td><td>{kg(issue.qtyKg)}</td><td>{date(issue.productionRun.startTime)}</td><td className="ltr">{lot?.lotNo||'لم ينتج بعد'}</td><td>{lot?<>{kg(lot.qtyKg)} <Status value={lot.qcStatus}/></>:'—'}</td><td>{lot?customers(lot.deliveryLines):'—'}</td></tr>):<tr><td colSpan={7}>لم تُصرف هذه الخامة إلى تشغيل إنتاج حتى الآن.</td></tr>}</tbody></table></div></div>
    <div className="panel"><div className="panelTitle"><h2>سجل حركات المخزون</h2><span>أحدث {Math.min(raw.movements?.length||0,200)} حركة</span></div><div className="tableWrap"><table><thead><tr><th>التاريخ</th><th>الحركة</th><th>الكمية</th><th>من / إلى</th><th>المرجع</th><th>المستخدم</th></tr></thead><tbody>{raw.movements?.length?raw.movements.map((movement:any)=><tr key={movement.id}><td>{date(movement.createdAt)}</td><td>{movementNames[movement.movementType]||movement.movementType}</td><td>{movement.movementType==='ADJUST'?`${kg(movement.qtyKg)} (رصيد فعلي)`:kg(movement.qtyKg)}</td><td className="ltr">{movement.fromBinCode||'—'} → {movement.toBinCode||'—'}</td><td>{movement.refType||'—'} {movement.refId||''}</td><td>{movement.user?.fullNameAr||movement.user?.username||'—'}</td></tr>):<tr><td colSpan={6}>لا توجد حركات مخزون مسجلة.</td></tr>}</tbody></table></div></div>
  </>;
}

function FinishedTrace({finished}:{finished:any}){
  const run=finished.productionRun;
  return <>
    <div className="kpiGrid">
      <KpiCard label="Lot المنتج" value={finished.lotNo} note={finished.product.nameAr}/>
      <KpiCard label="الرصيد الحالي" value={kg(finished.availableQtyKg)} note={`إنتاج ${kg(finished.qtyKg)} • Grade ${finished.grade}`}/>
      <div className="kpi"><span>حالة الجودة</span><strong><Status value={finished.qcStatus}/></strong><small>{run.productionOrder.machine.code}</small></div>
    </div>
    <div className="panel"><div className="panelTitle"><h2>الخامات والتشغيل</h2><span className="ltr">{run.productionOrder.orderNo}</span></div><div className="tableWrap"><table><thead><tr><th>Lot POY المصدر</th><th>الخامة</th><th>المورد</th><th>الكمية المصروفة</th><th>الماكينة</th><th>بداية التشغيل</th></tr></thead><tbody>{run.materialIssues?.map((issue:any)=><tr key={issue.id}><td className="ltr"><a href={`/traceability?lot=${encodeURIComponent(issue.inventoryLot.lotNo)}`}>{issue.inventoryLot.lotNo}</a></td><td>{issue.inventoryLot.material.nameAr}</td><td>{issue.inventoryLot.supplier?.nameAr||'—'}</td><td>{kg(issue.qtyKg)}</td><td>{run.productionOrder.machine.code}</td><td>{date(run.startTime)}</td></tr>)}</tbody></table></div></div>
    <div className="panel"><div className="panelTitle"><h2>التسليم والعملاء</h2><span>{finished.deliveryLines?.length||0} تسليم</span></div><div className="tableWrap"><table><thead><tr><th>إذن التسليم</th><th>أمر البيع</th><th>العميل</th><th>الكمية</th></tr></thead><tbody>{finished.deliveryLines?.length?finished.deliveryLines.map((line:any)=><tr key={line.id}><td className="ltr">{line.delivery.deliveryNo}</td><td className="ltr">{line.delivery.salesOrder.orderNo}</td><td>{line.delivery.salesOrder.customer.nameAr}</td><td>{kg(line.qtyKg)}</td></tr>):<tr><td colSpan={4}>لم يتم تسليم هذا الـLot إلى عميل حتى الآن.</td></tr>}</tbody></table></div></div>
  </>;
}

function TraceabilityContent(){
  const q=useSearchParams();
  const [lot,setLot]=useState('POY-2608-0001');
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  async function search(value=lot){
    const normalized=value.trim();
    if(!normalized){setMsg('أدخل رقم Lot');return}
    setLoading(true);
    const r=await fetch(`/api/traceability/lot/${encodeURIComponent(normalized)}`,{cache:'no-store'});
    const j=await r.json();
    setLoading(false);
    if(r.ok){setData(j);setMsg('');setLot(normalized)}else{setData(null);setMsg(j.error||'تعذر تتبع Lot')}
  }
  useEffect(()=>{const value=q.get('lot');if(value){setLot(value);search(value)}},[q]);
  return <><header className="pageHead"><div><h1>تتبع الـLot</h1><p>من POY إلى الماكينة وDTY والعميل والعكس</p></div></header><div className="toolbar"><input className="ltr" value={lot} onChange={e=>setLot(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')search()}} placeholder="POY-... أو DTY-..."/><button className="primary" onClick={()=>search()} disabled={loading}>{loading?'جارٍ التتبع...':'تتبع'}</button></div>{msg&&<div className="formError">{msg}</div>}{data?.type==='POY'&&<RawTrace raw={data.raw}/>} {data?.type==='DTY'&&<FinishedTrace finished={data.finished}/>}</>;
}

export default function Traceability(){return <Suspense fallback={<div className="panel">جارٍ تحميل شاشة التتبع…</div>}><TraceabilityContent/></Suspense>}
