# Portfolio — พัตเตอร์ (Peerapat Punnapong)

เว็บหน้าเดียวแบบ scrollytelling · HTML + CSS + JavaScript ธรรมดา · GSAP + ScrollTrigger จาก CDN

## ดูบนเครื่อง
ดับเบิลคลิก `index.html` ได้เลย (ต้องต่อเน็ตเพื่อโหลดฟอนต์และ GSAP)
หรือถ้าอยากให้เหมือนบนเว็บจริง: เปิด terminal ในโฟลเดอร์นี้แล้วพิมพ์ `npx serve .`

## เอาขึ้น Vercel (เลือกวิธีเดียว)
**ก. ง่ายสุด — ผ่าน GitHub**
1. สร้าง repo ใหม่บน GitHub แล้วอัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ (ให้ `index.html` อยู่ชั้นนอกสุด)
2. เข้า vercel.com → Add New → Project → เลือก repo นั้น
3. Framework Preset: **Other** · Build Command: เว้นว่าง · Output Directory: เว้นว่าง → Deploy

**ข. ผ่าน terminal**
```
npm i -g vercel
vercel          # ครั้งแรกจะให้ล็อกอินและตั้งชื่อโปรเจกต์
vercel --prod
```

## สิ่งที่ต้องแก้เองก่อนขึ้นจริง
| เรื่อง | แก้ที่ไหน |
|---|---|
| อีเมล / Instagram | ใส่แล้วใน `js/main.js` (`CONTACT`) — เว้นว่าง = ซ่อน |
| แกลเลอรีผลงาน | ใน `index.html` แต่ละการ์ดมี `<div class="gc" data-yt="…">` — ปุ่ม `gc__thumb` แต่ละอันคือรูปหนึ่งรูป (`data-src` = รูปใหญ่, img ข้างใน = รูปย่อ `-sm.webp`) · ลบ `data-yt` = ไม่มีปุ่มดูวิดีโอ |
| ภาพท่า **ชี้ขวา** (Timeline) | ยังใช้ภาพยืนถือเบสแทนไว้ก่อน — วางไฟล์ใหม่ทับ `assets/char/pose-point.webp` (PNG พื้นใสแปลงเป็น WebP) · ท่ายื่นมือ (`pose-present.webp`) เปลี่ยนเป็นภาพจริงแล้ว |
| ภาพคอม (item-laptop) | ภาพเดิมมีลายน้ำ Vecteezy ติดอยู่ ควรเปลี่ยนเป็นภาพที่มีสิทธิ์ใช้ → ทับ `assets/items/laptop.webp` |
| og:image | หลัง deploy เปลี่ยน `content="assets/og.jpg"` ใน `index.html` เป็น URL เต็ม เช่น `https://ชื่อเว็บ.vercel.app/assets/og.jpg` |

แปลง PNG เป็น WebP: ใช้ squoosh.app (ลากไฟล์ → เลือก WebP → quality ~80) หรือ `cwebp -q 80 in.png -o out.webp`

## โครงไฟล์
```
index.html          เนื้อหาทั้งหมด (00 Hero → 04 Dream + footer)
css/style.css       ดีไซน์ สี ฟอนต์ มือถือ และโหมดลดแอนิเมชัน
js/main.js          ตัวละครลอย/เปลี่ยนท่า, พื้นหลังกลางวัน→กลางคืน, ของ 4 ชิ้น, แกลเลอรี, GSAP
js/stars.js         ดาวกระพริบ + ดาวตก (canvas)
assets/char         เฟรมเล่นเบส 1–6 (ครอปชิดตัวแล้ว) และท่าอื่น
assets/video        hero-play.mp4 — คลิปที่เล่นเมื่อกด/แตะตัวละครในหน้าแรก
assets/items        เบส เครื่องเกม คอม หนังสือ (ลบพื้นแล้ว)
assets/scenes       ฉากเวที ฉากความฝัน (มีขนาดเล็กสำหรับมือถือ)
assets/projects     รูปของแต่ละผลงาน (grab-turtle, siam-n-serpent, figure-out, hallo)
assets/photos       รูปจริง (เวที สตูดิโอ รางวัล โรงเรียน)
vercel.json         ตั้ง cache ให้ไฟล์ภาพ
```

## การทำงานโดยย่อ
- กด/แตะตัวละครในหน้าแรก → เล่น `assets/video/hero-play.mp4` หนึ่งรอบพร้อมเสียง (มี mask ขอบนุ่ม) แล้วกลับไปเป็นเฟรมวน
- ตัวละครเป็น `position: fixed` เปลี่ยนตำแหน่ง/ท่าตามส่วนที่อยู่กลางจอ (`data-narrator` ในแต่ละ section)
- ส่วนหลักทั้งหมดทำงานได้แม้ GSAP โหลดไม่ขึ้น — GSAP ใช้ทำ intro, ตัวเลขนับขึ้น, เส้น timeline, ซูมฉาก
- `prefers-reduced-motion` หรือกดปุ่ม **ข้าม animation** → ปิดการขยับทั้งหมด (จำค่าไว้ในเบราว์เซอร์)
- บนมือถือ ตัวละครไม่ลอย แสดงเป็นภาพในแต่ละส่วนแทน และไม่มีพารัลแลกซ์
