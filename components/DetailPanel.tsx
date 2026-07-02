'use client';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';
import { SC, EXEC_STATUS_OPTS } from '@/lib/domain';

const CHECK = 'M20 6 9 17l-5-5';
const CLOCK = 'M12 8v4l2.5 1.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z';
const DOWNLOAD = 'M12 3v12M7 10l5 5 5-5M5 21h14';
const WALLET = 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z';
const SPEECH = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#8A97AD',
  marginBottom: 4,
};
const valueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1F2D49',
};

const sectionCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E7ECF4',
  borderRadius: 14,
  padding: '16px 18px',
};

export function DetailPanel({ vm }: { vm: VM }) {
  const d = vm.detail!;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        direction: 'rtl',
      }}
    >
      {/* scrim */}
      <div
        onClick={d.onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8,18,40,.5)',
          animation: 'fadeIn .2s',
        }}
      />
      {/* panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 680,
          maxWidth: '97vw',
          background: '#F4F7FC',
          boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
          animation: 'slideIn .3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ---------- HEADER ---------- */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E7ECF4',
            padding: '16px 22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: d.typeBg,
                  color: d.typeColor,
                  flex: 'none',
                }}
              >
                {d.typeLabel}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#13213C',
                  lineHeight: 1.4,
                }}
              >
                {d.title}
              </span>
            </div>
            <button
              onClick={d.onClose}
              style={{
                flex: 'none',
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid #E7ECF4',
                background: '#fff',
                color: '#54627B',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* ---------- STEP TIMELINE ---------- */}
          <div style={{ display: 'flex', marginTop: 18 }}>
            {d.dSteps.map((st, idx) => {
              const circleBg = st.isDone ? '#0B8A4B' : st.state === 'active' ? '#fff' : '#EFF2F7';
              const circleColor = st.isDone ? '#fff' : st.state === 'active' ? '#2563EB' : '#9AA6BC';
              const circleBorder =
                st.state === 'active' ? '2px solid #2563EB' : st.isDone ? 'none' : '1px solid #E1E7F1';
              const circleGlow =
                st.state === 'active' ? '0 0 0 4px rgba(37,99,235,.15)' : 'none';
              const lineBg = st.isDone || st.state === 'active' ? '#0B8A4B' : '#E1E7F1';
              const labelColor =
                st.state === 'active' ? '#13213C' : st.isDone ? '#0B8A4B' : '#9AA6BC';
              return (
                <div
                  key={st.num}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 3,
                        background: idx === 0 ? 'transparent' : lineBg,
                      }}
                    />
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        flex: 'none',
                        margin: '0 4px',
                        background: circleBg,
                        color: circleColor,
                        border: circleBorder,
                        boxShadow: circleGlow,
                      }}
                    >
                      {st.isDone ? <Icon d={CHECK} size={14} color="#fff" strokeWidth={3} /> : st.num}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 3,
                        background: idx === d.dSteps.length - 1 ? 'transparent' : (d.dSteps[idx + 1].isDone || d.dSteps[idx + 1].state === 'active' ? '#0B8A4B' : '#E1E7F1'),
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: labelColor,
                      textAlign: 'center',
                      marginTop: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- BODY ---------- */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* ===== INFO GRID ===== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 10,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>الحالة</div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: d.wfBg,
                  color: d.wfChip,
                }}
              >
                {d.wfLabel}
              </span>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>الأولوية</div>
              <div style={valueStyle}>{d.priority}</div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>التعقيد</div>
              <div style={valueStyle}>{d.complexity}</div>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>الانتهاء المتوقع</div>
              <div style={valueStyle}>{d.endDateFmt}</div>
            </div>
          </div>

          {/* Funded banner */}
          {d.dFunded && (
            <div
              style={{
                background: '#EDF9F1',
                border: '1px solid #D5EEE0',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 'none', marginTop: 1 }}>
                <Icon d={WALLET} size={20} color="#0B8A4B" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#0B8A4B', fontWeight: 800, fontSize: 13 }}>
                  معتمد للتمويل من اللجنة الوطنية
                </div>
                <div style={{ color: '#0B7C57', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  {d.dFundedText}
                </div>
              </div>
            </div>
          )}

          {/* Returned banner */}
          {d.isReturned && (
            <div
              style={{
                background: '#FFF4F4',
                border: '1px solid #F6D6D9',
                borderRadius: 11,
                padding: '11px 13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#C0303B',
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Icon d={SPEECH} size={16} color="#C0303B" />
                {d.retBannerLabel}
              </div>
              {d.retNote && (
                <div style={{ color: '#7A4A4E', fontSize: 12, marginTop: 4 }}>{d.retNote}</div>
              )}
            </div>
          )}

          {/* Main card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <div style={labelStyle}>الاسم</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C' }}>{d.title}</div>
            </div>
            <div>
              <div style={labelStyle}>الوصف</div>
              <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>{d.desc}</div>
            </div>

            {/* --- PROJECT / INITIATIVE --- */}
            {d.isProj && (
              <>
                <div>
                  <div style={labelStyle}>المخرجات المتوقعة</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.expectedOutputs}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>النتائج المتوقعة</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.expectedOutcomes}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>الأثر المتوقع</div>
                    <div style={valueStyle}>{d.expectedImpact}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>نماذج الذكاء</div>
                    <div style={valueStyle}>{d.aiModels}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>نسبة التحول</div>
                    <div style={valueStyle}>{d.targetPct}%</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>قابلية التحول</div>
                    <div style={valueStyle}>{d.transformability}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>أولوية التحول</div>
                    <div style={valueStyle}>{d.transformPriority}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>جاهزية التحول</div>
                    <div style={valueStyle}>{d.readiness}%</div>
                  </div>
                </div>
              </>
            )}

            {/* --- OPERATION --- */}
            {d.isOp && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>نوع العملية</div>
                    <div style={valueStyle}>{d.opType}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>كثافة الاستخدام</div>
                    <div style={valueStyle}>{d.usageIntensity}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>الأنشطة الفرعية</div>
                    <div style={valueStyle}>{d.subActivities}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>قابلية التحول</div>
                    <div style={valueStyle}>{d.transformability}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>أولوية التحول</div>
                    <div style={valueStyle}>{d.transformPriority}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>جاهزية التحول</div>
                    <div style={valueStyle}>{d.readiness}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>مستوى الأتمتة</div>
                    <div style={valueStyle}>
                      {d.automationLevel} · {d.automationPct}%
                    </div>
                  </div>
                  {d.automationSystem && (
                    <div>
                      <div style={labelStyle}>نظام الأتمتة</div>
                      <div style={valueStyle}>{d.automationSystem}</div>
                    </div>
                  )}
                  {d.complexityLevel && (
                    <div>
                      <div style={labelStyle}>مستوى تعقيد الأتمتة</div>
                      <div style={valueStyle}>{d.complexityLevel}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>الجهة الاتحادية المعنية</div>
                    <div style={valueStyle}>{d.itemEntityName}</div>
                  </div>
                  {d.sector && (
                    <div>
                      <div style={labelStyle}>القطاع المعني</div>
                      <div style={valueStyle}>{d.sector}</div>
                    </div>
                  )}
                  {d.dept && (
                    <div>
                      <div style={labelStyle}>الإدارة المعنية</div>
                      <div style={valueStyle}>{d.dept}</div>
                    </div>
                  )}
                  {d.section && (
                    <div>
                      <div style={labelStyle}>القسم المعني</div>
                      <div style={valueStyle}>{d.section}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- OUTCOMES for non-project types (entered in step 3) --- */}
            {!d.isProj && (d.expectedOutputs || d.expectedOutcomes || d.expectedImpact || !!d.targetPct || !!d.aiModels) && (
              <>
                {d.expectedOutputs && (
                  <div>
                    <div style={labelStyle}>المخرجات المتوقعة</div>
                    <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>{d.expectedOutputs}</div>
                  </div>
                )}
                {d.expectedOutcomes && (
                  <div>
                    <div style={labelStyle}>النتائج المتوقعة</div>
                    <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>{d.expectedOutcomes}</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {d.expectedImpact && (
                    <div>
                      <div style={labelStyle}>الأثر المتوقع</div>
                      <div style={valueStyle}>{d.expectedImpact}</div>
                    </div>
                  )}
                  {!!d.aiModels && (
                    <div>
                      <div style={labelStyle}>نماذج الذكاء</div>
                      <div style={valueStyle}>{d.aiModels}</div>
                    </div>
                  )}
                  {!!d.targetPct && (
                    <div>
                      <div style={labelStyle}>نسبة التحول</div>
                      <div style={valueStyle}>{d.targetPct}%</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- SERVICE --- */}
            {d.isSvc && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>مالك الخدمة</div>
                    <div style={valueStyle}>{d.serviceOwner}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>الفئة المستهدفة</div>
                    <div style={valueStyle}>{d.targetUsers}</div>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>رحلة المتعامل الحالية</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.currentJourney}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>نقاط الألم</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.painPoints}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>التحسين المتوقع</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.expectedImprovement}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===== EXECUTION PLAN (as entered by the coordinator) ===== */}
          {d.execBatchName && (
            <div style={sectionCard}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#13213C', marginBottom: 10 }}>
                خطة التنفيذ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EAF0FE',
                    color: '#2563EB',
                    borderRadius: 999,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {d.execBatchName}
                </span>
                {d.execBatchPeriod && (
                  <span style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 700 }}>
                    {d.execBatchPeriod}
                  </span>
                )}
              </div>
              {d.subMilestones.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...labelStyle, marginBottom: 8 }}>المراحل الفرعية</div>
                  {d.subMilestones.map((sm, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '7px 0',
                        borderBottom: i < d.subMilestones.length - 1 ? '1px solid #F0F3F8' : 'none',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', flex: 'none' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#33405A', flex: 1 }}>{sm.name}</span>
                      <span style={{ fontSize: 11, color: '#9AA6BC', fontWeight: 700 }}>
                        {sm.startFmt} — {sm.endFmt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PLANNED LAUNCHES (read-only, pre-launch stages) ===== */}
          {!d.showLaunchView && d.plannedLaunches.length > 0 && (
            <div style={sectionCard}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#13213C', marginBottom: 10 }}>
                خطة الإطلاق
              </div>
              {d.plannedLaunches.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: i < d.plannedLaunches.length - 1 ? '1px solid #F0F3F8' : 'none',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>
                      {l.title}
                      {l.shared && (
                        <span
                          style={{
                            marginRight: 7,
                            background: '#E5EEFF',
                            color: '#2563EB',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          مشتركة
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9AA6BC', fontWeight: 600, marginTop: 2 }}>
                      {l.ltype} · التسليم المتوقع {l.dateFmt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== RECOMMENDATION ===== */}
          {d.showReco && (
            <>
              <div
                style={{
                  background: '#F5F8FD',
                  border: '1px solid #E1E9F5',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#8A97AD',
                    marginBottom: 12,
                  }}
                >
                  توصية الذكاء الاصطناعي للتحول
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: d.scoreColor,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {d.scoreV}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: d.scoreColor }}>
                      {d.scoreLabel}
                    </div>
                    <div
                      style={{ fontSize: 12, color: '#54627B', lineHeight: 1.7, marginTop: 4 }}
                    >
                      {d.scoreExpl}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E7ECF4',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#13213C',
                    marginBottom: 12,
                  }}
                >
                  معايير التقييم
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>الأولوية</div>
                    <div style={valueStyle}>{d.priority}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>مستوى التعقيد</div>
                    <div style={valueStyle}>{d.complexity}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>الأثر المتوقع</div>
                    <div style={valueStyle}>{d.expectedImpact}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== APPROVAL LOG ===== */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#13213C',
                marginBottom: 14,
              }}
            >
              سجل الاعتمادات والإجراءات
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {d.logRows.map((lg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: lg.color,
                      marginTop: 4,
                      flex: 'none',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                      {lg.action}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 2 }}>{lg.sub}</div>
                    {lg.hasNote && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#54627B',
                          background: '#F7F9FD',
                          border: '1px solid #EBEFF6',
                          borderRadius: 10,
                          padding: '8px 10px',
                          marginTop: 6,
                          lineHeight: 1.6,
                        }}
                      >
                        {lg.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== SCOPE & BUDGET ===== */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#13213C',
                marginBottom: 14,
              }}
            >
              نطاق العمل والميزانية
            </div>

            {/* Editable */}
            {d.canEditScope && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#54627B', marginBottom: 6 }}
                  >
                    نطاق العمل التفصيلي
                  </div>
                  <textarea
                    value={d.scopeOfWork}
                    onChange={(e) => d.onScopeWork(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #DCE3EE',
                      background: '#fff',
                      borderRadius: 11,
                      padding: '11px 13px',
                      fontSize: 13.5,
                      outline: 'none',
                      minHeight: 90,
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#54627B', marginBottom: 6 }}
                  >
                    الميزانية التقديرية
                  </div>
                  <input
                    value={d.budget}
                    onChange={(e) => d.onBudget(e.target.value)}
                    placeholder="مثال: 1,500,000 درهم"
                    style={{
                      width: '100%',
                      border: '1px solid #DCE3EE',
                      background: '#fff',
                      borderRadius: 11,
                      padding: '11px 13px',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#54627B', marginBottom: 6 }}
                  >
                    إرفاق مستند نطاق العمل
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px dashed #CDD8EA',
                      background: '#FAFCFF',
                      borderRadius: 11,
                      padding: '18px 13px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#54627B',
                      cursor: 'pointer',
                    }}
                  >
                    {d.scopeFileLabel}
                    <input type="file" style={{ display: 'none' }} />
                  </label>
                </div>
                {d.showBudgetSubmit && (
                  <button
                    onClick={d.onSubmitScope}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '13px 20px',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
                    }}
                  >
                    إرسال الميزانية ونطاق العمل للاعتماد
                  </button>
                )}
              </div>
            )}

            {/* Pending input */}
            {d.scopePendingInput && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  background: '#F7F9FD',
                  border: '1px solid #EBEFF6',
                  borderRadius: 12,
                  padding: '13px 14px',
                }}
              >
                <div style={{ flex: 'none', marginTop: 1 }}>
                  <Icon d={CLOCK} size={20} color="#8A97AD" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                    بانتظار إدخال رئيس المسار
                  </div>
                  <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginTop: 4 }}>
                    سيقوم رئيس المسار بإدخال نطاق العمل والميزانية المطلوبة، وستظهر التفاصيل هنا بمجرد
                    إرسالها.
                  </div>
                </div>
              </div>
            )}

            {/* Read only */}
            {d.scopeReadOnly && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={labelStyle}>نطاق العمل التفصيلي</div>
                  <div style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}>
                    {d.scopeOfWork}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>الميزانية التقديرية</div>
                  <div style={valueStyle}>{d.budget}</div>
                </div>
                {d.hasScopeFile && (
                  <div>
                    <div style={labelStyle}>المستند المرفق</div>
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#F7F9FD',
                        border: '1px solid #DCE3EE',
                        borderRadius: 11,
                        padding: '10px 13px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#2563EB',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon d={DOWNLOAD} size={16} color="#2563EB" />
                      {d.scopeFile}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== EXECUTION CHECKLIST ===== */}
          {d.showExecView && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C' }}>
                تنفيذ واختبار التحول
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#8A97AD',
                  lineHeight: 1.7,
                  margin: '6px 0 14px',
                }}
              >
                حدّث حالة كل بند — أكمِل البند أو حدّد سبب التأخير وتاريخاً جديداً قبل الانتقال للإطلاق.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {d.execRows.map((x) => {
                  const dotColor =
                    x.status === 'مكتمل'
                      ? '#0B8A4B'
                      : x.status === 'متأخر'
                        ? '#C0303B'
                        : '#C2CCDC';
                  return (
                    <div
                      key={x.key}
                      style={{
                        border: '1px solid #EBEFF6',
                        borderRadius: 12,
                        padding: 13,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: dotColor,
                            flex: 'none',
                          }}
                        />
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                          {x.label}
                        </div>
                      </div>

                      {d.execEditable ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          {EXEC_STATUS_OPTS.map((opt) => {
                            const active = x.status === opt;
                            const sc = SC[opt];
                            return (
                              <button
                                key={opt}
                                onClick={() => x.onStatus(opt)}
                                style={{
                                  border: 'none',
                                  borderRadius: 7,
                                  padding: '6px 11px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  background: active ? '#fff' : '#F1F4F9',
                                  color: active ? sc.c : '#8A97AD',
                                  boxShadow: active
                                    ? '0 2px 6px -2px rgba(15,31,61,.15)'
                                    : 'none',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ marginTop: 10 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 12,
                              fontWeight: 800,
                              padding: '4px 11px',
                              borderRadius: 999,
                              background: (SC[x.status] || SC['لم تبدأ']).bg,
                              color: (SC[x.status] || SC['لم تبدأ']).c,
                            }}
                          >
                            {x.status}
                          </span>
                        </div>
                      )}

                      {x.isDelayed && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: '1px dashed #E1E7F1',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#54627B',
                                marginBottom: 6,
                              }}
                            >
                              تاريخ انتهاء جديد
                            </div>
                            {d.execEditable ? (
                              <input
                                type="date"
                                value={x.newDate}
                                onChange={(e) => x.onNewDate(e.target.value)}
                                style={{
                                  width: '100%',
                                  border: '1px solid #DCE3EE',
                                  background: '#fff',
                                  borderRadius: 11,
                                  padding: '10px 13px',
                                  fontSize: 13.5,
                                  outline: 'none',
                                }}
                              />
                            ) : (
                              <div style={valueStyle}>{x.newDateFmt}</div>
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#54627B',
                                marginBottom: 6,
                              }}
                            >
                              سبب التأخير
                            </div>
                            {d.execEditable ? (
                              <textarea
                                value={x.reason}
                                onChange={(e) => x.onReason(e.target.value)}
                                placeholder="اذكر السبب"
                                style={{
                                  width: '100%',
                                  border: '1px solid #DCE3EE',
                                  background: '#fff',
                                  borderRadius: 11,
                                  padding: '10px 13px',
                                  fontSize: 13.5,
                                  outline: 'none',
                                  minHeight: 64,
                                  resize: 'vertical',
                                }}
                              />
                            ) : (
                              <div
                                style={{ fontSize: 13, color: '#54627B', lineHeight: 1.7 }}
                              >
                                {x.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {d.showGoLaunch && (
                <button
                  onClick={d.onGoLaunch}
                  disabled={d.execBlocked}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 20px',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: d.execBlocked ? 'not-allowed' : 'pointer',
                    opacity: d.execOpacity,
                    boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
                  }}
                >
                  الانتقال إلى مرحلة الإطلاق
                </button>
              )}
            </div>
          )}

          {/* ===== LAUNCH CHECKLIST ===== */}
          {d.showLaunchView && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C' }}>خطة الإطلاق</div>
              <div
                style={{
                  fontSize: 12,
                  color: '#8A97AD',
                  lineHeight: 1.7,
                  margin: '6px 0 14px',
                }}
              >
                علّم بنود خطة الإطلاق عند إنجازها.
              </div>

              {d.hasLaunchChk ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {d.launchChk.map((l) => (
                    <div
                      key={l.idx}
                      onClick={d.launchEditable ? l.onToggle : undefined}
                      style={{
                        display: 'flex',
                        gap: 11,
                        alignItems: 'flex-start',
                        border: '1px solid #EBEFF6',
                        borderRadius: 12,
                        padding: 13,
                        cursor: d.launchEditable ? 'pointer' : 'default',
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          flex: 'none',
                          marginTop: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: l.done ? '#0B8A4B' : '#fff',
                          border: l.done ? 'none' : '1.5px solid #C2CCDC',
                        }}
                      >
                        {l.done && <Icon d={CHECK} size={14} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                          {l.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 2 }}>
                          {l.ltype} · التسليم المتوقع {l.dateFmt}
                        </div>
                        {l.done && (
                          <div style={{ fontSize: 11.5, color: '#0B8A4B', marginTop: 2 }}>
                            الإنجاز الفعلي {l.actualFmt}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#8A97AD', lineHeight: 1.7 }}>
                  لم تُعرّف بنود خطة إطلاق عند الإنشاء.
                </div>
              )}

              {d.showFinishLaunch && (
                <button
                  onClick={d.onFinishLaunch}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 20px',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 10px 22px -10px rgba(11,138,75,.6)',
                  }}
                >
                  إنهاء وإغلاق العنصر
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------- FOOTER ACTION BAR ---------- */}
        {(d.canApproveGateView || d.canEdit) && (
          <div
            style={{
              background: '#fff',
              borderTop: '1px solid #E7ECF4',
              padding: '13px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {d.canApproveGateView ? (
              <>
                <div style={{ position: 'relative', flex: 'none' }}>
                  <button
                    onClick={d.onToggleMenu}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      border: '1px solid #E7ECF4',
                      background: '#fff',
                      color: '#54627B',
                      fontSize: 18,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={2.5} />
                  </button>
                  {d.dActionMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 52,
                        right: 0,
                        width: 200,
                        background: '#fff',
                        border: '1px solid #E7ECF4',
                        borderRadius: 14,
                        boxShadow: '0 24px 60px -20px rgba(2,12,35,.45)',
                        overflow: 'hidden',
                        zIndex: 5,
                        animation: 'fadeUp .2s',
                      }}
                    >
                      {d.showMenuEdit && (
                        <button
                          onClick={d.onEdit}
                          style={menuItemStyle('#33405A')}
                        >
                          <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={15} />
                          تعديل البيانات
                        </button>
                      )}
                      <button
                        onClick={d.onReqInfo}
                        style={{ ...menuItemStyle('#33405A'), borderTop: '1px solid #F0F3F8' }}
                      >
                        <Icon d="M12 8h.01M11 12h1v4h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" size={15} />
                        طلب معلومات إضافية
                      </button>
                      <button
                        onClick={d.onReject}
                        style={{ ...menuItemStyle('#D23B45'), borderTop: '1px solid #F0F3F8' }}
                      >
                        <Icon d="M18 6 6 18M6 6l12 12" size={15} color="#D23B45" />
                        رفض
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={d.onApprove}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 20px',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 10px 22px -10px rgba(11,138,75,.6)',
                  }}
                >
                  اعتماد
                </button>
              </>
            ) : (
              <button
                onClick={d.onEdit}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 20px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
                }}
              >
                <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" size={16} color="#fff" />
                {d.editLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    width: '100%',
    textAlign: 'right',
    background: '#fff',
    border: 'none',
    padding: '12px 14px',
    fontSize: 13,
    fontWeight: 700,
    color,
    cursor: 'pointer',
  };
}
