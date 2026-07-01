'use client';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';

const BLUE_GRAD = 'linear-gradient(180deg,#2E74EE,#1F5FE0)';
const GREEN_GRAD = 'linear-gradient(180deg,#0EA371,#0B8A4B)';
const RED_GRAD = 'linear-gradient(180deg,#D8434F,#C0303B)';
const BLUE_SHADOW = '0 10px 22px -10px rgba(37,99,235,.7)';
const GREEN_SHADOW = '0 10px 22px -10px rgba(11,138,75,.6)';

// icon path data
const IC_USERS =
  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75';
const IC_PENCIL = 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z';
const IC_SEND = 'M22 2 11 13 M22 2 15 22l-4-9-9-4 20-7Z';
const IC_SPARKLE = 'M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z';
const IC_CHECK = 'M20 6 9 17l-5-5';
const IC_GRIP = 'M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01';

export function Overlays({ vm }: { vm: VM }) {
  const s = vm.store;
  return (
    <>
      {/* ================= TEAM PANEL ================= */}
      {vm.teamOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, direction: 'rtl' }}>
          <div
            onClick={() => s.closeTeam()}
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 560,
              maxWidth: '96vw',
              background: '#F4F7FC',
              boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn .3s',
            }}
          >
            {/* header */}
            <div
              style={{
                background: '#fff',
                borderBottom: '1px solid #E7ECF4',
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: '#EAF0FE',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon d={IC_USERS} size={20} color="#2563EB" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>فريق العمل</div>
                <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600 }}>
                  الفريق المسؤول عن التحول بالذكاء الاصطناعي
                </div>
              </div>
              <button
                onClick={() => s.closeTeam()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#54627B',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* official rep card */}
              <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#54627B', marginBottom: 12 }}>
                  الممثل الرسمي للجهة
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {(vm.tmRep.name || 'م').split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1F2D49' }}>{vm.tmRep.name}</div>
                    <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600 }}>{vm.tmRep.position}</div>
                    <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, direction: 'ltr', textAlign: 'right' }}>
                      {vm.tmRep.email}
                    </div>
                  </div>
                </div>
              </div>
              {/* path owners card */}
              <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#54627B', marginBottom: 12 }}>
                  مسؤولو المسارات
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {vm.tmOwners.map((o, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 38, borderRadius: 6, background: o.color, flex: 'none' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1F2D49' }}>{o.name}</div>
                        <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600 }}>
                          {o.ownerName} · {o.ownerPos}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* footer */}
            <div style={{ background: '#fff', borderTop: '1px solid #E7ECF4', padding: '13px 20px' }}>
              <button
                onClick={() => s.goEditTeam()}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: BLUE_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 26px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: BLUE_SHADOW,
                }}
              >
                <Icon d={IC_PENCIL} size={17} color="#fff" />
                تعديل الفريق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DEADLINES MODAL ================= */}
      {vm.deadlinesOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => s.closeDeadlines()}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,17,35,.5)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              animation: 'fadeIn .2s',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 540,
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
              animation: 'fadeUp .3s',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '86vh',
            }}
          >
            <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C' }}>ضبط مهل المراحل</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3 }}>
                  حدّد الموعد النهائي لكل مرحلة من مراحل البرنامج
                </div>
              </div>
              <button
                onClick={() => s.closeDeadlines()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#54627B',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '0 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vm.deadlineRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: '#EAF0FE',
                      color: '#2563EB',
                      fontWeight: 800,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {r.num}
                  </div>
                  <input
                    value={r.name}
                    onChange={(e) => r.onName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: '1px solid #DCE3EE',
                      background: '#fff',
                      borderRadius: 11,
                      padding: '11px 13px',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                  <input
                    type="date"
                    value={r.deadline}
                    onChange={(e) => r.onSet(e.target.value)}
                    style={{
                      width: 160,
                      flex: 'none',
                      border: '1px solid #DCE3EE',
                      background: '#fff',
                      borderRadius: 11,
                      padding: '11px 13px',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 22px 20px' }}>
              <button
                onClick={() => s.closeDeadlines()}
                style={{
                  width: '100%',
                  background: BLUE_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 26px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: BLUE_SHADOW,
                }}
              >
                اعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RANK MODAL ================= */}
      {vm.rankOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => s.closeRank()}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,17,35,.5)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              animation: 'fadeIn .2s',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              maxHeight: '82vh',
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
              animation: 'fadeUp .3s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C' }}>ترتيب الأولوية</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3 }}>
                  اسحب العناصر لإعادة ترتيبها من الأعلى (الأولوية 1) للأسفل
                </div>
              </div>
              <button
                onClick={() => s.closeRank()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#54627B',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '0 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vm.rankRows.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={() => s.rankDragStart(r.idx)}
                  onDragEnter={() => s.rankDragEnter(r.idx)}
                  onDragEnd={() => s.rankDragEnd()}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    background: '#FBFCFE',
                    border: '1px solid #E7ECF4',
                    borderRadius: 12,
                    padding: '12px 13px',
                    cursor: 'grab',
                  }}
                >
                  <Icon d={IC_GRIP} size={18} color="#B4C0D4" />
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: '#EAF0FE',
                      color: '#2563EB',
                      fontWeight: 800,
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {r.num}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#33405A', minWidth: 0 }}>{r.title}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 22px 20px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => s.closeRank()}
                style={{
                  flex: 'none',
                  background: '#EEF1F7',
                  color: '#54627B',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 22px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={() => s.saveRank()}
                style={{
                  flex: 1,
                  background: BLUE_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 26px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: BLUE_SHADOW,
                }}
              >
                حفظ الترتيب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REQUEST / REJECT MODAL ================= */}
      {vm.reqModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 75,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => s.closeReqModal()}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,17,35,.55)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              animation: 'fadeIn .2s',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
              animation: 'fadeUp .3s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C' }}>
                  {vm.reqModal.mode === 'info' ? 'طلب معلومات إضافية' : 'رفض العنصر'}
                </div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3 }}>
                  {vm.reqModal.mode === 'info'
                    ? 'حدّد ما يجب استكماله أو توضيحه قبل المتابعة'
                    : 'وضّح أسباب الرفض والنقاط الواجب معالجتها'}
                </div>
              </div>
              <button
                onClick={() => s.closeReqModal()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#54627B',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '0 22px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#54627B' }}>
                  الملاحظات المطلوب معالجتها للمتابعة
                </span>
                <span style={{ color: '#94A3B8' }}>*</span>
              </div>
              <textarea
                value={vm.reqModal.note}
                onChange={(e) => s.setReqNote(e.target.value)}
                placeholder="اكتب بوضوح النقاط أو الحقول المطلوب استكمالها أو تصحيحها قبل الاعتماد…"
                style={{
                  width: '100%',
                  minHeight: 130,
                  border: '1.5px solid #DCE3EE',
                  borderRadius: 13,
                  padding: '12px 14px',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 8, lineHeight: 1.7 }}>
                ستصل هذه الملاحظات إلى ممثل المسار، ولن ينتقل العنصر للمرحلة التالية حتى تتم معالجتها.
              </div>
            </div>
            <div style={{ padding: '16px 22px 20px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => s.closeReqModal()}
                style={{
                  flex: 'none',
                  background: '#EEF1F7',
                  color: '#54627B',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 22px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={() => s.confirmReqModal()}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: BLUE_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 26px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: BLUE_SHADOW,
                }}
              >
                <Icon d={IC_SEND} size={17} color="#fff" />
                {vm.reqModal.mode === 'info' ? 'إرسال الطلب' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CANCEL-FUNDING MODAL ================= */}
      {vm.cancelFund && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => s.closeCancelFund()}
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,16,38,.5)', animation: 'fadeIn .2s' }}
          />
          <div
            style={{
              position: 'relative',
              width: 440,
              maxWidth: '96vw',
              background: '#fff',
              borderRadius: 18,
              padding: 22,
              boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
              animation: 'fadeUp .2s',
            }}
          >
            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C' }}>إلغاء تمويل اللجنة الوطنية</div>
            <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3, marginBottom: 16 }}>
              {vm.cancelFundTitle}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#54627B', marginBottom: 8 }}>
              سبب إلغاء التمويل <span style={{ color: '#D23B45' }}>*</span>
            </div>
            <textarea
              value={vm.cancelFund.note}
              onChange={(e) => s.setCancelFundNote(e.target.value)}
              placeholder="اذكر سبب إلغاء تمويل هذا العنصر..."
              style={{
                width: '100%',
                minHeight: 96,
                border: '1px solid #DCE3EE',
                borderRadius: 12,
                padding: '11px 13px',
                fontSize: 13.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 8, marginBottom: 16 }}>
              سيصل هذا السبب إلى الجهة المعنية.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => s.closeCancelFund()}
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#54627B',
                  border: '1px solid #DCE3EE',
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                تراجع
              </button>
              <button
                onClick={() => s.confirmCancelFund()}
                style={{
                  flex: 1,
                  background: RED_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCOPE AI-REVIEW MODAL ================= */}
      {vm.subReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 76,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={() => s.closeSubReview()}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,17,35,.55)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              animation: 'fadeIn .2s',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
              animation: 'fadeUp .3s',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '86vh',
            }}
          >
            <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon d={IC_SPARKLE} size={20} color="#fff" fill="#fff" strokeWidth={1} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>المراجعة الذكية</div>
              </div>
            </div>
            <div style={{ padding: '0 22px', overflowY: 'auto' }}>
              {vm.subReview.loading ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: '40px 0',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '3px solid #EAF0FE',
                      borderTopColor: '#2563EB',
                      animation: 'spin .8s linear infinite',
                    }}
                  />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#54627B' }}>
                    جارٍ مراجعة نطاق العمل والميزانية…
                  </div>
                </div>
              ) : vm.subReview.result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0B8A4B', marginBottom: 10 }}>
                      جاهز للإرسال
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vm.subReview.result.ready.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 7,
                              background: '#E3F6EC',
                              color: '#0B8A4B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 'none',
                              marginTop: 1,
                            }}
                          >
                            <Icon d={IC_CHECK} size={14} color="#0B8A4B" strokeWidth={3} />
                          </div>
                          <div style={{ fontSize: 13, color: '#33405A', lineHeight: 1.6 }}>{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#B45309', marginBottom: 10 }}>
                      بحاجة إلى تحسين
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vm.subReview.result.improve.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 7,
                              background: '#FFF3DE',
                              color: '#B45309',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 'none',
                              marginTop: 1,
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                          >
                            !
                          </div>
                          <div style={{ fontSize: 13, color: '#33405A', lineHeight: 1.6 }}>{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div style={{ padding: '16px 22px 20px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => s.closeSubReview()}
                style={{
                  flex: 'none',
                  background: '#EEF1F7',
                  color: '#54627B',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 22px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                تعديل
              </button>
              <button
                onClick={() => s.confirmSubReview()}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: GREEN_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 26px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: GREEN_SHADOW,
                }}
              >
                <Icon d={IC_CHECK} size={17} color="#fff" strokeWidth={3} />
                إرسال للاعتماد
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
