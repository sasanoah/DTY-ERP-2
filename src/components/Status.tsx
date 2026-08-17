const labels:Record<string,string>={
 RUN:'تشغيل',STOP:'متوقفة',MAINT:'صيانة',TRIAL:'تجربة',PENDING:'انتظار جودة',RELEASED:'مفرج',HOLD:'محجوز',REJECTED:'مرفوض',
 CONFIRMED:'مؤكد',ALLOCATED:'مخصص',DELIVERED:'تم التسليم',INVOICED:'مفوتر',OPEN:'مفتوح',PARTIAL:'جزئي',PAID:'مسدد',OVERDUE:'متأخر',
 BLOCKED:'موقوف ائتمانيًا',OVERRIDE:'استثناء',DRAFT:'مسودة',RUNNING:'قيد التشغيل',COMPLETED:'مكتمل',CLOSED:'مغلق',CANCELLED:'ملغي',
 URGENT:'عاجل',HIGH:'مرتفع',NORMAL:'عادي',LOW:'منخفض',APPROVED:'معتمد',SENT:'مرسل',PARTIAL_RECEIVED:'استلام جزئي',RECEIVED:'مستلم',
 SUBMITTED:'مقدم',CONVERTED:'محول',ASSIGNED:'مسند',IN_PROGRESS:'جاري التنفيذ',TESTING:'اختبار'
};
export function Status({value}:{value:string}){const shown=labels[value]||value; const good=['RUN','RELEASED','COMPLETED','CLOSED','PAID','APPROVED','RECEIVED'].includes(value); const danger=['STOP','REJECTED','HOLD','URGENT','OVERDUE','BLOCKED'].includes(value); const cls=good?'ok':danger?'danger':'warn'; return <span className={`status ${cls}`}>{shown}</span>}
