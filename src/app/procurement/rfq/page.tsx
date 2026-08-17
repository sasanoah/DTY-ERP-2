'use client';

import {useEffect,useMemo,useState} from 'react';
import {Status} from '@/components/Status';

type Material={id:string;code:string;nameAr:string};
type Supplier={id:string;code:string;nameAr:string;currencyDefault:string;paymentTermsDays:number};
type RfqLine={id:string;materialId:string;qtyKg:string|number;requiredDate?:string|null;material:Material};
type QuoteLine={id:string;rfqLineId:string;unitPrice:string|number;freightEgpKg:string|number;leadTimeDays:number};
type SupplierQuote={id:string;supplierId:string;currency:string;exchangeRate:string|number;validUntil?:string|null;paymentTermsDays:number;status:string;supplier:Supplier;lines:QuoteLine[]};
type Rfq={id:string;rfqNo:string;dueDate:string;status:string;notes?:string|null;lines:RfqLine[];quotes:SupplierQuote[]};
type NewLine={materialId:string;qtyKg:number;requiredDate:string};
type QuoteDraft={supplierId:string;currency:string;exchangeRate:number;validUntil:string;paymentTermsDays:number;lines:Array<{rfqLineId:string;unitPrice:number;freightEgpKg:number;leadTimeDays:number}>};

function futureDate(days:number){const value=new Date(Date.now()+days*86_400_000);return value.toISOString().slice(0,10)}
function apiMessage(body:any){return body?.issues?.[0]?.message||body?.error||'تعذر تنفيذ العملية'}
function formatDate(value:string){return new Date(value).toLocaleDateString('ar-EG')}
function landedAverage(quote:SupplierQuote,rfq:Rfq){
  const quantities=new Map(rfq.lines.map(line=>[line.id,Number(line.qtyKg)]));
  const totalQty=quote.lines.reduce((sum,line)=>sum+(quantities.get(line.rfqLineId)||0),0);
  if(!totalQty)return 0;
  return quote.lines.reduce((sum,line)=>sum+((Number(line.unitPrice)*Number(quote.exchangeRate))+Number(line.freightEgpKg))*(quantities.get(line.rfqLineId)||0),0)/totalQty;
}

export default function RfqPage(){
  const [rfqs,setRfqs]=useState<Rfq[]>([]);
  const [materials,setMaterials]=useState<Material[]>([]);
  const [suppliers,setSuppliers]=useState<Supplier[]>([]);
  const [dueDate,setDueDate]=useState(()=>futureDate(7));
  const [notes,setNotes]=useState('');
  const [lines,setLines]=useState<NewLine[]>([{materialId:'',qtyKg:20000,requiredDate:''}]);
  const [statusFilter,setStatusFilter]=useState('OPEN');
  const [editingRfqId,setEditingRfqId]=useState('');
  const [quoteDraft,setQuoteDraft]=useState<QuoteDraft|null>(null);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);

  async function load(){
    const [rfqResponse,contextResponse]=await Promise.all([
      fetch('/api/procurement/rfq',{cache:'no-store'}),
      fetch('/api/procurement/context',{cache:'no-store'}),
    ]);
    const [rfqBody,contextBody]=await Promise.all([rfqResponse.json(),contextResponse.json()]);
    if(!rfqResponse.ok){setMessage({type:'error',text:apiMessage(rfqBody)});return}
    if(!contextResponse.ok){setMessage({type:'error',text:apiMessage(contextBody)});return}
    setRfqs(rfqBody.rfqs);
    setMaterials(contextBody.materials);
    setSuppliers(contextBody.suppliers);
    setLines(current=>current.map(line=>({...line,materialId:line.materialId||contextBody.materials[0]?.id||''})));
  }

  useEffect(()=>{load()},[]);

  function addLine(){
    const unused=materials.find(material=>!lines.some(line=>line.materialId===material.id));
    setLines(current=>[...current,{materialId:unused?.id||materials[0]?.id||'',qtyKg:20000,requiredDate:''}]);
  }
  function updateLine(index:number,patch:Partial<NewLine>){setLines(current=>current.map((line,i)=>i===index?{...line,...patch}:line))}
  function removeLine(index:number){setLines(current=>current.filter((_,i)=>i!==index))}

  async function createRfq(){
    setMessage(null);
    if(!dueDate)return setMessage({type:'error',text:'حدد موعد إغلاق طلب عرض السعر'});
    if(!lines.length||lines.some(line=>!line.materialId||line.qtyKg<=0))return setMessage({type:'error',text:'أكمل الخامة والكمية لكل السطور'});
    if(new Set(lines.map(line=>line.materialId)).size!==lines.length)return setMessage({type:'error',text:'لا يمكن تكرار الخامة داخل الطلب'});
    setBusy('create');
    const response=await fetch('/api/procurement/rfq',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({dueDate,notes:notes||undefined,lines:lines.map(line=>({materialId:line.materialId,qtyKg:line.qtyKg,requiredDate:line.requiredDate||undefined}))})});
    const body=await response.json();
    setBusy('');
    if(!response.ok)return setMessage({type:'error',text:apiMessage(body)});
    setMessage({type:'success',text:`تم إصدار ${body.rfq.rfqNo} وإرساله للموردين`});
    setDueDate(futureDate(7));setNotes('');setLines([{materialId:materials[0]?.id||'',qtyKg:20000,requiredDate:''}]);
    await load();
  }

  function makeQuoteDraft(rfq:Rfq,supplierId:string):QuoteDraft{
    const supplier=suppliers.find(item=>item.id===supplierId);
    const existing=rfq.quotes.find(quote=>quote.supplierId===supplierId);
    return {
      supplierId,
      currency:existing?.currency||supplier?.currencyDefault||'USD',
      exchangeRate:Number(existing?.exchangeRate||(supplier?.currencyDefault==='EGP'?1:50)),
      validUntil:existing?.validUntil?.slice(0,10)||futureDate(14),
      paymentTermsDays:existing?.paymentTermsDays??supplier?.paymentTermsDays??30,
      lines:rfq.lines.map(line=>{const saved=existing?.lines.find(item=>item.rfqLineId===line.id);return {rfqLineId:line.id,unitPrice:Number(saved?.unitPrice||0),freightEgpKg:Number(saved?.freightEgpKg||0),leadTimeDays:saved?.leadTimeDays??30}}),
    };
  }

  function openQuote(rfq:Rfq){
    const supplierId=rfq.quotes.find(quote=>quote.status==='SUBMITTED')?.supplierId||suppliers[0]?.id||'';
    if(!supplierId){setMessage({type:'error',text:'لا يوجد مورد معتمد لتسجيل العرض'});return}
    setEditingRfqId(rfq.id);setQuoteDraft(makeQuoteDraft(rfq,supplierId));setMessage(null);
  }

  async function saveQuote(rfq:Rfq){
    if(!quoteDraft)return;
    if(!quoteDraft.supplierId||quoteDraft.exchangeRate<=0||quoteDraft.lines.some(line=>line.unitPrice<=0||line.freightEgpKg<0||line.leadTimeDays<0)){
      setMessage({type:'error',text:'أكمل المورد وسعر الصرف وأسعار جميع الخامات'});return;
    }
    setBusy(`quote-${rfq.id}`);setMessage(null);
    const response=await fetch('/api/procurement/rfq/quotes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rfqId:rfq.id,...quoteDraft,validUntil:quoteDraft.validUntil||undefined})});
    const body=await response.json();setBusy('');
    if(!response.ok)return setMessage({type:'error',text:apiMessage(body)});
    setMessage({type:'success',text:`تم حفظ عرض ${body.quote.supplier.nameAr} على ${rfq.rfqNo}`});
    setEditingRfqId('');setQuoteDraft(null);await load();
  }

  async function convert(rfq:Rfq,quote:SupplierQuote){
    setBusy(`convert-${quote.id}`);setMessage(null);
    const response=await fetch(`/api/procurement/rfq/${rfq.id}/convert`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({supplierQuoteId:quote.id})});
    const body=await response.json();setBusy('');
    if(!response.ok)return setMessage({type:'error',text:apiMessage(body)});
    setMessage({type:'success',text:`تم اختيار ${quote.supplier.nameAr} وإنشاء أمر الشراء ${body.purchaseOrder.poNo}`});
    setEditingRfqId('');setQuoteDraft(null);await load();
  }

  const visibleRfqs=useMemo(()=>rfqs.filter(rfq=>statusFilter==='ALL'||(statusFilter==='OPEN'?rfq.status==='SENT':rfq.status===statusFilter)),[rfqs,statusFilter]);

  return <>
    <header className="pageHead"><div><h1>طلبات عروض الأسعار RFQ</h1><p>إصدار الطلب، تسجيل عروض الموردين، المقارنة، ثم إنشاء أمر الشراء</p></div><button className="toolbarLink" onClick={load}>تحديث</button></header>

    {message&&<div className={message.type==='error'?'formError':'formNotice'}>{message.text}</div>}

    <div className="panel formPanel">
      <div className="panelTitle"><h2>طلب عرض سعر جديد</h2><span>{lines.length} خامة</span></div>
      <div className="formGrid">
        <label>موعد إغلاق RFQ<input type="date" value={dueDate} min={new Date().toISOString().slice(0,10)} onChange={event=>setDueDate(event.target.value)}/></label>
        <label>ملاحظات<input value={notes} onChange={event=>setNotes(event.target.value)} placeholder="الشروط أو المواصفات المطلوبة"/></label>
      </div>
      <div className="tableWrap"><table><thead><tr><th>الخامة</th><th>الكمية kg</th><th>تاريخ الاحتياج</th><th></th></tr></thead><tbody>{lines.map((line,index)=><tr key={index}><td><select aria-label={`خامة السطر ${index+1}`} value={line.materialId} onChange={event=>updateLine(index,{materialId:event.target.value})}>{materials.map(material=><option key={material.id} value={material.id}>{material.code} — {material.nameAr}</option>)}</select></td><td><input aria-label={`كمية السطر ${index+1}`} type="number" min="0.001" step="0.001" value={line.qtyKg} onChange={event=>updateLine(index,{qtyKg:Number(event.target.value)})}/></td><td><input aria-label={`تاريخ احتياج السطر ${index+1}`} type="date" value={line.requiredDate} onChange={event=>updateLine(index,{requiredDate:event.target.value})}/></td><td>{lines.length>1&&<button onClick={()=>removeLine(index)}>حذف</button>}</td></tr>)}</tbody></table></div>
      <div className="inlineActions"><button onClick={addLine} disabled={lines.length>=materials.length}>+ إضافة خامة</button><button className="primary" onClick={createRfq} disabled={busy==='create'||!materials.length}>{busy==='create'?'جارٍ الإصدار…':'إصدار RFQ'}</button></div>
    </div>

    <div className="toolbar" style={{marginTop:16}}><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="OPEN">الطلبات المفتوحة</option><option value="CONVERTED">المحولة لأوامر شراء</option><option value="ALL">كل الطلبات</option></select><span className="hint">{visibleRfqs.length} طلب</span></div>

    {visibleRfqs.length===0&&<div className="panel">لا توجد طلبات ضمن هذا الاختيار.</div>}
    {visibleRfqs.map(rfq=><div className="panel" key={rfq.id} data-testid={`rfq-${rfq.id}`} style={{marginBottom:14}}>
      <div className="panelTitle"><h2 className="ltr">{rfq.rfqNo}</h2><Status value={rfq.status}/></div>
      <p className="hint">إغلاق العروض: {formatDate(rfq.dueDate)}{rfq.notes?` • ${rfq.notes}`:''}</p>
      <div className="tableWrap"><table><thead><tr><th>الخامة المطلوبة</th><th>الكمية</th><th>تاريخ الاحتياج</th></tr></thead><tbody>{rfq.lines.map(line=><tr key={line.id}><td>{line.material.code} — {line.material.nameAr}</td><td>{Number(line.qtyKg).toLocaleString()} كجم</td><td>{line.requiredDate?formatDate(line.requiredDate):'—'}</td></tr>)}</tbody></table></div>
      {rfq.status==='SENT'&&<div className="inlineActions" style={{marginTop:12}}><button onClick={()=>openQuote(rfq)}>+ تسجيل / تعديل عرض مورد</button></div>}

      {editingRfqId===rfq.id&&quoteDraft&&<div className="formPanel" style={{marginTop:14,borderTop:'1px solid var(--line)',paddingTop:14}}>
        <h3>عرض المورد</h3>
        <div className="formGrid">
          <label>المورد<select aria-label="المورد" value={quoteDraft.supplierId} onChange={event=>setQuoteDraft(makeQuoteDraft(rfq,event.target.value))}>{suppliers.map(supplier=><option key={supplier.id} value={supplier.id}>{supplier.code} — {supplier.nameAr}</option>)}</select></label>
          <label>العملة<select aria-label="عملة العرض" value={quoteDraft.currency} onChange={event=>setQuoteDraft({...quoteDraft,currency:event.target.value,exchangeRate:event.target.value==='EGP'?1:quoteDraft.exchangeRate})}><option value="USD">USD</option><option value="EUR">EUR</option><option value="EGP">EGP</option></select></label>
          <label>سعر الصرف إلى EGP<input aria-label="سعر الصرف" type="number" min="0.0001" step="0.01" value={quoteDraft.exchangeRate} onChange={event=>setQuoteDraft({...quoteDraft,exchangeRate:Number(event.target.value)})}/></label>
          <label>صلاحية العرض حتى<input aria-label="صلاحية العرض حتى" type="date" min={new Date().toISOString().slice(0,10)} value={quoteDraft.validUntil} onChange={event=>setQuoteDraft({...quoteDraft,validUntil:event.target.value})}/></label>
          <label>شروط السداد / يوم<input aria-label="شروط السداد" type="number" min="0" value={quoteDraft.paymentTermsDays} onChange={event=>setQuoteDraft({...quoteDraft,paymentTermsDays:Number(event.target.value)})}/></label>
        </div>
        <div className="tableWrap"><table><thead><tr><th>الخامة</th><th>سعر الوحدة / kg</th><th>شحن EGP/kg</th><th>مدة التوريد / يوم</th></tr></thead><tbody>{rfq.lines.map((line,index)=>{const draftLine=quoteDraft.lines[index];return <tr key={line.id} data-testid={`quote-line-${line.id}`}><td>{line.material.nameAr}<small>{Number(line.qtyKg).toLocaleString()} كجم</small></td><td><input aria-label={`سعر ${line.material.nameAr}`} type="number" min="0.000001" step="0.001" value={draftLine.unitPrice} onChange={event=>setQuoteDraft({...quoteDraft,lines:quoteDraft.lines.map((item,i)=>i===index?{...item,unitPrice:Number(event.target.value)}:item)})}/></td><td><input aria-label={`شحن ${line.material.nameAr}`} type="number" min="0" step="0.01" value={draftLine.freightEgpKg} onChange={event=>setQuoteDraft({...quoteDraft,lines:quoteDraft.lines.map((item,i)=>i===index?{...item,freightEgpKg:Number(event.target.value)}:item)})}/></td><td><input aria-label={`توريد ${line.material.nameAr}`} type="number" min="0" value={draftLine.leadTimeDays} onChange={event=>setQuoteDraft({...quoteDraft,lines:quoteDraft.lines.map((item,i)=>i===index?{...item,leadTimeDays:Number(event.target.value)}:item)})}/></td></tr>})}</tbody></table></div>
        <div className="inlineActions" style={{marginTop:12}}><button className="primary" onClick={()=>saveQuote(rfq)} disabled={busy===`quote-${rfq.id}`}>{busy===`quote-${rfq.id}`?'جارٍ الحفظ…':'حفظ عرض المورد'}</button><button onClick={()=>{setEditingRfqId('');setQuoteDraft(null)}}>إلغاء</button></div>
      </div>}

      {rfq.quotes.length>0&&<div className="tableWrap" style={{marginTop:14}}><table><thead><tr><th>المورد</th><th>العملة / الصرف</th><th>متوسط التكلفة EGP/kg</th><th>مدة التوريد</th><th>السداد</th><th>صلاحية العرض</th><th>الحالة</th><th></th></tr></thead><tbody>{rfq.quotes.map(quote=><tr key={quote.id}><td>{quote.supplier.nameAr}</td><td className="ltr">{quote.currency} / {Number(quote.exchangeRate).toFixed(2)}</td><td>{landedAverage(quote,rfq).toFixed(2)} ج</td><td>{Math.max(...quote.lines.map(line=>line.leadTimeDays),0)} يوم</td><td>{quote.paymentTermsDays} يوم</td><td>{quote.validUntil?formatDate(quote.validUntil):'—'}</td><td><Status value={quote.status}/></td><td>{rfq.status==='SENT'&&quote.status==='SUBMITTED'&&<button onClick={()=>convert(rfq,quote)} disabled={busy===`convert-${quote.id}`}>{busy===`convert-${quote.id}`?'جارٍ الإنشاء…':'اختيار وإنشاء PO'}</button>}</td></tr>)}</tbody></table></div>}
    </div>)}
  </>;
}
