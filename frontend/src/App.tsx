import { useEffect, useState, type FormEvent } from "react";

type User = { id: number; name: string; email: string };
type PlanPlace = { id?: number; name: string; dayNumber: number; orderIndex?: number; plannedTime?: string; notes?: string };
type Plan = {
  id: number; title: string; destination: string; startDate: string; days: number; travelers: number;
  transport: string; notes?: string; createdAt: string; places: PlanPlace[];
};
type PlanForm = Omit<Plan, "id" | "createdAt" | "places"> & { places: PlanPlace[] };

const emptyForm = (): PlanForm => ({
  title: "서울 주말 나들이", destination: "서울", startDate: "2026-12-01", days: 2,
  travelers: 2, transport: "대중교통", notes: "점심시간은 여유 있게 잡기",
  places: [
    { name: "경복궁", dayNumber: 1, plannedTime: "10:00" },
    { name: "북촌 한옥마을", dayNumber: 1, plannedTime: "13:00" },
    { name: "광장시장", dayNumber: 2, plannedTime: "11:30" },
  ],
});

const cityRegions = [
  { name: "종로·북촌", left: "54%", top: "22%", places: ["경복궁", "북촌 한옥마을", "광장시장"] },
  { name: "마포·홍대", left: "20%", top: "45%", places: ["홍대 거리", "망원시장", "연남동"] },
  { name: "명동·중구", left: "46%", top: "48%", places: ["명동 거리", "덕수궁", "남산서울타워"] },
  { name: "성수·서울숲", left: "77%", top: "36%", places: ["서울숲", "성수 카페거리", "뚝섬 한강공원"] },
  { name: "용산·이태원", left: "57%", top: "68%", places: ["국립중앙박물관", "이태원 거리", "한강진"] },
  { name: "강남", left: "82%", top: "81%", places: ["코엑스", "봉은사", "강남역"] },
];
const tokyoRegions = [
  { name: "아사쿠사·우에노", left: "72%", top: "25%", places: ["센소지", "우에노 공원", "아메요코 시장"] },
  { name: "신주쿠", left: "36%", top: "39%", places: ["신주쿠 교엔", "도쿄도청 전망대", "오모이데 요코초"] },
  { name: "시부야·하라주쿠", left: "28%", top: "65%", places: ["시부야 스크램블 교차로", "메이지 신궁", "다케시타 거리"] },
  { name: "긴자·도쿄역", left: "66%", top: "60%", places: ["긴자 거리", "도쿄역", "츠키지 장외시장"] },
  { name: "오다이바", left: "83%", top: "82%", places: ["오다이바 해변공원", "다이버시티 도쿄", "teamLab Planets"] },
  { name: "마이하마", left: "91%", top: "48%", places: ["도쿄 디즈니랜드", "도쿄 디즈니씨"] },
];

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `요청에 실패했습니다 (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function App() {
  const [screen, setScreen] = useState<"welcome" | "auth" | "home" | "mypage" | "form" | "plan">("welcome");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [planStep, setPlanStep] = useState(0);
  const [activeRegion, setActiveRegion] = useState("종로·북촌");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newPlaceDay, setNewPlaceDay] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPlans = async () => setPlans(await api<Plan[]>("/api/plans"));
  useEffect(() => {
    api<User>("/api/auth/me").then(async (currentUser) => {
      setUser(currentUser);
      await loadPlans();
      setScreen("home");
    }).catch(() => {});
  }, []);

  const startAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setMessage("");
    setScreen("auth");
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const currentUser = await api<User>(`/api/auth/${authMode === "register" ? "register" : "login"}`, {
        method: "POST", body: JSON.stringify(authMode === "register" ? { name, email, password } : { email, password }),
      });
      setUser(currentUser);
      await loadPlans();
      setScreen("home");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "계정 요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api<void>("/api/auth/logout", { method: "POST" });
    setUser(null); setPlans([]); setScreen("welcome");
  };

  const beginNewPlan = () => {
    setForm(emptyForm()); setEditingId(null); setPlanStep(0); setActiveRegion("종로·북촌"); setMessage(""); setScreen("form");
  };

  const editPlan = (plan: Plan) => {
    setForm({ title: plan.title, destination: plan.destination, startDate: plan.startDate, days: plan.days,
      travelers: plan.travelers, transport: plan.transport, notes: plan.notes ?? "", places: plan.places });
    setEditingId(plan.id); setPlanStep(0); setActiveRegion("종로·북촌"); setMessage(""); setScreen("form");
  };

  const savePlan = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const saved = await api<Plan>(editingId ? `/api/plans/${editingId}` : "/api/plans", {
        method: editingId ? "PUT" : "POST", body: JSON.stringify({ ...form, places: form.places.map(({ name: placeName, dayNumber, plannedTime, notes }) => ({ name: placeName, dayNumber, plannedTime, notes })) }),
      });
      await loadPlans(); setSelectedPlan(saved); setScreen("plan");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "플랜 저장에 실패했습니다.");
    } finally { setBusy(false); }
  };

  const openPlan = async (id: number) => {
    try { setSelectedPlan(await api<Plan>(`/api/plans/${id}`)); setScreen("plan"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "플랜을 불러오지 못했습니다."); }
  };

  const deletePlan = async (plan: Plan) => {
    if (!window.confirm(`'${plan.title}' 플랜을 삭제할까요?`)) return;
    try { await api<void>(`/api/plans/${plan.id}`, { method: "DELETE" }); await loadPlans(); setScreen("mypage"); setMessage("플랜을 삭제했습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "플랜 삭제에 실패했습니다."); }
  };

  const updateForm = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const addPlace = () => {
    const placeName = newPlace.trim();
    if (!placeName) return;
    updateForm("places", [...form.places, { name: placeName, dayNumber: newPlaceDay, plannedTime: "12:00" }]);
    setNewPlace("");
  };
  const toggleSuggestedPlace = (placeName: string) => {
    const exists = form.places.some((place) => place.name === placeName);
    updateForm("places", exists
      ? form.places.filter((place) => place.name !== placeName)
      : [...form.places, { name: placeName, dayNumber: newPlaceDay, plannedTime: "12:00" }]);
  };
  const regionChoices = /tokyo|도쿄|일본/i.test(form.destination) ? tokyoRegions : cityRegions;
  const selectedRegion = regionChoices.find((region) => region.name === activeRegion) ?? regionChoices[0];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand-button" onClick={() => setScreen(user ? "home" : "welcome")}><span className="brand"><span className="brand-mark">R</span><span>Route<span>Craft</span></span></span></button>
      <nav className="nav-links">
        {user && <><button onClick={() => setScreen("home")}>내 여행</button><button onClick={() => setScreen("mypage")}>마이페이지</button></>}
      </nav>
      <div className="header-actions">{user ? <><span>{user.name}님</span><button className="help-button" onClick={logout}>로그아웃</button></> : <button className="help-button" onClick={() => startAuth("login")}>로그인</button>}</div>
    </header>

    {screen === "welcome" && <main className="welcome-main"><section className="welcome-hero"><div className="welcome-content">
      <span className="eyebrow">나의 여행을 한곳에 정리해요</span>
      <h1 className="welcome-title">여행 준비부터 기록까지,<br /><strong>RouteCraft</strong>와 함께.</h1>
      <p>여행 일정과 방문 장소를 직접 정리하고<br />내 플랜으로 저장해 언제든 다시 확인하세요.</p>
      <div className="welcome-actions"><button className="primary-button" onClick={() => startAuth("register")}>회원가입</button><button className="secondary-button" onClick={() => startAuth("login")}>로그인</button></div>
      <div className="welcome-points"><span>여행 플랜 저장</span><span>방문 장소 관리</span><span>내 계정에서 확인</span></div>
    </div><div className="welcome-visual"><div className="preview-card preview-main"><small>나의 여행 플랜 · 2일</small><h3>서울 주말 나들이</h3><p>1일차　경복궁 · 북촌 한옥마을</p><p>2일차　광장시장</p><span className="preview-note">예시 플랜 · 직접 수정할 수 있어요</span></div></div></section></main>}

    {screen === "auth" && <main className="setup-main auth-main"><div className="wizard-heading"><span className="eyebrow">RouteCraft 계정</span><h1 className="page-title">{authMode === "register" ? "회원가입" : "로그인"}</h1><p>저장한 여행 플랜을 내 계정에서 관리하세요.</p></div>
      <form className="form-card auth-card" onSubmit={submitAuth}>
        {authMode === "register" && <label className="field">이름<input className="control" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={60} /></label>}
        <label className="field">이메일<input className="control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label className="field">비밀번호<input className="control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength={authMode === "register" ? 8 : 1} required /><small>비밀번호는 8자 이상으로 설정해 주세요.</small></label>
        {message && <p className="form-message">{message}</p>}
        <button className="primary-button full" disabled={busy}>{busy ? "처리 중…" : authMode === "register" ? "계정 만들기" : "로그인"}</button>
        <p className="auth-switch">{authMode === "register" ? "이미 계정이 있나요?" : "처음 방문하셨나요?"} <button type="button" onClick={() => startAuth(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "로그인" : "회원가입"}</button></p>
      </form></main>}

    {screen === "home" && <main className="itinerary-main"><div className="itinerary-header"><div><span className="eyebrow">환영합니다, {user?.name}님</span><h1 className="page-title">나의 여행 플랜</h1><p>여행 정보를 기록하고 방문 장소를 관리하세요.</p></div><button className="primary-button" onClick={beginNewPlan}>＋ 새 플랜 만들기</button></div>
      {message && <p className="form-message">{message}</p>}
      <section className="plan-grid">{plans.length ? plans.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={() => void openPlan(plan.id)} />) : <div className="empty-card"><h2>아직 저장한 플랜이 없어요</h2><p>첫 여행의 날짜와 방문 장소를 기록해 보세요.</p><button className="primary-button" onClick={beginNewPlan}>여행 플랜 만들기</button></div>}</section>
    </main>}

    {screen === "mypage" && <main className="setup-main"><div className="wizard-heading"><span className="eyebrow">계정 정보</span><h1 className="page-title">마이페이지</h1><p>내 계정과 저장된 여행 플랜을 관리하세요.</p></div>
      {user && <section className="profile-card"><div className="profile-avatar">{user.name.slice(0, 1)}</div><div><h2>{user.name}</h2><p>{user.email}</p></div><span className="profile-count">저장한 플랜 <strong>{plans.length}</strong></span></section>}
      <div className="mypage-heading"><h2>내 여행 플랜</h2><button className="secondary-button" onClick={beginNewPlan}>＋ 새 플랜</button></div>
      {message && <p className="form-message">{message}</p>}
      <section className="plan-grid">{plans.length ? plans.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={() => void openPlan(plan.id)} />) : <div className="empty-card"><p>저장된 플랜이 없습니다.</p><button className="primary-button" onClick={beginNewPlan}>첫 플랜 만들기</button></div>}</section>
    </main>}

    {screen === "form" && <main className="setup-main wizard-main">
      <div className="wizard-heading"><button type="button" className="wizard-exit" onClick={() => setScreen("home")}>← 내 여행으로</button><span className="eyebrow">여행 플랜 만들기</span><h1 className="page-title">{["기본 여행 정보", "가고 싶은 곳", "추가 요청사항"][planStep]}</h1><p>{["여행의 기본 조건을 정해 주세요.", "지도에서 지역을 선택하고 방문할 장소를 골라 주세요.", "여행 중 기억할 조건이나 메모를 남겨 주세요."][planStep]}</p></div>
      <div className="wizard-progress" aria-label="플랜 작성 단계">{["기본 정보", "가고 싶은 곳", "추가 요청"].map((label, index) => <button type="button" key={label} className={planStep === index ? "active" : planStep > index ? "complete" : ""} onClick={() => setPlanStep(index)}><span>{index + 1}</span>{label}</button>)}</div>
      <form className="wizard-card plan-wizard" onSubmit={(event) => { if (planStep < 2) { event.preventDefault(); setPlanStep(planStep + 1); } else { void savePlan(event); } }}>
        <div className={`wizard-track wizard-step-${planStep}`}>
          <section className="wizard-slide"><div className="section-heading compact"><span className="section-icon">01</span><div><div role="heading" aria-level={2}>기본 여행 정보</div><p>여행지, 날짜와 이동 방식을 입력해 주세요.</p></div></div>
            <div className="form-grid wizard-form"><label className="field">플랜 이름<input className="control" value={form.title} onChange={(event) => updateForm("title", event.target.value)} required maxLength={100} /></label><label className="field">여행지<input className="control" value={form.destination} onChange={(event) => updateForm("destination", event.target.value)} required maxLength={120} /></label><label className="field">출발일<input className="control" type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} required /></label><label className="field">여행 기간(일)<input className="control" type="number" min={1} max={30} value={form.days} onChange={(event) => { const days = Math.max(1, Math.min(30, Number(event.target.value) || 1)); setForm((current) => ({ ...current, days, places: current.places.map((place) => ({ ...place, dayNumber: Math.min(place.dayNumber, days) })) })); setNewPlaceDay((current) => Math.min(current, days)); }} required /></label><label className="field">여행 인원<input className="control" type="number" min={1} max={100} value={form.travelers} onChange={(event) => updateForm("travelers", Number(event.target.value))} required /></label><label className="field">이동 수단<select className="control" value={form.transport} onChange={(event) => updateForm("transport", event.target.value)}><option>대중교통</option><option>도보</option><option>자가용</option><option>택시</option></select></label></div>
          </section>
          <section className="wizard-slide"><div className="section-heading compact"><span className="section-icon">02</span><div><div role="heading" aria-level={2}>가고 싶은 곳</div><p>지역을 고르면 해당 지역의 장소를 추가할 수 있어요.</p></div></div>
            <div className="region-picker"><div className="region-map" role="group" aria-label={`${form.destination} 지역 선택 지도`}><svg viewBox="0 0 600 360" aria-hidden="true"><path className="map-river" d="M-20 230 C80 190 130 270 225 225 S370 180 455 220 S555 250 625 190"/><g className="map-streets"><path d="M35 40 165 320M110 0 270 350M220 0 180 350M330 0 420 350M460 0 380 340M15 100 590 70M0 160 600 130M20 300 590 280M280 0 300 360"/></g></svg><span className="map-caption">{/tokyo|도쿄|일본/i.test(form.destination) ? "도쿄" : "서울"} 지역 선택 지도 · 장소 예시</span>{regionChoices.map((region) => <button key={region.name} type="button" className={`region-marker ${selectedRegion.name === region.name ? "active" : ""}`} style={{ left: region.left, top: region.top }} onClick={() => setActiveRegion(region.name)} aria-pressed={selectedRegion.name === region.name}><span className="region-marker-dot">{selectedRegion.name === region.name ? "✓" : ""}</span>{region.name}</button>)}</div>
              <aside className="region-sidebar"><div className="region-sidebar-title"><span>선택한 지역</span><strong>{selectedRegion.name}</strong></div><p>방문할 장소를 선택하세요. 선택한 장소는 플랜에 추가됩니다.</p><div className="suggested-places">{selectedRegion.places.map((placeName) => { const selected = form.places.some((place) => place.name === placeName); return <button type="button" key={placeName} className={selected ? "selected" : ""} onClick={() => toggleSuggestedPlace(placeName)}><span>{selected ? "✓" : "+"}</span>{placeName}</button>; })}</div><label className="field region-day-select">방문 날짜<select className="control" value={newPlaceDay} onChange={(event) => setNewPlaceDay(Number(event.target.value))}>{Array.from({ length: form.days }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}일차</option>)}</select></label></aside></div>
            <div className="place-editor-heading selected-place-heading"><div><h2>내가 고른 장소</h2><p>장소를 누르면 목록에서 빼거나 다시 추가할 수 있어요.</p></div><span>{form.places.length}곳</span></div><div className="chosen-places">{form.places.length ? form.places.map((place, index) => <button type="button" key={`${place.name}-${index}`} onClick={() => updateForm("places", form.places.filter((_, i) => i !== index))}><span>{place.dayNumber}일차</span>{place.name}<b>×</b></button>) : <p className="muted-copy">지도에서 지역을 고르고 방문 장소를 추가해 주세요.</p>}</div>
            <div className="add-place custom-place"><input value={newPlace} onChange={(event) => setNewPlace(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addPlace())} placeholder="목록에 없는 장소도 직접 추가할 수 있어요"/><button type="button" onClick={addPlace}>직접 추가</button></div>
          </section>
          <section className="wizard-slide"><div className="section-heading compact"><span className="section-icon soft">03</span><div><div role="heading" aria-level={2}>추가 요청사항</div><p>꼭 지켜야 할 시간이나 개인 메모를 자유롭게 적어 주세요.</p></div></div><div className="request-examples"><span>이런 내용을 적을 수 있어요</span><div><button type="button" onClick={() => updateForm("notes", "매일 오후 6시까지 숙소로 돌아오기")}>매일 오후 6시까지 숙소 복귀</button><button type="button" onClick={() => updateForm("notes", "둘째 날은 가족과 함께 천천히 여행하기")}>둘째 날은 여유롭게</button><button type="button" onClick={() => updateForm("notes", "걷는 시간을 줄이고 대중교통 이용하기")}>걷는 시간 줄이기</button></div></div><label className="field request-field">추가 요청사항<textarea className="control" rows={5} value={form.notes ?? ""} onChange={(event) => updateForm("notes", event.target.value)} maxLength={1000} placeholder="예: 둘째 날은 가족과 함께하고, 매일 오후 6시 전에 숙소로 돌아오기"/></label><div className="request-summary"><span>여행 기간 <strong>{form.days}일</strong></span><span>방문 장소 <strong>{form.places.length}곳</strong></span><span>이동 수단 <strong>{form.transport}</strong></span><span>여행 인원 <strong>{form.travelers}명</strong></span></div></section>
        </div>
        {message && <p className="form-message wizard-message">{message}</p>}
        <div className="wizard-footer"><button type="button" className="secondary-button" onClick={() => planStep === 0 ? setScreen("home") : setPlanStep(planStep - 1)}>{planStep === 0 ? "취소" : "이전"}</button><span>STEP {planStep + 1} / 3</span>{planStep < 2 ? <button type="button" className="primary-button" onClick={() => setPlanStep(planStep + 1)}>다음 단계 →</button> : <button type="submit" className="primary-button" disabled={busy}>{busy ? "저장 중…" : "플랜 저장"}</button>}</div>
      </form>
    </main>}
    {screen === "plan" && selectedPlan && <main className="itinerary-main"><div className="itinerary-header"><div><button className="back-link" onClick={() => setScreen("home")}>← 내 여행으로</button><h1 className="page-title">{selectedPlan.title}</h1><p>{selectedPlan.destination} · {selectedPlan.days}일 · {selectedPlan.travelers}명 · {selectedPlan.transport}</p></div><div className="plan-actions"><button className="secondary-button" onClick={() => editPlan(selectedPlan)}>수정</button><button className="delete-button" onClick={() => void deletePlan(selectedPlan)}>삭제</button></div></div>
      <section className="schedule-panel plan-detail"><div className="panel-heading"><div><h2>여행 정보</h2><p>{selectedPlan.startDate} 출발</p></div></div><p className="plan-notes">{selectedPlan.notes || "메모가 없습니다."}</p>
        {Array.from({ length: selectedPlan.days }, (_, i) => i + 1).map((dayNumber) => <div className="detail-day" key={dayNumber}><h3>{dayNumber}일차</h3>{selectedPlan.places.filter((place) => place.dayNumber === dayNumber).length ? selectedPlan.places.filter((place) => place.dayNumber === dayNumber).map((place) => <div className="detail-place" key={place.id ?? `${place.name}-${place.orderIndex}`}><time>{place.plannedTime || "시간 미정"}</time><strong>{place.name}</strong>{place.notes && <span>{place.notes}</span>}</div>) : <p className="muted-copy">아직 등록한 장소가 없습니다.</p>}</div>)}
      </section>
    </main>}
  </div>;
}

function PlanCard({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  return <button className="plan-card" onClick={onOpen}><span className="plan-card-icon">↗</span><span className="plan-card-body"><strong>{plan.title}</strong><span>{plan.destination} · {plan.days}일 · {plan.travelers}명</span><small>{plan.startDate} 출발 · 장소 {plan.places.length}곳</small></span><span className="plan-card-arrow">→</span></button>;
}

export default App;
