import * as React from "react"
import { HrPage } from "@/components/hr/HrPage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * How to mark attendance — the employee-facing guide, in English and Urdu.
 *
 * Every figure here mirrors the server: DEFAULT_SHIFT and LATES_PER_HALF_DAY in
 * Hr/attendance.js, and SITES in Hr/geofence.js. If the policy moves there, it
 * has to move here too — a guide that quotes the wrong cut-off is worse than no
 * guide at all.
 *
 * Interface labels ("Check in", "My Hub") stay in English inside the Urdu copy
 * on purpose: the dashboard itself is in English, so translating a button name
 * would send someone hunting for a control that does not exist by that name.
 */

type Copy = { en: string; ur: string }
type Lang = "en" | "ur"

const LANG_KEY = "davaam-ess-guide-lang"

const INTRO: Copy = {
  en: "You check in and out yourself, from your own phone or computer, at the office. This page explains how — and what the system does with it.",
  ur: "آپ اپنی حاضری خود لگاتے ہیں — اپنے موبائل یا کمپیوٹر سے، دفتر میں موجود ہوتے ہوئے۔ اس صفحے میں پورا طریقہ اور اصول بیان کیے گئے ہیں۔",
}

const FACTS: Array<{ label: Copy; value: Copy; hint: Copy }> = [
  {
    label: { en: "Day starts", ur: "دن کا آغاز" },
    value: { en: "9:30 am", ur: "صبح 9:30" },
    hint: {
      en: "Check in at 9:30 exactly and you are on time.",
      ur: "ٹھیک 9:30 پر چیک اِن بھی وقت پر شمار ہوتا ہے۔",
    },
  },
  {
    label: { en: "Day ends", ur: "دن کا اختتام" },
    value: { en: "5:30 pm", ur: "شام 5:30" },
    hint: { en: "Eight hours from 9:30.", ur: "9:30 سے آٹھ گھنٹے۔" },
  },
  {
    label: { en: "Half day under", ur: "آدھا دن" },
    value: { en: "4 hours", ur: "4 گھنٹے سے کم" },
    hint: {
      en: "Less than four hours worked.",
      ur: "اس سے کم کام آدھا دن شمار ہوگا۔",
    },
  },
  {
    label: { en: "3 lates equal", ur: "3 لیٹ برابر" },
    value: { en: "½ day", ur: "آدھا دن" },
    hint: { en: "Every third late mark.", ur: "ہر تیسری لیٹ حاضری پر۔" },
  },
]

const STEPS: Array<{ title: Copy; body: Copy }> = [
  {
    title: { en: "Log in to the dashboard", ur: "ڈیش بورڈ میں لاگ اِن کریں" },
    body: {
      en: "Use the email address and password HR gave you. If you have never logged in, or the password does not work, ask HR to reset it.",
      ur: "وہی ای میل اور پاس ورڈ استعمال کریں جو HR نے آپ کو دیا ہے۔ اگر آپ نے کبھی لاگ اِن نہیں کیا یا پاس ورڈ کام نہیں کر رہا تو HR سے دوبارہ بنوا لیں۔",
    },
  },
  {
    title: {
      en: "Open Self Service → My Hub",
      ur: "Self Service ← My Hub کھولیں",
    },
    body: {
      en: "It is in the menu on the left, at the bottom. Every employee has it, whatever your department.",
      ur: "یہ بائیں طرف والے مینو میں سب سے نیچے ہے۔ ہر ملازم کے پاس یہ موجود ہے، شعبہ کوئی بھی ہو۔",
    },
  },
  {
    title: {
      en: "Allow location when your browser asks",
      ur: "لوکیشن کی اجازت دیں",
    },
    body: {
      en: "Press Allow. Attendance only works from the office, so the system has to confirm you are there. If you block it, you cannot check in at all.",
      ur: "براؤزر لوکیشن مانگے تو Allow دبائیں۔ حاضری صرف دفتر سے لگتی ہے، اس لیے سسٹم کو آپ کی موجودگی کی تصدیق کرنی ہوتی ہے۔ اجازت نہ دینے کی صورت میں حاضری بالکل نہیں لگے گی۔",
    },
  },
  {
    title: {
      en: "Press Check in when you arrive",
      ur: "پہنچتے ہی Check in دبائیں",
    },
    body: {
      en: "Do it as soon as you reach the office. The time recorded is the moment you press the button — not the time you walked in the gate.",
      ur: "دفتر پہنچتے ہی یہ بٹن دبا دیں۔ وقت وہی درج ہوگا جس لمحے آپ نے بٹن دبایا — گیٹ میں داخل ہونے کا وقت نہیں۔",
    },
  },
  {
    title: {
      en: "Press Check out before you leave",
      ur: "جانے سے پہلے Check out دبائیں",
    },
    body: {
      en: "This completes your day and counts your hours. If you forget, the day has no end time and your hours cannot be worked out.",
      ur: "اسی سے آپ کا دن مکمل ہوتا ہے اور گھنٹے شمار ہوتے ہیں۔ بھول جانے کی صورت میں دن کا اختتامی وقت درج نہیں ہوتا اور گھنٹوں کا حساب نہیں لگ پاتا۔",
    },
  },
]

const OUTCOMES: Array<{ status: Copy; tone: string; when: Copy }> = [
  {
    status: { en: "Present", ur: "حاضر" },
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    when: {
      en: "You checked in at 9:30 am or earlier, and worked four hours or more.",
      ur: "آپ نے صبح 9:30 یا اس سے پہلے چیک اِن کیا اور چار گھنٹے یا اس سے زیادہ کام کیا۔",
    },
  },
  {
    status: { en: "Late", ur: "لیٹ" },
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    when: {
      en: "You checked in after 9:30 am. There is no grace period — 9:31 is late.",
      ur: "آپ نے صبح 9:30 کے بعد چیک اِن کیا۔ کوئی رعایتی وقت نہیں ہے — 9:31 بھی لیٹ ہے۔",
    },
  },
  {
    status: { en: "Half day", ur: "آدھا دن" },
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    when: {
      en: "You worked less than four hours between checking in and checking out.",
      ur: "چیک اِن اور چیک آؤٹ کے درمیان چار گھنٹے سے کم وقت رہا۔",
    },
  },
  {
    status: { en: "Overtime", ur: "اوور ٹائم" },
    tone: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    when: {
      en: "You worked more than eight hours. The extra time is recorded automatically.",
      ur: "آپ نے آٹھ گھنٹے سے زیادہ کام کیا۔ اضافی وقت خودبخود درج ہو جاتا ہے۔",
    },
  },
  {
    status: { en: "Absent", ur: "غیر حاضر" },
    tone: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    when: {
      en: "You did not check in at all, and had no approved leave for that day.",
      ur: "آپ نے چیک اِن نہیں کیا اور اُس دن کی منظور شدہ چھٹی بھی نہیں تھی۔",
    },
  },
]

const LATE_RULE: { title: Copy; body: Copy } = {
  title: {
    en: "Three late marks count as half a day",
    ur: "تین لیٹ حاضریاں آدھے دن کے برابر",
  },
  body: {
    en: "Your late marks are counted on your attendance summary — every third one becomes half a day, and six lates a full day. Arriving at 9:31 costs you the same mark as arriving at 11:00, so it is worth being on time rather than nearly on time.",
    ur: "آپ کی لیٹ حاضریاں حاضری کے خلاصے میں شمار ہوتی ہیں — ہر تیسری لیٹ آدھا دن بن جاتی ہے، اور چھ لیٹ ایک پورا دن۔ 9:31 پر آنا اور 11:00 بجے آنا، دونوں پر ایک ہی لیٹ لگتی ہے، اس لیے تھوڑا سا لیٹ ہونے سے بہتر ہے وقت پر پہنچنا۔",
  },
}

const SITES_INTRO: Copy = {
  en: "Your device sends its location with every punch, and the system checks it. You must be at one of these two places — roughly within 200 metres of the building.",
  ur: "ہر بار حاضری کے ساتھ آپ کے آلے کی لوکیشن بھی جاتی ہے اور سسٹم اُس کی جانچ کرتا ہے۔ آپ کا اِن دو مقامات میں سے کسی ایک پر ہونا ضروری ہے — عمارت سے تقریباً 200 میٹر کے اندر۔",
}

const SITES: Array<{ name: Copy; where: Copy }> = [
  {
    name: { en: "Workshop", ur: "ورکشاپ" },
    where: { en: "DHA Phase 2, Karachi", ur: "ڈی ایچ اے فیز 2، کراچی" },
  },
  {
    name: { en: "Head Office", ur: "ہیڈ آفس" },
    where: { en: "DHA Phase 8, Karachi", ur: "ڈی ایچ اے فیز 8، کراچی" },
  },
]

const OFFSITE: { title: Copy; body: Copy } = {
  title: {
    en: "Working somewhere else that day?",
    ur: "اگر اُس دن کہیں اور کام ہو؟",
  },
  body: {
    en: "You cannot check in from home, from a machine site, or on the road. Tell HR and they will mark your attendance for you — that is the correct route, not asking a colleague to check in on your behalf.",
    ur: "گھر سے، مشین کی سائٹ سے یا راستے سے حاضری نہیں لگ سکتی۔ HR کو بتا دیں، وہ آپ کی حاضری خود لگا دیں گے — یہی درست طریقہ ہے۔ کسی ساتھی سے اپنی حاضری لگوانا درست نہیں۔",
  },
}

const PROBLEMS: Array<{ q: Copy; a: Copy }> = [
  {
    q: {
      en: "It says location access is blocked",
      ur: "لکھا آ رہا ہے کہ لوکیشن بلاک ہے",
    },
    a: {
      en: "You said no to the location request at some point, and the browser remembered. Open your browser settings for this site, turn location on, reload the page and try again. On a phone, also check that location services are switched on for the whole device.",
      ur: "کسی موقع پر آپ نے لوکیشن کی اجازت سے انکار کیا تھا اور براؤزر نے یاد رکھ لیا۔ براؤزر کی سیٹنگز میں اس سائٹ کے لیے لوکیشن آن کریں، صفحہ دوبارہ لوڈ کریں اور کوشش کریں۔ موبائل پر یہ بھی دیکھ لیں کہ پورے فون کی لوکیشن سروس آن ہے۔",
    },
  },
  {
    q: {
      en: 'It says "Already checked in for today"',
      ur: '"Already checked in for today" لکھا آ رہا ہے',
    },
    a: {
      en: "You have already checked in. There is one check-in per day — pressing it again is not needed and will not change your time.",
      ur: "آپ پہلے ہی چیک اِن کر چکے ہیں۔ دن میں ایک ہی بار چیک اِن ہوتا ہے — دوبارہ دبانے کی ضرورت نہیں اور اس سے وقت تبدیل نہیں ہوگا۔",
    },
  },
  {
    q: {
      en: 'It says "Check in first"',
      ur: '"Check in first" لکھا آ رہا ہے',
    },
    a: {
      en: "You pressed Check out before ever checking in. The day has to start before it can end. If you genuinely forgot to check in this morning, ask HR to correct the day.",
      ur: "آپ نے چیک اِن کیے بغیر چیک آؤٹ دبا دیا۔ دن پہلے شروع ہوگا، تب ہی ختم ہوگا۔ اگر واقعی صبح چیک اِن کرنا بھول گئے تھے تو HR سے دن درست کروا لیں۔",
    },
  },
  {
    q: {
      en: "I forgot to check out yesterday",
      ur: "کل چیک آؤٹ کرنا بھول گیا تھا",
    },
    a: {
      en: "You cannot fix a past day yourself. Ask HR — they can set the correct check-out time on your record. Do it soon, while you still remember when you left.",
      ur: "گزرا ہوا دن آپ خود درست نہیں کر سکتے۔ HR سے کہیں — وہ آپ کے ریکارڈ میں درست چیک آؤٹ وقت درج کر دیں گے۔ جلد بتا دیں، جب تک آپ کو جانے کا وقت یاد ہے۔",
    },
  },
  {
    q: {
      en: "My phone cannot get a location",
      ur: "میرا فون لوکیشن نہیں لے پا رہا",
    },
    a: {
      en: "Move outside or near a window and try again — GPS is poor deep inside a building. If it still fails, or the reading is very inaccurate, the punch will be refused. Ask HR to mark your attendance manually.",
      ur: "باہر نکل کر یا کھڑکی کے قریب جا کر دوبارہ کوشش کریں — عمارت کے اندر GPS کمزور ہوتا ہے۔ پھر بھی نہ چلے یا لوکیشن بہت غیر واضح ہو تو حاضری قبول نہیں ہوگی۔ HR سے کہیں کہ آپ کی حاضری خود لگا دیں۔",
    },
  },
  {
    q: {
      en: "I am at the office but it says I am too far away",
      ur: "میں دفتر میں ہوں مگر کہہ رہا ہے کہ آپ دور ہیں",
    },
    a: {
      en: "This usually means your device gave a poor location reading rather than that you are in the wrong place. Turn wifi on — it improves accuracy indoors — wait a few seconds and try again. If it keeps failing, tell HR where you are and they will record it.",
      ur: "عام طور پر اس کا مطلب یہ ہوتا ہے کہ آپ کے آلے نے لوکیشن درست نہیں بتائی، نہ کہ آپ غلط جگہ پر ہیں۔ وائی فائی آن کریں — اس سے عمارت کے اندر لوکیشن بہتر ہو جاتی ہے — چند لمحے رک کر دوبارہ کوشش کریں۔ بار بار ناکام ہو تو HR کو اپنی جگہ بتا دیں، وہ درج کر دیں گے۔",
    },
  },
]

const ELSEWHERE: Array<{ title: Copy; body: Copy }> = [
  {
    title: { en: "Applying for leave", ur: "چھٹی کی درخواست" },
    body: {
      en: "Go to My Leave → Apply for leave. Choose the leave type, the dates, and write a short reason. Your remaining balance for each type is shown on the same page. Your manager approves it.",
      ur: "My Leave ← Apply for leave پر جائیں۔ چھٹی کی قسم، تاریخیں اور مختصر وجہ لکھیں۔ ہر قسم کی باقی چھٹیاں اسی صفحے پر نظر آتی ہیں۔ منظوری آپ کے منیجر سے ہوگی۔",
    },
  },
  {
    title: { en: "Holidays", ur: "تعطیلات" },
    body: {
      en: "When HR announces a holiday, it appears in the bell at the top of the screen straight away, and under Upcoming Holidays on My Hub. On the day before, a banner appears at the top of My Hub. On a public holiday you do not check in at all.",
      ur: "HR جیسے ہی کوئی تعطیل کا اعلان کرتا ہے، وہ فوراً اوپر والی گھنٹی میں اور My Hub پر Upcoming Holidays میں نظر آ جاتی ہے۔ ایک دن پہلے My Hub کے اوپر اطلاع بھی آ جاتی ہے۔ تعطیل والے دن حاضری لگانے کی ضرورت نہیں ہوتی۔",
    },
  },
  {
    title: {
      en: "Expenses, travel and complaints",
      ur: "اخراجات، سفر اور شکایات",
    },
    body: {
      en: "My Requests holds expense claims, travel requests and help desk tickets. My Profile shows what HR has on record for you — tell them if anything is wrong.",
      ur: "My Requests میں اخراجات کے دعوے، سفر کی درخواستیں اور شکایات درج ہوتی ہیں۔ My Profile میں وہ معلومات ہیں جو HR کے پاس آپ کے بارے میں ہیں — کچھ غلط ہو تو انہیں بتائیں۔",
    },
  },
]

const CLOSING: Copy = {
  en: "Still stuck? Contact the HR department. Do not let a missing check-in sit for weeks — the longer you leave it, the harder it is to prove what happened. All times are Pakistan Standard Time.",
  ur: "پھر بھی مسئلہ ہو؟ HR کے شعبے سے رابطہ کریں۔ کوئی حاضری رہ جائے تو ہفتوں انتظار نہ کریں — جتنی دیر ہوگی، ثابت کرنا اتنا ہی مشکل ہو جائے گا۔ تمام اوقات پاکستان کے معیاری وقت کے مطابق ہیں۔",
}

const HEADINGS: Record<string, Copy> = {
  facts: { en: "The numbers that matter", ur: "اہم اوقات اور اصول" },
  steps: { en: "Marking attendance, step by step", ur: "حاضری لگانے کا طریقہ" },
  outcomes: { en: "How your day is marked", ur: "آپ کا دن کس طرح شمار ہوتا ہے" },
  sites: { en: "Where you can check in from", ur: "حاضری کہاں سے لگ سکتی ہے" },
  problems: { en: "When something goes wrong", ur: "اگر کوئی مسئلہ پیش آئے" },
  elsewhere: { en: "The rest of Self Service", ur: "سیلف سروس کی باقی سہولتیں" },
  result: { en: "Result", ur: "نتیجہ" },
  whenYouGetIt: { en: "When you get it", ur: "کب ملتا ہے" },
}

const Instructions = () => {
  const [lang, setLang] = React.useState<Lang>("en")

  // A remembered language is a convenience, not a requirement — a browser that
  // refuses storage (private window, blocked site data) just opens in English.
  React.useEffect(() => {
    try {
      if (localStorage.getItem(LANG_KEY) === "ur") setLang("ur")
    } catch {
      /* storage unavailable */
    }
  }, [])

  const choose = (next: Lang) => {
    setLang(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* storage unavailable */
    }
  }

  const urdu = lang === "ur"
  const t = (copy: Copy) => copy[lang]

  /** Urdu needs its face, its leading and its direction — always together. */
  const script = urdu ? "font-urdu text-[15px]" : ""
  const dir = urdu ? "rtl" : "ltr"

  return (
    <HrPage title="How to Mark Attendance">
      <div className="flex justify-center gap-1.5 pb-1">
        <Button
          size="sm"
          variant={urdu ? "outline" : "default"}
          className={cn(!urdu && "bg-teal-600 hover:bg-teal-700")}
          onClick={() => choose("en")}
        >
          English
        </Button>
        <Button
          size="sm"
          variant={urdu ? "default" : "outline"}
          className={cn("font-urdu-tight", urdu && "bg-teal-600 hover:bg-teal-700")}
          onClick={() => choose("ur")}
        >
          اردو
        </Button>
      </div>

      <div dir={dir} className={cn("flex flex-col gap-6", script)}>
        <p className="max-w-2xl text-muted-foreground">{t(INTRO)}</p>

        {/* ── Numbers ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.facts)}</SectionTitle>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f) => (
              <Card key={f.label.en}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{t(f.label)}</p>
                  <p
                    className={cn(
                      "text-xl font-semibold tabular-nums text-teal-600",
                      urdu && "font-urdu-tight text-lg",
                    )}
                  >
                    {t(f.value)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(f.hint)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Steps ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.steps)}</SectionTitle>
          <ol className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <li key={step.title.en}>
                <Card>
                  <CardContent className="flex gap-3.5 p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 font-sans text-sm font-semibold tabular-nums text-teal-600 dark:bg-teal-950">
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="font-semibold">{t(step.title)}</p>
                      <p className="text-sm text-muted-foreground">{t(step.body)}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Outcomes ──────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.outcomes)}</SectionTitle>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">
                        {t(HEADINGS.result)}
                      </th>
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">
                        {t(HEADINGS.whenYouGetIt)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {OUTCOMES.map((o) => (
                      <tr key={o.status.en} className="border-b last:border-0">
                        <td className="px-4 py-3 align-top">
                          <span
                            className={cn(
                              "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
                              o.tone,
                              urdu && "font-urdu-tight",
                            )}
                          >
                            {t(o.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-muted-foreground">{t(o.when)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Note tone="amber" title={t(LATE_RULE.title)}>
            {t(LATE_RULE.body)}
          </Note>
        </section>

        {/* ── Sites ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.sites)}</SectionTitle>
          <p className="text-sm text-muted-foreground">{t(SITES_INTRO)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SITES.map((s) => (
              <Card key={s.name.en}>
                <CardContent className="flex flex-col gap-0.5 p-4">
                  <p className="font-semibold">{t(s.name)}</p>
                  <p className="text-sm text-muted-foreground">{t(s.where)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Note title={t(OFFSITE.title)}>{t(OFFSITE.body)}</Note>
        </section>

        {/* ── Troubleshooting ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.problems)}</SectionTitle>
          <div className="flex flex-col gap-2">
            {PROBLEMS.map((p) => (
              <details
                key={p.q.en}
                className="group overflow-hidden rounded-lg border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {t(p.q)}
                  <span className="shrink-0 font-sans text-lg leading-none text-teal-600">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">{t(p.a)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Everything else ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle urdu={urdu}>{t(HEADINGS.elsewhere)}</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {ELSEWHERE.map((e) => (
              <Note key={e.title.en} tone="teal" title={t(e.title)}>
                {t(e.body)}
              </Note>
            ))}
          </div>
        </section>

        <p className="border-t pt-4 text-sm text-muted-foreground">{t(CLOSING)}</p>
      </div>
    </HrPage>
  )
}

function SectionTitle({ urdu, children }: { urdu: boolean; children: React.ReactNode }) {
  return (
    <h2
      className={cn(
        "border-b pb-2 text-lg font-semibold tracking-tight",
        urdu && "font-urdu-tight",
      )}
    >
      {children}
    </h2>
  )
}

function Note({
  title,
  tone = "plain",
  children,
}: {
  title: string
  tone?: "plain" | "teal" | "amber"
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    plain: "border bg-card",
    teal: "border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  }
  const headings: Record<string, string> = {
    plain: "",
    teal: "text-teal-800 dark:text-teal-200",
    amber: "text-amber-800 dark:text-amber-200",
  }
  const bodies: Record<string, string> = {
    plain: "text-muted-foreground",
    teal: "text-teal-700 dark:text-teal-300",
    amber: "text-amber-700 dark:text-amber-300",
  }

  return (
    <Card className={cn("shadow-none", tones[tone])}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-base", headings[tone])}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-sm", bodies[tone])}>{children}</p>
      </CardContent>
    </Card>
  )
}

export default Instructions
