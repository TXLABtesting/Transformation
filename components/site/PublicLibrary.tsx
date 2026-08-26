'use client';
// المنشورات — تصميم المكتبة من التسليم، والوثائق من إدارة المشرف
// (وثائق المنشورات في لوحة المشرف) لا من قائمة ثابتة.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { DOC_CATS, docCatLabel, type LibraryDoc } from '@/lib/domain';
import { asset } from '@/lib/site';
import { SiteLayout } from './SiteLayout';

// أيقونات SVG مضمّنة — لا اعتماد على خط أيقونات خارجي
const SvgIcon = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);
const I_DOWN = 'M6 9l6 6 6-6';
const I_UP = 'M18 15l-6-6-6 6';
const I_DL = 'M12 3v12|M7 10l5 5 5-5|M5 21h14';
const I_EYE = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';
const I_DOC = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M9 13h6|M9 17h6';
const I_SEARCH_OFF = 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3|M8 8l6 6|M14 8l-6 6';


/** تطبيع النص العربي للبحث: إسقاط التشكيل والتطويل وتوحيد الألف والياء والتاء */
function normalise(text: string) {
  return text
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

// الوثائق الافتراضية بلا ملف مرفوع تعرض غلاف/ملف الإصدارين الرسميين المضمّنين
// (الملفات نفسها التي تشحنها المنصة منذ البداية في public/assets/docs)
const BUNDLED: Record<string, { cover: string; file: string }> = {
  guide: { cover: 'assets/docs/cover-definition-guide.png', file: 'assets/docs/ai-definition-guide.pdf' },
  system: { cover: 'assets/docs/cover-work-system.png', file: 'assets/docs/ai-work-system.pdf' },
};

const coverOf = (d: LibraryDoc) => d.coverUrl || (BUNDLED[d.id] ? asset(BUNDLED[d.id].cover) : '');
const fileOf = (d: LibraryDoc) => d.fileUrl || (BUNDLED[d.id] ? asset(BUNDLED[d.id].file) : '');

function previewDoc(doc: LibraryDoc) {
  const url = fileOf(doc);
  if (!url) return;
  // فصل النافذة الجديدة عن صفحتها الأم قبل أي استخدام — يمنع تلاعب الصفحة المفتوحة بالأصل
  const win = window.open(url, '_blank');
  if (win) win.opener = null;
  else window.location.href = url;
}

function downloadDoc(doc: LibraryDoc) {
  const url = fileOf(doc);
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.title}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function PublicLibrary() {
  const hydrate = useStore((s) => s.hydrate);
  const docs = useStore((s) => s.libraryDocs);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filterOpen]);

  const results = useMemo(() => {
    const q = normalise(query);
    return docs.filter((doc) => (!category || doc.cat === category) && (!q || normalise(doc.title).includes(q)));
  }, [docs, query, category]);

  return (
    <SiteLayout background="#FFFFFF">
      <div className="mx-auto w-full max-w-[1240px] bg-white px-10 pt-[170px] pb-[90px] font-kufi max-[780px]:px-5 max-[780px]:pt-[130px] max-[780px]:pb-[60px]">
        <header className="mb-11 flex flex-wrap items-center justify-between gap-6">
          <h1 className="m-0 text-right font-normal text-black" style={{ fontSize: 'clamp(30px,9vw,46px)' }}>
            المنشورات
          </h1>

          <div ref={filterRef} className="relative z-30 w-[250px] max-[780px]:w-full">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              aria-expanded={filterOpen}
              className="flex w-full cursor-pointer flex-row-reverse items-center justify-between border border-[#E3E9F2] bg-[#F6F8FB] px-[18px] py-[13px] text-[13.5px] font-bold text-[#0F1F3D] transition-colors hover:bg-[#EFF3F9]"
            >
              <span className="text-[#5B6B85]"><SvgIcon d={filterOpen ? I_UP : I_DOWN} size={17} /></span>
              <span>{category ? docCatLabel(category) : 'المنشورات'}</span>
            </button>

            {filterOpen && (
              <div className="absolute inset-x-0 top-[calc(100%+4px)] flex flex-col gap-[2px] border border-[#E3E9F2] bg-white p-[10px] shadow-[0_22px_44px_-24px_rgba(15,31,61,.3)]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث"
                  className="mb-2 w-full border border-[#E3E9F2] px-3 py-[9px] text-[13px] font-semibold outline-none focus:border-[#2563EB]"
                />
                {DOC_CATS.map((cat) => {
                  const active = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setCategory(active ? null : cat.key);
                        setFilterOpen(false);
                      }}
                      className="cursor-pointer border-none bg-transparent px-3 py-[10px] text-right text-[13.5px] transition-colors hover:bg-[#F4F7FC]"
                      style={{ color: active ? '#2563EB' : '#0F1F3D', fontWeight: active ? 800 : 600 }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-x-9 gap-y-11" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
          {results.map((doc) => {
            const cover = coverOf(doc);
            return (
              <article key={doc.id} className="flex flex-col gap-4">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-md bg-[#F2F5F9] shadow-[0_10px_26px_-18px_rgba(15,31,61,.35)]"
                  style={{ aspectRatio: '0.72' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: cover ? `url("${cover}")` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundColor: '#F2F5F9',
                    }}
                  />
                  {!cover && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8A97AD]">
                      <SvgIcon d={I_DOC} size={42} />
                      <span className="px-4 text-center text-[12.5px] font-bold">{docCatLabel(doc.cat)}</span>
                    </div>
                  )}
                  <div className="doc-actions absolute inset-0 flex items-center justify-center gap-3 bg-[rgba(8,24,58,0)] opacity-0 transition-all duration-[250ms] group-hover:bg-[rgba(8,24,58,.38)] group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => downloadDoc(doc)}
                      title="تحميل"
                      aria-label={`تحميل ${doc.title}`}
                      className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-none bg-white text-[#2563EB] shadow-[0_10px_24px_-10px_rgba(0,0,0,.4)] transition-colors hover:bg-[#EAF1FE]"
                    >
                      <SvgIcon d={I_DL} size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => previewDoc(doc)}
                      title="معاينة"
                      aria-label={`معاينة ${doc.title}`}
                      className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-none bg-white text-[#2563EB] shadow-[0_10px_24px_-10px_rgba(0,0,0,.4)] transition-colors hover:bg-[#EAF1FE]"
                    >
                      <SvgIcon d={I_EYE} size={20} />
                    </button>
                  </div>
                </div>
                <h2 className="m-0 text-right text-[17px] font-extrabold leading-[1.7] text-[#0F1F3D]" style={{ textWrap: 'balance' }}>
                  {doc.title}
                </h2>
              </article>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="py-[60px] text-center">
            <span className="inline-block text-[#8A97AD]"><SvgIcon d={I_SEARCH_OFF} size={42} /></span>
            <div className="mt-3 text-[15px] font-extrabold text-[#0F1F3D]">لا توجد منشورات مطابقة</div>
            <div className="mt-1 text-[12.5px] font-semibold text-[#8A97AD]">جرّب كلمة أخرى أو امسح البحث</div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
