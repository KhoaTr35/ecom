# ATELIER — Website TMĐT (CO3027)

Đồ án môn CO3027 — website TMĐT demo học tập (chủ đề X: **thời trang**), không
phục vụ kinh doanh thực tế.
Kế hoạch chi tiết: `Implementation Plan – Website TMĐT cho chủ đề X (CO3027).md`.

**Giao diện:** monochrome tối giản (đen/trắng, bo góc mềm `0.75rem`, viền mảnh
thay vì đổ bóng), chữ hiển thị Instrument Serif + Inter. Bo góc toàn site chỉ
do một biến `--radius` trong `app/globals.css` điều khiển (mọi `rounded-sm` →
`rounded-4xl` đều tính theo tỉ lệ từ biến này) — đổi độ cong chỉ cần sửa một
chỗ. Token màu/typography cũng tập trung ở `app/globals.css` và
`app/layout.tsx`.

## Tài khoản demo (sau khi seed)

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | admin@atelier.test | Password123! |
| Staff | staff@atelier.test | Password123! |
| Customer | customer1@atelier.test | Password123! |

## Danh mục (collections)

`prisma/seed-data.json` → `categories`/`products` có 7 danh mục, mỗi danh mục
2 sản phẩm (model `Category`/`Product`/`ProductVariant` có sẵn, không cần
migration mới):

| Slug | Tên | Loại sản phẩm |
| --- | --- | --- |
| `new-arrivals` | New Arrivals | Áo khoác len, đầm lụa |
| `ready-to-wear` | Ready-to-Wear | Áo len cashmere, quần ống rộng |
| `accessories` | Accessories | Túi tote da, bông tai vàng |
| `autumn` | Autumn Collection | Áo sơ mi kẻ len, túi đeo chéo da |
| `winter` | Winter Collection | Áo phao, bông tai ngọc trai |
| `spring` | Spring Collection | Đầm họa tiết hoa, túi cỏ đan |
| `christmas` | Christmas Collection | Blazer nhung đỏ, lắc tay vàng |

Trang chủ (`/`) có 2 lối vào xem danh mục, cả hai đọc thật từ DB qua
`listCategories()`, không hardcode:

- **Poster grid** (`components/shop/collection-poster-grid.tsx`) — mục
  "Collections" trên trang chủ, mỗi danh mục một "poster" chữ lớn (không có
  ảnh thật — `Category` không có field ảnh, cố tình dùng chữ để khớp ngôn
  ngữ thiết kế "không ảnh, chữ lớn" sẵn có của site), tile đảo màu
  đen/trắng xen kẽ. Cả tile là link, bấm đâu cũng vào `/c/[slug]`.
- **shadcn `Sidebar`** (`components/shop/collections-sidebar.tsx`, collapsed
  mặc định, `collapsible="offcanvas"`) — mở bằng nút `SidebarTrigger` gốc
  (icon toggle, góc trên-trái trang chủ, dính khi cuộn). Liệt kê cả 7 danh
  mục chia 2 nhóm thật — **By season** (4 collection theo mùa) và
  **By type** (3 danh mục gốc) — kèm badge số lượng sản phẩm thật.

Desktop `Header`/`Footer` (`components/shop/nav-links.ts`) vẫn chỉ hardcode
3 link đầu (New Arrivals/Ready-to-Wear/Accessories) — 4 collection theo mùa
chỉ vào được qua trang chủ hoặc URL trực tiếp ở breakpoint này; đổi
`nav-links.ts` sang đọc động từ `listCategories()` là việc có thể làm tiếp
nếu muốn đồng bộ.

**Mobile (`< lg`)** không còn dùng hamburger menu: giao diện là "reel
commerce" — Feed (`/`) full-screen từng sản phẩm một, swipe lên/xuống, mỗi
vài sản phẩm chèn một collection reel đọc thật từ `Category.tagline` /
`Category.heroMediaUrl`; swipe phải hoặc tab "Wall" sang `/wall`, trang kiểu
profile Instagram liệt kê **đủ cả 7 danh mục** (đã đóng gap 3-link nói
trên, riêng cho mobile) cùng toàn bộ sản phẩm dạng lưới 3 cột. Thanh tab
dưới cùng cố định (Feed · Wall · Search · Bag · Me,
`components/shop/mobile/mobile-tab-bar.tsx`) thay cho menu/icon header.
Desktop ở mọi route không đổi — mobile là cây JSX riêng (`lg:hidden` /
`hidden lg:block`) trong cùng route, không phải domain hay middleware
riêng, nên toggle desktop/mobile có sẵn (`components/dev/dev-mode-frame.tsx`)
vẫn dùng được.

Ảnh sản phẩm dùng placeholder SVG trong `public/products/` theo loại sản
phẩm (`garment`/`bag`/`jewellery`, mỗi loại có thêm bản `-back`/`-detail`
cho story bar nhiều khung ảnh ở Feed/product detail), không fake ảnh thật.
`public/collections/` có 1 SVG 9:16 mỗi danh mục cho `Category.heroMediaUrl`
(collection reel trên Feed).

## Dữ liệu lịch sử sau khi seed

> [!WARNING]
> **`pnpm db:seed` XOÁ DỮ LIỆU trước khi nạp lại.** Nó gọi `deleteMany()` trên
> 12 bảng: `orderItem`, `payment`, `order`, `analyticsEvent`, `cartItem`,
> `cart`, `productImage`, `productVariant`, `product`, `category`,
> `shippingMethod`, `priceRule`. **Cả nhóm đang dùng CHUNG một database
> Supabase** (xem mục "Database" dưới), nên chạy seed là xoá luôn dữ liệu của
> người khác — **hỏi nhóm trước khi chạy**. Những bảng *không* bị xoá:
> `User`, `Session`, `Address`, `AuditLog` — nên tài khoản demo và sổ địa chỉ
> vẫn còn, chỉ đơn hàng/giỏ/analytics của chúng là mất. Muốn phá dữ liệu tự
> do thì dùng Postgres local qua Docker (mục "Cài đặt"), đừng dùng Supabase.

`pnpm db:seed` (`prisma/seed.ts` + `prisma/seed-demo-history.ts`) không chỉ nạp
catalog/tài khoản mà còn tạo sẵn lịch sử để trang admin có gì đó để hiện ngay,
không cần tự thao tác trước. Toàn bộ sinh bằng phép toán theo chỉ số (không
`Math.random`) nên mọi người seed lại đều ra **cùng một** dashboard:

- **70 đơn hàng** (`seedOrderHistory`) trải trong 30 ngày gần nhất, 2–3 đơn
  mỗi ngày, đủ cả 5 nhóm trạng thái trên `/admin/orders` (Pending/Processing/
  Shipped/Delivered/Cancelled). 29/30 ngày có ít nhất một đơn tính doanh thu
  (`PAID`/`PROCESSING`/`SHIPPED`/`DELIVERED`) để biểu đồ doanh thu theo ngày
  là một đường xu hướng chứ không phải vài cột lẻ. Hai cặp sản phẩm cố định
  (áo khoác len + quần ống rộng; đầm lụa + bông tai) lặp ở các đơn có trạng
  thái **`PAID`/`DELIVERED`** — đúng điều kiện `lib/recommend` lọc, nếu để
  trạng thái khác thì mục "Frequently bought together" sẽ im lặng rơi về
  fallback cùng danh mục. Không đụng vào tồn kho (`ProductVariant.stock`) —
  đây là đơn lịch sử, không phải đơn đang giữ hàng.
- **~584 analytics event** (`seedAnalyticsEvents`) — khoảng 8–15 phiên mỗi
  ngày trong 30 ngày (**~332 "Visits"**), phễu lồng nhau theo tỷ lệ thực tế:
  100% page_view → ~46% product_view → ~18% add_to_cart → ~8% begin_checkout
  → ~2,1% purchase. Tỷ lệ chuyển đổi trên dashboard vì vậy ra **~2,1%** thay
  vì 10% như bản seed cũ (1 phiên/ngày) — con số 10% là không thực tế với
  TMĐT và dễ bị hỏi khi demo.

## Analytics & cookie consent

Lần đầu vào site sẽ thấy banner xin phép cookie ở dưới. **Accept** mới tạo
cookie `analytics_sid` (ngẫu nhiên) — từ đó các hành động (xem trang, xem sản
phẩm, thêm giỏ, vào checkout, đặt hàng) mới được ghi vào `AnalyticsEvent` qua
`POST /api/analytics/track` (route public, không cần đăng nhập vì phần lớn
traffic này là khách chưa đăng nhập). **Decline** hoặc không trả lời thì
không ghi gì. Dashboard `/admin/analytics` đọc từ bảng này cho tile "Visits"
và biểu đồ "Funnel" — sau `pnpm db:seed` đã có sẵn dữ liệu mẫu (xem phần
"Dữ liệu lịch sử sau khi seed" trên) nên không hiện 0 ngay cả khi chưa tự
Accept cookie lần nào.

## FAQ chat widget

Nút tròn góc dưới-phải mọi trang shop (`components/shop/faq-chat-widget.tsx`)
— hỏi-đáp 5 câu cố định (thanh toán, giao hàng, hủy đơn, đổi trả, theo dõi
đơn), **không gọi AI thật, không gọi backend**. Bấm câu hỏi → hiện 3 chấm
"đang gõ" ~1 giây → hiện câu trả lời đã viết sẵn; hết câu hỏi thì ẩn danh
sách, chỉ còn dòng kết. Dùng đúng bộ chat primitives của shadcn
(`Message`/`Bubble`/`MessageScroller`) thay vì tự dựng UI chat bằng div —
`MessageScroller` lo việc neo câu hỏi mới lên đầu khung cuộn khi danh sách
dài hơn khung nhìn, nên cài thêm gói `@shadcn/react` (xem `package.json`).

## Trang quản trị (Admin)

Không có trong menu chính — truy cập trực tiếp `http://localhost:3000/admin`.
Đăng nhập bằng tài khoản `ADMIN`/`STAFF` ở trên thì menu tài khoản (icon avatar
trên header) sẽ hiện thêm mục **Admin panel** để vào nhanh; tài khoản
`CUSTOMER` không thấy mục này và bị redirect về `/` nếu cố vào thẳng URL
(`app/admin/layout.tsx` chặn theo `role`).

**Quản lý sản phẩm** (`/admin/products`) — tạo mới và sửa sản phẩm, gồm
variant (SKU/giá/tồn kho) và ảnh (URL + alt text), dùng thẳng model
`Product`/`ProductVariant`/`ProductImage` có sẵn (không cần migration mới).
Vài lựa chọn đáng lưu ý:

- **Ảnh là URL, không upload file** — `.env.example` có để sẵn
  `BLOB_READ_WRITE_TOKEN` cho Vercel Blob nhưng chưa cấu hình thật; thêm upload
  file khi có token đó, còn hiện tại cứ dán URL ảnh (giống cách seed data làm,
  `prisma/seed-data.json` → `images[].url`).
- **`attributes`/`options` là JSON thô trong textarea**, không phải field
  động theo từng category — mỗi category có trục filter khác nhau
  (`Category.filters`), build UI động theo đó tốn công hơn mức cần cho một
  admin panel đồ án; sửa khi việc gõ JSON tay thực sự gây khó chịu.
- **Sửa variant không được xoá variant đã nằm trong đơn hàng/giỏ hàng** — xoá
  kiểu đó vi phạm khoá ngoại `OrderItem.variantId`/`CartItem.variantId`, API
  trả lỗi rõ ràng (400) thay vì crash hoặc xoá nhầm dữ liệu lịch sử.
- Trạng thái Active/Inactive của sản phẩm vẫn do switch trên bảng list quản
  lý riêng — form sửa gửi lại đúng status hiện tại, không có ô chỉnh trong
  form để tránh hai nơi cùng sửa một field.

## Trang tài khoản (`/account/*`)

Mọi tài khoản đã đăng nhập đều có 2 tab (`components/shop/account-nav.tsx`):

- **Orders** (`/account/orders`) — lịch sử đơn hàng + tiến trình giao hàng.
  Đơn còn ở bước "Placed" (`PENDING_PAYMENT`/`PENDING_CONFIRM`) có nút **Cancel**
  tự hủy (`POST /api/orders/[id]/cancel`, có check chủ đơn + hoàn kho).
- **Settings** (`/account/settings`) — đổi tên hiển thị (qua Better Auth
  `updateUser`; email chỉ đọc, chưa có luồng xác thực đổi email) và quản lý
  **sổ địa chỉ giao hàng** (thêm/sửa/xoá, đặt địa chỉ mặc định — địa chỉ đầu
  tiên tự động làm mặc định). API: `GET/POST /api/addresses`,
  `PATCH/DELETE /api/addresses/[id]`. Dùng model `Address` có sẵn trong schema
  (không cần migration mới). Checkout (`/checkout`) đọc thẳng sổ địa chỉ này —
  có địa chỉ đã lưu thì hiện picker (mặc định chọn sẵn), kèm lựa chọn "Use a
  new address" quay về form nhập tay; chưa có địa chỉ nào thì vào thẳng form
  nhập tay như trước.

## Yêu cầu

- Node.js LTS, pnpm (`corepack enable` hoặc `npm i -g pnpm`)
- Docker Desktop (chạy Postgres qua `docker-compose.yml`) — hoặc Neon/Postgres
  local tự quản lý, xem phần "Dùng Postgres khác" dưới đây.

## Cài đặt (Docker, mặc định)

```bash
pnpm install
cp .env.example .env         # giá trị mặc định đã khớp docker-compose.yml + có sẵn BETTER_AUTH_SECRET dev, không cần sửa gì
docker compose up -d         # tạo + chạy container Postgres (postgres:16-alpine, cổng 5432)
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Mở http://localhost:3000. Đã test lại bằng cách tráo `.env` thật sang y
nguyên `.env.example` (không sửa gì) — homepage, API đọc DB, và đăng ký tài
khoản (dùng `BETTER_AUTH_SECRET`) đều chạy được ngay, xác nhận quy trình trên
đủ cho một lần `git clone` mới, không cần thêm bước thủ công nào.

> **`BETTER_AUTH_SECRET` trong `.env.example` chỉ dùng cho local/demo** — giá
> trị này nằm trong git, ai cũng đọc được nên không bảo vệ được gì. Tạo giá
> trị thật (`openssl rand -base64 32`) nếu deploy thật hoặc chia sẻ ngoài môn học.

Lệnh Docker hay dùng:

| Lệnh | Mục đích |
| --- | --- |
| `docker compose up -d` | Khởi động container Postgres (idempotent, chạy lại an toàn) |
| `docker compose down` | Dừng container, giữ lại data (volume `ecom-db-data`) |
| `docker compose down -v` | Dừng + xoá sạch data — dùng khi muốn làm lại từ đầu |
| `docker compose logs -f db` | Xem log Postgres |

> **Nếu máy đã có Postgres khác chiếm cổng 5432** (ví dụ cài qua Homebrew):
> dừng service đó trước (`brew services stop postgresql@14` hoặc tương đương)
> rồi mới `docker compose up -d`, vì container map thẳng ra `5432:5432`.

### Dùng Postgres khác (Neon, Postgres local không qua Docker)

Bỏ qua bước `docker compose up -d`, sửa `DATABASE_URL`/`DIRECT_URL` trong
`.env` cho khớp, rồi chạy `pnpm db:migrate && pnpm db:seed` như thường.
**Lưu ý:** `pnpm db:migrate` chỉ tạo *bảng*, không tự tạo *database* — với
Postgres tự cài (không Docker), phải tạo trước bằng
`createdb -h <host> -U <user> ecom`. Thiếu bước này, mọi query Prisma sẽ
throw — trang catalog (`lib/catalog`) tự rơi về dữ liệu mock nên vẫn chạy
được, nhưng đăng ký/đăng nhập (Better Auth, không có fallback) sẽ lỗi.

### [Kế hoạch tương lai] Chuyển sang DB hosted (Supabase/Neon)

Chưa làm, mới chỉ kiểm tra tính khả thi — nhưng kiến trúc hiện tại đã sẵn sàng
cho việc này, không cần đổi code:

- `lib/db.ts` (app runtime) đọc `DATABASE_URL`; `prisma.config.ts` (CLI —
  migrate/studio) đọc `DIRECT_URL`. Đây đúng là mô hình pooled/direct mà
  Supabase và Neon đều dùng (Supabase: cổng `6543` qua PgBouncer cho
  `DATABASE_URL`, cổng `5432` trực tiếp cho `DIRECT_URL`).
- Chuyển sang Supabase: tạo project, lấy 2 connection string đó bỏ vào
  `.env`, chạy `pnpm db:migrate` (hoặc `db:deploy`) rồi `pnpm db:seed` như
  bình thường.
- Lưu ý: PgBouncer của Supabase mặc định chạy transaction-mode, có thể cần
  thêm `?pgbouncer=true` vào `DATABASE_URL` để Prisma không lỗi vì prepared
  statements — phải test thật một request ghi (đặt thử 1 đơn) sau khi đổi,
  không chỉ test kết nối được.
- Đây là đổi **schema**, không mang theo **data** — dữ liệu đang test ở
  Postgres local (Docker) không tự chuyển qua; muốn có dữ liệu thì chạy lại
  `pnpm db:seed` trên DB mới, hoặc tự `pg_dump`/`pg_restore` nếu cần giữ
  nguyên dữ liệu cũ.
- Một khi là DB dùng chung thật (không chỉ máy mình), phải đổi
  `BETTER_AUTH_SECRET` sang giá trị mới tự sinh — giá trị trong
  `.env.example` chỉ an toàn cho local/demo (xem ghi chú ở phần Cài đặt).

### Truy cập database để kiểm tra

```bash
# Danh sách bảng
PGPASSWORD=postgres psql -h localhost -U postgres -d ecom -c "\dt"

# Xem user đã seed (bảng demo accounts ở trên)
PGPASSWORD=postgres psql -h localhost -U postgres -d ecom \
  -c "SELECT email, role FROM \"User\" ORDER BY email;"

# Mở psql tương tác
PGPASSWORD=postgres psql -h localhost -U postgres -d ecom
```

Đổi `postgres`/`localhost`/`ecom` theo giá trị thật trong `DATABASE_URL` nếu
dùng Neon. Lịch sử migration nằm ở `prisma/migrations/*/migration.sql`.

## Lệnh hay dùng

| Lệnh | Mục đích |
| --- | --- |
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm db:migrate` | Tạo/áp migration (dev) |
| `pnpm db:deploy` | Áp migration (production) |
| `pnpm db:seed` | Nạp dữ liệu mẫu + lịch sử đơn/analytics (xem dưới), chạy lại được nhiều lần |
| `pnpm test` | Chạy unit test (Vitest) |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Kiểm tra type |
| `docker compose up -d` / `down [-v]` | Bật/tắt Postgres local (xem phần Cài đặt) |

## Xem layout desktop/mobile song song (dev only)

`pnpm dev` có nút preview layout ở góc dưới-trái mọi trang (icon `</>`,
`components/dev/dev-mode-frame.tsx`) — bấm vào để xem trang hiện tại trong
khung iframe, kèm 2 nút chuyển đổi độ rộng **Desktop**/**Mobile** (390px).
Dùng iframe thay vì chỉ thu nhỏ một `<div>`, vì class `sm:`/`lg:` của
Tailwind phản ứng theo kích thước **viewport trình duyệt thật**, không phải
theo bề rộng phần tử cha — iframe có viewport riêng nên mới thật sự kích
hoạt lại breakpoint mobile. Chuyển qua lại Desktop/Mobile chỉ đổi `width`
của cùng một iframe, không reload, nên state trong trang không mất khi đổi
qua đổi lại. Tự ẩn hoàn toàn ở production build (`pnpm build && pnpm start`)
— đã verify bằng cách build thật rồi kiểm tra nút không còn trong HTML.

## Kiến trúc tóm tắt

Next.js App Router full-stack, mô hình lai: **đọc bằng Server Components, ghi
qua REST Route Handlers** (`app/api/*`, bọc `withAuth`). Logic nghiệp vụ nằm
trong `lib/*`; `app/` chỉ là lớp mỏng gọi vào đó. Chi tiết cấu trúc thư mục và
quy ước code xem `AGENTS.md`.

## Trạng thái hiện tại (skeleton)

Đã có: cấu trúc repo đầy đủ theo kế hoạch, Prisma schema + seed, Better Auth
(đăng ký/đăng nhập + vai trò + JWT), giỏ hàng tạm → đồng bộ khi đăng nhập,
đặt hàng (COD và VNPay sandbox đều hoạt động đầy đủ), tự hủy đơn khi còn ở
bước đầu, trang admin có CRUD sản phẩm (xem phần "Quản lý sản phẩm" trên),
dashboard KPI + funnel đọc dữ liệu thật (có cookie consent gate — xem phần
"Analytics & cookie consent"), gợi ý "Thường mua cùng" tính từ lịch sử đơn
thật, 7 danh mục duyệt được qua poster grid + Sidebar trên trang chủ (xem
phần "Danh mục"), FAQ chat widget hỏi-đáp cố định, và preview layout
desktop/mobile cho dev (xem 2 phần cuối). Các việc còn lại nằm rải rác
trong code dưới dạng comment `TODO (IMP-xx)`, tham chiếu đúng task trong
kế hoạch.
