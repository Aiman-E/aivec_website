import {
  db,
  siteSettingsTable,
  pagesTable,
  eventsTable,
  eventFieldsTable,
  newsPostsTable,
  blogPostsTable,
  sponsorsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const CONFERENCE_INTRO_AR = `ينعقد مؤتمر عدن الثاني لجراحة الأوعية الدموية والتداخلية (AIVEC 2026) في عدن خلال الفترة من 1 إلى 3 ديسمبر 2026، في صالة سبأ الكبرى بخورمكسر المطلة على ساحل أبين في خليج عدن، حيث يجتمع جمال المكان مع اعتدال المناخ ليشكّلا بيئة مثالية لحدث علمي متميز. ويُعد المؤتمر منصة علمية متقدمة تجمع نخبة من الأطباء والاستشاريين من مختلف دول العالم، لمناقشة أحدث التطورات في تشخيص وعلاج أمراض الأوعية الدموية. كما يتضمن ورش عمل تدريبية متخصصة وعروضاً لأحدث التقنيات في الجراحة والتداخلات العلاجية بالقسطرة، بهدف رفع كفاءة الكوادر الطبية وتعزيز المهارات العملية. ويأتي هذا الحدث امتداداً لنجاح المؤتمر الأول الذي عُقد في نوفمبر 2025، ليؤكد التزامه بتطوير القطاع الصحي وتعزيز تبادل الخبرات العلمية، وخدمة المجتمع اليمني والعربي والدولي في مجال الرعاية الصحية.`;

const CONFERENCE_INTRO_EN = `The Second Aden International Vascular and Endovascular Conference (AIVEC 2026) will be held in Aden from December 1–3, 2026, at Saba Grand Hall in Khormaksar, overlooking the Abyan Coast along the Gulf of Aden. The conference benefits from Aden's pleasant climate, creating an ideal environment for a distinguished scientific event. It serves as an advanced platform bringing together leading physicians and consultants from around the world to discuss the latest developments in the diagnosis and treatment of vascular diseases. The conference will feature specialized training workshops and presentations on cutting-edge technologies in vascular surgery and interventional catheter-based therapies, aiming to enhance professional skills and build medical capacity. Building on the success of the first conference held in November 2025, AIVEC 2026 reaffirms its commitment to advancing healthcare, fostering scientific exchange, and serving the Yemeni, regional, and international communities in the field of medicine.`;

async function upsertPage(key: string, fields: Record<string, unknown>) {
  const [existing] = await db.select().from(pagesTable).where(sql`${pagesTable.key} = ${key}`);
  if (existing) {
    await db.update(pagesTable).set(fields).where(sql`${pagesTable.id} = ${existing.id}`);
  } else {
    await db.insert(pagesTable).values({ key, ...(fields as object) });
  }
}

async function upsertSiteSettings() {
  const [existing] = await db.select().from(siteSettingsTable).limit(1);
  const data = {
    siteTitleEn: "AIVEC 2026 — Aden International Vascular & Endovascular Conference",
    siteTitleAr: "AIVEC 2026 — مؤتمر عدن الدولي لجراحة الأوعية الدموية والتداخلية",
    conferenceYear: 2026,
    conferenceNumber: 2,
    conferenceOrdinalEn: "Second Conference",
    conferenceOrdinalAr: "المؤتمر الثاني",
    conferenceDatesEn: "December 1–3, 2026",
    conferenceDatesAr: "1 – 3 ديسمبر 2026",
    venueNameEn: "Saba Grand Hall, Khormaksar, Aden",
    venueNameAr: "صالة سبأ الكبرى، خورمكسر، عدن",
    venueDescEn: "Overlooking the Abyan Coast along the Gulf of Aden.",
    venueDescAr: "تطل على ساحل أبين على خليج عدن.",
    contactPhone: "+967777907147",
    contactWhatsapp: "+967777907147",
    contactEmails: ["alameriendo@gmail.com", "alameri_karim@yahoo.com"],
    seoTitleEn: "AIVEC 2026 — Aden International Vascular & Endovascular Conference",
    seoTitleAr: "AIVEC 2026 — مؤتمر عدن الدولي لجراحة الأوعية الدموية والتداخلية",
    seoDescEn:
      "The 2nd Aden International Vascular & Endovascular Conference, December 1–3, 2026, Saba Grand Hall, Khormaksar, Aden, Yemen.",
    seoDescAr:
      "المؤتمر الثاني لجراحة الأوعية الدموية والتداخلية، 1 – 3 ديسمبر 2026، صالة سبأ الكبرى، خورمكسر، عدن.",
    footerNoteEn:
      "Convened in Aden under the patronage of the Ministry of Public Health and Population of Yemen.",
    footerNoteAr:
      "يُعقد في عدن برعاية وزارة الصحة العامة والسكان في الجمهورية اليمنية.",
  };
  if (existing) {
    await db.update(siteSettingsTable).set(data).where(sql`${siteSettingsTable.id} = ${existing.id}`);
  } else {
    await db.insert(siteSettingsTable).values(data);
  }
}

async function upsertPages() {
  await upsertPage("home", {
    titleEn: "Aden International Vascular & Endovascular Conference",
    titleAr: "مؤتمر عدن الدولي لجراحة الأوعية الدموية والتداخلية",
    subtitleEn: "AIVEC 2026 — Second Conference · December 1–3, 2026 · Saba Grand Hall, Aden",
    subtitleAr: "AIVEC 2026 — المؤتمر الثاني · 1 – 3 ديسمبر 2026 · صالة سبأ الكبرى، عدن",
    bodyEn: CONFERENCE_INTRO_EN,
    bodyAr: CONFERENCE_INTRO_AR,
    sections: {
      highlights: [
        {
          titleEn: "International Scientific Platform",
          titleAr: "منصة علمية دولية",
          bodyEn: "Leading vascular surgeons and interventional specialists from across the world.",
          bodyAr: "نخبة من جراحي الأوعية والاستشاريين التداخليين من مختلف دول العالم.",
        },
        {
          titleEn: "Hands-on Workshops",
          titleAr: "ورش عمل عملية",
          bodyEn: "Specialised training in modern catheter-based vascular interventions.",
          bodyAr: "تدريب متخصص على أحدث تقنيات التداخل الوعائي بالقسطرة.",
        },
        {
          titleEn: "Advanced Endovascular Technologies",
          titleAr: "تقنيات تداخلية متقدمة",
          bodyEn: "Showcases of the latest devices and techniques in endovascular care.",
          bodyAr: "استعراض أحدث الأجهزة والتقنيات في علاج أمراض الأوعية الدموية.",
        },
        {
          titleEn: "Medical Capacity Building",
          titleAr: "بناء القدرات الطبية",
          bodyEn: "Strengthening the Yemeni and regional medical workforce.",
          bodyAr: "تعزيز كفاءة الكوادر الطبية في اليمن والمنطقة.",
        },
      ],
    },
  });

  await upsertPage("about", {
    titleEn: "About AIVEC",
    titleAr: "عن AIVEC",
    subtitleEn: "A permanent scientific identity for Aden",
    subtitleAr: "هوية علمية دائمة لمدينة عدن",
    bodyEn:
      "AIVEC — the Aden International Vascular & Endovascular Conference — is established as a permanent scientific identity for the city of Aden, dedicated to the advancement of vascular surgery and interventional therapies. Each annual edition gathers physicians, consultants, residents and trainees from Yemen, the Arab world and beyond, to exchange knowledge, transfer modern techniques, and strengthen patient care across the region.",
    bodyAr:
      "AIVEC — مؤتمر عدن الدولي لجراحة الأوعية الدموية والتداخلية — هوية علمية دائمة لمدينة عدن مكرّسة لتطوير جراحة الأوعية الدموية والعلاجات التداخلية. تجمع كل دورة سنوية أطباء واستشاريين ومقيمين ومتدربين من اليمن والعالم العربي والدول الأخرى لتبادل المعرفة، ونقل التقنيات الحديثة، والارتقاء برعاية المرضى في المنطقة.",
    sections: {
      timeline: [
        {
          when: "November 2025",
          titleEn: "First Conference",
          titleAr: "المؤتمر الأول",
          bodyEn: "Inaugural edition of AIVEC held in Aden, establishing the conference identity.",
          bodyAr: "الدورة الافتتاحية لمؤتمر AIVEC في عدن، تأسيس الهوية العلمية للمؤتمر.",
        },
        {
          when: "December 1–3, 2026",
          titleEn: "Second Conference — AIVEC 2026",
          titleAr: "المؤتمر الثاني — AIVEC 2026",
          bodyEn: "Saba Grand Hall, Khormaksar, Aden.",
          bodyAr: "صالة سبأ الكبرى، خورمكسر، عدن.",
        },
      ],
    },
  });

  await upsertPage("vision", {
    titleEn: "Vision, Mission & Objectives",
    titleAr: "الرؤية والرسالة والأهداف",
    subtitleEn: "The scientific and institutional framework of AIVEC 2026",
    subtitleAr: "الإطار العلمي والمؤسسي لمؤتمر AIVEC 2026",
    bodyEn: "",
    bodyAr: "",
    sections: {
      vision: {
        titleEn: "Vision",
        titleAr: "الرؤية",
        bodyEn:
          "To establish AIVEC 2026 as a leading regional and international scientific platform in vascular surgery and interventional therapies, contributing to the transfer of advanced knowledge, enhancing healthcare quality, and positioning Aden as a distinguished hub in this specialty.",
        bodyAr:
          "أن يكون مؤتمر AIVEC 2026 منصة علمية رائدة إقليمياً ودولياً في مجال جراحة الأوعية الدموية والتداخلات العلاجية، تسهم في نقل المعرفة الحديثة وتعزيز جودة الرعاية الصحية، وتضع عدن كمركز علمي متميز في هذا التخصص.",
      },
      mission: {
        titleEn: "Mission",
        titleAr: "الرسالة",
        bodyEn:
          "To deliver a comprehensive scientific conference that brings together leading experts and consultants from around the world to exchange knowledge and present the latest advancements in vascular surgery and interventional procedures, with a strong focus on practical training and capacity building for healthcare professionals.",
        bodyAr:
          "تقديم مؤتمر علمي متكامل يجمع نخبة الخبراء والاستشاريين من مختلف دول العالم، لتبادل الخبرات وعرض أحدث التقنيات في جراحة وتداخلات الأوعية الدموية، مع التركيز على التدريب العملي ورفع كفاءة الكوادر الطبية.",
      },
      objectives: {
        titleEn: "Objectives",
        titleAr: "الأهداف",
        bodyEn:
          "To enhance medical knowledge of the latest global developments in the diagnosis and treatment of vascular diseases, develop physicians' skills through hands-on workshops, build international scientific partnerships, and support the improvement of healthcare quality to serve the Yemeni, regional, and global communities.",
        bodyAr:
          "تعزيز المعرفة الطبية بأحدث التطورات العالمية في تشخيص وعلاج أمراض الأوعية الدموية، تطوير مهارات الأطباء عبر ورش العمل التدريبية، بناء شراكات علمية دولية، ودعم تحسين جودة الخدمات الصحية بما يخدم المجتمع اليمني والإقليمي.",
      },
    },
  });

  await upsertPage("audience", {
    titleEn: "Target Audience",
    titleAr: "الجمهور المستهدف",
    subtitleEn: "Who AIVEC 2026 is designed for",
    subtitleAr: "الفئات التي يستهدفها مؤتمر AIVEC 2026",
    bodyEn:
      "Vascular surgeons, interventional radiologists, general surgeons, cardiologists, resident doctors, medical students, nursing and technical staff, and all professionals interested in vascular diseases and modern interventional treatment techniques.",
    bodyAr:
      "أطباء جراحة الأوعية الدموية، أطباء الأشعة التداخلية، الجراحون العامون، أطباء القلب، الأطباء المقيمون، طلاب الطب، الكوادر التمريضية والفنية، وكل المهتمين بمجال أمراض الأوعية الدموية والتقنيات العلاجية الحديثة.",
    sections: {
      groups: [
        { en: "Vascular surgeons", ar: "جراحو الأوعية الدموية" },
        { en: "Interventional radiologists", ar: "أطباء الأشعة التداخلية" },
        { en: "General surgeons", ar: "الجراحون العامون" },
        { en: "Cardiologists", ar: "أطباء القلب" },
        { en: "Resident physicians", ar: "الأطباء المقيمون" },
        { en: "Medical students", ar: "طلاب الطب" },
        { en: "Nursing and technical staff", ar: "الكوادر التمريضية والفنية" },
      ],
    },
  });

  await upsertPage("sponsorship", {
    titleEn: "Sponsorship & Support",
    titleAr: "الرعاية والدعم",
    subtitleEn: "An institutional alliance behind AIVEC 2026",
    subtitleAr: "تحالف مؤسسي يدعم مؤتمر AIVEC 2026",
    bodyEn:
      "AIVEC 2026 is supported by a wide range of companies, institutions, and medical centers specializing in pharmaceuticals and therapeutic supplies, reflecting their commitment to advancing the healthcare sector. Hospitals, universities, and community organizations also play an active role in supporting the conference. Leading support comes from the Ministry of Public Health and Population Yemen and its affiliated institutions, alongside other relevant ministries and governmental bodies. The participation of international companies through their local representatives in Yemen highlights a strong commitment to introducing cutting-edge medical technologies and strengthening global partnerships. This collective support reflects effective collaboration between public and private sectors, reinforces the importance of continuous medical education, and demonstrates the government's dedication to supporting science, researchers, and medical advancement.",
    bodyAr:
      "يحظى مؤتمر AIVEC 2026 برعاية ودعم واسع من الشركات والمؤسسات والمراكز الطبية المتخصصة في المستلزمات العلاجية والأدوية، تأكيداً لدورها في تطوير القطاع الصحي. كما تشارك المستشفيات، الجامعات، والمؤسسات المجتمعية بفاعلية في دعم وإنجاح هذا الحدث العلمي. ويأتي في مقدمة الجهات الداعمة وزارة الصحة العامة والسكان اليمنية بكافة مؤسساتها وفروعها، إلى جانب الوزارات والهيئات الحكومية ذات العلاقة. ويعكس حضور الشركات العالمية عبر وكلائها في اليمن اهتماماً بنقل أحدث التقنيات الطبية وتعزيز الشراكات الدولية. ويجسد هذا الدعم التكامل بين القطاعين العام والخاص لخدمة التعليم الطبي المستمر. كما يؤكد حرص الدولة والحكومة على دعم العلم والعلماء وتشجيع البحث العلمي. ويسهم ذلك في خلق بيئة علمية متقدمة تسهم في تحسين جودة الرعاية الصحية. ويعد المؤتمر نموذجاً للتعاون المثمر بين مختلف القطاعات الصحية والأكاديمية. ويعزز هذا الدعم من مكانة المؤتمر كمنصة علمية رائدة على المستوى المحلي والإقليمي.",
    sections: {
      tiers: [
        { key: "government", titleEn: "Patron / Government", titleAr: "الراعي الرسمي / حكومي" },
        { key: "platinum", titleEn: "Platinum", titleAr: "بلاتيني" },
        { key: "gold", titleEn: "Gold", titleAr: "ذهبي" },
        { key: "silver", titleEn: "Silver", titleAr: "فضي" },
        { key: "supporter", titleEn: "Supporter", titleAr: "داعم" },
      ],
    },
  });

  await upsertPage("conference-2026", {
    titleEn: "AIVEC 2026 — Second Conference",
    titleAr: "AIVEC 2026 — المؤتمر الثاني",
    subtitleEn: "December 1–3, 2026 · Saba Grand Hall · Aden",
    subtitleAr: "1 – 3 ديسمبر 2026 · صالة سبأ الكبرى · عدن",
    bodyEn: CONFERENCE_INTRO_EN,
    bodyAr: CONFERENCE_INTRO_AR,
    sections: {
      themes: [
        {
          titleEn: "Aortic & Peripheral Arterial Disease",
          titleAr: "أمراض الشريان الأورطي والشرايين الطرفية",
        },
        {
          titleEn: "Venous Disease & Deep Vein Interventions",
          titleAr: "أمراض الأوردة والتدخلات الوريدية العميقة",
        },
        {
          titleEn: "Diabetic Foot & Critical Limb Ischaemia",
          titleAr: "القدم السكرية ونقص التروية الطرفية الحرج",
        },
        {
          titleEn: "Endovascular Aneurysm Repair",
          titleAr: "إصلاح أم الدم بالتدخل الوعائي",
        },
        {
          titleEn: "Vascular Access for Dialysis",
          titleAr: "المداخل الوعائية للغسيل الكلوي",
        },
      ],
      workshops: [
        {
          titleEn: "Endovascular Workshop",
          titleAr: "ورشة عمل التداخل الوعائي",
          bodyEn: "Hands-on training in catheter-based vascular interventions.",
          bodyAr: "تدريب عملي على التدخلات الوعائية بالقسطرة.",
        },
        {
          titleEn: "Vascular Ultrasound Workshop",
          titleAr: "ورشة الموجات فوق الصوتية الوعائية",
          bodyEn: "Practical sessions on duplex scanning and pre-operative mapping.",
          bodyAr: "جلسات عملية على فحص الدوبلكس والتقييم قبل الجراحة.",
        },
      ],
    },
  });
}

async function upsertEvents() {
  const slug = "aivec-2026-main-registration";
  const existing = await db.select().from(eventsTable).where(sql`${eventsTable.slug} = ${slug}`);
  if (existing.length > 0) return;

  const [event] = await db
    .insert(eventsTable)
    .values({
      slug,
      titleEn: "AIVEC 2026 — Delegate Registration",
      titleAr: "AIVEC 2026 — تسجيل المشاركين",
      summaryEn:
        "Register as a delegate, speaker, or trainee for the Second Aden International Vascular & Endovascular Conference, December 1–3, 2026.",
      summaryAr:
        "سجّل كمشارك أو متحدث أو متدرب في المؤتمر الثاني لجراحة الأوعية الدموية والتداخلية، 1 – 3 ديسمبر 2026.",
      bodyEn:
        "Register to attend AIVEC 2026 at Saba Grand Hall in Khormaksar, Aden, December 1–3, 2026. The scientific committee will review every submission and issue confirmation by email.",
      bodyAr:
        "سجّل لحضور مؤتمر AIVEC 2026 في صالة سبأ الكبرى بخورمكسر، عدن، خلال الفترة 1 – 3 ديسمبر 2026. ستراجع اللجنة العلمية كل طلب ويتم إرسال التأكيد بالبريد الإلكتروني.",
      venueEn: "Saba Grand Hall, Khormaksar, Aden",
      venueAr: "صالة سبأ الكبرى، خورمكسر، عدن",
      startsAt: new Date("2026-12-01T08:00:00Z"),
      endsAt: new Date("2026-12-03T18:00:00Z"),
      status: "open",
      featured: true,
    })
    .returning();

  if (!event) return;

  const fields = [
    {
      fieldKey: "full_name",
      fieldType: "short_text",
      labelEn: "Full name",
      labelAr: "الاسم الكامل",
      placeholderEn: "Dr. Firstname Lastname",
      placeholderAr: "د. الاسم الكامل",
      required: true,
      order: 1,
    },
    {
      fieldKey: "email",
      fieldType: "email",
      labelEn: "Email",
      labelAr: "البريد الإلكتروني",
      required: true,
      order: 2,
    },
    {
      fieldKey: "phone",
      fieldType: "phone",
      labelEn: "Phone / WhatsApp",
      labelAr: "الهاتف / واتساب",
      required: true,
      order: 3,
    },
    {
      fieldKey: "specialty",
      fieldType: "dropdown",
      labelEn: "Specialty",
      labelAr: "التخصص",
      required: true,
      order: 4,
      options: [
        { value: "vascular_surgery", labelEn: "Vascular surgery", labelAr: "جراحة الأوعية الدموية" },
        { value: "interventional_radiology", labelEn: "Interventional radiology", labelAr: "الأشعة التداخلية" },
        { value: "general_surgery", labelEn: "General surgery", labelAr: "الجراحة العامة" },
        { value: "cardiology", labelEn: "Cardiology", labelAr: "أمراض القلب" },
        { value: "resident", labelEn: "Resident / Trainee", labelAr: "طبيب مقيم / متدرب" },
        { value: "medical_student", labelEn: "Medical student", labelAr: "طالب طب" },
        { value: "nursing_technical", labelEn: "Nursing / Technical staff", labelAr: "تمريض / كوادر فنية" },
        { value: "other", labelEn: "Other", labelAr: "أخرى" },
      ],
    },
    {
      fieldKey: "institution",
      fieldType: "short_text",
      labelEn: "Institution / Hospital",
      labelAr: "المؤسسة / المستشفى",
      required: true,
      order: 5,
    },
    {
      fieldKey: "city_country",
      fieldType: "short_text",
      labelEn: "City, Country",
      labelAr: "المدينة، الدولة",
      required: true,
      order: 6,
    },
    {
      fieldKey: "professional_title",
      fieldType: "short_text",
      labelEn: "Professional title",
      labelAr: "المسمى الوظيفي",
      required: false,
      order: 7,
    },
    {
      fieldKey: "attendance_type",
      fieldType: "radio",
      labelEn: "Attendance type",
      labelAr: "نوع الحضور",
      required: true,
      order: 8,
      options: [
        { value: "in_person", labelEn: "In person, in Aden", labelAr: "حضور شخصي في عدن" },
        { value: "speaker", labelEn: "Invited speaker", labelAr: "متحدث مدعو" },
        { value: "trainee", labelEn: "Workshop trainee", labelAr: "متدرب في ورشة عمل" },
      ],
    },
    {
      fieldKey: "workshops",
      fieldType: "checkbox",
      labelEn: "Workshops of interest",
      labelAr: "ورش العمل المهتم بها",
      required: false,
      order: 9,
      options: [
        { value: "endovascular", labelEn: "Endovascular workshop", labelAr: "ورشة التداخل الوعائي" },
        { value: "ultrasound", labelEn: "Vascular ultrasound workshop", labelAr: "ورشة الموجات فوق الصوتية الوعائية" },
        { value: "diabetic_foot", labelEn: "Diabetic foot session", labelAr: "جلسة القدم السكرية" },
      ],
    },
    {
      fieldKey: "notes",
      fieldType: "long_text",
      labelEn: "Notes for the scientific committee",
      labelAr: "ملاحظات للجنة العلمية",
      required: false,
      order: 10,
    },
  ] as const;

  await db.insert(eventFieldsTable).values(
    fields.map((f) => ({
      eventId: event.id,
      fieldKey: f.fieldKey,
      fieldType: f.fieldType,
      labelEn: f.labelEn,
      labelAr: f.labelAr,
      helpEn: "",
      helpAr: "",
      placeholderEn: ("placeholderEn" in f && f.placeholderEn) || "",
      placeholderAr: ("placeholderAr" in f && f.placeholderAr) || "",
      required: f.required,
      order: f.order,
      options: ("options" in f && f.options) ? [...f.options] : null,
    })),
  );
}

async function upsertNews() {
  const items: Array<typeof newsPostsTable.$inferInsert> = [
    {
      slug: "aivec-2026-registration-open",
      titleEn: "Registration is now open for AIVEC 2026",
      titleAr: "فتح باب التسجيل في مؤتمر AIVEC 2026",
      excerptEn:
        "Delegates, speakers, and trainees from across the Arab world and beyond can now register for the second Aden International Vascular & Endovascular Conference.",
      excerptAr:
        "بإمكان المشاركين والمتحدثين والمتدربين من العالم العربي والدول الأخرى التسجيل في المؤتمر الثاني لجراحة الأوعية الدموية والتداخلية في عدن.",
      bodyEn:
        "The scientific committee of the Aden International Vascular & Endovascular Conference (AIVEC) is pleased to announce that registration is now open for AIVEC 2026, to be held December 1–3, 2026, at Saba Grand Hall in Khormaksar, Aden. Confirmed delegates will receive an official letter from the committee with attendance and workshop details.",
      bodyAr:
        "تعلن اللجنة العلمية لمؤتمر عدن الدولي لجراحة الأوعية الدموية والتداخلية (AIVEC) عن فتح باب التسجيل لمؤتمر AIVEC 2026 الذي سيُعقد في الفترة من 1 إلى 3 ديسمبر 2026 في صالة سبأ الكبرى بخورمكسر، عدن. سيتلقى المشاركون المؤكدون خطاباً رسمياً من اللجنة يتضمن تفاصيل الحضور وورش العمل.",
      category: "announcement",
      published: true,
      publishedAt: new Date("2026-05-16T08:00:00Z"),
    },
    {
      slug: "aivec-2026-venue-saba-grand-hall",
      titleEn: "AIVEC 2026 returns to Aden at Saba Grand Hall",
      titleAr: "AIVEC 2026 يعود إلى عدن في صالة سبأ الكبرى",
      excerptEn:
        "The second edition of AIVEC will be hosted at Saba Grand Hall in Khormaksar, overlooking the Abyan Coast on the Gulf of Aden.",
      excerptAr:
        "ستُقام الدورة الثانية من AIVEC في صالة سبأ الكبرى بخورمكسر، المطلة على ساحل أبين على خليج عدن.",
      bodyEn:
        "Building on the success of the first conference held in November 2025, AIVEC 2026 will convene at one of Aden's most prominent venues. Khormaksar's coastal setting and Aden's pleasant December climate provide an exceptional environment for the international scientific programme.",
      bodyAr:
        "امتداداً لنجاح المؤتمر الأول الذي عُقد في نوفمبر 2025، سينعقد AIVEC 2026 في واحد من أبرز قاعات عدن. ويوفر موقع خورمكسر الساحلي ومناخ عدن المعتدل في ديسمبر بيئة استثنائية للبرنامج العلمي الدولي.",
      category: "venue",
      published: true,
      publishedAt: new Date("2026-05-18T08:00:00Z"),
    },
    {
      slug: "aivec-2026-workshops-announced",
      titleEn: "Workshops on endovascular technique and vascular ultrasound",
      titleAr: "إعلان ورشتي التداخل الوعائي والموجات فوق الصوتية",
      excerptEn:
        "Hands-on training sessions will run alongside the scientific programme.",
      excerptAr:
        "ستُعقد جلسات تدريبية عملية بالتوازي مع البرنامج العلمي.",
      bodyEn:
        "AIVEC 2026 will host hands-on workshops in catheter-based vascular interventions and vascular ultrasound, designed for residents, trainees, and consultants seeking to update their practical skills.",
      bodyAr:
        "سيستضيف AIVEC 2026 ورش عمل عملية في التدخلات الوعائية بالقسطرة والموجات فوق الصوتية الوعائية، مصممة للأطباء المقيمين والمتدربين والاستشاريين الراغبين في تحديث مهاراتهم العملية.",
      category: "programme",
      published: true,
      publishedAt: new Date("2026-05-20T08:00:00Z"),
    },
  ];
  for (const item of items) {
    const [existing] = await db.select().from(newsPostsTable).where(sql`${newsPostsTable.slug} = ${item.slug}`);
    if (existing) continue;
    await db.insert(newsPostsTable).values(item);
  }
}

async function upsertBlog() {
  const items: Array<typeof blogPostsTable.$inferInsert> = [
    {
      slug: "why-vascular-care-matters-in-yemen",
      titleEn: "Why vascular care matters for Yemen — and for Aden",
      titleAr: "لماذا تُعد رعاية الأوعية الدموية أولوية لليمن وعدن",
      excerptEn:
        "Diabetic foot disease, peripheral arterial disease and dialysis access remain among the most consequential — and most treatable — vascular problems we face.",
      excerptAr:
        "تظل أمراض القدم السكرية، وأمراض الشرايين الطرفية، ومداخل الغسيل الكلوي من أهم المشكلات الوعائية وأكثرها قابلية للعلاج.",
      bodyEn:
        "Across Yemen and the region, vascular disease is both common and underserved. AIVEC exists to close that gap by gathering vascular surgeons, interventional radiologists and cardiologists in Aden to share technique, exchange evidence, and train the next generation of physicians.",
      bodyAr:
        "تنتشر أمراض الأوعية الدموية في اليمن والمنطقة بشكل واسع وتعاني من قلة الخدمات المتخصصة. يأتي AIVEC ليسد هذه الفجوة بجمع جراحي الأوعية وأطباء الأشعة التداخلية وأطباء القلب في عدن لتبادل الخبرات والأدلة العلمية وتدريب الجيل القادم من الأطباء.",
      tags: ["vascular", "yemen", "editorial"],
      authorName: "AIVEC Scientific Committee",
      published: true,
      publishedAt: new Date("2026-05-19T08:00:00Z"),
    },
    {
      slug: "endovascular-techniques-state-of-the-art",
      titleEn: "Endovascular techniques: where the field stands in 2026",
      titleAr: "تقنيات التداخل الوعائي: أين وصل المجال في 2026",
      excerptEn:
        "From drug-eluting balloons to dedicated below-the-knee devices, the toolkit available to vascular specialists has changed substantially over the past decade.",
      excerptAr:
        "من بالونات الدواء إلى الأجهزة المخصصة لما تحت الركبة، تغيرت أدوات أخصائيي الأوعية الدموية بشكل جوهري خلال العقد الماضي.",
      bodyEn:
        "This editorial overview previews several of the technical sessions at AIVEC 2026, with a focus on practical decision-making in resource-aware settings.",
      bodyAr:
        "تقدم هذه الافتتاحية لمحة عامة عن عدد من الجلسات الفنية في AIVEC 2026 مع التركيز على اتخاذ القرارات العملية في البيئات محدودة الموارد.",
      tags: ["endovascular", "technique", "preview"],
      authorName: "AIVEC Scientific Committee",
      published: true,
      publishedAt: new Date("2026-05-21T08:00:00Z"),
    },
  ];
  for (const item of items) {
    const [existing] = await db.select().from(blogPostsTable).where(sql`${blogPostsTable.slug} = ${item.slug}`);
    if (existing) continue;
    await db.insert(blogPostsTable).values(item);
  }
}

async function upsertSponsors() {
  const [count] = await db.select({ c: sql<number>`count(*)::int` }).from(sponsorsTable);
  if ((count?.c ?? 0) > 0) return;
  await db.insert(sponsorsTable).values([
    {
      nameEn: "Ministry of Public Health & Population — Yemen",
      nameAr: "وزارة الصحة العامة والسكان — اليمن",
      tier: "government",
    },
    {
      nameEn: "Aden Medical Association",
      nameAr: "الجمعية الطبية بعدن",
      tier: "government",
    },
    {
      nameEn: "University of Aden — Faculty of Medicine",
      nameAr: "جامعة عدن — كلية الطب",
      tier: "platinum",
    },
    {
      nameEn: "Aden General Hospital",
      nameAr: "مستشفى عدن العام",
      tier: "gold",
    },
  ]);
}

async function main() {
  await upsertSiteSettings();
  await upsertPages();
  await upsertEvents();
  await upsertNews();
  await upsertBlog();
  await upsertSponsors();
  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
