'use client';
export function LogoutButton(){async function logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/login'}return <button className="logoutBtn" onClick={logout}>تسجيل الخروج</button>}
