export function KpiCard({label,value,note,tone='good'}:{label:string,value:string,note:string,tone?:string}){
 return <div className={`kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}
